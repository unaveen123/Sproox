from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app import models
from datetime import datetime, timedelta, date

router = APIRouter(prefix="/user", tags=["Reservation"])


@router.post("/reserve-seat/{seat_id}")
def reserve_seat(seat_id: str,
                 db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):

    # 1️⃣ Get seat
    seat = db.query(models.Seat).filter(models.Seat.id == seat_id).first()

    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")

    # 2️⃣ Seat under maintenance
    if seat.status == "maintenance":
        raise HTTPException(status_code=400, detail="Seat under maintenance")

    # 3️⃣ Already BOOKED (real booking check)
    today = date.today().isoformat()

    existing_booking = db.query(models.Booking).filter(
        models.Booking.seat_id == seat_id,
        models.Booking.booking_date >= today
    ).first()

    if existing_booking:
        raise HTTPException(status_code=400, detail="Seat already booked")

    # 4️⃣ Already RESERVED (real reservation check)
    if seat.status == "reserved" and seat.reserved_until:

        # reservation still active
        if seat.reserved_until > datetime.utcnow():

            # allow same user to continue
            if seat.reserved_by != current_user.id:
                raise HTTPException(
                    status_code=400,
                    detail="Seat currently reserved by another user"
                )

    # 5️⃣ Reserve seat (REAL LOCK)
    expiry_time = datetime.utcnow() + timedelta(minutes=5)

    seat.status = "reserved"
    seat.reserved_by = current_user.id
    seat.reserved_until = expiry_time

    db.commit()

    return {
        "message": "Seat reserved successfully",
        "expires_at": expiry_time
    }


@router.get("/active-reservation")
def get_active_reservation(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):

    # find seat reserved by current user
    seat = db.query(models.Seat).filter(
        models.Seat.reserved_by == current_user.id,
        models.Seat.status == "reserved"
    ).first()

    if not seat:
        return {"message": "No active reservation"}

    # check expiry
    if seat.reserved_until <= datetime.utcnow():

        # reservation expired → release seat
        seat.status = "available"
        seat.reserved_by = None
        seat.reserved_until = None
        db.commit()

        return {"message": "No active reservation"}

    # get workspace info
    location = db.query(models.Location).filter(
        models.Location.id == seat.location_id
    ).first()

    return {
        "workspace": location.name,
        "seat_id": seat.id,
        "seat_number": seat.seat_number,
        "expires_at": seat.reserved_until
    }