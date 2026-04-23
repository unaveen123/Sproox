import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";

const BookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = location;
  const [emailSent, setEmailSent] = useState(false);

  const bookings = state?.bookingDetails || [];
  const slot = state?.slot;
  const screen = state?.screen;
  const totalPrice = state?.totalPrice || 0;
  const bookingDate = state?.bookingDate;
  const qrTickets = state?.qrTickets || [];
  const bookingIds = state?.bookingIds || bookings.map((b) => b.booking_id);

  const backendUrl = "http://127.0.0.1:8000";

  // ✅ FINAL FIX (ONLY SOURCE)
  const movieName =
    state?.movie_name || slot?.movie_name || "N/A";

  const language =
    state?.language || slot?.language || "-";

  const seatLabels = bookings
    .map((b) => b.seat_label || b.seat_number || "-")
    .join(", ");

  const displayedQrTickets = qrTickets.length > 0 ? [qrTickets[0]] : [];

  // 📧 SEND CONFIRMATION EMAIL
  useEffect(() => {
    const sendConfirmationEmail = async () => {
      if (emailSent || !user?.email || bookings.length === 0) return;

      try {
        await api.post("/user/send-booking-confirmation", {
          booking_ids: bookingIds,
        });
        setEmailSent(true);
      } catch (err) {
        console.error("Failed to send confirmation email:", err);
        setEmailSent(true);
      }
    };

    sendConfirmationEmail();
  }, []);

  if (!state || bookings.length === 0) {
    return <div className="p-10 text-center">No booking details found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl">

        {/* ✅ HEADER */}
        <div className="mb-6 rounded-3xl border border-green-100 bg-green-50 p-6">
          <h1 className="text-3xl font-bold text-green-800">
            Booking Confirmed!
          </h1>

          <p className="mt-2 text-slate-700">
            Your seats are booked for {slot?.start_time} - {slot?.end_time} on {bookingDate}.
          </p>

          {/* 🔥 FIXED */}
          <p className="mt-2 text-slate-700">
            Movie: {movieName}
          </p>

          <p className="text-slate-700">
            Language: {language}
          </p>

          <p className="text-slate-700">
            Screen: {screen?.name}
          </p>
        </div>

        {/* ✅ SUMMARY */}
        <div className="grid gap-4 sm:grid-cols-2">

          <div className="rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-3">Booking Summary</h2>

            {/* 🔥 FIXED */}
            <p className="text-sm text-slate-600">
              Movie: {movieName}
            </p>

            <p className="text-sm text-slate-600">
              Language: {language}
            </p>

            <p className="text-sm text-slate-600">
              Total seats: {bookings.length}
            </p>

            <p className="text-sm text-slate-600">
              Total price: ₹{totalPrice}
            </p>

            <p className="text-sm text-slate-600">
              Date: {bookingDate}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-3">Seats Booked</h2>

            <p className="text-sm text-slate-600">{seatLabels}</p>

            <ul className="mt-4 space-y-2">
              {bookings.map((b) => (
                <li key={b.booking_id} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex justify-between">
                    <span>{b.seat_label}</span>
                    <span>₹{b.price}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ✅ QR */}
        {qrTickets.length > 0 && (
          <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-5">
            <p className="font-semibold">Ticket ready for scanning</p>

            <p className="text-xs mt-2">
              Ticket IDs: {bookingIds.join(", ")}
            </p>

            {displayedQrTickets.map((url, i) => (
              <img
                key={i}
                src={`${backendUrl}${url}`}
                alt="QR"
                className="mt-4 rounded-xl"
              />
            ))}
          </div>
        )}

        {/* ✅ BUTTONS */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Home
          </button>

          <button
            onClick={() => navigate("/bookings")}
            className="border px-6 py-2 rounded"
          >
            My Bookings
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookingSuccess;