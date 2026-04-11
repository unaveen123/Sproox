import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddSeatCategory = () => {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [screens, setScreens] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");

  const [categories, setCategories] = useState([
    { name: "", price: "" },
  ]);

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
        console.error("LOCATION ERROR:", err);
      }
    };

    fetchLocations();
  }, []);

  // ✅ FETCH SCREENS
  const handleLocationChange = async (locationId) => {
    setSelectedLocation(locationId);
    setSelectedScreen("");

    if (!locationId) {
      setScreens([]);
      return;
    }

    try {
      const res = await axios.get(
        `${BASE_URL}/provider/location/${locationId}/screens`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setScreens(res.data || []);
    } catch (err) {
      console.error("SCREEN ERROR:", err);
      setScreens([]);
    }
  };

  // ✅ HANDLE CATEGORY CHANGE
  const handleCategoryChange = (index, field, value) => {
    const updated = [...categories];

    if (field === "name") {
      const lowerValue = value.toLowerCase();

      const isDuplicate = updated.some(
        (cat, i) => i !== index && cat.name.toLowerCase() === lowerValue
      );

      if (isDuplicate) {
        alert("❌ Category already exists. Use different name");
        return;
      }
    }

    updated[index][field] = value;
    setCategories(updated);
  };

  const addCategory = () => {
    setCategories([...categories, { name: "", price: "" }]);
  };

  const removeCategory = (index) => {
    const updated = [...categories];
    updated.splice(index, 1);
    setCategories(updated);
  };

  // ✅ FINAL SUBMIT (FIXED FOR YOUR BACKEND)
  const handleSubmit = async () => {
    if (!selectedLocation || !selectedScreen) {
      alert("Select location and screen");
      return;
    }

    // VALIDATION
    for (let cat of categories) {
      if (!cat.name?.trim() || !cat.price) {
        alert("❌ All fields are required");
        return;
      }

      if (isNaN(cat.price)) {
        alert("❌ Price must be a number");
        return;
      }
    }

    // DUPLICATE CHECK
    const names = categories.map((c) => c.name.toLowerCase());
    const hasDuplicate = names.some(
      (name, index) => names.indexOf(name) !== index
    );

    if (hasDuplicate) {
      alert("❌ Category already exists. Use different name");
      return;
    }

    try {
      // 🔥 IMPORTANT: SEND ONE BY ONE
      for (let cat of categories) {
        await axios.post(
          `${BASE_URL}/theater/provider/location/${selectedLocation}/seat-categories`,
          null,
          {
            params: {
              screen_id: selectedScreen,
              name: cat.name.trim(),
              price: Number(cat.price),
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      alert("✅ Categories added successfully!");
      setCategories([{ name: "", price: "" }]);

    } catch (err) {
      console.error("SUBMIT ERROR:", err);

      if (err.response?.data?.detail) {
        const errorData = err.response.data.detail;

        if (Array.isArray(errorData)) {
          const messages = [
            ...new Set(errorData.map((e) => e.msg || e.message))
          ];
          alert(messages.join("\n"));
        } else {
          alert(errorData);
        }
      } else {
        alert("Error adding categories");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
      <div className="bg-purple-800 p-8 rounded-2xl w-[400px] shadow-lg">

        <button
          onClick={() => navigate("/add-screen")}
          className="text-white mb-4"
        >
          ← Back
        </button>

        <h2 className="text-white text-xl mb-6 text-center">
          🎬 Add Seat Categories
        </h2>

        {/* LOCATION */}
        <select
          className="w-full mb-4 p-3 rounded bg-purple-600 text-white"
          value={selectedLocation}
          onChange={(e) => handleLocationChange(e.target.value)}
        >
          <option value="">Select Location</option>
          {locations.map((loc) => {
            const locId = loc.id || loc.uuid || loc.location_id;
            return (
              <option key={locId} value={locId}>
                {loc.name || loc.location_name}
              </option>
            );
          })}
        </select>

        {/* SCREEN */}
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

          {screens.map((scr) => (
            <option key={scr.id} value={scr.id}>
              {scr.name || `Screen ${scr.screen_number}`}
            </option>
          ))}
        </select>

        {/* CATEGORY INPUTS */}
        {categories.map((cat, index) => (
          <div key={index} className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Category"
              className="w-1/2 p-2 rounded bg-purple-600 text-white"
              value={cat.name}
              onChange={(e) =>
                handleCategoryChange(index, "name", e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Price"
              className="w-1/2 p-2 rounded bg-purple-600 text-white"
              value={cat.price}
              onChange={(e) =>
                handleCategoryChange(index, "price", e.target.value)
              }
            />

            {categories.length > 1 && (
              <button
                onClick={() => removeCategory(index)}
                className="bg-red-500 px-3 rounded text-white"
              >
                Delete
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addCategory}
          className="w-full py-2 mb-3 bg-purple-500 rounded text-white"
        >
          + Add More Category
        </button>

        <button
          onClick={handleSubmit}
          className="w-full py-3 mb-3 bg-purple-400 rounded text-white font-semibold"
        >
          Submit All
        </button>

        <button
          onClick={() =>
            navigate("/generate-seats", {
              state: {
                locationId: selectedLocation,
                screenId: selectedScreen,
              },
            })
          }
          className="w-full py-3 bg-green-500 rounded text-white font-semibold"
        >
          Next →
        </button>

      </div>
    </div>
  );
};

export default AddSeatCategory;