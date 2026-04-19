import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  const bookings = state?.bookingDetails || [];
  const slot = state?.slot;
  const screen = state?.screen;
  const totalPrice = state?.totalPrice || 0;
  const bookingDate = state?.bookingDate;

  // ✅ SAFE FALLBACKS
  const movieName = slot?.movie_name || "Movie";
  const language = slot?.language || "-";

  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const bookingIds = bookings.map((b) => b.booking_id);

  const razorpayKey =
    import.meta.env.VITE_RAZORPAY_KEY_ID ||
    import.meta.env.VITE_RAZORPAY_KEY ||
    "";

  // 🔁 LOAD RAZORPAY
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

      // ✅ PASS MOVIE DATA EXPLICITLY
      navigate("/booking-success", {
        state: {
          bookingDetails: bookings,
          slot,
          screen,
          totalPrice,
          bookingDate,

          movie_name: slot?.movie_name,
          language: slot?.language,

          paymentId: verifyRes.data.payment_id,
          qrTickets: verifyRes.data.qr_tickets,
          bookingIds: verifyRes.data.booking_ids,
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

        // ✅ SHOW MOVIE INFO IN RAZORPAY
        name: movieName,
        description: `${language} • ${screen?.name}`,

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

  // 🚫 NO DATA CASE
  if (!state || bookings.length === 0) {
    return <div className="p-10 text-center">No booking data</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-3xl bg-white p-8 rounded-3xl shadow-xl">

        <h1 className="text-3xl font-bold mb-4">Confirm & Pay</h1>

        {/* 🎬 MOVIE INFO */}
        <div className="mb-6 p-4 border rounded-xl">
          <p><strong>Movie:</strong> {movieName}</p>
          <p><strong>Language:</strong> {language}</p>
          <p><strong>Screen:</strong> {screen?.name}</p>
          <p><strong>Time:</strong> {slot?.start_time} - {slot?.end_time}</p>
          <p><strong>Date:</strong> {bookingDate}</p>
        </div>

        {/* 💰 SUMMARY */}
        <div className="mb-6 p-4 border rounded-xl">
          <p>Total Seats: {bookings.length}</p>
          <p>Total Price: ₹{totalPrice}</p>
        </div>

        {/* 🎟 SEATS */}
        <div className="mb-6 p-4 border rounded-xl">
          <h3 className="font-semibold mb-2">Seats</h3>
          {bookings.map((b) => (
            <p key={b.booking_id}>{b.seat_label}</p>
          ))}
        </div>

        {paymentError && (
          <p className="text-red-500 mb-4">{paymentError}</p>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white ${
            loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Processing..." : `Pay ₹${totalPrice}`}
        </button>

      </div>
    </div>
  );
};

export default Payment;