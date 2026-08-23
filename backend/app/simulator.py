import random
import time
from datetime import datetime
from typing import Dict, Any, List
from app.ml_engine import predictor

class TelemetrySimulator:
    def __init__(self):
        # Override configuration
        self.override_active = False
        self.override_temp = None
        self.override_humidity = None
        self.override_moisture = None
        self.override_gas = None
        self.override_grain_type = "RICE"
        self.exposure_days = 5.0

        # Define 12 sensors distributed across silos and warehouses
        # Layout coordinate mappings: Silo 1, Silo 2, Silo 3, and Warehouse Hall
        self.sensors_state = [
            # Silo 1 (Left Silo: x=-4, z=0)
            {"id": 1, "node_name": "SILO_01_BOTTOM", "x_pos": -4.0, "y_pos": 0.8, "z_pos": 0.0, "grain_type": "RICE"},
            {"id": 2, "node_name": "SILO_01_MID", "x_pos": -4.0, "y_pos": 2.5, "z_pos": 0.0, "grain_type": "RICE"},
            {"id": 3, "node_name": "SILO_01_TOP", "x_pos": -4.0, "y_pos": 4.2, "z_pos": 0.0, "grain_type": "RICE"},
            
            # Silo 2 (Center Silo: x=0, z=0)
            {"id": 4, "node_name": "SILO_02_BOTTOM", "x_pos": 0.0, "y_pos": 0.8, "z_pos": 0.0, "grain_type": "WHEAT"},
            {"id": 5, "node_name": "SILO_02_MID", "x_pos": 0.0, "y_pos": 2.5, "z_pos": 0.0, "grain_type": "WHEAT"},
            {"id": 6, "node_name": "SILO_02_TOP", "x_pos": 0.0, "y_pos": 4.2, "z_pos": 0.0, "grain_type": "WHEAT"},
            
            # Silo 3 (Right Silo: x=4, z=0)
            {"id": 7, "node_name": "SILO_03_BOTTOM", "x_pos": 4.0, "y_pos": 0.8, "z_pos": 0.0, "grain_type": "MAIZE"},
            {"id": 8, "node_name": "SILO_03_MID", "x_pos": 4.0, "y_pos": 2.5, "z_pos": 0.0, "grain_type": "MAIZE"},
            {"id": 9, "node_name": "SILO_03_TOP", "x_pos": 4.0, "y_pos": 4.2, "z_pos": 0.0, "grain_type": "MAIZE"},
            
            # Warehouse Hall (Flat structure: z=4)
            {"id": 10, "node_name": "WH_HALL_EAST", "x_pos": -2.5, "y_pos": 1.0, "z_pos": 4.0, "grain_type": "PULSES"},
            {"id": 11, "node_name": "WH_HALL_CENTER", "x_pos": 0.0, "y_pos": 1.0, "z_pos": 4.0, "grain_type": "PULSES"},
            {"id": 12, "node_name": "WH_HALL_WEST", "x_pos": 2.5, "y_pos": 1.0, "z_pos": 4.0, "grain_type": "PULSES"}
        ]

        # Initialize base values for sensors
        # Normal distributions
        self.readings_cache = {}
        self.initialize_readings()

    def initialize_readings(self):
        for s in self.sensors_state:
            # Set baseline readings depending on grain types
            g_type = s["grain_type"]
            if g_type == "RICE":
                self.readings_cache[s["id"]] = {
                    "temp": 22.0, "humidity": 58.0, "moisture": 12.2, "gas": 410.0
                }
            elif g_type == "WHEAT":
                self.readings_cache[s["id"]] = {
                    "temp": 20.0, "humidity": 55.0, "moisture": 11.8, "gas": 390.0
                }
            elif g_type == "MAIZE":
                self.readings_cache[s["id"]] = {
                    "temp": 23.0, "humidity": 60.0, "moisture": 12.0, "gas": 420.0
                }
            else: # PULSES
                self.readings_cache[s["id"]] = {
                    "temp": 21.0, "humidity": 56.0, "moisture": 10.5, "gas": 400.0
                }

    def set_override(self, temp: float, humidity: float, moisture: float, gas: float, exposure_days: float, grain_type: str):
        self.override_active = True
        self.override_temp = temp
        self.override_humidity = humidity
        self.override_moisture = moisture
        self.override_gas = gas
        self.override_grain_type = grain_type
        self.exposure_days = exposure_days

    def clear_override(self):
        self.override_active = False
        self.initialize_readings()

    def update_sensor_readings(self) -> List[Dict[str, Any]]:
        """
        Calculates the next state of sensor readings, incorporating slight weather drift
        or direct UI slider overrides. Then runs predictions on each sensor's readings.
        """
        current_data = []

        for s in self.sensors_state:
            s_id = s["id"]
            grain = self.override_grain_type if self.override_active else s["grain_type"]

            if self.override_active:
                # Use override values with a small random noise representing sensor variation
                temp = self.override_temp + random.uniform(-0.3, 0.3)
                humidity = self.override_humidity + random.uniform(-0.5, 0.5)
                moisture = self.override_moisture + random.uniform(-0.1, 0.1)
                gas = self.override_gas + random.uniform(-5.0, 5.0)
            else:
                # Normal drift simulation
                prev = self.readings_cache[s_id]
                temp = prev["temp"] + random.uniform(-0.1, 0.1)
                humidity = prev["humidity"] + random.uniform(-0.2, 0.2)
                moisture = prev["moisture"] + random.uniform(-0.02, 0.02)
                gas = prev["gas"] + random.uniform(-2.0, 2.0)

                # Keep normal values within safe agricultural bounds
                temp = min(max(temp, 15.0), 30.0)
                humidity = min(max(humidity, 45.0), 75.0)
                moisture = min(max(moisture, 9.0), 16.0)
                gas = min(max(gas, 350.0), 700.0)

            # Store updated values back to cache
            self.readings_cache[s_id] = {
                "temp": temp, "humidity": humidity, "moisture": moisture, "gas": gas
            }

            # Run through Prediction Engine
            prediction = predictor.predict_risk(
                temp=temp,
                humidity=humidity,
                moisture=moisture,
                gas=gas,
                exposure_days=self.exposure_days,
                grain_type=grain
            )

            # Assemble full telemetry payload
            sensor_payload = {
                "sensor_id": s_id,
                "node_name": s["node_name"],
                "x_pos": s["x_pos"],
                "y_pos": s["y_pos"],
                "z_pos": s["z_pos"],
                "grain_type": grain,
                "telemetry": {
                    "temperature": round(temp, 2),
                    "humidity": round(humidity, 2),
                    "moisture": round(moisture, 2),
                    "gas": round(gas, 2)
                },
                "prediction": {
                    "risk_score": prediction["risk_score"],
                    "risk_category": prediction["risk_category"],
                    "contributing_factors": prediction["contributing_factors"],
                    "recommended_action": prediction["recommended_action"]
                }
            }
            
            # Update physical sensor status in general state
            s["status"] = prediction["risk_category"]
            current_data.append(sensor_payload)

        return current_data

simulator = TelemetrySimulator()
