from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

# --- READING SCHEMAS ---
class ReadingBase(BaseModel):
    temperature: float
    humidity: float
    moisture: float
    gas: float

class ReadingCreate(ReadingBase):
    sensor_id: int

class Reading(ReadingBase):
    id: int
    sensor_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# --- SENSOR SCHEMAS ---
class SensorBase(BaseModel):
    node_name: str
    status: str
    x_pos: float
    y_pos: float
    z_pos: float

class Sensor(SensorBase):
    id: int
    warehouse_id: int
    readings: List[Reading] = []

    class Config:
        from_attributes = True

# --- WAREHOUSE SCHEMAS ---
class WarehouseBase(BaseModel):
    name: str
    location: str
    capacity_tons: float
    status: str

class WarehouseCreate(WarehouseBase):
    pass

class Warehouse(WarehouseBase):
    id: int
    last_updated: datetime
    sensors: List[Sensor] = []

    class Config:
        from_attributes = True

# --- ALERT SCHEMAS ---
class AlertBase(BaseModel):
    risk_score: float
    trigger_type: str
    status: str
    message: str

class Alert(AlertBase):
    id: int
    warehouse_id: int
    sensor_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- ML PREDICTION SCHEMAS ---
class PredictionRequest(BaseModel):
    temperature: float = Field(..., ge=-10.0, le=60.0)
    humidity: float = Field(..., ge=0.0, le=100.0)
    moisture: float = Field(..., ge=0.0, le=40.0)
    gas: float = Field(..., ge=0.0, le=2000.0)
    exposure_days: float = Field(default=5.0, ge=0.0)
    grain_type: str = Field(default="RICE")  # RICE, WHEAT, MAIZE, PULSES

class PredictionResponse(BaseModel):
    risk_score: float  # Percentage: 0.0 to 100.0
    risk_category: str  # NORMAL, WARNING, CRITICAL
    contributing_factors: List[str]
    recommended_action: str
    timestamp: datetime

# --- SIMULATION OVERRIDE ---
class SimulationOverride(BaseModel):
    enabled: bool
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    moisture: Optional[float] = None
    gas: Optional[float] = None
    exposure_days: Optional[float] = None
    grain_type: Optional[str] = None
