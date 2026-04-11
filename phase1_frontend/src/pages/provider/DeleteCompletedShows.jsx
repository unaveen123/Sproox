import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DeleteCompletedShows = () => {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [slots, setSlots] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [movieName, setMovieName] = useState("");

  const BASE_URL = "http://127.0.0.1:8000";

  // ✅ FETCH LOCATIONS
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/provider/location/my-locations`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setLocations(res.data || []);
      } catch (err) {
        console.log("Location error:", err);
      }
    };

    fetchLocations();
  }, []);

  // ✅ FETCH TIMESLOTS (🔥 CORRECT API)
  useEffect(() => {
    if (!selectedLocation) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      try {
        // ✅ CORRECT API (DOUBLE provider)
        const res = await axios.get(
          `${BASE_URL}/provider/provider/location/${selectedLocation}/timeslots`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("SLOTS:", res.data);

        setSlots(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.log("Slot error:", err);
        setSlots([]);
      }
    };

    fetchSlots();
    setSelectedSlot("");
  }, [selectedLocation]);

  // ✅ DELETE COMPLETED SHOW
  const handleDelete = async () => {
    if (!selectedLocation || !selectedSlot || !movieName) {
      alert("⚠️ All fields required");
      return;
    }

    if (!window.confirm("Are you sure to delete this show?")) return;

    try {
      await axios.delete(`${BASE_URL}/provider/delete-completed-shows`, {
        params: {
          location_id: selectedLocation,
          movie_name: movieName,
          slot_id: selectedSlot,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      alert("✅ Completed show deleted successfully");

      // reset
      setMovieName("");
      setSelectedSlot("");

    } catch (err) {
      console.log(err);
      alert(
        err?.response?.data?.detail ||
        "❌ Error deleting completed show"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
      <div className="bg-purple-800 p-8 rounded-2xl w-[400px] shadow-lg">

        {/* BACK */}
        <button
          onClick={() => navigate("/")}
          className="text-white mb-4"
        >
          ← Back
        </button>

        <h2 className="text-white text-xl mb-6 text-center">
          🗑 Delete Completed Shows
        </h2>

        {/* LOCATION */}
        <select
          className="w-full mb-4 p-3 rounded bg-purple-600 text-white"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">Select Location</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name || loc.location_name}
            </option>
          ))}
        </select>

        {/* SLOT */}
        <select
          className="w-full mb-4 p-3 rounded bg-purple-600 text-white"
          value={selectedSlot}
          onChange={(e) => setSelectedSlot(e.target.value)}
          disabled={!selectedLocation}
        >
          <option value="">
            {slots.length === 0
              ? "⚠️ No Slots Found"
              : "Select Slot"}
          </option>

          {slots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              🎬 {slot.movie_name} ({slot.start_time} - {slot.end_time})
            </option>
          ))}
        </select>

        {/* MOVIE NAME */}
        <input
          type="text"
          placeholder="Movie Name (case-sensitive)"
          className="w-full mb-4 p-3 rounded bg-purple-600 text-white placeholder-white"
          value={movieName}
          onChange={(e) => setMovieName(e.target.value)}
        />

        {/* DELETE */}
        <button
          onClick={handleDelete}
          className="w-full py-3 bg-red-500 rounded text-white font-semibold"
        >
          Delete Completed Show
        </button>

      </div>
    </div>
  );
};

export default DeleteCompletedShows;