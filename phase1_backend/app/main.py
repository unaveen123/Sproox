from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import asyncio

# DB & Models
from app.database import engine
import app.models as models

# Routers
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
from app.routes import payment_routes
from app.routes import theater_routes
from app.routes import screen_routes

# Background Task
from app.seat_cleaner import release_expired_seats


# =========================
# 🚀 APP INIT
# =========================
app = FastAPI(title="Seat Booking API")


# =========================
# 📁 CREATE FOLDERS
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_DIR = os.path.join(BASE_DIR, "..", "uploads")
LOCATION_UPLOADS = os.path.join(UPLOAD_DIR, "locations")
TICKET_DIR = os.path.join(BASE_DIR, "..", "tickets")

os.makedirs(LOCATION_UPLOADS, exist_ok=True)
os.makedirs(TICKET_DIR, exist_ok=True)


# =========================
# 📸 STATIC FILES
# =========================
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/tickets", StaticFiles(directory=TICKET_DIR), name="tickets")


# =========================
# 🌐 CORS (IMPORTANT)
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# 🗄️ CREATE TABLES
# =========================
models.Base.metadata.create_all(bind=engine)


# =========================
# 🔌 ROUTES
# =========================
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


# =========================
# 🏠 ROOT
# =========================
@app.get("/")
def home():
    return {"message": "Seat Booking Backend Running 🚀"}


# =========================
# ⏳ BACKGROUND TASK
# =========================
@app.on_event("startup")
async def start_seat_cleaner():
    asyncio.create_task(release_expired_seats())