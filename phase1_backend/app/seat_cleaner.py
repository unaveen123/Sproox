import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models


# This function runs forever in background
async def release_expired_seats():

    while True:
        db: Session = SessionLocal()

        try:
            now = datetime.utcnow()

            # find all reserved seats
            reserved_seats = db.query(models.Seat).filter(
                models.Seat.status == "reserved",
                models.Seat.reserved_until != None
            ).all()

            for seat in reserved_seats:

                # if reservation expired
                if seat.reserved_until < now:
                    print(f"Releasing expired seat: {seat.id}")

                    seat.status = "available"
                    seat.reserved_by = None
                    seat.reserved_until = None

            db.commit()

        except Exception as e:
            print("Seat cleaner error:", e)

        finally:
            db.close()

        # check every 10 seconds
        await asyncio.sleep(10)