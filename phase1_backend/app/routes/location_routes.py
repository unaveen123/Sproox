from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Location, Provider, User
from app.schemas import LocationCreate
from app.dependencies import get_current_user
from app.models import Location, Provider, User
import app.models as models

router = APIRouter(prefix="/provider/location", tags=["Provider Locations"])


# only approved provider allowed
def provider_required(current_user: User = Depends(get_current_user),
                      db: Session = Depends(get_db)):

    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers allowed")

    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()

    if not provider or not provider.is_approved:
        raise HTTPException(status_code=403, detail="Provider not approved")

    return provider


@router.post("/add")
def add_location(data: LocationCreate,
                 provider: Provider = Depends(provider_required),
                 db: Session = Depends(get_db)):

    new_location = Location(
        provider_id=provider.id,
        name=data.name,
        address=data.address,
        city=data.city,
        description=data.description
    )

    db.add(new_location)
    db.commit()

    return {"message": "Location added successfully"}

# -----------------------------
# GET PROVIDER OWN LOCATIONS
# -----------------------------
@router.get("/my-locations")
def get_my_locations(provider: Provider = Depends(provider_required),
                     db: Session = Depends(get_db)):

    locations = db.query(models.Location).filter(
        models.Location.provider_id == provider.id
    ).all()

    result = []

    for loc in locations:
        result.append({
            "location_id": loc.id,
            "name": loc.name,
            "city": loc.city,
            "address": loc.address,
            "description": loc.description
        })

    return result
