from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES


# -------------------------
# PASSWORD HASHING SETUP
# -------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# -------------------------
# OAUTH2 SCHEME (for protected routes)
# -------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# -------------------------
# HASH PASSWORD
# -------------------------
def hash_password(password: str):
    return pwd_context.hash(password)


# -------------------------
# VERIFY PASSWORD
# -------------------------
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


# -------------------------
# CREATE ACCESS TOKEN (JWT)
# -------------------------
def create_access_token(data: dict):
    """
    data example:
    {"sub": user_email}
    """
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# -------------------------
# DECODE TOKEN
# -------------------------
def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# -------------------------
# GET CURRENT USER (IMPORTANT)
# -------------------------
def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    email = payload.get("sub")

    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user info",
        )

    return email