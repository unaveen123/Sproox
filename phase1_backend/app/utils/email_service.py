import smtplib
from email.message import EmailMessage
import os


# =========================
# 🕒 FORMAT TIME
# =========================
def format_time(time_obj):
    try:
        return time_obj.strftime("%I:%M %p")
    except:
        return str(time_obj)


# =========================
# 📧 SEND EMAIL
# =========================
def send_ticket_email(
    to_email,
    user_name,
    booking_type,  # "coworking" or "theater"

    # common
    location_name,
    location_address,
    location_city,
    booking_date,
    booking_id,
    qr_path=None,

    # time
    start_time=None,
    end_time=None,

    # coworking
    seat_number=None,

    # theater
    movie_name=None,
    screen_name=None,
    seat_label=None,
    language=None
):

    EMAIL = os.getenv("EMAIL")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

    # ❌ safety check
    if not EMAIL or not EMAIL_PASSWORD:
        print("❌ Email credentials missing in .env")
        return

    msg = EmailMessage()
    msg["Subject"] = "🎫 Booking Confirmed"
    msg["From"] = EMAIL
    msg["To"] = to_email

    # =========================
    # 🎬 THEATER EMAIL
    # =========================
    if booking_type == "theater":

        body = f"""
Hello {user_name},

🎬 Your movie booking is CONFIRMED!

━━━━━━━━━━━━━━━━━━━━━━━
📍 Theater: {location_name}
📌 Address: {location_address}, {location_city}

🎞 Movie: {movie_name}
🌐 Language: {language if language else "N/A"}
🖥 Screen: {screen_name}

📅 Date: {booking_date}
🎟 Seat: {seat_label}

⏰ Time: {format_time(start_time)} - {format_time(end_time)}

🆔 Booking ID: {booking_id}
━━━━━━━━━━━━━━━━━━━━━━━

⏳ Please arrive 15 minutes early.
🎟 Show your QR ticket at entry.

Enjoy your movie 🍿

— Booking Team
"""

    # =========================
    # 🪑 CO-WORKING EMAIL
    # =========================
    else:

        body = f"""
Hello {user_name},

Your workspace booking is CONFIRMED!

━━━━━━━━━━━━━━━━━━━━━━━
📍 Location: {location_name}
📌 Address: {location_address}, {location_city}

📅 Date: {booking_date}
💺 Seat: {seat_number}

⏰ Time: {format_time(start_time)} - {format_time(end_time)}

🆔 Booking ID: {booking_id}
━━━━━━━━━━━━━━━━━━━━━━━

⏳ Please arrive 10 minutes early.
📲 Show your QR ticket at entry.

Thank you 🙌

— Workspace Booking Team
"""

    msg.set_content(body)

    # =========================
    # 📎 ATTACH QR
    # =========================
    try:
        if qr_path and os.path.exists(qr_path):

            with open(qr_path, "rb") as f:
                file_data = f.read()
                file_name = os.path.basename(qr_path)

            msg.add_attachment(
                file_data,
                maintype="image",
                subtype="png",
                filename=file_name
            )

        else:
            print(f"⚠️ QR file not found or empty: {qr_path}")

    except Exception as e:
        print("⚠️ QR attach error:", str(e))

    # =========================
    # 📤 SEND EMAIL
    # =========================
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL, EMAIL_PASSWORD)
            smtp.send_message(msg)

        print("✅ Email sent successfully to", to_email)

    except Exception as e:
        print("❌ Email failed:", str(e))