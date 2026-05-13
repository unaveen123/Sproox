import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const Payment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // ✅ SAFE DATA EXTRACTION
  const bookings = state?.bookingDetails || [];
  const slot = state?.slot || {};
  const screen = state?.screen || {};
  const theaterLocation = state?.location || {};
  const totalPrice = state?.totalPrice || 0;
  const bookingDate = state?.bookingDate || "";

  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const bookingIds = bookings.map((b) => b.booking_id);

  const razorpayKey =
    import.meta.env.VITE_RAZORPAY_KEY_ID ||
    import.meta.env.VITE_RAZORPAY_KEY ||
    "";

  // 🔁 LOAD RAZORPAY SCRIPT
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ✅ VERIFY PAYMENT
  const handleVerify = async (response) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const verifyRes = await axios.post(
        "http://127.0.0.1:8000/payment/verify",
        {
          order_id: response.razorpay_order_id,
          payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          booking_ids: bookingIds,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 🔥 FORMAT DATA FOR BOOKING SUCCESS PAGE
      navigate("/booking-success", {
        state: {
          booking: {
            total_price: totalPrice,
            date: bookingDate,
            ticket_ids: verifyRes.data.booking_ids || [],
          },
          qrTickets: verifyRes.data.qr_tickets || [],

          // ✅ FIXED SEATS STRUCTURE
          seats: bookings.map((b) => ({
            seat_number: b.seat_label,
            price: b.price,
          })),

          slot,
          screen,
          location: theaterLocation,
        },
      });

    } catch (error) {
      setPaymentError(
        error.response?.data?.detail ||
        error.message ||
        "Payment verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // 💳 HANDLE PAYMENT
  const handlePayment = async () => {
    if (bookings.length === 0) {
      setPaymentError("No booking items found.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!razorpayKey) {
      setPaymentError("Razorpay key missing.");
      return;
    }

    setLoading(true);
    setPaymentError("");

    try {
      const orderRes = await axios.post(
        "http://127.0.0.1:8000/payment/create-order",
        { booking_ids: bookingIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPaymentError("Unable to load Razorpay.");
        setLoading(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: orderRes.data.amount * 100,
        currency: orderRes.data.currency,
        order_id: orderRes.data.order_id,

        name: slot?.movie_name || "Movie",
        description: `${slot?.language} • ${screen?.name || "Screen"}`,

        handler: handleVerify,
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      setPaymentError(
        error.response?.data?.detail ||
        error.message ||
        "Payment failed"
      );
      setLoading(false);
    }
  };

  // 🚫 SAFETY CHECK
  if (!state || bookings.length === 0) {
    return <div className="p-10 text-center">No booking data</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 px-4 py-12">
      <div className="mx-auto max-w-4xl">

        <h1 className="text-4xl font-bold text-white mb-8 text-center">🎬 Confirm & Pay</h1>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* POSTER SECTION */}
          <div className="grid md:grid-cols-2 gap-8 p-8">

            {/* LEFT - POSTER */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full bg-gray-300 rounded-xl overflow-hidden shadow-lg">
                {theaterLocation?.poster_url ? (
                  <img 
                    src={theaterLocation.poster_url} 
                    alt="Theater Poster" 
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-2xl">🎭 No Poster</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-sm mt-2">Theater Poster</p>
            </div>

            {/* RIGHT - DETAILS */}
            <div className="space-y-6">

              {/* MOVIE & THEATER INFO */}
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{slot?.movie_name || "Movie Name"}</h2>
                <p className="text-lg text-gray-600">🎭 {theaterLocation?.name || "Theater Name"}</p>
              </div>

              {/* BOOKING DETAILS */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-700">📍 Location:</span>
                  <span className="font-semibold text-gray-900">{theaterLocation?.city || theaterLocation?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">📺 Screen:</span>
                  <span className="font-semibold text-gray-900">{screen?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">🎞️ Language:</span>
                  <span className="font-semibold text-gray-900">{slot?.language || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">⏰ Show Time:</span>
                  <span className="font-semibold text-gray-900">{slot?.start_time} - {slot?.end_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">📅 Date:</span>
                  <span className="font-semibold text-gray-900">{bookingDate}</span>
                </div>
              </div>

              {/* SEATS */}
              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-800 mb-2">🎫 Selected Seats</h3>
                <div className="flex flex-wrap gap-2">
                  {bookings.map((b) => (
                    <span key={b.booking_id} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {b.seat_label}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* PRICING SECTION */}
          <div className="bg-gray-50 px-8 py-6 border-t">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-600">Total Seats:</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">Total Amount:</p>
                <p className="text-3xl font-bold text-green-600">₹{totalPrice}</p>
              </div>
            </div>

            {paymentError && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">
                {paymentError}
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg transition ${
                loading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              }`}
            >
              {loading ? "⏳ Processing Payment..." : `💳 Pay ₹${totalPrice}`}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Payment;
