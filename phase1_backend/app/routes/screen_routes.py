from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app import models

router = APIRouter(prefix="/provider", tags=["Screens"])


# 🎬 ADD SCREEN
@router.post("/location/{location_id}/add-screen")
def add_screen(
    location_id: str,
    name: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    location = db.query(models.Location).filter(
        models.Location.id == location_id
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    provider = db.query(models.Provider).filter(
        models.Provider.id == location.provider_id
    ).first()

    if provider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your location")

    # ✅ duplicate check
    existing_screen = db.query(models.Screen).filter(
        models.Screen.location_id == location_id,
        models.Screen.name.ilike(name.strip())
    ).first()

    if existing_screen:
        raise HTTPException(
            status_code=400,
            detail=f"{name} already exists for this location"
        )

    screen = models.Screen(
        location_id=location_id,
        name=name.strip()
    )

    db.add(screen)
    db.commit()

    return {"message": "Screen added successfully"} 


# 🎬 GET ALL SCREENS FOR LOCATION
@router.get("/location/{location_id}/screens")
def get_screens(
    location_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check location
    location = db.query(models.Location).filter(
        models.Location.id == location_id
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # Check provider ownership
    provider = db.query(models.Provider).filter(
        models.Provider.id == location.provider_id
    ).first()

    if provider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your location")

    # Fetch screens
    screens = db.query(models.Screen).filter(
        models.Screen.location_id == location_id
    ).all()

    return screens
#delete completed shows
@router.delete("/delete-completed-shows")
def delete_completed_shows(
    location_id: str,
    movie_name: str,
    slot_id: str,   # ✅ use slot_id instead
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # 🔍 find exact slot
    slot = db.query(models.TimeSlot).filter(
        models.TimeSlot.id == slot_id,
        models.TimeSlot.location_id == location_id,
        models.TimeSlot.movie_name.ilike(movie_name)
    ).first()

    if not slot:
        raise HTTPException(status_code=404, detail="Show not found")

    # 🔥 delete bookings
    db.query(models.Booking).filter(
        models.Booking.slot_id == slot.id
    ).delete(synchronize_session=False)

    # 🔥 delete timeslot
    db.delete(slot)

    db.commit()

    return {"message": "Selected show deleted successfully"}

@router.delete("/location/{location_id}/delete-screen-maintenance/{screen_id}")
def delete_screen_maintenance(
    location_id: str,
    screen_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
        # check screen
    screen = db.query(models.Screen).filter(
        models.Screen.id == screen_id,
        models.Screen.location_id == location_id
    ).first()

    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")

    # ownership check
    location = db.query(models.Location).filter(
        models.Location.id == location_id
    ).first()

    provider = db.query(models.Provider).filter(
        models.Provider.id == location.provider_id
    ).first()

    if provider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your location")

    # check active bookings (maintenance condition)
    active_bookings = db.query(models.Booking).filter(
        models.Booking.slot_id.in_(
            db.query(models.TimeSlot.id).filter(
                models.TimeSlot.screen_id == screen_id
            )
        )
    ).count()

    if active_bookings > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete screen with active bookings"
        )

    # 🔥 DELETE IN CORRECT ORDER

    # 1️⃣ delete bookings
    db.query(models.Booking).filter(
    models.Booking.slot_id.in_(
        db.query(models.TimeSlot.id).filter(
            models.TimeSlot.screen_id == screen_id
        )
    )
).delete(synchronize_session=False)

# 2️⃣ EXTRA SAFETY: delete bookings linked via seat_id
    db.query(models.Booking).filter(
    models.Booking.seat_id.in_(
        db.query(models.Seat.id).filter(
            models.Seat.location_id == location_id
        )
    )
).delete(synchronize_session=False)

# 3️⃣ delete timeslots
    db.query(models.TimeSlot).filter(
    models.TimeSlot.screen_id == screen_id
).delete()

# 4️⃣ delete seats
    db.query(models.Seat).filter(
    models.Seat.location_id == location_id
).delete()

# 5️⃣ delete screen
    db.delete(screen)

    db.commit()
    return {"message": "Screen deleted successfully"}