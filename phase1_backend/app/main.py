from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import engine
import app.models as models   # <-- IMPORTANT CHANGE

from app.routes import auth_routes
from app.routes import provider_routes
from app.routes import admin_routes
from app.routes import location_routes
from app.routes import location_image_routes
from app.routes import seat_routes
from app.routes import user_routes
from app.routes import seat_management_routes
from app.routes import timeslot_routes
from app.routes import booking_routes
from app.routes import reservation_routes
import asyncio
from app.seat_cleaner import release_expired_seats
from app.routes import payment_routes
from app.routes import theater_routes
from app.routes import screen_routes

app = FastAPI()

# auto create upload folders
os.makedirs("uploads/locations", exist_ok=True)

# static images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# IMPORTANT: create tables AFTER models are imported
models.Base.metadata.create_all(bind=engine)

# Routers
app.include_router(auth_routes.router)
app.include_router(provider_routes.router)
app.include_router(admin_routes.router)
app.include_router(location_routes.router)
app.include_router(location_image_routes.router)
app.include_router(timeslot_routes.router)
app.include_router(seat_routes.router)
app.include_router(seat_management_routes.router)
app.include_router(user_routes.router)
app.include_router(booking_routes.router)
app.include_router(reservation_routes.router)
app.include_router(payment_routes.router)
app.include_router(theater_routes.router)
app.include_router(screen_routes.router)



@app.get("/")
def home():
    return {"message": "Seat Booking Backend Running"}

@app.on_event("startup")
async def start_seat_cleaner():
    # Start the seat cleaner in the background
    asyncio.create_task(release_expired_seats())