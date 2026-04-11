from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt
