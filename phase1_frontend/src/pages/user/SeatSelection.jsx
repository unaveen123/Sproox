import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useParams, useNavigate } from "react-router-dom";

const SeatSelection = () => {
  const { id: locationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { screen, slot, slots } = location.state || {};

  // ✅ FIX: correct slot_id handling
  const [selectedSlotId, setSelectedSlotId] = useState(
    slot?.slot_id || null
  );

  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [bookingStatus, setBookingStatus] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // 🔍 DEBUG (you can remove later)
  console.log("SLOTS:", slots);

  // ================= FETCH SEATS =================
  const fetchSeats = async (slotId) => {
    try {
      const bookingDate = new Date().toISOString().split("T")[0];

      const res = await axios.get(
        `http://127.0.0.1:8000/user/locations/${locationId}/theater-seats`,
        {
          params: {
            slot_id: slotId,
            booking_date: bookingDate,
          },
        }
      );

      setSeats(res.data);
      setSelectedSeats([]);
    } catch (err) {
      console.error("Seat fetch error:", err);
    }
  };

  useEffect(() => {
    if (selectedSlotId) fetchSeats(selectedSlotId);
  }, [selectedSlotId]);

  // ================= GROUP BY CATEGORY =================
  const categories = {};
  seats.forEach((seat) => {
    const cat = seat.category || "General";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(seat);
  });

  // ================= SELECT =================
  const toggleSeat = (seat) => {
    if (seat.is_booked) return;

    const seatId = seat.seat_id || seat.id;
    const exists = selectedSeats.some((s) => {
      const selectedId = s.seat_id || s.id;
      return selectedId && seatId && selectedId === seatId;
    });

    if (exists) {
      setSelectedSeats(
        selectedSeats.filter((s) => {
          const selectedId = s.seat_id || s.id;
          return selectedId !== seatId;
        })
      );
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const totalPrice = selectedSeats.reduce(
    (sum, seat) => sum + seat.price,
    0
  );

  const handleContinue = async () => {
    const token = localStorage.getItem("token");

    if (!token || token === "undefined" || token === "null") {
      localStorage.removeItem("token");
      alert("Session expired or invalid. Please login again.");
      navigate("/login");
      return;
    }

    if (!selectedSlotId) {
      alert("Please select a time slot first.");
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    setBookingLoading(true);
    setBookingStatus("");

    const bookingDate = new Date().toISOString().split("T")[0];
    const bookings = [];
    let errorMessage = null;

    for (const seat of selectedSeats) {
      try {
        const res = await axios.post(
          "http://127.0.0.1:8000/user/book-seat",
          {
            theater_seat_id: seat.seat_id,
            slot_id: selectedSlotId,
            booking_date: bookingDate,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        bookings.push({
          booking_id: res.data.booking_id,
          seat_label: seat.seat_number,
          price: seat.price,
        });
      } catch (err) {
        errorMessage = err.response?.data?.detail || err.message;

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          alert("Your session has expired. Please login again.");
          navigate("/login");
          return;
        }

        break;
      }
    }

    setBookingLoading(false);

    if (errorMessage && bookings.length === 0) {
      setBookingStatus(`Booking failed: ${errorMessage}`);
      return;
    }

    navigate("/payment", {
      state: {
        bookingDetails: bookings,
        slot: slots?.find((s) => s.slot_id === selectedSlotId) || slot,
        screen,
        totalPrice,
        bookingDate,
      },
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-24">

      {/* 🔥 TOP BAR */}
      <div className="bg-white p-4 shadow flex justify-between items-center">
        <button onClick={() => navigate(-1)}>⬅ Back</button>
        <div className="font-semibold">
          🎟 {selectedSeats.length} Tickets
        </div>
      </div>

      {/* 🔥 TIME SLOTS (FIXED) */}
      <div className="flex gap-3 overflow-x-auto p-4 bg-gray-200">
        {(slots && slots.length > 0) ? (
          slots.map((s) => (
            <button
              key={s.slot_id}   // ✅ FIXED
              onClick={() => setSelectedSlotId(s.slot_id)}
              className={`px-4 py-2 rounded border ${
                selectedSlotId === s.slot_id
                  ? "bg-green-500 text-white"
                  : "bg-white"
              }`}
            >
              {s.start_time} - {s.end_time}
            </button>
          ))
        ) : (
          <p className="text-red-500 text-sm">
            No time slots available
          </p>
        )}
      </div>

      {/* 🔥 ZOOM */}
      <div className="flex flex-col gap-3 px-4 mt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setZoom(zoom + 0.1)}
            className="bg-white px-3 py-1 border rounded"
          >
            +
          </button>
          <button
            onClick={() => setZoom(Math.max(0.6, zoom - 0.1))}
            className="bg-white px-3 py-1 border rounded"
          >
            -
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 w-full sm:w-auto">
          <div className="rounded-3xl bg-white px-4 py-3 shadow-sm border border-slate-200">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Available</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{seats.filter((seat) => !(seat.is_booked || seat.status === "booked" || seat.status === "BOOKED" || seat.status === "occupied")).length}</p>
          </div>
          <div className="rounded-3xl bg-white px-4 py-3 shadow-sm border border-slate-200">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Selected</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">{selectedSeats.length}</p>
          </div>
          <div className="rounded-3xl bg-white px-4 py-3 shadow-sm border border-slate-200">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Booked</p>
            <p className="mt-2 text-2xl font-semibold text-slate-400">{seats.filter((seat) => seat.is_booked || seat.status === "booked" || seat.status === "BOOKED" || seat.status === "occupied").length}</p>
          </div>
        </div>
      </div>

      {/* 🔥 SCREEN */}
      <div className="text-center my-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-center gap-4 rounded-full bg-slate-200 px-4 py-3 shadow-sm">
          <div className="h-3 w-full rounded-full bg-slate-400"></div>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Screen</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Tap multiple seats to book more than one ticket.</p>
      </div>

      {/* 🔥 SEATS */}
      <div
        className="flex flex-col items-center"
        style={{ transform: `scale(${zoom})` }}
      >
        {Object.keys(categories).map((category) => {
          const categorySeats = categories[category];

          const rows = {};
          categorySeats.forEach((seat) => {
            const row = seat.seat_number[0];
            if (!rows[row]) rows[row] = [];
            rows[row].push(seat);
          });

          return (
            <div key={category} className="mb-12">

              {/* CATEGORY */}
              <h2 className="text-center font-semibold mb-4 text-lg">
                ₹{categorySeats[0]?.price} {category.toUpperCase()}
              </h2>

              {/* ROWS */}
              {Object.keys(rows)
                .sort()
                .reverse()
                .map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-center mb-2"
                  >
                    <div className="w-6 text-sm font-medium">{row}</div>

                    <div className="flex gap-2">
                      {rows[row].map((seat) => {
                        const isSelected = selectedSeats.find(
                          (s) => s.seat_id === seat.seat_id
                        );

                        return (
                          <button
                            key={seat.seat_id}
                            onClick={() => toggleSeat(seat)}
                            disabled={seat.is_booked}
                            className={`w-9 h-9 text-xs rounded-md border transition ${
                              seat.is_booked
                                ? "bg-gray-400 cursor-not-allowed"
                                : isSelected
                                ? "bg-green-500 text-white scale-110"
                                : "bg-white hover:bg-gray-200"
                            }`}
                          >
                            {seat.seat_number.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          );
        })}
      </div>

      {/* 🔥 BOTTOM BAR */}
      <div className="fixed bottom-0 w-full bg-white p-4 flex flex-col gap-3 md:flex-row md:justify-between md:items-center shadow-lg border-t">
        <div>
          <p className="font-bold text-lg">₹{totalPrice}</p>
          <p className="text-xs text-gray-500">
            Seats:{" "}
            {selectedSeats.length > 0
              ? selectedSeats.map((s) => s.seat_number).join(", ")
              : "None"}
          </p>
          {bookingStatus && (
            <p className="mt-2 text-sm text-slate-600">{bookingStatus}</p>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={selectedSeats.length === 0 || bookingLoading}
          className={`px-6 py-2 rounded ${
            selectedSeats.length === 0
              ? "bg-gray-400"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          {bookingLoading ? "Booking..." : "Continue to payment"}
        </button>
      </div>
    </div>
  );
};

export default SeatSelection;