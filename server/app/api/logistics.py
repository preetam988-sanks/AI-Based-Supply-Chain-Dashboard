from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas import schemas
from ..models import models

router = APIRouter()

# ---------------------------
# GET all vehicles
# ---------------------------
@router.get("/vehicles", response_model=List[schemas.Vehicle])
def get_all_vehicles(db: Session = Depends(get_db)):
    return db.query(models.Vehicle).all()


# ---------------------------
# CREATE vehicle
# ---------------------------
@router.post("/vehicles", response_model=schemas.Vehicle)
def create_vehicle(
        vehicle: schemas.VehicleCreate,
        db: Session = Depends(get_db)
):
    db_vehicle = models.Vehicle(
        vehicle_number=vehicle.vehicle_number,
        driver_name=vehicle.driver_name,
        latitude=vehicle.latitude,
        longitude=vehicle.longitude,
        status=vehicle.status,
        live_temp=vehicle.live_temp,
        orders_count=vehicle.orders_count,
        fuel_level=vehicle.fuel_level,
    )

    db.add(db_vehicle)
    db.commit()              # 🔥 REQUIRED
    db.refresh(db_vehicle)

    return db_vehicle


# ---------------------------
# DELETE vehicle
# ---------------------------
@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    db_vehicle = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.id == vehicle_id)
        .first()
    )

    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    db.delete(db_vehicle)
    db.commit()
    return None
