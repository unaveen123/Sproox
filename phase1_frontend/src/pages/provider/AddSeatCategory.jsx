import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddSeatCategory = () => {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [screens, setScreens] = useState([]);
  const [existingCategories, setExistingCategories] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");

  const [categories, setCategories] = useState([
    { name: "", price: "", mode: "existing" },
  ]);

  const [message, setMessage] = useState("");

  const BASE_URL = "http://127.0.0.1:8000";

  const mergeUniqueCategories = (categoryGroups) => {
    const unique = new Map();

    categoryGroups.flat().forEach((category) => {
      const name = category.name || category.category_name;
      if (!name) return;

      const key = name.trim().toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, {
          ...category,
          id: category.id || key,
          name,
        });
      }
    });

    return Array.from(unique.values());
  };

  const fetchExistingCategories = async (locationId) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/theater/provider/location/${locationId}/seat-categories`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setExistingCategories((prev) =>
        mergeUniqueCategories([prev, res.data || []])
      );
    } catch {
      setExistingCategories((prev) => prev);
    }
  };

  const fetchAllExistingCategories = async (providerLocations) => {
    const locationIds = providerLocations
      .map((location) => location.id || location.location_id)
      .filter(Boolean);

    if (locationIds.length === 0) {
      setExistingCategories([]);
      return;
    }

    const responses = await Promise.allSettled(
      locationIds.map((locationId) =>
        axios.get(
          `${BASE_URL}/theater/provider/location/${locationId}/seat-categories`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
      )
    );

    const categoryGroups = responses
      .filter((response) => response.status === "fulfilled")
      .map((response) => response.value.data || []);

    setExistingCategories(mergeUniqueCategories(categoryGroups));
  };

  // ================= FETCH LOCATIONS =================
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
        fetchAllExistingCategories(res.data || []);
      } catch {
        setMessage("❌ Failed to load locations");
      }
    };

    fetchLocations();
  }, []);

  // ================= FETCH SCREENS =================
  const handleLocationChange = async (locationId) => {
    setSelectedLocation(locationId);
    setSelectedScreen("");

    if (!locationId) {
      setScreens([]);
      fetchAllExistingCategories(locations);
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

      console.log("Screens API:", res.data);

      setScreens(res.data || []);
      fetchExistingCategories(locationId);
    } catch {
      setScreens([]);
      setMessage("❌ Failed to load screens");
    }
  };

  // ================= CATEGORY CHANGE =================
  const setCategoryMode = (index, mode) => {
    const updated = [...categories];
    updated[index] = {
      ...updated[index],
      mode,
      name: "",
      price: mode === "new" ? "" : updated[index].price,
    };
    setCategories(updated);
  };

  const handleExistingCategorySelect = (index, value) => {
    const updated = [...categories];
    const matchingCategory = existingCategories.find(
      (c) => String(c.id) === String(value)
    );

    updated[index] = {
      ...updated[index],
      mode: "existing",
      name: matchingCategory ? matchingCategory.name || matchingCategory.category_name : "",
      price: matchingCategory ? matchingCategory.price?.toString() || "" : updated[index].price,
    };

    setCategories(updated);
  };

  const handleCategoryNameChange = (index, value) => {
    const updated = [...categories];
    updated[index] = {
      ...updated[index],
      name: value,
    };
    setCategories(updated);
  };

  const handleCategoryPriceChange = (index, value) => {
    const updated = [...categories];
    updated[index].price = value;
    setCategories(updated);
  };

  const addCategory = () => {
    setCategories([...categories, { name: "", price: "", mode: "existing" }]);
  };

  const removeCategory = (index) => {
    const updated = [...categories];
    updated.splice(index, 1);
    setCategories(updated);
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (!selectedLocation || !selectedScreen) {
      setMessage("⚠️ Select location and screen");
      return;
    }

    const validCategories = categories.filter(
      (cat) => cat.name.trim() && cat.price
    );

    if (validCategories.length === 0) {
      setMessage("âš ï¸ Select or type at least one category with price");
      return;
    }

    try {
      for (let cat of validCategories) {

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

      setMessage("✅ Successfully added categories");
      fetchExistingCategories(selectedLocation);

    } catch {
      setMessage("❌ Error adding categories");
    }
  };

  // ================= AUTO HIDE =================
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
        <div className={`fixed top-5 right-5 px-4 py-3 rounded shadow-lg text-white ${
          message.includes("✅") ? "bg-green-500" :
          message.includes("❌") ? "bg-red-500" : "bg-yellow-500"
        }`}>
          {message}
        </div>
      )}

      <div className="max-w-3xl mx-auto">

        <button
          onClick={() => navigate("/add-screen")}
          className="mb-4 px-5 py-2 bg-gray-100 rounded-xl"
        >
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
            <h2 className="text-2xl font-bold">Add Seat Categories</h2>
          </div>

          <div className="p-6">

            {/* LOCATION */}
            <select
              value={selectedLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full mb-4 p-3 rounded-lg border"
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

            {/* SCREEN */}
            <select
              value={selectedScreen}
              onChange={(e) => setSelectedScreen(e.target.value)}
              className="w-full mb-4 p-3 rounded-lg border"
            >
              <option value="">
                {screens.length === 0
                  ? "No Screens Available"
                  : "Select Screen"}
              </option>

              {screens.map((scr) => {
                const id = scr.id || scr.screen_id;
                const name = scr.name || scr.screen_name;

                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>

            {/* CATEGORY INPUT */}
            <p className="mb-3 text-sm text-slate-500">
              Select an existing category or type a new one. Existing categories appear in the dropdown.
            </p>
            {categories.map((cat, index) => (
              <div key={index} className="grid gap-2 mb-3 md:grid-cols-[1.5fr_1fr_auto]">
                <div className="space-y-2">
                  <select
                    value={cat.mode === "new" ? "__new__" : existingCategories.find((c) => (c.name || c.category_name) === cat.name)?.id || ""}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setCategoryMode(index, "new");
                      } else {
                        setCategoryMode(index, "existing");
                        handleExistingCategorySelect(index, e.target.value);
                      }
                    }}
                    className="w-full p-3 rounded-lg border"
                  >
                    <option value="">Select existing category</option>
                    {existingCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.category_name}
                      </option>
                    ))}
                    <option value="__new__">+ Type new category</option>
                  </select>

                  {cat.mode === "new" && (
                    <input
                      placeholder="Type new category"
                      value={cat.name}
                      onChange={(e) => handleCategoryNameChange(index, e.target.value)}
                      className="w-full p-3 rounded-lg border"
                    />
                  )}
                </div>

                <input
                  type="number"
                  placeholder="Price"
                  value={cat.price}
                  onChange={(e) => handleCategoryPriceChange(index, e.target.value)}
                  className="w-full p-3 rounded-lg border"
                />

                {categories.length > 1 && (
                  <button
                    onClick={() => removeCategory(index)}
                    className="bg-red-500 px-3 rounded-lg text-white"
                  >
                    X
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addCategory}
              className="w-full py-3 mb-3 rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-500"
            >
              + Add More Category
            </button>

            <button
              onClick={handleSubmit}
              className="w-full py-3 mb-3 rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-500"
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
              className="w-full py-3 rounded-lg border"
            >
              Next →
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSeatCategory;
