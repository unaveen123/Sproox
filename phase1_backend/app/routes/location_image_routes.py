import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Location, LocationImage, Provider

router = APIRouter(prefix="/provider/location", tags=["Provider Images"])

UPLOAD_DIR = "uploads/locations"

@router.post("/upload-images/{location_id}")
def upload_location_images(
    location_id: str,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # minimum 3 maximum 5 images
    if len(files) < 3 or len(files) > 5:
        raise HTTPException(status_code=400, detail="Upload minimum 3 and maximum 5 images")

    # get provider
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(status_code=403, detail="Only provider allowed")

    location = db.query(Location).filter(Location.id == location_id, Location.provider_id == provider.id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    saved_images = []

    for file in files:
        ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        image_url = f"/uploads/locations/{filename}"

        new_image = LocationImage(
            location_id=location_id,
            image_url=image_url
        )
        db.add(new_image)
        saved_images.append(image_url)

    db.commit()

    return {"message": "Images uploaded successfully", "images": saved_images}
