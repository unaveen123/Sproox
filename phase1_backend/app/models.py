from sqlalchemy import Column, String, Boolean, ForeignKey, Integer, Float, Time, Date, DateTime
from app.database import Base
from sqlalchemy.orm import relationship
from sqlalchemy import UniqueConstraint
import uuid
from datetime import datetime


# =========================
# USER
# =========================
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    phone = Column(String(10), unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)

    is_verified = Column(Boolean, default=False)
    role = Column(String, default="user")  # user / provider / admin
    is_blocked = Column(Boolean, default=False)


# =========================
# PROVIDER
# =========================
class Provider(Base):
    __tablename__ = "providers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))

    business_name = Column(String, nullable=False)
    phone = Column(String(10), nullable=False)

    is_approved = Column(Boolean, default=False)
    is_blocked = Column(Boolean, default=False)

    user = relationship("User", backref="provider")
    locations = relationship("Location", back_populates="provider", cascade="all, delete")


# =========================
# LOCATION
# =========================
class Location(Base):
    __tablename__ = "locations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_id = Column(String, ForeignKey("providers.id", ondelete="CASCADE"))

    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    description = Column(String, nullable=True)

    # ✅ NEW (VERY IMPORTANT)
    type = Column(String, default="coworking")  
    # coworking / library / theater

    provider = relationship("Provider", back_populates="locations")
    images = relationship("LocationImage", back_populates="location", cascade="all, delete")
    seats = relationship("Seat", back_populates="location", cascade="all, delete")

    # ✅ NEW RELATION
    screens = relationship("Screen", back_populates="location", cascade="all, delete")


# =========================
# LOCATION IMAGES
# =========================
class LocationImage(Base):
    __tablename__ = "location_images"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    location_id = Column(String, ForeignKey("locations.id", ondelete="CASCADE"))

    image_url = Column(String, nullable=False)

    location = relationship("Location", back_populates="images")


# =========================
# SEAT (CO-WORKING / LIBRARY)
# =========================
class Seat(Base):
    __tablename__ = "seats"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    location_id = Column(String, ForeignKey("locations.id", ondelete="CASCADE"))

    seat_number = Column(Integer, nullable=False)

    price_per_hour = Column(Float, nullable=False)

    is_available = Column(Boolean, default=True)

    status = Column(String, default="available")  # available / reserved / maintenance

    # 🔥 RESERVATION SYSTEM
    reserved_by = Column(String, ForeignKey("users.id"), nullable=True)
    reserved_until = Column(DateTime, nullable=True)

    location = relationship("Location", back_populates="seats")


# =========================
# SCREEN (THEATER)
# =========================
class Screen(Base):
    __tablename__ = "screens"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    location_id = Column(String, ForeignKey("locations.id"))

    name = Column(String, nullable=False)   # Screen 1, Screen 2

    location = relationship("Location", back_populates="screens")

    # ✅ RELATION
    timeslots = relationship("TimeSlot", back_populates="screen", cascade="all, delete")


# =========================
# TIMESLOT
# =========================
class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    location_id = Column(String, ForeignKey("locations.id", ondelete="CASCADE"))

    # ✅ NEW
    screen_id = Column(String, ForeignKey("screens.id"), nullable=True)

    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # ✅ NEW
    movie_name = Column(String, nullable=True)
    language = Column(String, nullable=True)

    location = relationship("Location")

    # ✅ NEW RELATION
    screen = relationship("Screen", back_populates="timeslots")

    bookings = relationship("Booking", back_populates="slot", cascade="all, delete")


# =========================
# BOOKING
# =========================
class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String, ForeignKey("users.id"))
    seat_id = Column(String, ForeignKey("seats.id"))

    # ✅ THEATER
    theater_seat_id = Column(String, ForeignKey("theater_seats.id"), nullable=True)

    slot_id = Column(String, ForeignKey("time_slots.id"))

    booking_date = Column(Date, nullable=False)

    status = Column(String, default="pending")  
    # pending / confirmed / cancelled / failed

    qr_code = Column(String, nullable=True)
    qr_used = Column(Boolean, default=False)

    __table_args__ = (
        UniqueConstraint('seat_id', 'slot_id', 'booking_date', name='unique_seat_booking'),
    )

    user = relationship("User")
    seat = relationship("Seat")

    theater_seat = relationship("TheaterSeat")

    slot = relationship("TimeSlot")

    payment = relationship("Payment", back_populates="booking", uselist=False)


# =========================
# PAYMENT
# =========================
class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    booking_id = Column(String, ForeignKey("bookings.id"), nullable=False)

    amount = Column(Integer, nullable=False)

    order_id = Column(String, nullable=True)
    payment_id = Column(String, nullable=True)

    status = Column(String, default="pending")

    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="payment")


# =========================
# THEATER CATEGORY
# =========================
class SeatCategory(Base):
    __tablename__ = "seat_categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    location_id = Column(String, ForeignKey("locations.id"))
    screen_id = Column(String, ForeignKey("screens.id"))

    name = Column(String, nullable=False)
    price = Column(Integer, nullable=False)

    location = relationship("Location")
    theater_seats = relationship("TheaterSeat", back_populates="category")


# =========================
# THEATER SEATS
# =========================
class TheaterSeat(Base):
    __tablename__ = "theater_seats"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    location_id = Column(String, ForeignKey("locations.id"))

    row = Column(String)
    number = Column(Integer)

    seat_label = Column(String)

    category_id = Column(String, ForeignKey("seat_categories.id"))

    is_available = Column(Boolean, default=True)

    # ✅ SCREEN SUPPORT
    screen_id = Column(String, ForeignKey("screens.id"))

    location = relationship("Location")
    category = relationship("SeatCategory", back_populates="theater_seats")