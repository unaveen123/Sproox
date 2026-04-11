import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useParams } from "react-router-dom";

const SeatSelection = () => {
  const { id: locationId } = useParams();
  const location = useLocation();

  const { screen_id, slot_id, screen, slot } = location.state || {};

  const selectedScreenId = screen_id || screen?.id;
  const selectedSlotId = slot_id || slot?.slot_id || slot?.id;

  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ================= FETCH SEATS =================
  const fetchSeats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const bookingDate = new Date().toISOString().split("T")[0];

      const res = await axios.get(
        `http://127.0.0.1:8000/user/locations/${locationId}/theater-seats`,
        {
          params: {
            slot_id: selectedSlotId,
            booking_date: bookingDate,
          },
        }
      );

      setSeats(res.data);
      setLoading(false);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to load seats";
      setError(errorMsg);
      setLoading(false);
    }
  };

  // ================= LOAD =================
  useEffect(() => {
    if (selectedSlotId) {
      fetchSeats();
    }
  }, [selectedSlotId]);

  // ================= GROUP BY CATEGORY =================
  const groupedSeats = seats.reduce((acc, seat) => {
    if (!acc[seat.category]) {
      acc[seat.category] = [];
    }
    acc[seat.category].push(seat);
    return acc;
  }, {});

  // ================= SELECT SEAT =================
  const toggleSeat = (seat) => {
    if (seat.is_booked) {
      return; // Don't allow selecting booked seats
    }

    const exists = selectedSeats.find((s) => s.seat_id === seat.seat_id);

    if (exists) {
      setSelectedSeats(
        selectedSeats.filter((s) => s.seat_id !== seat.seat_id)
      );
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // ================= TOTAL PRICE =================
  const totalPrice = selectedSeats.reduce(
    (sum, seat) => sum + (seat.price || 0),
    0
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Seat Selection</h1>

      {/* ================= INFO ================= */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <p>
          🎬 <strong>Screen:</strong> {screen?.name || selectedScreenId || "N/A"}
        </p>
        <p>
          ⏰ <strong>Slot:</strong> {slot?.start_time ? `${slot.start_time} - ${slot.end_time}` : selectedSlotId || "N/A"}
        </p>
      </div>

      {/* ================= ERROR MESSAGE ================= */}
      {error && (
        <div className="mb-6 p-4 border border-red-500 rounded bg-red-50 text-red-700">
          <p className="font-semibold">❌ Error:</p>
          <p>{error}</p>
          <p className="text-sm mt-2">
            Make sure the provider has:
            <br />1. Created seat categories for this screen
            <br />2. Generated seats for this screen
          </p>
        </div>
      )}

      {/* ================= SCREEN ================= */}
      <div className="text-center mb-6">
        <div className="bg-gray-300 h-3 rounded w-2/3 mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">
          All eyes this way please 👀
        </p>
      </div>

      {/* ================= LEGEND ================= */}
      <div className="flex gap-4 justify-center mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white border rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-400 rounded"></div>
          <span>Booked</span>
        </div>
      </div>

      {/* ================= SEATS ================= */}
      {loading ? (
        <p className="text-center text-gray-500">Loading seats...</p>
      ) : seats.length === 0 ? (
        <p className="text-center text-gray-500">No seats available</p>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedSeats).map((category) => (
            <div key={category}>
              {/* Category Title */}
              <h2 className="font-semibold mb-2">
                ₹{groupedSeats[category][0]?.price} {category.toUpperCase()}
              </h2>

              {/* Seats Grid */}
              <div className="flex flex-wrap gap-2">
                {groupedSeats[category].map((seat) => {
                  const isSelected = selectedSeats.find(
                    (s) => s.seat_id === seat.seat_id
                  );
                  const isBooked = seat.is_booked;

                  return (
                    <button
                      key={seat.seat_id}
                      onClick={() => toggleSeat(seat)}
                      disabled={isBooked}
                      className={`w-10 h-10 border rounded text-xs ${
                        isBooked
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : isSelected
                          ? "bg-green-500 text-white"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      {seat.seat_number}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= SUMMARY ================= */}
      <div className="mt-6">
        <p>
          <strong>Selected Seats:</strong>{" "}
          {selectedSeats.length > 0
            ? selectedSeats.map((s) => s.seat_number).join(", ")
            : "None"}
        </p>

        <p className="mt-2 text-lg font-bold">
          Total Price: ₹{totalPrice}
        </p>
      </div>

      {/* ================= BUTTON ================= */}
      <button
        disabled={selectedSeats.length === 0}
        className={`mt-6 px-6 py-2 rounded text-white ${
          selectedSeats.length === 0
            ? "bg-gray-400"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        Book Seats
      </button>
    </div>
  );
};

export default SeatSelection;