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

  // 🔥 FIXED: USING PROVIDER API WITH TOKEN
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

    console.log("✅ SCREENS RESPONSE:", res.data);

    setScreens(res.data || []);
  } catch (err) {
    console.error("❌ SCREEN ERROR:", err.response || err);
  }
};

  // ✅ TIMESLOTS (USER API OK)
  const fetchTimeslots = async () => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/user/locations/${id}/timeslots`
      );

      console.log("TIMESLOTS:", res.data);
      setTimeslots(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching timeslots:", err);
    }
  };

  const filteredTimeslots = selectedScreen
    ? timeslots.filter((slot) => slot.screen_id === selectedScreen)
    : timeslots;

  // 🚀 CONTINUE
  const handleContinue = () => {
    if (!selectedScreen) {
      alert("Select screen");
      return;
    }

    if (!selectedTime) {
      alert("Select time slot");
      return;
    }

    navigate(`/seats/${id}`, {
      state: {
        screen_id: selectedScreen,
        slot_id: selectedTime,
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
                selectedScreen === scr.id
                  ? "bg-blue-500 text-white"
                  : ""
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
        {filteredTimeslots.length === 0 ? (
          <p className="text-red-500">
            {selectedScreen
              ? "No timeslots available for this screen"
              : "No timeslots available"}
          </p>
        ) : (
          filteredTimeslots.map((slot) => (
            <button
              key={slot.slot_id}
              onClick={() => setSelectedTime(slot.slot_id)}
              className={`px-4 py-2 border rounded ${
                selectedTime === slot.slot_id
                  ? "bg-green-500 text-white"
                  : ""
              }`}
            >
              {slot.start_time} - {slot.end_time}
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