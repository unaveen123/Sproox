from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import hash_password
from app.otp import generate_otp
from app.otp import verify_otp
from app.auth import verify_password, create_access_token
from app.dependencies import get_current_user
from fastapi.security import OAuth2PasswordRequestForm



router = APIRouter(prefix="/auth", tags=["Authentication"])


# REGISTER USER
@router.post("/register")
def register_user(user: schemas.RegisterSchema, db: Session = Depends(get_db)):

    # check password match
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # check email exists
    existing_email = db.query(models.User).filter(models.User.email == user.email).first()
    # If user already exists but not verified → resend OTP
    if existing_email:
        if existing_email.is_verified:
            raise HTTPException(status_code=400, detail="Email already registered and verified")
        else:
            generate_otp(user.email)
            return {"message": "OTP resent to your email"}
        
    # check phone exists
    existing_phone = db.query(models.User).filter(models.User.phone == user.phone).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # hash password
    hashed_password = hash_password(user.password)

    # create user (unverified)
    new_user = models.User(
        name=user.name,
        phone=user.phone,
        email=user.email,
        password=hashed_password,
        is_verified=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # generate & send OTP
    generate_otp(user.email)

    return {"message": "OTP sent to your email"}

# VERIFY OTP
@router.post("/verify-otp")
def verify_user_otp(data: schemas.OTPVerify, db: Session = Depends(get_db)):

    # check user exists
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # verify otp
    if not verify_otp(data.email, data.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # activate account
    user.is_verified = True
    db.commit()

    return {"message": "Account created successfully. Please login."}


@router.post("/forgot-password")
def forgot_password(data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    generate_otp(data.email)
    return {"message": "Password reset OTP sent to your email."}


@router.post("/reset-password")
def reset_password(data: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_otp(data.email, data.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user.password = hash_password(data.new_password)
    db.commit()

    return {"message": "Password reset successfully. You can now login."}


# LOGIN USER (OAUTH2 COMPATIBLE)
@router.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends(),
               db: Session = Depends(get_db)):

    # username can be email OR phone
    user = db.query(models.User).filter(
        (models.User.email == form_data.username) |
        (models.User.phone == form_data.username)
    ).first()

    # 1️⃣ user exists?
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2️⃣ verified?
    if not user.is_verified:
        raise HTTPException(status_code=401, detail="Please verify your account first")

    # 🚨 3️⃣ BLOCK CHECK (THIS IS THE IMPORTANT PART)
    if user.is_blocked == True:
        raise HTTPException(status_code=403, detail="Your account is blocked by admin")

    # 4️⃣ password correct?
    if not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect password")

    # 5️⃣ create token
    access_token = create_access_token({"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# PROTECTED ROUTE
@router.get("/me")
def get_profile(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role
    }

# USER HOME WELCOME MESSAGE
@router.get("/welcome")
def welcome_user(current_user: models.User = Depends(get_current_user)):
    return {
        "message": f"Welcome {current_user.name}"
    }