from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Seat
import app.models as models


router = APIRouter(prefix="/provider/seats", tags=["Seat Management"])


# Put seat into maintenance
@router.put("/provider/seats/maintenance/{seat_id}")
def put_seat_maintenance(seat_id: str,
                         db: Session = Depends(get_db),
                         current_user = Depends(get_current_user)):

    seat = db.query(models.Seat).filter(models.Seat.id == seat_id).first()

    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")

    # get location
    location = db.query(models.Location).filter(models.Location.id == seat.location_id).first()

    # ownership check
    if location.provider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your seat")

    # mark maintenance
    seat.status = "maintenance"
    seat.is_available = False

    db.commit()

    return {"message": "Seat marked as maintenance"}


@router.put("/provider/seats/available/{seat_id}")
def make_seat_available(seat_id: str,
                        db: Session = Depends(get_db),
                        current_user = Depends(get_current_user)):

    seat = db.query(models.Seat).filter(models.Seat.id == seat_id).first()

    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")

    # get location
    location = db.query(models.Location).filter(models.Location.id == seat.location_id).first()

    # ownership check
    if location.provider.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your seat")

    # make available again
    seat.status = "available"
    seat.is_available = True

    db.commit()

    return {"message": "Seat is now available"}
