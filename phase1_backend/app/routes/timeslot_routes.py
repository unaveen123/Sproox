from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app import models
from datetime import datetime

router = APIRouter(prefix="/provider", tags=["Provider TimeSlots"])


# =========================
# ⏱️ HELPER FUNCTION
# =========================
def parse_time(time_str: str):
    try:
        return datetime.strptime(time_str.strip().upper(), "%I:%M %p").time()
    except:
        try:
            return datetime.strptime(time_str.strip(), "%H:%M").time()
        except:
            raise HTTPException(
                status_code=400,
                detail="Invalid time format. Use '10:00 AM' or '22:00'"
            )


# =========================
# 🎬 ADD TIMESLOT
# =========================
@router.post("/location/{location_id}/add-timeslot")
def add_timeslot(
    location_id: str,
    start_time: str,
    end_time: str,
    screen_id: str = None,
    movie_name: str = None,
    language: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # 🔍 check location
    location = db.query(models.Location).filter(
        models.Location.id == location_id
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # 🔍 check provider ownership
    provider = db.query(models.Provider).filter(
        models.Provider.id == location.provider_id
    ).first()

    if not provider or provider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your location")

    # 🎬 check if theater
    is_theater = screen_id is not None

    if is_theater:
        if not movie_name:
            raise HTTPException(status_code=400, detail="movie_name required")

        screen = db.query(models.Screen).filter(
            models.Screen.id == screen_id,
            models.Screen.location_id == location_id
        ).first()

        if not screen:
            raise HTTPException(status_code=404, detail="Screen not found")
    else:
        screen = None

    # ⏱️ parse time
    start = parse_time(start_time)
    end = parse_time(end_time)

    if start >= end:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    # 🔍 existing slots
    if is_theater:
        existing_slots = db.query(models.TimeSlot).filter(
            models.TimeSlot.location_id == location_id,
            models.TimeSlot.screen_id == screen_id
        ).all()
    else:
        existing_slots = db.query(models.TimeSlot).filter(
            models.TimeSlot.location_id == location_id
        ).all()

    # 📊 max limit
    if len(existing_slots) >= 10:
        raise HTTPException(status_code=400, detail="Max 10 slots allowed")

    # ⛔ overlap check
    for slot in existing_slots:
        if not (end <= slot.start_time or start >= slot.end_time):
            raise HTTPException(status_code=400, detail="Time overlap detected")

    # ✅ create slot
    new_slot = models.TimeSlot(
        location_id=location_id,
        start_time=start,
        end_time=end,
        movie_name=movie_name if is_theater else None,
        language=language if is_theater else None,
        screen_id=screen_id if is_theater else None
    )

    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)

    return {
        "message": "Timeslot added successfully",
        "data": {
            "id": new_slot.id,
            "movie_name": new_slot.movie_name,
            "language": new_slot.language
        }
    }


# =========================
# 🎟️ GET TIMESLOTS (PROVIDER)
# =========================
@router.get("/location/{location_id}/timeslots")
def get_timeslots(
    location_id: str,
    db: Session = Depends(get_db)
):
    slots = db.query(models.TimeSlot).filter(
        models.TimeSlot.location_id == location_id
    ).all()

    result = []

    for slot in slots:
        result.append({
            "id": slot.id,
            "location_id": slot.location_id,
            "screen_id": slot.screen_id,
            "start_time": slot.start_time.strftime("%I:%M %p"),
            "end_time": slot.end_time.strftime("%I:%M %p"),
            "movie_name": slot.movie_name,
            "language": slot.language
        })

    return result