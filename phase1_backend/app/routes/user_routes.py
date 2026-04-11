from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Location, Provider, Seat, Screen
import app.models as models
from app.models import TimeSlot
from datetime import date

router = APIRouter(prefix="/user", tags=["User Browse"])


# ================= GET ALL APPROVED LOCATIONS =================
@router.get("/locations")
def get_locations(db: Session = Depends(get_db)):

    locations = (
        db.query(Location)
        .join(Provider, Location.provider_id == Provider.id)
        .join(TimeSlot, Location.id == TimeSlot.location_id)
        .filter(Provider.is_approved.is_(True))
        .distinct()
        .all()
    )

    result = []

    for loc in locations:
        result.append({
            "location_id": loc.id,
            "name": loc.name,
            "address": loc.address,
            "city": loc.city,
            "description": loc.description,
            "provider_business": loc.provider.business_name
        })

    return result


# ================= GET SCREENS (USER SIDE) =================
@router.get("/locations/{location_id}/screens")
def get_screens_for_user(location_id: str, db: Session = Depends(get_db)):

    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    screens = db.query(models.Screen).filter(
        models.Screen.location_id == location_id
    ).all()

    return screens


# ================= GET SEATS =================
@router.get("/locations/{location_id}/seats")
def get_location_seats(location_id: str, db: Session = Depends(get_db)):

    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    seats = db.query(models.Seat).filter(
        models.Seat.location_id == location_id,
        models.Seat.status == "available",
        models.Seat.is_available == True
    ).all()

    return seats


# ================= SEAT LAYOUT =================
@router.get("/locations/{location_id}/seat-layout")
def seat_layout(location_id: str, db: Session = Depends(get_db)):

    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    seats = db.query(models.Seat).filter(
        models.Seat.location_id == location_id
    ).all()

    return seats


# ================= TIMESLOTS =================
@router.get("/locations/{location_id}/timeslots")
def get_location_timeslots(location_id: str, db: Session = Depends(get_db)):

    location = db.query(models.Location).filter(models.Location.id == location_id).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    slots = db.query(models.TimeSlot).filter(
        models.TimeSlot.location_id == location_id
    ).all()

    result = []

    for s in slots:

        screen_name = None

        if s.screen_id:
            screen = db.query(models.Screen).filter(
                models.Screen.id == str(s.screen_id)
            ).first()

            if screen:
                screen_name = screen.name

        result.append({
            "slot_id": s.id,
            "start_time": s.start_time.strftime("%I:%M %p"),
            "end_time": s.end_time.strftime("%I:%M %p"),
            "movie_name": s.movie_name,
            "screen_id": s.screen_id,
            "screen": screen_name,
            "language": s.language
        })

    return result


# ================= AVAILABLE SEATS (COWORKING) =================
@router.get("/locations/{location_id}/available-seats")
def get_available_seats(location_id: str,
                       slot_id: str,
                       booking_date: date,
                       db: Session = Depends(get_db)):

    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    all_seats = db.query(models.Seat).filter(
        models.Seat.location_id == location_id
    ).all()

    booked_seats = db.query(models.Booking).filter(
        models.Booking.slot_id == slot_id,
        models.Booking.booking_date == str(booking_date)
    ).all()

    booked_seat_ids = [b.seat_id for b in booked_seats]

    available_seats = []
    for seat in all_seats:
        if seat.id not in booked_seat_ids:
            available_seats.append({
                "seat_id": seat.id,
                "seat_number": seat.seat_number,
                "price_per_hour": seat.price_per_hour
            })

    return available_seats


# ================= 🎬 THEATER SEATS =================
@router.get("/locations/{location_id}/theater-seats")
def get_theater_seats(location_id: str,
                      slot_id: str,
                      booking_date: date,
                      db: Session = Depends(get_db)):
    
    try:
        # Find the slot
        slot = db.query(models.TimeSlot).filter(
            models.TimeSlot.id == slot_id,
            models.TimeSlot.location_id == location_id
        ).first()

        if not slot:
            raise HTTPException(status_code=404, detail="Show slot not found")

        # Check if slot has screen_id
        if not slot.screen_id:
            raise HTTPException(status_code=400, detail="Slot does not have a screen assigned")

        # Query all seats for this screen
        seats = db.query(models.TheaterSeat).filter(
            models.TheaterSeat.location_id == location_id,
            models.TheaterSeat.screen_id == str(slot.screen_id)
        ).all()

        # If no seats found, return helpful message
        if not seats:
            screen = db.query(models.Screen).filter(
                models.Screen.id == str(slot.screen_id)
            ).first()
            
            if screen:
                raise HTTPException(
                    status_code=404, 
                    detail=f"No seats configured for {screen.name}. Please add seat categories and generate seats first."
                )
            else:
                raise HTTPException(status_code=404, detail="Screen not found")

        # Get booked seats for this slot and date
        booked_seats = db.query(models.Booking).filter(
            models.Booking.slot_id == slot_id,
            models.Booking.booking_date == booking_date,
            models.Booking.status.in_(["pending", "confirmed"])
        ).all()

        booked_seat_ids = {b.theater_seat_id for b in booked_seats if b.theater_seat_id}

        # Build result with category info
        result = []
        for seat in seats:
            category = db.query(models.SeatCategory).filter(
                models.SeatCategory.id == seat.category_id
            ).first()

            if category:
                result.append({
                    "seat_id": seat.id,
                    "seat_number": seat.seat_label,
                    "category": category.name,
                    "price": category.price,
                    "is_booked": seat.id in booked_seat_ids
                })

        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")