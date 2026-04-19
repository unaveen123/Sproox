from pydantic import BaseModel, EmailStr, validator
from datetime import time
from typing import List, Optional




class RegisterSchema(BaseModel):
    name: str
    phone: str
    email: EmailStr
    password: str
    confirm_password: str

    @validator("phone")
    def phone_must_be_10_digits(cls, v):
        if not v.isdigit() or len(v) != 10:
            raise ValueError("Enter valid 10 digit phone number")
        return v

    @validator("password")
    def password_min_length(cls, v):
        if len(v) < 5:
            raise ValueError("Password must be at least 5 characters")
        return v


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
    confirm_password: str

    @validator("new_password")
    def password_min_length(cls, v):
        if len(v) < 5:
            raise ValueError("Password must be at least 5 characters")
        return v

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginSchema(BaseModel):
    email_or_phone: str
    password: str

class ProviderApply(BaseModel):
    business_name: str
    email: EmailStr
    phone: str

class LocationCreate(BaseModel):
    name: str
    address: str
    city: str
    description: str   

class AddSeatsSchema(BaseModel):
    total_seats: int
    price_per_hour: float  

class TimeSlotCreate(BaseModel):  
    start_time: time
    end_time: time  

class BookSeatSchema(BaseModel):
    seat_id: Optional[str]=None
    theater_seat_id: Optional[str]=None
    slot_id: str
    booking_date: str  # YYYY-MM-DD
        
class PaymentOrderRequest(BaseModel):
    booking_ids: List[str]


class PaymentVerify(BaseModel):
    order_id: str
    payment_id: str
    signature: str
    booking_ids: Optional[List[str]] = None


class ScanTicket(BaseModel):
    booking_id: str    
   