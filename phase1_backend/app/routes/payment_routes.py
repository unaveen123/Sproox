from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app import models
import razorpay
from datetime import datetime
import os
from app import schemas
from app.utils.qr_generator import generate_qr_ticket
from app.utils.email_service import send_ticket_email

router = APIRouter(prefix="/payment", tags=["Payment"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_SECRET = os.getenv("RAZORPAY_SECRET")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_SECRET))


# ============================================================
# 💰 CREATE PAYMENT ORDER (DYNAMIC PRICE)
# ============================================================
@router.post("/create-order/{booking_id}")
def create_payment_order(
        booking_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):

    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == "confirmed":
        raise HTTPException(status_code=400, detail="Payment already completed")

    existing_payment = db.query(models.Payment).filter(
        models.Payment.booking_id == booking_id
    ).first()

    if existing_payment:
        raise HTTPException(status_code=400, detail="Payment already initiated")

    # 🎯 CO-WORKING
    if booking.seat_id:
        seat = db.query(models.Seat).filter(
            models.Seat.id == booking.seat_id
        ).first()

        if not seat:
            raise HTTPException(status_code=404, detail="Seat not found")

        amount = int(seat.price_per_hour)

    # 🎬 THEATER
    elif booking.theater_seat_id:
        seat = db.query(models.TheaterSeat).filter(
            models.TheaterSeat.id == booking.theater_seat_id
        ).first()

        if not seat:
            raise HTTPException(status_code=404, detail="Theater seat not found")

        category = db.query(models.SeatCategory).filter(
            models.SeatCategory.id == seat.category_id
        ).first()

        if not category:
            raise HTTPException(status_code=404, detail="Seat category not found")

        amount = int(category.price)

    else:
        raise HTTPException(status_code=400, detail="Invalid booking type")

    order = client.order.create({
        "amount": amount * 100,
        "currency": "INR",
        "payment_capture": 1
    })

    payment = models.Payment(
        booking_id=booking_id,
        amount=amount,
        order_id=order["id"],
        status="pending"
    )

    db.add(payment)
    db.commit()

    return {
        "order_id": order["id"],
        "amount": amount,
        "currency": "INR"
    }


# ============================================================
# ✅ VERIFY PAYMENT
# ============================================================
@router.post("/verify")
def verify_payment(
        data: schemas.PaymentVerify,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):

    payment = db.query(models.Payment).filter(
        models.Payment.order_id == data.order_id
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    try:
        pass
    except:
        payment.status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment verification failed")

    # ✅ update payment
    payment.payment_id = data.payment_id
    payment.status = "success"

    # 🎟️ confirm booking
    booking = db.query(models.Booking).filter(
        models.Booking.id == payment.booking_id
    ).first()

    booking.status = "confirmed"

    # ============================================================
    # 🎯 CO-WORKING
    # ============================================================
    if booking.seat_id:

        seat = db.query(models.Seat).filter(
            models.Seat.id == booking.seat_id
        ).first()

        location = seat.location

        # 📧 SEND EMAIL (UPDATED)
        send_ticket_email(
            to_email=booking.user.email,
            user_name=booking.user.name,
            booking_type="coworking",

            location_name=location.name,
            location_address=location.address,
            location_city=location.city,
            booking_date=booking.booking_date,
            booking_id=booking.id,
            qr_path=None,  # temp

            start_time=booking.slot.start_time,
            end_time=booking.slot.end_time,

            seat_number=seat.seat_number
        )

    # ============================================================
    # 🎬 THEATER
    # ============================================================
    else:

        seat = db.query(models.TheaterSeat).filter(
            models.TheaterSeat.id == booking.theater_seat_id
        ).first()

        location = seat.location

        screen = db.query(models.Screen).filter(
            models.Screen.id == seat.screen_id
        ).first()

        slot = booking.slot

        # 📧 SEND EMAIL (UPDATED)
        send_ticket_email(
            to_email=booking.user.email,
            user_name=booking.user.name,
            booking_type="theater",

            location_name=location.name,
            location_address=location.address,
            location_city=location.city,
            booking_date=booking.booking_date,
            booking_id=booking.id,
            qr_path=None,  # temp

            start_time=slot.start_time,
            end_time=slot.end_time,

            movie_name=slot.movie_name,
            screen_name=screen.name if screen else None,
            seat_label=seat.seat_label,
            language=slot.language
        )

    # ============================================================
    # 🎫 GENERATE QR AFTER EMAIL DATA READY
    # ============================================================
    qr_path = generate_qr_ticket(booking)
    booking.qr_code = qr_path

    # 🔥 SEND EMAIL AGAIN WITH QR (FINAL)
    if booking.seat_id:
        send_ticket_email(
            to_email=booking.user.email,
            user_name=booking.user.name,
            booking_type="coworking",

            location_name=location.name,
            location_address=location.address,
            location_city=location.city,
            booking_date=booking.booking_date,
            booking_id=booking.id,
            qr_path=qr_path,

            start_time=booking.slot.start_time,
            end_time=booking.slot.end_time,

            seat_number=seat.seat_number
        )
    else:
        send_ticket_email(
            to_email=booking.user.email,
            user_name=booking.user.name,
            booking_type="theater",

            location_name=location.name,
            location_address=location.address,
            location_city=location.city,
            booking_date=booking.booking_date,
            booking_id=booking.id,
            qr_path=qr_path,

            start_time=slot.start_time,
            end_time=slot.end_time,

            movie_name=slot.movie_name,
            screen_name=screen.name if screen else None,
            seat_label=seat.seat_label,
            language=slot.language
        )

    db.commit()

    return {
        "message": "Payment successful",
        "booking_id": booking.id,
        "payment_id": data.payment_id,
        "qr_ticket": qr_path
    }