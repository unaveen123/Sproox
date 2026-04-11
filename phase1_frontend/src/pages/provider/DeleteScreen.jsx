import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DeleteScreen = () => {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [screens, setScreens] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");

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

        console.log("✅ LOCATIONS DATA:", res.data);

        setLocations(res.data || []);
      } catch (err) {
        console.log("❌ Location error:", err);
      }
    };

    fetchLocations();
  }, []);

  // ✅ FETCH SCREENS (FIXED PROPERLY)
  useEffect(() => {
    if (!selectedLocation) {
      setScreens([]);
      return;
    }

    const fetchScreens = async () => {
      try {
        console.log("👉 Calling screens API with ID:", selectedLocation);

        const res = await axios.get(
          `${BASE_URL}/provider/location/${selectedLocation}/screens`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("✅ SCREENS DATA:", res.data);

        setScreens(res.data || []);
      } catch (err) {
        console.log("❌ Screen error:", err);
        setScreens([]);
      }
    };

    fetchScreens();
    setSelectedScreen("");
  }, [selectedLocation]);

  // ✅ DELETE SCREEN
  const handleDelete = async () => {
    if (!selectedLocation || !selectedScreen) {
      alert("Select location and screen");
      return;
    }

    if (!window.confirm("Are you sure to delete this screen?")) return;

    try {
      await axios.delete(
        `${BASE_URL}/provider/location/${selectedLocation}/delete-screen-maintenance/${selectedScreen}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("✅ Screen deleted successfully");

      // refresh UI
      setScreens((prev) =>
        prev.filter((scr) => scr.id !== selectedScreen)
      );

      setSelectedScreen("");
    } catch (err) {
      console.log("❌ Delete error:", err);
      alert("Error deleting screen");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
      <div className="bg-purple-800 p-8 rounded-2xl w-[400px] shadow-lg">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate("/")}
          className="text-white mb-4"
        >
          ← Back
        </button>

        <h2 className="text-white text-xl mb-6 text-center">
          🗑 Delete Screen
        </h2>

        {/* LOCATION DROPDOWN (FIXED) */}
        <select
          className="w-full mb-4 p-3 rounded bg-purple-600 text-white"
          value={selectedLocation}
          onChange={(e) => {
            console.log("🎯 Selected Location ID:", e.target.value);
            setSelectedLocation(e.target.value);
          }}
        >
          <option value="">Select Location</option>

          {locations.map((loc, index) => {
            const locId = loc.id || loc.location_id; // 🔥 FIX

            return (
              <option key={locId || index} value={locId}>
                {loc.name || loc.location_name}
              </option>
            );
          })}
        </select>

        {/* SCREEN DROPDOWN */}
        <select
          className="w-full mb-4 p-3 rounded bg-purple-600 text-white"
          value={selectedScreen}
          onChange={(e) => setSelectedScreen(e.target.value)}
          disabled={!selectedLocation}
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
          onClick={handleDelete}
          className="w-full py-3 bg-red-500 rounded text-white font-semibold"
        >
          Delete Screen
        </button>

      </div>
    </div>
  );
};

export default DeleteScreen;