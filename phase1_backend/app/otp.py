import random
import smtplib
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

load_dotenv()

EMAIL = os.getenv("EMAIL")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

otp_storage = {}

def generate_otp(email: str):
    otp = str(random.randint(100000, 999999))
    otp_storage[email] = otp

    send_email(email, otp)
    return otp


def send_email(to_email, otp):
    subject = "Your OTP Verification Code"
    body = f"Your OTP is: {otp}. It will expire in 5 minutes."

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL
    msg["To"] = to_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL, EMAIL_PASSWORD)
        server.sendmail(EMAIL, to_email, msg.as_string())


def verify_otp(email: str, otp: str):
    if email in otp_storage and otp_storage[email] == otp:
        del otp_storage[email]
        return True
    return False
