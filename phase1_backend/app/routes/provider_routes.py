from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Provider, User
from app.schemas import ProviderApply
from app.dependencies import get_current_user
from app import schemas
from app import models
from typing import Optional
from datetime import date

router = APIRouter(prefix="/provider", tags=["Provider"])


# =========================
# APPLY PROVIDER
# =========================
@router.post("/apply")
def apply_provider(
    data: schemas.ProviderApply,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Admin cannot apply as provider")

    existing = db.query(models.Provider).filter(
        models.Provider.user_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You have already applied as provider")

    if data.email != current_user.email:
        raise HTTPException(status_code=400, detail="Email does not match your registered account")

    if data.phone != current_user.phone:
        raise HTTPException(status_code=400, detail="Phone number does not match your registered account")

    new_provider = models.Provider(
        user_id=current_user.id,
        business_name=data.business_name,
        phone=data.phone,
        is_approved=False,
        is_blocked=False
    )

    db.add(new_provider)
    db.commit()
    db.refresh(new_provider)

    return {"message": "Provider application submitted. Wait for admin approval"}


# =========================
# GET LOCATION BOOKINGS
# 🔥 UPDATED (supports theater)
# =========================
@router.get("/location-bookings/{location_id}")
def get_location_bookings(
    location_id: str,
    filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    provider = db.query(models.Provider).filter(
        models.Provider.user_id == current_user.id,
        models.Provider.is_approved == True
    ).first()

    if not provider:
        raise HTTPException(status_code=403, detail="Not an approved provider")

    location = db.query(models.Location).filter(
        models.Location.id == location_id,
        models.Location.provider_id == provider.id
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    today = date.today()

    bookings = db.query(models.Booking).filter(
        models.Booking.slot_id != None
    ).all()

    result = []

    for booking in bookings:

        # 🔥 detect seat type
        if booking.seat_id:
            seat = db.query(models.Seat).filter(models.Seat.id == booking.seat_id).first()
            if not seat or seat.location_id != location_id:
                continue
            seat_label = seat.seat_number

        else:
            seat = db.query(models.TheaterSeat).filter(models.TheaterSeat.id == booking.theater_seat_id).first()
            if not seat or seat.location_id != location_id:
                continue
            seat_label = seat.seat_label

        user = db.query(models.User).filter(models.User.id == booking.user_id).first()
        slot = db.query(models.TimeSlot).filter(models.TimeSlot.id == booking.slot_id).first()

        booking_date = booking.booking_date

        # 🎯 filter logic
        if filter == "today" and booking_date != today:
            continue
        if filter == "upcoming" and booking_date <= today:
            continue
        if filter == "history" and booking_date >= today:
            continue

        result.append({
            "workspace": location.name,
            "booking_id": booking.id,
            "user_name": user.name,
            "user_phone": user.phone,
            "seat": seat_label,
            "movie": getattr(slot, "movie_name", None),   # 🎬 NEW
            "date": booking_date,
            "start_time": str(slot.start_time),
            "end_time": str(slot.end_time),
            "status": booking.status
        })

    return result


# =========================
# WORKSPACE ANALYTICS
# =========================
@router.get("/workspace-analytics/{location_id}")
def workspace_analytics(
    location_id: str,
    filter: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    provider = db.query(models.Provider).filter(
        models.Provider.user_id == current_user.id,
        models.Provider.is_approved == True
    ).first()

    if not provider:
        raise HTTPException(status_code=403, detail="Not an approved provider")

    location = db.query(models.Location).filter(
        models.Location.id == location_id,
        models.Location.provider_id == provider.id
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    today = date.today()

    total_seats = db.query(models.Seat).filter(
        models.Seat.location_id == location_id
    ).count()

    total_slots = db.query(models.TimeSlot).filter(
        models.TimeSlot.location_id == location_id
    ).count()

    max_capacity = total_seats * total_slots

    if filter == "today":

        confirmed = db.query(models.Booking).join(models.Seat).filter(
            models.Seat.location_id == location_id,
            models.Booking.booking_date == str(today),
            models.Booking.status == "confirmed"
        ).count()

        cancelled = db.query(models.Booking).join(models.Seat).filter(
            models.Seat.location_id == location_id,
            models.Booking.booking_date == str(today),
            models.Booking.status == "cancelled"
        ).count()

        available = max_capacity - confirmed

        occupancy = 0
        if max_capacity > 0:
            occupancy = round((confirmed / max_capacity) * 100, 2)

        return {
            "workspace": location.name,
            "date": str(today),
            "seats": total_seats,
            "timeslots": total_slots,
            "max_daily_capacity": max_capacity,
            "confirmed_bookings": confirmed,
            "cancelled_bookings": cancelled,
            "available_slots": available,
            "occupancy_rate": f"{occupancy}%"
        }

    elif filter == "upcoming":

        future_bookings = db.query(models.Booking).join(models.Seat).filter(
            models.Seat.location_id == location_id,
            models.Booking.booking_date > str(today),
            models.Booking.status == "confirmed"
        ).count()

        return {
            "workspace": location.name,
            "upcoming_bookings": future_bookings
        }

    elif filter == "history":

        total_bookings = db.query(models.Booking).join(models.Seat).filter(
            models.Seat.location_id == location_id,
            models.Booking.booking_date < str(today),
            models.Booking.status == "confirmed"
        ).count()

        cancelled = db.query(models.Booking).join(models.Seat).filter(
            models.Seat.location_id == location_id,
            models.Booking.booking_date < str(today),
            models.Booking.status == "cancelled"
        ).count()

        return {
            "workspace": location.name,
            "total_bookings": total_bookings,
            "total_cancelled": cancelled
        }

    return {"message": "Use filter=today | upcoming | history"}


# =========================
# SCAN QR TICKET
# 🔥 UPDATED (movie support)
# =========================
@router.post("/scan-ticket")
def scan_ticket(
    data: schemas.ScanTicket,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    booking = db.query(models.Booking).filter(
        models.Booking.id == data.booking_id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Invalid ticket")

    if booking.status != "confirmed":
        raise HTTPException(status_code=400, detail="Ticket not confirmed")

    if booking.qr_used:
        raise HTTPException(status_code=400, detail="Ticket already used")

    booking.qr_used = True

    slot = db.query(models.TimeSlot).filter(
        models.TimeSlot.id == booking.slot_id
    ).first()

    db.commit()

    return {
        "message": "Entry allowed",
        "booking_id": booking.id,
        "movie": getattr(slot, "movie_name", None),  # 🎬 NEW
        "time": f"{slot.start_time} - {slot.end_time}"
    }