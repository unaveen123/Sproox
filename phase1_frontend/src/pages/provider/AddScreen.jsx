import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddScreen = () => {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [screenInput, setScreenInput] = useState("");

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

        console.log("Locations API:", res.data); // 🔥 DEBUG
        setLocations(res.data || []);
      } catch (err) {
        console.error("Location fetch error:", err);
      }
    };

    fetchLocations();
  }, []);

  // SUBMIT
  const handleSubmit = async () => {
    if (!selectedLocation || !screenInput) {
      alert("Please fill all fields");
      return;
    }

    console.log("Submitting Location ID:", selectedLocation); // 🔥 DEBUG

    try {
      await axios.post(
        `${BASE_URL}/provider/location/${selectedLocation}/add-screen`,
        null,
        {
          params: { name: screenInput },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("✅ Screen added successfully!");
      setScreenInput("");
    } catch (err) {
      console.error("Submit error:", err.response?.data);
      alert(err.response?.data?.detail || "❌ Error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
      <div className="bg-purple-800 p-8 rounded-2xl w-[400px] shadow-lg">
        <h2 className="text-white text-xl mb-6 text-center">
          🎬 Add Screen
        </h2>

        {/* LOCATION DROPDOWN */}
        <select
          className="w-full mb-4 p-3 rounded bg-purple-600 text-white"
          value={selectedLocation}
          onChange={(e) => {
            console.log("Selected Location ID:", e.target.value); // 🔥 IMPORTANT
            setSelectedLocation(e.target.value);
          }}
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

        {/* SCREEN INPUT */}
        <input
          type="text"
          placeholder="Enter Screen (e.g. Screen 1)"
          className="w-full mb-4 p-3 rounded bg-purple-600 text-white"
          value={screenInput}
          onChange={(e) => setScreenInput(e.target.value)}
        />

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 mb-3 bg-purple-400 rounded text-white font-semibold"
        >
          Submit
        </button>

        {/* NEXT */}
        <button
          onClick={() => {
            if (!selectedLocation) {
              alert("Please select location first");
              return;
            }

            navigate("/seat-categories", {
              state: { locationId: selectedLocation },
            });
          }}
          className="w-full py-3 bg-green-500 rounded text-white font-semibold"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default AddScreen;