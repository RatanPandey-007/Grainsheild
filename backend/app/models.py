from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    location = Column(String)
    capacity_tons = Column(Float)
    status = Column(String, default="NORMAL")  # NORMAL, WARNING, CRITICAL
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sensors = relationship("Sensor", back_populates="warehouse", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="warehouse", cascade="all, delete-orphan")

class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"))
    node_name = Column(String, index=True)  # e.g., SENSOR_01
    status = Column(String, default="NORMAL")  # NORMAL, WARNING, CRITICAL
    x_pos = Column(Float)  # 3D position coordinates in scene
    y_pos = Column(Float)
    z_pos = Column(Float)

    warehouse = relationship("Warehouse", back_populates="sensors")
    readings = relationship("Reading", back_populates="sensor", cascade="all, delete-orphan")

class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id", ondelete="CASCADE"), index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    moisture = Column(Float)
    gas = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

    sensor = relationship("Sensor", back_populates="readings")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"))
    sensor_id = Column(Integer, ForeignKey("sensors.id", ondelete="CASCADE"), nullable=True)
    risk_score = Column(Float)
    trigger_type = Column(String)  # e.g., HUMIDITY, TEMPERATURE, MOISTURE, GAS, SPOILAGE_RISK
    status = Column(String, default="ACTIVE")  # ACTIVE, RESOLVED
    message = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    warehouse = relationship("Warehouse", back_populates="alerts")
