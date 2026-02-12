# app/models/vehicle.py
from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, index=True, nullable=False)
    driver_name = Column(String, nullable=True) # Added
    latitude = Column(Float, nullable=True)    # Added
    longitude = Column(Float, nullable=True)   # Added
    status = Column(String, default="Idle")    # Added
    live_temp = Column(Float, default=25.0)    # Added
    fuel_level = Column(Float, default=100.0)  # Added
    orders_count = Column(Integer, default=0)  # Added