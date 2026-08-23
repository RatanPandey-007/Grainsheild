from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any
import random

from app.database import get_db, engine, Base
from app import models, schemas
from app.ml_engine import predictor
from app.simulator import simulator

router = APIRouter()

# Seed database on module load or table creation
def seed_database(db: Session):
    # Check if seeded
    if db.query(models.Warehouse).first():
        return
    
    # Create main warehouse complex
    warehouse = models.Warehouse(
        name="HQ SILO COMPLEX",
        location="Punjab Storage Hub, India",
        capacity_tons=50000.0,
        status="NORMAL"
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)

    # Add sensors from simulator template
    for s in simulator.sensors_state:
        db_sensor = models.Sensor(
            warehouse_id=warehouse.id,
            node_name=s["node_name"],
            status="NORMAL",
            x_pos=s["x_pos"],
            y_pos=s["y_pos"],
            z_pos=s["z_pos"]
        )
        db.add(db_sensor)
    db.commit()

# --- INITIALIZATION ---
Base.metadata.create_all(bind=engine)
# Seed the initial DB
with Session(engine) as session:
    seed_database(session)

# --- ENDPOINTS ---

@router.get("/warehouses", response_model=List[schemas.Warehouse])
def get_warehouses(db: Session = Depends(get_db)):
    return db.query(models.Warehouse).all()

@router.get("/sensors")
def get_sensors(db: Session = Depends(get_db)):
    # Merges database sensor configurations with current simulated telemetry
    db_sensors = db.query(models.Sensor).all()
    live_readings = simulator.update_sensor_readings()
    
    sensor_map = {r["sensor_id"]: r for r in live_readings}
    
    response = []
    for s in db_sensors:
        live = sensor_map.get(s.id, {})
        response.append({
            "id": s.id,
            "node_name": s.node_name,
            "x_pos": s.x_pos,
            "y_pos": s.y_pos,
            "z_pos": s.z_pos,
            "status": live.get("prediction", {}).get("risk_category", s.status),
            "grain_type": live.get("grain_type", "RICE"),
            "telemetry": live.get("telemetry", {
                "temperature": 20.0, "humidity": 50.0, "moisture": 11.0, "gas": 400.0
            }),
            "prediction": live.get("prediction", {
                "risk_score": 0.0, "risk_category": "NORMAL", "contributing_factors": [], "recommended_action": ""
            })
        })
    return response

@router.get("/analytics/historical")
def get_historical_telemetry(grain_type: str = "RICE"):
    """
    Generates realistic historic telemetry charts (24 hours in steps of 2 hours)
    for temperature, humidity, moisture, and spoilage risk.
    """
    timestamps = []
    now = datetime.utcnow()
    for i in range(12, -1, -1):
        timestamps.append((now - timedelta(hours=i * 2)).strftime("%H:%M"))

    # Baseline calculations based on grain type
    baseline_temp = 22.0
    baseline_hum = 60.0
    baseline_moist = 12.0
    if grain_type.upper() == "PULSES":
        baseline_temp = 20.0; baseline_hum = 55.0; baseline_moist = 10.5
    elif grain_type.upper() == "WHEAT":
        baseline_temp = 19.0; baseline_hum = 58.0; baseline_moist = 11.5

    # Generate telemetry waves
    temp_series = [round(baseline_temp + random.uniform(-1.0, 1.0) + math_wave(i), 1) for i in range(13)]
    hum_series = [round(baseline_hum + random.uniform(-2.0, 2.0) + math_wave(i)*2, 1) for i in range(13)]
    moist_series = [round(baseline_moist + random.uniform(-0.2, 0.2) + (i*0.02), 1) for i in range(13)]
    
    # Calculate risks
    risk_series = []
    for t, h, m in zip(temp_series, hum_series, moist_series):
        p = predictor.predict_risk(t, h, m, 400 + random.uniform(-10, 10), 5.0, grain_type)
        risk_series.append(p["risk_score"])

    return {
        "labels": timestamps,
        "temperature": temp_series,
        "humidity": hum_series,
        "moisture": moist_series,
        "risk_score": risk_series
    }

def math_wave(i: int) -> float:
    # A simple wave generator
    import math
    return math.sin(i / 2.0) * 1.5

@router.post("/prediction", response_model=schemas.PredictionResponse)
def get_prediction(req: schemas.PredictionRequest):
    res = predictor.predict_risk(
        temp=req.temperature,
        humidity=req.humidity,
        moisture=req.moisture,
        gas=req.gas,
        exposure_days=req.exposure_days,
        grain_type=req.grain_type
    )
    return res

@router.post("/simulation")
def trigger_simulation_override(req: schemas.SimulationOverride):
    if not req.enabled:
        simulator.clear_override()
        return {"status": "success", "message": "Simulation override cleared."}
    
    simulator.set_override(
        temp=req.temperature,
        humidity=req.humidity,
        moisture=req.moisture,
        gas=req.gas,
        exposure_days=req.exposure_days,
        grain_type=req.grain_type
    )
    return {"status": "success", "message": "Simulation override activated."}

@router.get("/alerts")
def get_active_alerts(db: Session = Depends(get_db)):
    # Scan simulator sensor readings and generate active alerts if warning/critical
    live_readings = simulator.update_sensor_readings()
    alerts = []
    
    for r in live_readings:
        pred = r["prediction"]
        if pred["risk_category"] in ["WARNING", "CRITICAL"]:
            alerts.append({
                "sensor_id": r["sensor_id"],
                "node_name": r["node_name"],
                "risk_score": pred["risk_score"],
                "risk_category": pred["risk_category"],
                "message": pred["recommended_action"],
                "timestamp": datetime.utcnow()
            })
    return alerts

@router.post("/sync")
def sync_offline_telemetry(payload: List[Dict[str, Any]], db: Session = Depends(get_db)):
    """
    Receives an offline buffered batch of telemetry logs and inserts them into the DB.
    """
    for item in payload:
        # Resolve sensor_id from name or fallback
        node_name = item.get("node_name", "UNKNOWN")
        sensor = db.query(models.Sensor).filter(models.Sensor.node_name == node_name).first()
        sensor_id = sensor.id if sensor else 1
        
        reading = models.Reading(
            sensor_id=sensor_id,
            temperature=item.get("temperature", 20.0),
            humidity=item.get("humidity", 50.0),
            moisture=item.get("moisture", 12.0),
            gas=item.get("gas", 400.0),
            timestamp=datetime.strptime(item.get("timestamp"), "%Y-%m-%dT%H:%M:%S.%fZ") if item.get("timestamp") else datetime.utcnow()
        )
        db.add(reading)
        
        # Check alerts triggers
        p = predictor.predict_risk(reading.temperature, reading.humidity, reading.moisture, reading.gas, 5.0, "RICE")
        if p["risk_category"] in ["WARNING", "CRITICAL"]:
            alert = models.Alert(
                warehouse_id=sensor.warehouse_id if sensor else 1,
                sensor_id=sensor_id,
                risk_score=p["risk_score"],
                trigger_type="SPOILAGE_RISK",
                message=f"Sync Alert: {p['recommended_action']}"
            )
            db.add(alert)
            
    db.commit()
    return {"status": "success", "synchronized_records": len(payload)}
