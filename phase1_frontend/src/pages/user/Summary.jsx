import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import BookingSummary from "../../components/BookingSummary.jsx";

const Summary = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    location,
    screen,
    slot,
    selectedSeats,
    totalPrice
  } = state || {};

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FIXED DATA
  const movieName = slot?.movie_name || "Movie";
  const language = slot?.language || "";

  useEffect(() => {
    if (!selectedSeats || selectedSeats.length === 0 || !slot) {
      navigate("/movies", { replace: true });
    }
  }, [navigate, selectedSeats, slot]);

  const handleConfirm = async () => {
    setProcessing(true);
    setError(null);

    try {
      const bookingDate = new Date().toISOString().split("T")[0];
      const bookedSeats = [];

      for (const seat of selectedSeats) {
        const res = await api.post("/user/book-seat", {
          theater_seat_id: seat.seat_id || seat.id,
          slot_id: slot.slot_id,
          booking_date: bookingDate,
        });

        bookedSeats.push({
          booking_id: res.data.booking_id || res.data.id,
          seat_label: seat.seat_number || seat.label || seat.name,
          price: seat.price || seat.amount || 0,
        });
      }

      navigate("/payment", {
        state: {
          bookingDetails: bookedSeats,
          totalPrice,
          slot,
          screen,
          bookingDate,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Booking failed. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* 🔥 HEADER */}
        <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <h1 className="text-4xl font-semibold text-slate-950">
            Confirm Booking
          </h1>
          <p className="mt-3 text-slate-600">
            Review your selected seats and complete booking.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">

          {/* LEFT SIDE */}
          <div className="space-y-6">

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Show details
              </h2>

              <div className="mt-4 space-y-3 text-slate-600">

                {/* 🎬 MOVIE */}
                <p className="text-sm font-medium text-slate-500">Movie</p>
                <p>{movieName}</p>

                {/* 🌐 LANGUAGE */}
                {language && (
                  <>
                    <p className="text-sm font-medium text-slate-500">Language</p>
                    <p>{language}</p>
                  </>
                )}

                {/* 🏢 THEATER */}
                <p className="text-sm font-medium text-slate-500">Theater</p>
                <p>{location?.name || location?.location_name}</p>

                {/* 🎥 SCREEN */}
                <p className="text-sm font-medium text-slate-500">Screen</p>
                <p>{screen?.name || "Screen"}</p>

                {/* ⏰ TIME */}
                <p className="text-sm font-medium text-slate-500">Time</p>
                <p>
                  {slot?.start_time} - {slot?.end_time}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Payment
              </h2>
              <p className="mt-4 text-slate-600">
                This is a mock payment step.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <BookingSummary
            show={{
              movie_title: movieName, // ✅ FIXED
              theater_name: location?.name,
              datetime: `${slot?.start_time} - ${slot?.end_time}`,
              language: language, // ✅ optional if used
            }}
            selectedSeats={selectedSeats || []}
            totalPrice={totalPrice || 0}
          />
        </div>

        {error && (
          <div className="mt-6 rounded-3xl bg-rose-50 p-5 text-red-600">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="border px-6 py-3 rounded"
          >
            Back
          </button>

          <button
            onClick={handleConfirm}
            disabled={processing}
            className="bg-green-600 text-white px-6 py-3 rounded"
          >
            {processing ? "Processing..." : `Confirm ₹${totalPrice}`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Summary;