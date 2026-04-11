import qrcode
import os


def generate_qr_ticket(booking):

    # QR data (what will be inside QR)
    qr_data = f"BOOKING_ID:{booking.id}"

    # generate QR
    qr = qrcode.make(qr_data)

    # folder to store tickets
    folder = "tickets"

    # create folder if not exists
    os.makedirs(folder, exist_ok=True)

    # file path
    file_path = f"{folder}/{booking.id}.png"

    # save QR
    qr.save(file_path)

    return file_path