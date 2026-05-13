from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Location, Provider
import app.models as models
from datetime import date

router = APIRouter(prefix="/user", tags=["User Browse"])


# ================= GET ALL APPROVED LOCATIONS =================
@router.get("/locations")
def get_locations(db: Session = Depends(get_db)):

    locations = (
        db.query(Location)
        .join(Provider, Location.provider_id == Provider.id)
        .join(models.TimeSlot, Location.id == models.TimeSlot.location_id)
        .filter(Provider.is_approved.is_(True))
        .distinct()
        .all()
    )

    result = []

    for loc in locations:
        location_image = db.query(models.LocationImage).filter(
            models.LocationImage.location_id == loc.id
        ).first()

        movie_posters = [
            {
                "movie_name": name,
                "image_url": image_url,
            }
            for (name, image_url) in db.query(models.MovieImage.movie_name, models.MovieImage.image_url)
            .filter(
                models.MovieImage.location_id == loc.id,
                models.MovieImage.movie_name.isnot(None),
                models.MovieImage.image_url.isnot(None)
            )
            .distinct()
            .all()
            if name and image_url
        ]

        movie_names = [
            name for (name,) in db.query(models.TimeSlot.movie_name)
            .filter(
                models.TimeSlot.location_id == loc.id,
                models.TimeSlot.movie_name.isnot(None)
            )
            .distinct()
            .all()
            if name
        ]

        show_count = db.query(models.TimeSlot).filter(
            models.TimeSlot.location_id == loc.id
        ).count()

        result.append({
            "location_id": loc.id,
            "name": loc.name,
            "address": loc.address,
            "city": loc.city,
            "description": loc.description,
            "provider_business": loc.provider.business_name,
            "image_url": location_image.image_url if location_image else None,
            "poster_url": movie_posters[0]["image_url"] if movie_posters else None,
            "movie_posters": movie_posters,
            "movie_names": movie_names,
            "show_count": show_count,
        })

    return result


# ================= GET MOVIE CAST/CREW =================
@router.get("/locations/{location_id}/movie-cast")
def get_movie_cast(location_id: str, movie_name: str | None = None, db: Session = Depends(get_db)):
    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    query = db.query(models.MovieCast).filter(models.MovieCast.location_id == location_id)
    if movie_name:
        query = query.filter(models.MovieCast.movie_name == movie_name)

    members = query.all()

    cast = [
        {
            "id": member.id,
            "name": member.name,
            "role": member.role,
            "member_type": member.member_type,
            "photo_url": member.photo_url,
            "movie_name": member.movie_name,
            "language": member.language,
            "timeslot_id": member.timeslot_id,
        }
        for member in members
    ]

    return {
        "cast": [m for m in cast if m["member_type"] == "cast"],
        "crew": [m for m in cast if m["member_type"] != "cast"],
    }


# ================= GET SCREENS =================
@router.get("/locations/{location_id}/screens")
def get_screens_for_user(location_id: str, db: Session = Depends(get_db)):

    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    screens = db.query(models.Screen).filter(
        models.Screen.location_id == location_id
    ).all()

    return screens


# ================= 🎬 GET TIMESLOTS (UPDATED FIX) =================
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

        # 🎯 get screen name
        screen_name = None
        if s.screen_id:
            screen = db.query(models.Screen).filter(
                models.Screen.id == str(s.screen_id)
            ).first()

            if screen:
                screen_name = screen.name

        movie_images = db.query(models.MovieImage).filter(
            models.MovieImage.timeslot_id == s.id
        ).all()

        result.append({
            "slot_id": s.id,
            "screen_id": s.screen_id,
            "screen_name": screen_name,  # ✅ IMPORTANT
            "start_time": s.start_time.strftime("%I:%M %p"),
            "end_time": s.end_time.strftime("%I:%M %p"),
            "movie_name": s.movie_name,  # ✅ IMPORTANT
            "language": s.language,      # ✅ IMPORTANT
            "images": [image.image_url for image in movie_images],
            "poster_url": movie_images[0].image_url if movie_images else None,
        })

    return result


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


# ================= AVAILABLE SEATS =================
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

    slot = db.query(models.TimeSlot).filter(
        models.TimeSlot.id == slot_id,
        models.TimeSlot.location_id == location_id
    ).first()

    if not slot:
        raise HTTPException(status_code=404, detail="Show slot not found")

    if not slot.screen_id:
        raise HTTPException(status_code=400, detail="Slot has no screen")

    seats = db.query(models.TheaterSeat).filter(
        models.TheaterSeat.location_id == location_id,
        models.TheaterSeat.screen_id == str(slot.screen_id)
    ).all()

    booked_seats = db.query(models.Booking).filter(
        models.Booking.slot_id == slot_id,
        models.Booking.booking_date == booking_date,
        models.Booking.status.in_(["pending", "confirmed"])
    ).all()

    booked_ids = {b.theater_seat_id for b in booked_seats if b.theater_seat_id}

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
                "is_booked": seat.id in booked_ids
            })

    return result
