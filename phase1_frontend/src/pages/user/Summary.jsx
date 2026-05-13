import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

const getSeatId = (seat) => seat.theater_seat_id || seat.seat_id || seat.id;
const getSeatLabel = (seat) => seat.seat_label || seat.seat_number || seat.label;

const Summary = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    bookingDetails = [],
    totalPrice = 0,
    slot,
    screen,
    bookingDate,
    location,
  } = state || {};

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const posterUrl = getPosterUrl(slot, location);
  const razorpayKey =
    import.meta.env.VITE_RAZORPAY_KEY_ID ||
    import.meta.env.VITE_RAZORPAY_KEY ||
    "";

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const cancelPendingBookings = async (bookingIds) => {
    await Promise.allSettled(
      bookingIds.map((bookingId) => api.patch(`/user/cancel-booking/${bookingId}`))
    );
  };

  // 🔥 DEBUG (ADDED — DO NOT REMOVE)
  useEffect(() => {
    console.log("SUMMARY SLOT DATA:", slot);
  }, [slot]);

  useEffect(() => {
    if (!state || !slot) {
      navigate("/movies");
    }
  }, [state, navigate, slot]);

  const handlePayment = async () => {
    const createdBookingIds = [];

    try {
      if (!bookingDetails || bookingDetails.length === 0) {
        setMessage("⚠️ No seats selected");
        setMessageType("error");
        return;
      }

      if (!razorpayKey) {
        setMessage("❌ Razorpay key missing. Add VITE_RAZORPAY_KEY_ID in frontend .env");
        setMessageType("error");
        return;
      }

      setLoading(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setMessage("❌ Unable to load Razorpay checkout");
        setMessageType("error");
        return;
      }

      for (const seat of bookingDetails) {
        if (seat.booking_id) {
          createdBookingIds.push(seat.booking_id);
          continue;
        }

        const theaterSeatId = getSeatId(seat);
        if (!theaterSeatId) {
          throw new Error("Selected seat id missing");
        }

        const bookingRes = await api.post("/user/book-seat", {
          theater_seat_id: theaterSeatId,
          slot_id: slot.slot_id,
          booking_date: bookingDate,
        });

        createdBookingIds.push(bookingRes.data.booking_id);
      }

      const orderRes = await api.post("/payment/create-order", {
        booking_ids: createdBookingIds,
      });

      const { order_id, amount } = orderRes.data;

      const options = {
        key: razorpayKey,
        amount: Number(amount) * 100,
        currency: orderRes.data.currency || "INR",
        name: slot?.movie_name || "Sproox",
        description: `${slot?.language || "Movie"} - ${screen?.name || "Screen"}`,
        image: posterUrl || undefined,
        order_id: order_id,

        handler: async function (response) {
          try {
            const verifyRes = await api.post("/payment/verify", {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              booking_ids: createdBookingIds,
            });

            setMessage("✅ Payment Successful & Seats Booked!");
            setMessageType("success");

            navigate("/booking-success", {
              state: {
                booking: {
                  total_price: totalPrice,
                  date: bookingDate,
                  ticket_ids: verifyRes.data.booking_ids || createdBookingIds,
                },
                qrTickets: verifyRes.data.qr_tickets || [],
                seats: bookingDetails.map((seat) => ({
                  seat_number: getSeatLabel(seat),
                  price: seat.price || seat.amount || 0,
                })),
                slot,
                screen,
                location,
                posterUrl,
                successMessage: "✅ Payment Successful & Seats Booked!",
              },
            });

          } catch (err) {
            console.error("VERIFY ERROR:", err.response?.data);
            setMessage("❌ Payment verification failed");
            setMessageType("error");
            setLoading(false);
          }
        },

        modal: {
          ondismiss: async function () {
            await cancelPendingBookings(createdBookingIds);
            setLoading(false);
          },
        },

        theme: {
          color: "#22c55e",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      if (createdBookingIds.length > 0) {
        await cancelPendingBookings(createdBookingIds);
      }

      console.error("PAYMENT ERROR:", err.response?.data || err);
      setMessage(err.response?.data?.detail || err.message || "❌ Payment failed");
      setMessageType("error");
      setLoading(false);
    } finally {
      if (!window.Razorpay) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 px-4 py-12">
      <div className="mx-auto max-w-4xl">

        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🎬 Confirm & Pay
        </h1>

        {message && (
          <div className={`mb-6 rounded-3xl px-6 py-4 text-white ${
            messageType === "success"
              ? "bg-emerald-500"
              : "bg-rose-500"
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          <div className="grid md:grid-cols-2 gap-8 p-8">

            {/* 🎬 POSTER SECTION */}
            <div className="flex flex-col items-center">
              {posterUrl ? (
                <div className="flex h-80 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={posterUrl}
                    alt="poster"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/400x300?text=No+Poster";
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-80 bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center text-white text-xl rounded-xl">
                  🎭 No Poster
                </div>
              )}
              <p className="text-gray-500 mt-2 text-sm">Movie Poster</p>
            </div>

            {/* 📄 DETAILS */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">
                {slot?.movie_name || "Movie"}
              </h2>

              <p>🎭 {location?.name || "Theater"}</p>

              <div className="border-t pt-4 space-y-2">
                <p>📍 {location?.city || location?.name}</p>
                <p>📺 {screen?.name}</p>
                <p>🎞️ {slot?.language}</p>
                <p>⏰ {slot?.start_time} - {slot?.end_time}</p>
                <p>📅 {bookingDate || "N/A"}</p>
              </div>

              {/* 🎫 SEATS */}
              <div className="border-t pt-4">
                <h3 className="font-bold">
                  🎫 Selected Seats ({bookingDetails.length})
                </h3>

                <div className="flex flex-wrap gap-2 mt-2">
                  {bookingDetails.map((b) => (
                    <span
                      key={b.seat_id || b.id}
                      className="bg-purple-100 px-3 py-1 rounded"
                    >
                      {b.seat_label || b.seat_number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 💳 PAYMENT */}
          <div className="bg-gray-50 px-8 py-6 border-t">
            <div className="flex justify-between mb-4">
              <div>
                <p>Total Seats</p>
                <p className="text-xl font-bold">
                  {bookingDetails.length}
                </p>
              </div>

              <div className="text-right">
                <p>Total Amount</p>
                <p className="text-2xl text-green-600 font-bold">
                  ₹{totalPrice}
                </p>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl"
            >
              {loading ? "Processing..." : `💳 Pay ₹${totalPrice}`}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Summary;
