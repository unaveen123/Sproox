from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app import models
import re

router = APIRouter(prefix="/provider", tags=["Screens"])


# 🔥 HELPER
def extract_number(name: str):
    match = re.search(r"\d+", name)
    return match.group() if match else name.lower().strip()


# 🎬 ADD SCREEN
@router.post("/location/{location_id}/add-screen")
def add_screen(
    location_id: str,
    name: str = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    print("👉 Received location_id:", location_id)

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

    input_number = extract_number(name)
    final_name = f"Screen {input_number}"

    # 🔥 DUPLICATE CHECK
    existing = db.query(models.Screen).filter(
        models.Screen.location_id == location_id
    ).all()

    for s in existing:
        if extract_number(s.name) == input_number:
            raise HTTPException(
                status_code=400,
                detail=f"Screen {input_number} already exists"
            )

    new_screen = models.Screen(
        location_id=location_id,
        name=final_name
    )

    db.add(new_screen)
    db.commit()
    db.refresh(new_screen)

    return {
        "screen": {
            "id": new_screen.id,
            "name": new_screen.name,
            "location_id": new_screen.location_id
        }
    }


# 🎬 GET SCREENS
@router.get("/location/{location_id}/screens")
def get_screens(
    location_id: str,
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

    if provider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your location")

    screens = db.query(models.Screen).filter(
        models.Screen.location_id == location_id
    ).all()

    return [
        {
            "id": s.id,
            "name": s.name,
            "location_id": s.location_id
        }
        for s in screens
    ]


# 🎬 DELETE SCREEN
@router.delete("/location/{location_id}/delete-screen-maintenance/{screen_id}")
def delete_screen(
    location_id: str,
    screen_id: str,
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

    if provider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your location")

    screen = db.query(models.Screen).filter(
        models.Screen.id == screen_id,
        models.Screen.location_id == location_id
    ).first()

    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")

    db.delete(screen)
    db.commit()

    return {"message": "Screen deleted successfully"}
