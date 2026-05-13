import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useParams, useNavigate } from "react-router-dom";

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
      const bookingDate = getLocalDateString();

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

  // ================= GROUP BY ROW =================
  const rows = {};
  seats.forEach((seat) => {
    const rowKey = seat.seat_number?.charAt(0) || seat.row || "A";
    if (!rows[rowKey]) rows[rowKey] = [];
    rows[rowKey].push(seat);
  });

  const getSeatStatus = (seat) => {
    const booked = seat.is_booked || seat.status === "booked" || seat.status === "BOOKED" || seat.status === "occupied";
    const selected = selectedSeats.some((selected) => {
      const selectedId = selected.seat_id || selected.id;
      const seatId = seat.seat_id || seat.id;
      return selectedId && seatId && selectedId === seatId;
    });
    return booked ? "booked" : selected ? "selected" : "available";
  };

  const getSeatNumberLabel = (seat) => {
    const seatNumber = seat.seat_number || seat.label || "";
    const match = seatNumber.toString().match(/\d+$/);
    return match ? match[0] : seatNumber;
  };

  const getSeatStyle = (seat) => {
    const categoryName = (seat.category || seat.category_name || "General").toLowerCase();
    if (categoryName.includes("plus") || categoryName.includes("diamond") || categoryName.includes("premium")) return "bg-amber-100 text-amber-700";
    if (categoryName.includes("classic") || categoryName.includes("silver")) return "bg-sky-100 text-sky-700";
    if (categoryName.includes("regular") || categoryName.includes("bronze") || categoryName.includes("gold")) return "bg-emerald-100 text-emerald-700";
    return "bg-slate-100 text-slate-700";
  };

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

    const bookingDate = getLocalDateString();
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

    navigate("/summary", {
      state: {
        bookingDetails: bookings,
        slot: slots?.find((s) => s.slot_id === selectedSlotId) || slot,
        screen,
        location: { name: "Theater", city: "City" },
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
      <div className="flex flex-col items-center">
        <div className="w-full max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" style={{ transform: `scale(${zoom})` }}>
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 h-2 w-2/3 rounded-full bg-slate-200" />
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Screen</p>
          </div>

          {Object.keys(rows)
            .sort()
            .reverse()
            .map((row) => (
              <div key={row} className="flex items-center justify-center gap-3 mb-3">
                <div className="w-6 text-sm font-medium text-slate-700">{row}</div>
                <div className="flex flex-wrap items-center gap-2 justify-center">
                  {rows[row]
                    .sort((a, b) => (a.seat_number || "").localeCompare(b.seat_number || ""))
                    .map((seat) => {
                      const status = getSeatStatus(seat);
                      const isBooked = status === "booked";
                      const isSelected = status === "selected";
                      const seatStyle = getSeatStyle(seat);

                      return (
                        <button
                          key={seat.seat_id || seat.id || seat.seat_number}
                          type="button"
                          disabled={isBooked}
                          onClick={() => toggleSeat(seat)}
                          className={`w-10 h-10 rounded-2xl border px-2 py-2 text-xs font-semibold transition ${
                            isBooked
                              ? "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-400"
                              : isSelected
                              ? "border-red-500 bg-red-500 text-white shadow"
                              : `border-slate-300 bg-white text-slate-900 hover:border-slate-900 hover:bg-slate-50 ${seatStyle}`
                          }`}
                        >
                          {getSeatNumberLabel(seat) || "-"}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
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
