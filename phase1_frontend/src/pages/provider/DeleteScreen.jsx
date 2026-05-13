import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DeleteScreen = () => {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [screens, setScreens] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");

  const BASE_URL = "http://127.0.0.1:8000";

  // FETCH LOCATIONS
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
      } catch {
        setMessage("❌ Failed to load locations");
      }
    };

    fetchLocations();
  }, []);

  // FETCH SCREENS
  useEffect(() => {
    if (!selectedLocation) {
      setScreens([]);
      return;
    }

    const fetchScreens = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/provider/location/${selectedLocation}/screens`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setScreens(res.data || []);
      } catch {
        setScreens([]);
        setMessage("❌ Failed to load screens");
      }
    };

    fetchScreens();
    setSelectedScreen("");
  }, [selectedLocation]);

  // DELETE
  const handleDelete = async () => {
    if (!selectedLocation || !selectedScreen) {
      setMessage("⚠️ Select location and screen");
      return;
    }

    try {
      await axios.delete(
        `${BASE_URL}/provider/location/${selectedLocation}/delete-screen-maintenance/${selectedScreen}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessage("✅ Screen deleted successfully");

      setScreens((prev) =>
        prev.filter((scr) => scr.id !== selectedScreen)
      );

      setSelectedScreen("");
    } catch {
      setMessage("❌ Error deleting screen");
    }
  };

  // AUTO HIDE
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
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
            <h2 className="text-2xl font-bold">Delete Screen</h2>
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
                const locId = loc.id || loc.location_id;
                return (
                  <option key={locId || index} value={locId}>
                    {loc.name || loc.location_name}
                  </option>
                );
              })}
            </select>

            {/* SCREEN */}
            <select
              value={selectedScreen}
              onChange={(e) => setSelectedScreen(e.target.value)}
              disabled={!selectedLocation}
              className="w-full mb-6 p-3 rounded-lg border border-gray-300"
            >
              <option value="">
                {screens.length === 0
                  ? "No Screens Available"
                  : "Select Screen"}
              </option>

              {screens.map((scr, index) => (
                <option key={scr.id || index} value={scr.id}>
                  {scr.name || `Screen ${scr.screen_number}`}
                </option>
              ))}
            </select>

            {/* DELETE BUTTON */}
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3 rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600"
            >
              Delete Screen
            </button>

          </div>
        </div>
      </div>

      {/* CONFIRM POPUP */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl text-center w-80 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">
              Confirm Delete
            </h3>

            <p className="mb-4 text-gray-600">
              Are you sure you want to delete this screen?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleDelete();
                }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Yes
              </button>

              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeleteScreen;