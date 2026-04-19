import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const SelectScreenTime = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [screens, setScreens] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    fetchScreens();
    fetchTimeslots();
  }, []);

  // ================= FETCH SCREENS =================
  const fetchScreens = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://127.0.0.1:8000/provider/location/${id}/screens`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setScreens(res.data || []);
    } catch (err) {
      console.error("❌ SCREEN ERROR:", err.response || err);
    }
  };

  // ================= FETCH TIMESLOTS =================
  const fetchTimeslots = async () => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/user/locations/${id}/timeslots`
      );

      console.log("TIMESLOTS:", res.data);
      setTimeslots(res.data || []);
    } catch (err) {
      console.error("❌ TIMESLOT ERROR:", err);
    }
  };

  // ✅ FIXED FILTER (IMPORTANT)
  const filteredTimeslots = selectedScreen
    ? timeslots.filter(
        (slot) =>
          String(slot.screen_id) === String(selectedScreen)
      )
    : [];

  // ================= CONTINUE =================
  const handleContinue = () => {
    if (!selectedScreen) {
      alert("Select screen");
      return;
    }

    if (!selectedTime) {
      alert("Select time slot");
      return;
    }

    const selectedScreenObj = screens.find(
      (s) => String(s.id) === String(selectedScreen)
    );

    const selectedSlotObj = filteredTimeslots.find(
      (s) => s.slot_id === selectedTime
    );

    if (!selectedSlotObj) {
      alert("Invalid slot");
      return;
    }

    navigate(`/seats/${id}`, {
      state: {
        screen: selectedScreenObj,
        slot: selectedSlotObj,
        slots: filteredTimeslots,
      },
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">
        Select Screen & Time
      </h2>

      {/* 🎬 SCREENS */}
      <h3 className="text-lg font-semibold mb-2">Screens</h3>

      {screens.length === 0 ? (
        <p className="text-red-500">❌ No screens available</p>
      ) : (
        <div className="flex gap-3 mb-6 flex-wrap">
          {screens.map((scr) => (
            <button
              key={scr.id}
              onClick={() => {
                setSelectedScreen(scr.id);
                setSelectedTime(null);
              }}
              className={`px-4 py-2 border rounded ${
                String(selectedScreen) === String(scr.id)
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              {scr.name}
            </button>
          ))}
        </div>
      )}

      {/* ⏰ TIMESLOTS */}
      <h3 className="text-lg font-semibold mb-2">Time Slots</h3>

      <div className="flex gap-3 flex-wrap mb-6">
        {!selectedScreen ? (
          <p className="text-gray-500">
            Select a screen to see matching time slots.
          </p>
        ) : filteredTimeslots.length === 0 ? (
          <p className="text-red-500">
            No time slots available for this screen.
          </p>
        ) : (
          filteredTimeslots.map((slot) => (
            <button
              key={slot.slot_id}
              onClick={() => setSelectedTime(slot.slot_id)}
              className={`px-4 py-2 border rounded ${
                selectedTime === slot.slot_id
                  ? "bg-green-500 text-white"
                  : "bg-white"
              }`}
            >
              {/* 🔥 SHOW MOVIE INFO */}
              <div className="font-semibold">
                {slot.movie_name}
              </div>
              <div className="text-sm text-gray-600">
                {slot.language}
              </div>
              <div>
                {slot.start_time} - {slot.end_time}
              </div>
            </button>
          ))
        )}
      </div>

      {/* 🚀 BUTTON */}
      <button
        onClick={handleContinue}
        className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-2 rounded"
      >
        Continue to Seats
      </button>
    </div>
  );
};

export default SelectScreenTime;