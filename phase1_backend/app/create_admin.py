from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from app.auth import hash_password

db: Session = SessionLocal()

admin_email = "pramod520741@gmail.com"

# check if admin already exists
existing_admin = db.query(User).filter(User.email == admin_email).first()

if existing_admin:
    print("Admin already exists!")
else:
    admin_user = User(
        name="Admin",
        phone="7619359946",
        email=admin_email,
        password=hash_password("Admin@123"),
        is_verified=True,
        role="admin"
    )

    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    print("Admin created successfully!")

db.close()
