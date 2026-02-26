from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas import schemas
from ..models import models
from .. import security
from ..config import conf

from fastapi_mail import FastMail, MessageSchema
import random
import time

router = APIRouter()

# Store OTP with expiry time (email: (otp, expiry))
otp_store = {}

# =========================
# GET ALL USERS
# =========================
@router.get("/", response_model=List[schemas.User])
def get_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users


# =========================
# CREATE USER (SIGNUP)
# =========================
@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = security.get_password_hash(user.password)
    user_data = user.model_dump(exclude={"password"})

    db_user = models.User(**user_data, hashed_password=hashed_password)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


# =========================
# UPDATE USER
# =========================
@router.put("/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(models.User.id == user_id).first()

    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)

    return db_user



@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(models.User.id == user_id).first()

    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(db_user)
    db.commit()

    return None


# =========================
# LOGIN
# =========================
@router.post("/login")
def login(form_data: schemas.UserLogin, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == form_data.email).first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = security.create_access_token(
        data={"sub": user.email, "role": user.role}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "userrole": user.role
    }


@router.post("/forgot-password")
async def forgot_password(email: str, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    current_time = time.time()

    # Check if resend cooldown exists
    existing_entry = otp_store.get(email)

    if existing_entry:
        resend_allowed_at = existing_entry["resend_allowed_at"]
        if current_time < resend_allowed_at:
            remaining = int(resend_allowed_at - current_time)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting OTP again"
            )

    # Generate new OTP
    otp = str(random.randint(100000, 999999))

    otp_store[email] = {
        "otp": otp,
        "expiry": current_time + 300,  # 5 minutes
        "attempts": 0,
        "resend_allowed_at": current_time + 60  # 60 sec cooldown
    }

    message = MessageSchema(
        subject="Your Password Reset OTP",
        recipients=[email],
        body=f"Your OTP is: {otp}. It expires in 5 minutes.",
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)

    return {"message": "OTP sent successfully"}
@router.post("/reset-password")
def reset_password(data: schemas.ResetPassword, db: Session = Depends(get_db)):

    entry = otp_store.get(data.email)

    if not entry:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    current_time = time.time()

    # Check expiry
    if current_time > entry["expiry"]:
        del otp_store[data.email]
        raise HTTPException(status_code=400, detail="OTP expired")

    # Check max attempts
    if entry["attempts"] >= 3:
        del otp_store[data.email]
        raise HTTPException(status_code=403, detail="Maximum OTP attempts exceeded")

    # Validate OTP
    if entry["otp"] != data.otp:
        entry["attempts"] += 1
        remaining = 3 - entry["attempts"]
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {remaining} attempts remaining"
        )

    # OTP correct → reset password
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = security.get_password_hash(data.new_password)
    db.commit()

    del otp_store[data.email]

    return {"message": "Password reset successful"}