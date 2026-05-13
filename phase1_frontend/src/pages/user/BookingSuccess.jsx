import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import api from "../../services/api";

const API_BASE_URL = api.defaults.baseURL || "http://127.0.0.1:8000";

const normalizeImageUrl = (value) => {
  const rawUrl =
    typeof value === "string"
      ? value
      : value?.image_url || value?.url || value?.poster_url || value?.src;

  if (!rawUrl) return null;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  const cleanedPath = rawUrl.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE_URL}/${cleanedPath}`;
};

const getPosterUrl = (slot, location) => {
  const posterCandidates = [
    slot?.poster_url,
    slot?.image_url,
    slot?.poster,
    slot?.thumbnail,
    Array.isArray(slot?.images) ? slot.images[0] : slot?.images,
    Array.isArray(slot?.movie_images) ? slot.movie_images[0] : slot?.movie_images,
    location?.poster_url,
    location?.image_url,
    location?.poster,
    Array.isArray(location?.images) ? location.images[0] : location?.images,
  ];

  return posterCandidates.map(normalizeImageUrl).find(Boolean);
};

const getTicketUrl = (value) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE_URL.replace(/\/$/, "")}/${String(value).replace(/^\/+/, "")}`;
};

const BookingSuccess = () => {
  const navigate = useNavigate();
  const locationHook = useLocation();
  const [showToast, setShowToast] = useState(true);

  const state = locationHook.state || {};

  // ✅ SAFE DATA EXTRACTION
  const booking = state?.booking || {};
  const seats = state?.seats || [];
  const slot = state?.slot || {};
  const screen = state?.screen || {};
  const theaterLocation = state?.location || {};
  const posterUrl = state?.posterUrl || getPosterUrl(slot, theaterLocation);
  const qrTicketUrls = state?.qrTickets || [];
  const firstQrTicketUrl = getTicketUrl(qrTicketUrls[0]);
  const successMessage = state?.successMessage || "Your booking is confirmed!";
  const bookingIds = booking?.ticket_ids || [];
  const seatLabels = seats.map((seat) => seat.seat_number).filter(Boolean);
  const qrValue = JSON.stringify({
    booking_ids: bookingIds,
    movie: slot?.movie_name,
    seats: seatLabels,
    date: booking?.date,
  });

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 8000); // ✅ 8 seconds instead of 5
    return () => clearTimeout(timer);
  }, [showToast]);

  console.log("Booking Success State:", state);
  console.log("Booking:", booking);
  console.log("Seats:", seats);

  // ❌ SAFETY CHECK - Only show error if completely empty
  if (!state || (Object.keys(state).length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-3xl mb-4">❌ No booking data found</p>
          <p className="text-gray-600 mb-6">Please complete your booking again</p>
          <button
            onClick={() => navigate("/movies")}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Movies
          </button>
        </div>
      </div>
    );
  }

  return (
<div className="min-h-screen bg-linear-to-br from-purple-900 to-gray-900 p-6">

      {/* SUCCESS TOAST */}
      {showToast && (
        <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-md">
          <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-2xl">
            <div className="bg-linear-to-r from-emerald-500 to-green-600 px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                    Booking Notification
                  </p>
                  <p className="mt-1 text-lg font-bold">{successMessage}</p>
                </div>
                <button
                  onClick={() => setShowToast(false)}
                  className="rounded-full px-2 text-2xl font-bold leading-none text-white/90 hover:bg-white/15"
                  aria-label="Close booking notification"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[76px_1fr] gap-4 p-4">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={slot?.movie_name || "Movie poster"}
                  className="h-28 w-20 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-28 w-20 items-center justify-center rounded-xl bg-slate-900 text-xl font-bold text-white">
                  {(slot?.movie_name || "M").slice(0, 1)}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-slate-950">
                  {slot?.movie_name || "Movie"}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {slot?.language || "N/A"} • {screen?.name || "Screen"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {booking?.date || "N/A"} | {slot?.start_time || "N/A"} - {slot?.end_time || "N/A"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Seats: {seatLabels.length > 0 ? seatLabels.join(", ") : "N/A"}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Ticket Scanner
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Booking ID: {bookingIds[0] || "N/A"}
                  </p>
                </div>
                <div className="shrink-0 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
                  {firstQrTicketUrl ? (
                    <img
                      src={firstQrTicketUrl}
                      alt="Ticket scanner"
                      className="h-20 w-20 object-contain"
                    />
                  ) : (
                    <QRCodeCanvas value={qrValue} size={80} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ SUCCESS HEADER */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-linear-to-r from-green-400 to-green-600 p-8 rounded-2xl mb-6 shadow-2xl text-white">
          <div className="text-center">
            <p className="text-6xl mb-3">✅</p>
            <h1 className="text-4xl font-bold">Booking Confirmed!</h1>
            <p className="text-xl mt-3">Your seats are successfully booked</p>
          </div>
        </div>

        {/* BOOKING DETAILS */}
        <div className="bg-white rounded-2xl p-0 shadow-xl mb-6 overflow-hidden">
          {posterUrl ? (
            <div className="relative h-112 md:h-144 overflow-hidden bg-slate-100">
              <img
                src={posterUrl}
                alt={slot?.movie_name || "Movie poster"}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/1600x900?text=No+Poster";
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-200">Booking Confirmed</p>
                <h2 className="mt-2 text-4xl font-semibold drop-shadow-lg">{slot?.movie_name || "Movie Title"}</h2>
                <p className="mt-2 text-lg text-slate-200">
                  {theaterLocation?.name || "Theater"} · {theaterLocation?.city || "Location"}
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid md:grid-cols-2 gap-8 p-8">

            {/* LEFT SIDE */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Movie Details</h2>
              
              <div className="space-y-3">
                <div className="border-b pb-2">
                  <p className="text-gray-600 text-sm">Movie Name</p>
                  <p className="text-xl font-semibold text-gray-900">{slot?.movie_name || "N/A"}</p>
                </div>

                <div className="border-b pb-2">
                  <p className="text-gray-600 text-sm">Theater</p>
                  <p className="text-xl font-semibold text-gray-900">{theaterLocation?.name || "N/A"}</p>
                </div>

                <div className="border-b pb-2">
                  <p className="text-gray-600 text-sm">Location</p>
                  <p className="text-xl font-semibold text-gray-900">{theaterLocation?.city || "N/A"}</p>
                </div>

                <div className="border-b pb-2">
                  <p className="text-gray-600 text-sm">Language</p>
                  <p className="text-xl font-semibold text-gray-900">{slot?.language || "N/A"}</p>
                </div>

                <div className="border-b pb-2">
                  <p className="text-gray-600 text-sm">Screen</p>
                  <p className="text-xl font-semibold text-gray-900">{screen?.name || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Summary</h2>

              <div className="space-y-3">
                <div className="border-b pb-2">
                  <p className="text-gray-600 text-sm">Date</p>
                  <p className="text-xl font-semibold text-gray-900">{booking?.date || "N/A"}</p>
                </div>

                <div className="border-b pb-2">
                  <p className="text-gray-600 text-sm">Show Time</p>
                  <p className="text-xl font-semibold text-gray-900">{slot?.start_time || "N/A"} - {slot?.end_time || "N/A"}</p>
                </div>

                <div className="border-b pb-2">
                  <p className="text-gray-600 text-sm">Total Seats</p>
                  <p className="text-xl font-semibold text-gray-900">{seats?.length || 0}</p>
                </div>

                <div className="border-b pb-2">
                  <p className="text-gray-600 text-sm">Total Amount</p>
                  <p className="text-3xl font-bold text-green-600">₹{booking?.total_price || 0}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* QR SECTION */}
        {bookingIds.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="grid grid-cols-[96px_1fr] gap-4 p-4">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={slot?.movie_name || "Movie poster"}
                    className="h-36 w-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-36 w-24 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-blue-600 text-white">
                    🎭
                  </div>
                )}

                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-bold text-gray-900">
                    {slot?.movie_name || "Movie"}
                  </h2>
                  <p className="mt-1 text-gray-600">{slot?.language || "N/A"}</p>
                  <p className="mt-2 text-gray-700">
                    {booking?.date || "N/A"} | {slot?.start_time || "N/A"} - {slot?.end_time || "N/A"}
                  </p>
                  <p className="mt-2 text-gray-700">
                    {theaterLocation?.name || "Theater"}: {theaterLocation?.city || "Location"}
                  </p>
                </div>
              </div>

              <div className="border-y bg-gray-50 px-4 py-3 text-center text-sm text-gray-600">
                Tap to hide details
              </div>

              <div className="p-6 text-center">
                <p className="text-gray-500">{seats.length} Ticket(s)</p>
                <h3 className="mt-2 text-3xl font-semibold text-gray-900">
                  {screen?.name || "Screen"}
                </h3>
                <p className="mt-2 text-gray-600">
                  {seatLabels.length > 0 ? seatLabels.join(", ") : "Seats N/A"}
                </p>

                <div className="mt-5 flex justify-center">
                  <div className="rounded-lg bg-white p-3 shadow">
                    {firstQrTicketUrl ? (
                      <img
                        src={firstQrTicketUrl}
                        alt="Ticket scanner"
                        className="h-[150px] w-[150px] object-contain"
                      />
                    ) : (
                      <QRCodeCanvas value={qrValue} size={150} />
                    )}
                  </div>
                </div>

                <p className="mt-4 text-sm font-bold text-gray-800">
                  BOOKING ID: {bookingIds[0] || "N/A"}
                </p>
                <p className="mt-4 border-t pt-4 text-sm text-gray-500">
                  Cancellation not available for this venue
                </p>
              </div>

              <div className="border-t bg-gray-50 p-4">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span>₹{booking?.total_price || 0}</span>
                </div>
                <div className="mt-3 flex justify-between text-gray-600">
                  <span>Ticket price ({seats.length})</span>
                  <span>₹{booking?.total_price || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BUTTONS */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/bookings")}
            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
          >
            📋 View All Bookings
          </button>
          <button
            onClick={() => navigate("/movies")}
            className="px-8 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition"
          >
            🎬 Book More Movies
          </button>
        </div>
      </div>

    </div>
  );
};

export default BookingSuccess;
