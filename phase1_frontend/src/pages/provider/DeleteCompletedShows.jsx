import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DeleteCompletedShows = () => {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [slots, setSlots] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  const [message, setMessage] = useState("");

  const BASE_URL = "http://127.0.0.1:8000";
  const token = localStorage.getItem("token");

  // FETCH LOCATIONS
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/provider/location/my-locations`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setLocations(res.data || []);
      } catch {
        setMessage("❌ Failed to load locations");
      }
    };

    fetchLocations();
  }, []);

  // FETCH SLOTS
  useEffect(() => {
    if (!selectedLocation) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/provider/location/${selectedLocation}/timeslots`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setSlots(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSlots([]);
        setMessage("❌ Failed to load slots");
      }
    };

    fetchSlots();
    setSelectedSlot("");
  }, [selectedLocation]);

  // DELETE
  const handleDelete = async () => {
    if (!selectedLocation || !selectedSlot) {
      setMessage("⚠️ Select location and slot");
      return;
    }

    if (!window.confirm("Are you sure to delete this show?")) return;

    try {
      await axios.delete(
        `${BASE_URL}/provider/delete-completed-shows?location_id=${selectedLocation}&slot_id=${selectedSlot}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage("✅ Completed show deleted successfully");

    } catch (err) {
      setMessage(
        err?.response?.data?.detail ||
          "❌ Error deleting completed show"
      );
    }
  };

  // AUTO HIDE
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* TOAST */}
      {message && (
        <div className="fixed top-5 right-5 px-4 py-3 rounded shadow-lg text-white bg-green-500">
          {message}
        </div>
      )}

      {/* ALIGN FIX */}
      <div className="max-w-3xl mx-auto">

        {/* BACK */}
        <button
          onClick={() => navigate("/provider/dashboard")}
          className="mb-4 px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium"
        >
          Back
        </button>

        {/* CARD */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* HEADER */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
            <h2 className="text-2xl font-bold">
              Delete Completed Shows
            </h2>
          </div>

          {/* BODY */}
          <div className="p-6">

            {/* LOCATION */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full mb-4 p-3 rounded-lg border border-gray-300"
            >
              <option value="">Select Location</option>
              {locations.map((loc, index) => {
                const locationId = loc.id || loc.location_id;
                const locationName = loc.name || loc.location_name;

                return (
                  <option key={locationId || index} value={locationId}>
                    {locationName}
                  </option>
                );
              })}
            </select>

            {/* SLOT */}
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              disabled={!selectedLocation}
              className="w-full mb-3 p-3 rounded-lg border border-gray-300"
            >
              <option value="">Select Slot</option>

              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  🎬 {slot.movie_name} ({slot.start_time} - {slot.end_time})
                </option>
              ))}
            </select>

            {/* NO SLOT MESSAGE */}
            {selectedLocation && slots.length === 0 && (
              <p className="text-yellow-600 text-sm mb-3">
                ⚠️ No slots available for this location
              </p>
            )}

            {/* DELETE */}
            <button
              onClick={handleDelete}
              className="w-full py-3 rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600"
            >
              Delete Completed Show
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCompletedShows;