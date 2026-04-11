import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const LocationDetails = () => {
  const { id: locationId } = useParams();
  const navigate = useNavigate();

  const [screens, setScreens] = useState([]);
  const [timeslots, setTimeslots] = useState([]);

  const [selectedScreen, setSelectedScreen] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    fetchScreens();
    fetchTimeSlots();
  }, []);

  // ✅ FETCH SCREENS
  const fetchScreens = async () => {
  try {
    const res = await axios.get(
      `http://127.0.0.1:8000/user/locations/${locationId}/screens`
    );

    console.log("SCREENS:", res.data);
    setScreens(res.data);
  } catch (err) {
    console.error("Error fetching screens:", err);
  }
};

  // ✅ FETCH TIMESLOTS
  const fetchTimeSlots = async () => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/user/locations/${locationId}/timeslots`
      );

      console.log("TIMESLOTS:", res.data);
      setTimeslots(res.data);
    } catch (err) {
      console.error("Error fetching timeslots:", err);
    }
  };

  // ✅ SCREEN SELECT
  const handleScreenSelect = (screen) => {
    setSelectedScreen(screen);
    setSelectedSlot(null); // reset slot when screen changes
  };

  // ✅ SLOT SELECT (ONLY ONE)
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  // ✅ CONTINUE
  const handleContinue = () => {
    if (!selectedScreen) {
      alert("Please select a screen");
      return;
    }

    if (!selectedSlot) {
      alert("Please select a time slot");
      return;
    }

    navigate(`/seats/${locationId}`, {
      state: {
        screen_id: selectedScreen.id,
        slot_id: selectedSlot.slot_id,
        screen: selectedScreen,
        slot: selectedSlot,
      },
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Select Screen & Time
      </h1>

      {/* ================= SCREENS ================= */}
      <h2 className="text-lg font-semibold mb-2">Screens</h2>

      {screens.length === 0 ? (
        <p className="text-red-500">❌ No screens available</p>
      ) : (
        <div className="flex flex-wrap gap-3 mb-6">
          {screens.map((screen) => (
            <button
              key={screen.id}
              onClick={() => handleScreenSelect(screen)}
              className={`px-4 py-2 border rounded ${
                selectedScreen?.id === screen.id
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              {screen.name}
            </button>
          ))}
        </div>
      )}

      {/* ================= TIMESLOTS ================= */}
      <h2 className="text-lg font-semibold mb-2">Time Slots</h2>

      {timeslots.length === 0 ? (
        <p className="text-gray-500">No time slots available</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {timeslots.map((slot) => (
            <button
              key={slot.slot_id}
              onClick={() => handleSlotSelect(slot)}
              className={`px-4 py-2 border rounded ${
                selectedSlot?.slot_id === slot.slot_id
                  ? "bg-green-500 text-white"
                  : "bg-white"
              }`}
            >
              {slot.start_time} - {slot.end_time}
            </button>
          ))}
        </div>
      )}

      {/* ================= BUTTON ================= */}
      <button
        onClick={handleContinue}
        className="mt-6 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-2 rounded-lg"
      >
        Continue to Seats
      </button>
    </div>
  );
};

export default LocationDetails;