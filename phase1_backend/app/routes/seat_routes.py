from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
import app.models as models
from app import schemas

from app.dependencies import get_current_user

router = APIRouter(prefix="/provider", tags=["Provider Seats"])


@router.post("/location/{location_id}/add-seats")
def add_seats(location_id: str,
              seat_data: schemas.AddSeatsSchema,
              db: Session = Depends(get_db),
              current_user = Depends(get_current_user)):

    # 1️⃣ Get provider of this logged in user
    provider = db.query(models.Provider).filter(
        models.Provider.user_id == current_user.id
    ).first()

    if not provider:
        raise HTTPException(status_code=403, detail="You are not a provider")

    # 2️⃣ Get location
    location = db.query(models.Location).filter(
        models.Location.id == location_id
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # 3️⃣ Verify ownership (THIS IS THE REAL CHECK)
    if location.provider_id != provider.id:
        raise HTTPException(status_code=403, detail="Not your location")

    # 4️⃣ Create seats
    for i in range(1, seat_data.total_seats + 1):
        new_seat = models.Seat(
            location_id=location_id,
            seat_number=i,
            price_per_hour=seat_data.price_per_hour,
            status="available"
        )
        db.add(new_seat)

    db.commit()

    return {"message": f"{seat_data.total_seats} seats created successfully"}
