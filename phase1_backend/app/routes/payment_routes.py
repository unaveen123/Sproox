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
import hmac
import hashlib
import os

router = APIRouter(prefix="/payment", tags=["Payment"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_SECRET = os.getenv("RAZORPAY_SECRET")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_SECRET))


# ============================================================
# 💰 CREATE PAYMENT ORDER FOR ONE OR MORE BOOKINGS
# ============================================================
@router.post("/create-order")
def create_payment_order(
        data: schemas.PaymentOrderRequest,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):

    if not data.booking_ids:
        raise HTTPException(status_code=400, detail="booking_ids are required")

    bookings = db.query(models.Booking).filter(models.Booking.id.in_(data.booking_ids)).all()

    if len(bookings) != len(set(data.booking_ids)):
        raise HTTPException(status_code=404, detail="One or more bookings not found")

    total_amount = 0
    for booking in bookings:
        if booking.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only pay for your own bookings")
        if booking.status == "confirmed":
            raise HTTPException(status_code=400, detail="One or more bookings are already confirmed")

        if booking.seat_id:
            seat = db.query(models.Seat).filter(models.Seat.id == booking.seat_id).first()
            if not seat:
                raise HTTPException(status_code=404, detail="Seat not found")
            total_amount += int(seat.price_per_hour)
        elif booking.theater_seat_id:
            seat = db.query(models.TheaterSeat).filter(models.TheaterSeat.id == booking.theater_seat_id).first()
            if not seat:
                raise HTTPException(status_code=404, detail="Theater seat not found")
            category = db.query(models.SeatCategory).filter(models.SeatCategory.id == seat.category_id).first()
            if not category:
                raise HTTPException(status_code=404, detail="Seat category not found")
            total_amount += int(category.price)
        else:
            raise HTTPException(status_code=400, detail="Invalid booking type")

    order = client.order.create({
        "amount": total_amount * 100,
        "currency": "INR",
        "payment_capture": 1
    })

    payment = models.Payment(
        booking_id=bookings[0].id,
        amount=total_amount,
        order_id=order["id"],
        status="pending"
    )

    db.add(payment)
    db.commit()

    return {
        "order_id": order["id"],
        "amount": total_amount,
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

    expected_signature = hmac.new(
        RAZORPAY_SECRET.encode(),
        f"{data.order_id}|{data.payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()

    if expected_signature != data.signature:
        payment.status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment verification failed")

    payment.payment_id = data.payment_id
    payment.status = "success"

    booking_ids = data.booking_ids or [payment.booking_id]
    bookings = db.query(models.Booking).filter(models.Booking.id.in_(booking_ids)).all()

    if len(bookings) != len(set(booking_ids)):
        raise HTTPException(status_code=404, detail="One or more bookings not found")

    qr_paths = []
    for booking in bookings:
        if booking.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only pay for your own bookings")
        booking.status = "confirmed"
        qr_path = generate_qr_ticket(booking)
        booking.qr_code = qr_path
        qr_paths.append(qr_path)

    db.commit()

    qr_urls = [f"/tickets/{os.path.basename(path)}" for path in qr_paths]

    return {
        "message": "Payment successful",
        "booking_ids": [booking.id for booking in bookings],
        "payment_id": data.payment_id,
        "qr_tickets": qr_urls
    }
