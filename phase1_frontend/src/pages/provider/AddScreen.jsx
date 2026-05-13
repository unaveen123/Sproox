import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddScreen = () => {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [screenInput, setScreenInput] = useState("");
  const [existingScreens, setExistingScreens] = useState([]);
  const [message, setMessage] = useState("");

  const inputRef = useRef(null);

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
  const fetchScreens = async (locationId) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/provider/location/${locationId}/screens`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setExistingScreens(res.data || []);
    } catch {
      setExistingScreens([]);
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      fetchScreens(selectedLocation);
    }
  }, [selectedLocation]);

  // SUBMIT
  const handleSubmit = async () => {
    const trimmed = screenInput.trim();

    if (!selectedLocation || !trimmed) {
      setMessage("⚠️ Please fill all fields");
      return;
    }

    const extractNumber = (name) => {
      const match = name.match(/\d+/);
      return match ? match[0] : name.toLowerCase().trim();
    };

    const inputNumber = extractNumber(trimmed);

    const exists = existingScreens.some(
      (s) => extractNumber(s.name) === inputNumber
    );

    if (exists) {
      setMessage(`⚠️ Screen ${inputNumber} already exists`);
      return;
    }

    const finalName = `Screen ${inputNumber}`;

    try {
      const res = await axios.post(
        `${BASE_URL}/provider/location/${selectedLocation}/add-screen`,
        null,
        {
          params: { name: finalName },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setExistingScreens((prev) => [...prev, res.data.screen]);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);

      setMessage("✅ Screen added successfully");
    } catch (err) {
      setMessage(err.response?.data?.detail || "❌ Error");
    }
  };

  // AUTO HIDE MESSAGE
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
        <div
          className={`fixed top-5 right-5 px-4 py-3 rounded shadow-lg text-white ${
            message.includes("✅")
              ? "bg-green-500"
              : message.includes("❌")
              ? "bg-red-500"
              : "bg-yellow-500"
          }`}
        >
          {message}
        </div>
      )}

      {/* ALIGN CONTAINER (IMPORTANT FIX) */}
      <div className="max-w-3xl mx-auto">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition"
        >
          Back
        </button>

        {/* CARD */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* HEADER */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
            <h2 className="text-2xl font-bold">Add Screen</h2>
          </div>

          {/* BODY */}
          <div className="p-6">

            {/* LOCATION */}
            <div className="mb-4">
              <label className="block mb-2 text-gray-700 font-medium">
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300"
              >
                <option value="">Select Location</option>
                {locations.map((loc) => {
                  const id = loc.id || loc.location_id;
                  const name = loc.name || loc.location_name;

                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* SCREEN INPUT */}
            <div className="mb-4">
              <label className="block mb-2 text-gray-700 font-medium">
                Screen
              </label>
              <input
                ref={inputRef}
                value={screenInput}
                onChange={(e) => setScreenInput(e.target.value)}
                placeholder="Enter Screen (e.g. 1 or Screen 1)"
                className="w-full p-3 rounded-lg border border-gray-300"
              />
            </div>

            {/* SCREEN LIST */}
            {existingScreens.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-gray-700 font-medium">
                  Added Screens
                </p>
                <div className="bg-gray-100 p-3 rounded max-h-32 overflow-y-auto">
                  {existingScreens.map((s) => (
                    <div key={s.id} className="text-sm text-gray-700">
                      🎬 {s.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBMIT */}
            <button
              onClick={handleSubmit}
              className="w-full mb-3 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-500"
            >
              Submit
            </button>

            {/* NEXT */}
            <button
              onClick={() => {
                if (!selectedLocation) {
                  setMessage("⚠️ Please select location first");
                  return;
                }

                navigate("/seat-categories", {
                  state: { locationId: selectedLocation },
                });
              }}
              className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold"
            >
              Next →
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AddScreen;