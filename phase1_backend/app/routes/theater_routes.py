from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app import models
from pydantic import BaseModel
from typing import Dict

router = APIRouter(prefix="/theater", tags=["Theater"])


# =========================
# 📦 REQUEST MODELS
# =========================

class GenerateSeatsRequest(BaseModel):
    rows: Dict[str, int]
    category_mapping: Dict[str, str]


# =========================
# 🎟️ ADD SEAT CATEGORIES
# =========================

@router.post("/provider/location/{location_id}/seat-categories")
def add_seat_category(
    location_id: str,
    screen_id: str,
    name: str,
    price: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
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

    screen = db.query(models.Screen).filter(
        models.Screen.id == screen_id,
        models.Screen.location_id == location_id
    ).first()

    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")

    existing = db.query(models.SeatCategory).filter(
        models.SeatCategory.location_id == location_id,
        models.SeatCategory.screen_id == screen_id,
        models.SeatCategory.name == name
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Category already exists for this screen"
        )

    category = models.SeatCategory(
        location_id=location_id,
        screen_id=screen_id,
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
# 🎬 GENERATE SEATS
# =========================

@router.post("/provider/location/{location_id}/generate-seats")
def generate_seats(
    location_id: str,
    screen_id: str,
    data: GenerateSeatsRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # ✅ LOCATION CHECK
    location = db.query(models.Location).filter(
        models.Location.id == location_id
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # ✅ PROVIDER CHECK
    provider = db.query(models.Provider).filter(
        models.Provider.id == location.provider_id
    ).first()

    if not provider or provider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your location")

    # ✅ SCREEN CHECK
    screen = db.query(models.Screen).filter(
        models.Screen.id == screen_id,
        models.Screen.location_id == location_id
    ).first()

    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")

    # 🔥 UPDATED LOGIC: GET EXISTING ROWS (instead of blocking everything)
    existing_rows = db.query(models.TheaterSeat.row).filter(
        models.TheaterSeat.screen_id == screen_id
    ).distinct().all()

    existing_rows = {r[0] for r in existing_rows}

    created = []

    # ✅ LOOP THROUGH NEW ROWS
    for row, count in data.rows.items():

        # ❌ BLOCK DUPLICATE ROWS
        if row in existing_rows:
            raise HTTPException(
                status_code=400,
                detail=f"Row '{row}' already exists. Cannot add duplicate row."
            )

        # ✅ CATEGORY CHECK
        category_name = data.category_mapping.get(row)

        if not category_name:
            raise HTTPException(
                status_code=400,
                detail=f"No category assigned for row {row}"
            )

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

        # ✅ CREATE SEATS
        for num in range(1, count + 1):
            label = f"{row}{num}"

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
# 🎟️ GET SEAT CATEGORIES (FIXED 🔥)
# =========================

@router.get("/provider/location/{location_id}/seat-categories")
def get_seat_categories(
    location_id: str,
    screen_id: str,  # 🔥 IMPORTANT
    db: Session = Depends(get_db)
):
    categories = db.query(models.SeatCategory).filter(
        models.SeatCategory.location_id == location_id,
        models.SeatCategory.screen_id == screen_id
    ).all()

    return categories