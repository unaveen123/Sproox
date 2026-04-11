from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app import models
from datetime import datetime

router = APIRouter(prefix="/provider", tags=["Provider TimeSlots"])


# helper → convert AM/PM to 24 hour time
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


# ADD TIMESLOT
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

    location = db.query(models.Location).filter(
        models.Location.id == location_id
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    provider = db.query(models.Provider).filter(
        models.Provider.id == location.provider_id
    ).first()

    if not provider or provider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your location")

    # ✅ DETECT TYPE USING SCREEN
    is_theater = screen_id is not None

    # 🎬 THEATER
    if is_theater:

        if not movie_name:
            raise HTTPException(status_code=400, detail="movie_name required for theater")

        screen = db.query(models.Screen).filter(
            models.Screen.id == screen_id,
            models.Screen.location_id == location_id
        ).first()

        if not screen:
            raise HTTPException(status_code=404, detail="Screen not found")

    else:
        screen = None

    # ⏱️ time parse
    start = parse_time(start_time)
    end = parse_time(end_time)

    if start >= end:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    # 🔍 fetch slots
    if is_theater:
        existing_slots = db.query(models.TimeSlot).filter(
            models.TimeSlot.location_id == location_id,
            models.TimeSlot.screen_id == screen_id
        ).all()
    else:
        existing_slots = db.query(models.TimeSlot).filter(
            models.TimeSlot.location_id == location_id
        ).all()

    # 📊 limit
    if len(existing_slots) >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 slots allowed")

    # ⛔ overlap
    for slot in existing_slots:
        if not (end <= slot.start_time or start >= slot.end_time):

            if is_theater:
                raise HTTPException(
                    status_code=400,
                    detail=f"Time overlap in {screen.name}"
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Time overlap detected"
                )

    # ✅ create
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

    return {
        "message": f"Time slot added for {screen.name}" if screen else "Time slot added successfully"
    }


# =========================
# 🎟️ GET TIMESLOTS
# =========================

@router.get("/location/{location_id}/timeslots")
def get_timeslots(
    location_id: str,
    db: Session = Depends(get_db)
):
    slots = db.query(models.TimeSlot).filter(
        models.TimeSlot.location_id == location_id
    ).all()

    return slots