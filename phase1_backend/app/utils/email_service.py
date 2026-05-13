import smtplib
from email.message import EmailMessage
from email.utils import make_msgid
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


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
    language=None,
    total_amount=None
):

    EMAIL = os.getenv("EMAIL")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

    # ❌ safety check
    if not EMAIL or not EMAIL_PASSWORD:
        print("❌ Email credentials missing in .env")
        return False

    msg = EmailMessage()
    msg["Subject"] = "🎫 Booking Confirmed"
    msg["From"] = EMAIL
    msg["To"] = to_email
    msg.replace_header("Subject", "Booking Confirmed - Your Sproox Ticket")
    qr_exists = bool(qr_path and os.path.exists(qr_path))
    qr_cid = make_msgid(domain="sproox.local")[1:-1] if qr_exists else None

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

🎫 Your QR ticket is attached to this email.
⏳ Please arrive 15 minutes early.

Enjoy your movie with Sproox! 🍿

— Sproox Team
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

🎫 Your QR ticket is attached to this email.
⏳ Please arrive 10 minutes early.

Thank you for booking with Sproox! 🙌

— Sproox Team
"""

    if booking_type == "theater":
        amount_row = (
            f"<tr><td style='padding:8px 0;color:#64748b;'>Total</td>"
            f"<td style='padding:8px 0;font-weight:bold;'>Rs.{total_amount}</td></tr>"
            if total_amount is not None
            else ""
        )
        qr_block = (
            f"<div style='margin-top:24px;text-align:center;'>"
            f"<p style='font-weight:bold;'>Ticket QR Scanner</p>"
            f"<img src='cid:{qr_cid}' alt='Ticket QR' "
            f"style='width:180px;height:180px;border:1px solid #e2e8f0;border-radius:12px;padding:10px;' />"
            f"</div>"
            if qr_cid
            else "<p style='margin-top:24px;color:#64748b;'>Your QR ticket is attached to this email.</p>"
        )
        html_body = f"""
<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#16a34a;color:#fff;border-radius:18px 18px 0 0;padding:22px;">
        <p style="margin:0;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Booking Confirmed</p>
        <h1 style="margin:8px 0 0;font-size:28px;">{movie_name or "Movie Ticket"}</h1>
      </div>
      <div style="background:#fff;border-radius:0 0 18px 18px;padding:24px;border:1px solid #e2e8f0;">
        <p style="font-size:16px;">Hello {user_name}, your movie booking is confirmed.</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:8px 0;color:#64748b;">Theater</td><td style="padding:8px 0;font-weight:bold;">{location_name}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Address</td><td style="padding:8px 0;">{location_address}, {location_city}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Movie</td><td style="padding:8px 0;font-weight:bold;">{movie_name or "N/A"}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Language</td><td style="padding:8px 0;">{language or "N/A"}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Screen</td><td style="padding:8px 0;">{screen_name or "N/A"}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Date</td><td style="padding:8px 0;">{booking_date}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Time</td><td style="padding:8px 0;">{format_time(start_time)} - {format_time(end_time)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Seats</td><td style="padding:8px 0;font-weight:bold;">{seat_label or "N/A"}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Booking ID</td><td style="padding:8px 0;">{booking_id}</td></tr>
          {amount_row}
        </table>
        {qr_block}
        <p style="margin-top:24px;color:#64748b;">Please arrive 15 minutes early.</p>
      </div>
    </div>
  </body>
</html>
"""

    msg.set_content(body)
    if booking_type == "theater":
        msg.add_alternative(html_body, subtype="html")

    # =========================
    # 📎 ATTACH QR
    # =========================
    try:
        if qr_exists:

            with open(qr_path, "rb") as f:
                file_data = f.read()
                file_name = os.path.basename(qr_path)

            if booking_type == "theater" and qr_cid:
                msg.get_payload()[1].add_related(
                    file_data,
                    maintype="image",
                    subtype="png",
                    cid=f"<{qr_cid}>",
                    filename=file_name,
                )
            else:
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
            return True

        print("✅ Email sent successfully to", to_email)

    except Exception as e:
        print("❌ Email failed:", str(e))
