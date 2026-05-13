from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app import models
from pydantic import BaseModel
from typing import Dict, Optional
from app import schemas

router = APIRouter(prefix="/theater", tags=["Theater"])


# =========================
# 📦 REQUEST MODELS
# =========================

class GenerateSeatsRequest(BaseModel):
    rows: Dict[str, int]   # {"A":10, "B":12}
    category_mapping: Dict[str, str]  # {"A":"Diamond", "B":"Gold"}


# =========================
# 🎟️ ADD SEAT CATEGORIES (PER SCREEN)
# =========================

@router.post("/provider/location/{location_id}/seat-categories")
def add_seat_category(
    location_id: str,
    screen_id: str,   # ✅ NEW
    name: str,
    price: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # check location
    location = db.query(models.Location).filter(
        models.Location.id == location_id
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # check provider
    provider = db.query(models.Provider).filter(
        models.Provider.id == location.provider_id
    ).first()

    if not provider or provider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your location")

    # check screen
    screen = db.query(models.Screen).filter(
        models.Screen.id == screen_id,
        models.Screen.location_id == location_id
    ).first()

    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")

    # prevent duplicate per screen
    existing = db.query(models.SeatCategory).filter(
        models.SeatCategory.location_id == location_id,
        models.SeatCategory.name == name,
        models.SeatCategory.screen_id == screen_id
    ).first()

    if existing:
        existing.price = price
        db.commit()

        return {
            "message": f"{name} category updated for {screen.name}",
            "price": price
        }

    category = models.SeatCategory(
        location_id=location_id,
        screen_id=screen_id,   # ✅ NEW
        name=name,
        price=price
    )

    db.add(category)
    db.commit()

    return {
        "message": f"{name} category added to {screen.name}",
        "price": price
    }


# =========================
# 📥 GET EXISTING SEAT CATEGORIES
# =========================
@router.get("/provider/location/{location_id}/seat-categories")
def get_seat_categories(
    location_id: str,
    screen_id: Optional[str] = None,
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

    query = db.query(models.SeatCategory).filter(
        models.SeatCategory.location_id == location_id
    )

    if screen_id:
        screen = db.query(models.Screen).filter(
            models.Screen.id == screen_id,
            models.Screen.location_id == location_id
        ).first()

        if not screen:
            raise HTTPException(status_code=404, detail="Screen not found")

        query = query.filter(models.SeatCategory.screen_id == screen_id)

    categories = query.all()

    unique_categories = {}
    for category in categories:
        unique_categories[category.name.lower()] = category

    return [
        {"id": category.id, "name": category.name, "price": category.price}
        for category in unique_categories.values()
    ]


# =========================
# 🎬 GENERATE SEATS (MULTI CATEGORY)
# =========================

@router.post("/provider/location/{location_id}/generate-seats")
def generate_seats(
    location_id: str,
    screen_id: str,
    data: GenerateSeatsRequest,   # ✅ UPDATED
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # check location
    location = db.query(models.Location).filter(
        models.Location.id == location_id
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # check provider
    provider = db.query(models.Provider).filter(
        models.Provider.id == location.provider_id
    ).first()

    if not provider or provider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your location")

    # check screen
    screen = db.query(models.Screen).filter(
        models.Screen.id == screen_id,
        models.Screen.location_id == location_id
    ).first()

    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")

    created = []

    # 🔥 LOOP THROUGH ROWS
    for row, count in data.rows.items():

        # 🔥 find category using mapping
        category_name = data.category_mapping.get(row)

        if not category_name:
            raise HTTPException(
                status_code=400,
                detail=f"No category assigned for row {row}"
            )

        # get category
        category = db.query(models.SeatCategory).filter(
            models.SeatCategory.location_id == location_id,
            models.SeatCategory.screen_id == screen_id,
            models.SeatCategory.name == category_name
        ).first()

        if not category:
            raise HTTPException(
                status_code=404,
                detail=f"{category_name} category not found"
            )

        for num in range(1, count + 1):

            label = f"{row}{num}"

            # prevent duplicate seats
            exists = db.query(models.TheaterSeat).filter(
                models.TheaterSeat.screen_id == screen_id,
                models.TheaterSeat.seat_label == label
            ).first()

            if exists:
                continue

            seat = models.TheaterSeat(
                location_id=location_id,
                screen_id=screen_id,
                row=row,
                number=num,
                seat_label=label,
                category_id=category.id
            )

            db.add(seat)
            created.append(label)

    db.commit()

    return {
        "screen": screen.name,
        "total_created": len(created),
        "sample": created[:10]
    }


# =========================
# 🪑 GET LAYOUT (WITH PRICE + CATEGORY)
# =========================

@router.get("/location/{location_id}/layout/{screen_id}")
def get_layout(
    location_id: str,
    screen_id: str,
    db: Session = Depends(get_db)
):

    # check location
    location = db.query(models.Location).filter(
        models.Location.id == location_id
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # check screen
    screen = db.query(models.Screen).filter(
        models.Screen.id == screen_id,
        models.Screen.location_id == location_id
    ).first()

    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")

    seats = db.query(models.TheaterSeat).filter(
        models.TheaterSeat.location_id == location_id,
        models.TheaterSeat.screen_id == screen_id
    ).all()

    result = []

    for seat in seats:
        result.append({
            "seat_id": seat.id,
            "seat_label": seat.seat_label,
            "row": seat.row,
            "number": seat.number,
            "category": seat.category.name if seat.category else None,
            "price": seat.category.price if seat.category else None,
            "is_available": seat.is_available
        })

    return {
        "screen": screen.name,
        "total_seats": len(result),
        "seats": result
    }

from fastapi import UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app import models
import shutil
import os

MAX_FILES = 10
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/provider/location/{location_id}/timeslot/{timeslot_id}/upload-movie-images")
def upload_movie_images(
    location_id: str,
    timeslot_id: str,
    movie_name: str,
    language: str,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # ✅ limit number of files
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed")

    # ✅ validate timeslot
    timeslot = db.query(models.TimeSlot).filter(
        models.TimeSlot.id == timeslot_id,
        models.TimeSlot.location_id == location_id
    ).first()

    if not timeslot:
        raise HTTPException(status_code=404, detail="Invalid timeslot")

    image_urls = []

    os.makedirs("uploads", exist_ok=True)  # ensure folder exists

    for file in files:

        # ✅ validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files allowed")

        # ✅ read file to check size
        contents = file.file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size should be less than 5MB")

        file_path = f"uploads/{file.filename}"

        # ✅ save file
        with open(file_path, "wb") as buffer:
            buffer.write(contents)

        # reset pointer (good practice)
        file.file.seek(0)

        db.add(models.MovieImage(
            timeslot_id=timeslot_id,
            location_id=location_id,
            movie_name=movie_name,
            language=language,
            image_url=file_path
        ))

        image_urls.append(file_path)

    db.commit()

    return {"images": image_urls}

from fastapi import UploadFile, File, Form
import uuid
import shutil
import os

@router.post("/provider/location/{location_id}/timeslot/{timeslot_id}/add-cast")
def add_cast_with_photos(
    location_id: str,
    timeslot_id: str,
    movie_name: str = Form(...),
    language: str = Form(...),

    names: list[str] = Form(...),   # 🔥 multiple names
    roles: list[str] = Form(...),   # 🔥 multiple roles
    photos: list[UploadFile] = File(...),  # 🔥 multiple photos

    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # ✅ validation
    if not (len(names) == len(roles) == len(photos)):
        raise HTTPException(status_code=400, detail="Names, roles, and photos count must match")

    os.makedirs("uploads", exist_ok=True)

    for i in range(len(names)):

        file = photos[i]

        file_name = f"{uuid.uuid4()}_{file.filename}"
        file_path = f"uploads/{file_name}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        new_cast = models.MovieCast(
            timeslot_id=timeslot_id,
            location_id=location_id,
            movie_name=movie_name,
            language=language,
            name=names[i],
            role=roles[i],
            photo_url=file_path
        )

        db.add(new_cast)

    db.commit()

    return {"message": "Cast with photos added successfully"}


@router.post("/provider/location/{location_id}/timeslot/{timeslot_id}/add-cast-crew")
def add_cast_and_crew_with_photos(
    location_id: str,
    timeslot_id: str,
    movie_name: str = Form(...),
    language: str = Form(...),
    names: list[str] | None = Form(None),
    roles: list[str] | None = Form(None),
    photos: list[UploadFile] | None = File(None),
    crew_names: list[str] | None = Form(None),
    crew_roles: list[str] | None = Form(None),
    crew_photos: list[UploadFile] | None = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    names = names or []
    roles = roles or []
    photos = photos or []

    if not (len(names) == len(roles) == len(photos)):
        raise HTTPException(status_code=400, detail="Cast names, roles, and photos count must match")

    crew_names = crew_names or []
    crew_roles = crew_roles or []
    crew_photos = crew_photos or []

    if not (len(crew_names) == len(crew_roles) == len(crew_photos)):
        raise HTTPException(status_code=400, detail="Crew names, roles, and photos count must match")

    if len(names) == 0 and len(crew_names) == 0:
        raise HTTPException(status_code=400, detail="Add at least one cast or crew member")

    os.makedirs("uploads", exist_ok=True)

    def save_members(member_names, member_roles, member_photos, member_type):
        for index, file in enumerate(member_photos):
            file_name = f"{uuid.uuid4()}_{file.filename}"
            file_path = f"uploads/{file_name}"

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            db.add(models.MovieCast(
                timeslot_id=timeslot_id,
                location_id=location_id,
                movie_name=movie_name,
                language=language,
                name=member_names[index],
                role=member_roles[index],
                member_type=member_type,
                photo_url=file_path
            ))

    save_members(names, roles, photos, "cast")
    save_members(crew_names, crew_roles, crew_photos, "crew")

    db.commit()

    return {"message": "Cast and crew added successfully"}
