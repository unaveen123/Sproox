from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Provider, User
from app.dependencies import get_current_user
from app import models

router = APIRouter(prefix="/admin", tags=["Admin"])


# ------------------------------
# 1️⃣ Get all pending providers
# ------------------------------
@router.get("/providers/pending")
def get_pending_providers(db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):

    # allow only admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    providers = db.query(Provider).filter(Provider.is_approved == False).all()

    result = []
    for p in providers:
        user = db.query(User).filter(User.id == p.user_id).first()

        result.append({
            "provider_id": p.id,
            "business_name": p.business_name,
            "phone": p.phone,
            "email": user.email,
            "owner_name": user.name
        })

    return result


# ------------------------------
# 2️⃣ Approve provider
# ------------------------------
@router.post("/providers/approve/{provider_id}")
def approve_provider(provider_id: str,
                     db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):

    # admin only
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    provider = db.query(Provider).filter(Provider.id == provider_id).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # approve provider
    provider.is_approved = True

    # update user role
    user = db.query(User).filter(User.id == provider.user_id).first()
    user.role = "provider"

    db.commit()

    return {"message": "Provider approved successfully"}

@router.delete("/user/delete/{user_id}")
def delete_user(user_id: str,
                db: Session = Depends(get_db),
                current_user = Depends(get_current_user)):

    # only admin allowed
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 🚫 ADMIN SELF DELETE PROTECTION
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Admin cannot delete himself")

    # 🚫 DO NOT DELETE OTHER ADMINS
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete another admin")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


@router.put("/user/block/{user_id}")
def block_user(user_id: str,
               db: Session = Depends(get_db),
               current_user = Depends(get_current_user)):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 🚫 ADMIN SELF BLOCK PROTECTION
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Admin cannot block himself")

    # 🚫 DO NOT BLOCK ADMINS
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot block another admin")

    user.is_blocked = True
    db.commit()

    return {"message": "User blocked successfully"}

@router.put("/user/unblock/{user_id}")
def unblock_user(user_id: str,
                 db: Session = Depends(get_db),
                 current_user = Depends(get_current_user)):

    # only admin allowed
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # safety: admin cannot unblock himself (not required but safe)
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot modify admin")

    user.is_blocked = False
    db.commit()

    return {"message": "User unblocked successfully"}

@router.delete("/provider/{provider_id}")
def delete_provider(provider_id: str,
                    db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):

    # admin only
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin allowed")

    provider = db.query(models.Provider).filter(models.Provider.id == provider_id).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # revert user back to normal user
    user = db.query(models.User).filter(models.User.id == provider.user_id).first()
    if user:
        user.role = "user"

    db.delete(provider)
    db.commit()

    return {"message": "Provider deleted and user reverted to normal user"}

@router.put("/provider/block/{provider_id}")
def block_provider(provider_id: str,
                   db: Session = Depends(get_db),
                   current_user = Depends(get_current_user)):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    provider = db.query(models.Provider).filter(models.Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # block provider
    provider.is_blocked = True

    # ALSO block login account
    user = db.query(models.User).filter(models.User.id == provider.user_id).first()
    if user:
        user.is_blocked = True

    db.commit()

    return {"message": "Provider blocked successfully"}

@router.put("/provider/unblock/{provider_id}")
def unblock_provider(provider_id: str,
                     db: Session = Depends(get_db),
                     current_user = Depends(get_current_user)):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    provider = db.query(models.Provider).filter(models.Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # unblock provider
    provider.is_blocked = False

    # unblock login account
    user = db.query(models.User).filter(models.User.id == provider.user_id).first()
    if user:
        user.is_blocked = False

    db.commit()

    return {"message": "Provider unblocked successfully"}


@router.get("/users")
def get_all_users(db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    users = db.query(models.User).all()

    result = []
    for u in users:
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "is_verified": u.is_verified,
            "is_blocked": u.is_blocked
        })

    return result

@router.get("/providers")
def get_all_providers(db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    providers = db.query(models.Provider).all()

    result = []
    for p in providers:
        user = db.query(models.User).filter(models.User.id == p.user_id).first()

        result.append({
            "provider_id": p.id,
            "business_name": p.business_name,
            "phone": p.phone,
            "owner_name": user.name,
            "owner_email": user.email,
            "is_approved": p.is_approved,
            "is_blocked": p.is_blocked
        })

    return result    