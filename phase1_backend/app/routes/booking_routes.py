from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app import models, schemas
from sqlalchemy.exc import IntegrityError
from datetime import datetime, date
import os

router = APIRouter(prefix="/user", tags=["Booking"])


@router.post("/book-seat")
def book_seat(
    data: schemas.BookSeatSchema,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    # =========================
    # 🎯 CO-WORKING / LIBRARY
    # =========================
    if data.seat_id:

        seat = db.query(models.Seat).filter(models.Seat.id == data.seat_id).first()
        if not seat:
            raise HTTPException(status_code=404, detail="Seat not found")

        location = db.query(models.Location).filter(models.Location.id == seat.location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

        provider = db.query(models.Provider).filter(models.Provider.id == location.provider_id).first()

        if provider and provider.user_id == current_user.id:
            raise HTTPException(status_code=403, detail="You cannot book your own workspace")

        slot = db.query(models.TimeSlot).filter(models.TimeSlot.id == data.slot_id).first()
        if not slot:
            raise HTTPException(status_code=404, detail="Time slot not found")

        # 🔒 reservation check
        if seat.status == "reserved" and seat.reserved_until:
            if seat.reserved_until > datetime.utcnow():
                if seat.reserved_by != current_user.id:
                    raise HTTPException(status_code=400, detail="Seat reserved by another user")
            else:
                seat.status = "available"
                seat.reserved_by = None
                seat.reserved_until = None
                db.commit()

        # prevent duplicate
        existing_booking = db.query(models.Booking).filter(
            models.Booking.seat_id == data.seat_id,
            models.Booking.slot_id == data.slot_id,
            models.Booking.booking_date == data.booking_date,
            models.Booking.status == "confirmed"
        ).first()

        if existing_booking:
            raise HTTPException(status_code=400, detail="Seat already booked")

        new_booking = models.Booking(
            user_id=current_user.id,
            seat_id=data.seat_id,
            slot_id=data.slot_id,
            booking_date=data.booking_date,
            status="pending"
        )

        try:
            db.add(new_booking)

            # release reservation
            seat.status = "available"
            seat.reserved_by = None
            seat.reserved_until = None

            db.commit()
            db.refresh(new_booking)

        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Seat already booked")

        return {
            "message": "Seat booked successfully (co-working)",
            "booking_id": new_booking.id,
            "amount": seat.price_per_hour
        }

    # =========================
    # 🎬 THEATER BOOKING (UPDATED 🔥)
    # =========================
    elif data.theater_seat_id:

        # 1️⃣ get theater seat
        seat = db.query(models.TheaterSeat).filter(
            models.TheaterSeat.id == data.theater_seat_id
        ).first()

        if not seat:
            raise HTTPException(status_code=404, detail="Theater seat not found")

        # 2️⃣ validate location
        location = db.query(models.Location).filter(
            models.Location.id == seat.location_id
        ).first()

        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

        # 3️⃣ screen validation
        screen = None
        if seat.screen_id:
            screen = db.query(models.Screen).filter(
                models.Screen.id == seat.screen_id,
                models.Screen.location_id == location.id
            ).first()

            if not screen:
                raise HTTPException(status_code=400, detail="Invalid screen")

        # 4️⃣ seat availability
        if not seat.is_available:
            raise HTTPException(status_code=400, detail="Seat already booked")

        # 5️⃣ check slot
        slot = db.query(models.TimeSlot).filter(
            models.TimeSlot.id == data.slot_id,
            models.TimeSlot.location_id == location.id
        ).first()

        if not slot:
            raise HTTPException(status_code=404, detail="Time slot not found")

        # 6️⃣ validate the chosen screen/slot combination
        def normalize_screen_ref(value):
            if value is None:
                return None
            normalized = str(value).strip().lower()
            normalized = normalized.replace("screen", "").replace(" ", "")
            return normalized

        normalized_slot_screen = normalize_screen_ref(slot.screen_id)
        normalized_seat_screen = normalize_screen_ref(seat.screen_id)

        if (slot.screen_id and seat.screen_id and
                normalized_slot_screen != normalized_seat_screen):
            raise HTTPException(
                status_code=400,
                detail="Selected seat does not belong to the chosen screen"
            )

        # 7️⃣ prevent duplicate
        existing_booking = db.query(models.Booking).filter(
            models.Booking.theater_seat_id == data.theater_seat_id,
            models.Booking.slot_id == data.slot_id,
            models.Booking.booking_date == data.booking_date,
            models.Booking.status == "confirmed"
        ).first()

        if existing_booking:
            raise HTTPException(status_code=400, detail="Seat already booked")

        # 7️⃣ create booking
        new_booking = models.Booking(
            user_id=current_user.id,
            theater_seat_id=data.theater_seat_id,
            slot_id=data.slot_id,
            booking_date=data.booking_date,
            status="pending"
        )

        # 💰 price
        amount = seat.category.price if seat.category else 0

        # 8️⃣ mark unavailable
        seat.is_available = False

        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)

        return {
            "message": "Theater seat booked successfully",
            "booking_id": new_booking.id,
            "movie": slot.movie_name,
            "language": slot.language,
            "screen": screen.name if screen else None,
            "seat": seat.seat_label,
            "amount": amount
        }

    else:
        raise HTTPException(status_code=400, detail="Provide seat_id or theater_seat_id")


# -------------------------------------------------------------


@router.get("/booking-history")
def get_booking_history(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):

    bookings = db.query(models.Booking).filter(
        models.Booking.user_id == current_user.id
    ).all()

    active = []
    completed = []
    others = []

    today = date.today()

    for booking in bookings:

        # 🔥 SLOT CHECK
        slot = db.query(models.TimeSlot).filter(
            models.TimeSlot.id == booking.slot_id
        ).first()

        if not slot:
            continue   # skip broken data

        # =========================
        # 🪑 CO-WORKING
        # =========================
        if booking.seat_id:

            seat = db.query(models.Seat).filter(
                models.Seat.id == booking.seat_id
            ).first()

            if not seat:
                continue

            location = db.query(models.Location).filter(
                models.Location.id == seat.location_id
            ).first()

            if not location:
                continue

            data = {
                "type": "co-working",
                "workspace": location.name,
                "seat": seat.seat_number,
                "price": seat.price_per_hour
            }

        # =========================
        # 🎬 THEATER
        # =========================
        else:

            seat = db.query(models.TheaterSeat).filter(
                models.TheaterSeat.id == booking.theater_seat_id
            ).first()

            if not seat:
                continue   # 🔥 FIX (main error)

            location = db.query(models.Location).filter(
                models.Location.id == seat.location_id
            ).first()

            if not location:
                continue

            screen = None
            if seat.screen_id:
                screen = db.query(models.Screen).filter(
                    models.Screen.id == seat.screen_id
                ).first()

            data = {
                "type": "theater",
                "workspace": location.name,
                "seat": seat.seat_label,
                "movie": slot.movie_name if slot else None,
                "language": slot.language if slot else None,
                "screen": screen.name if screen else None,
                "price": seat.category.price if seat.category else 0
            }

        # =========================
        # 📦 COMMON DATA
        # =========================
        qr_url = None
        if booking.qr_code:
            qr_url = f"/tickets/{os.path.basename(booking.qr_code)}"

        data.update({
            "booking_id": booking.id,
            "date": booking.booking_date,
            "start_time": slot.start_time.strftime("%I:%M %p"),
            "end_time": slot.end_time.strftime("%I:%M %p"),
            "status": booking.status,
            "qr_code_url": qr_url
        })

        # =========================
        # 📊 CATEGORY SPLIT
        # =========================
        if booking.status == "confirmed" and booking.booking_date >= today:
            active.append(data)

        elif booking.status == "confirmed" and booking.booking_date < today:
            completed.append(data)

        else:
            others.append(data)

    return {
        "active": active,
        "completed": completed,
        "others": others
    }
# -------------------------------------------------------------


@router.patch("/cancel-booking/{booking_id}")
def cancel_booking(
        booking_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):

    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Already cancelled")

    today = date.today()

    if booking.booking_date < today:
        raise HTTPException(status_code=400, detail="Cannot cancel completed booking")

    booking.status = "cancelled"

    # 🔥 release seat
    if booking.seat_id:
        seat = db.query(models.Seat).filter(models.Seat.id == booking.seat_id).first()
        if seat:
            seat.is_available = True

    if booking.theater_seat_id:
        seat = db.query(models.TheaterSeat).filter(models.TheaterSeat.id == booking.theater_seat_id).first()
        if seat:
            seat.is_available = True

    db.commit()

    return {
        "message": "Booking cancelled successfully",
        "booking_id": booking_id
    }