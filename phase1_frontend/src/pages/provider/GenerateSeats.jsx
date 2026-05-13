import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const GenerateSeats = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const BASE_URL = "http://127.0.0.1:8000";

  const [locations, setLocations] = useState([]);
  const [screens, setScreens] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");

  const [rows, setRows] = useState([
    { row: "A", seats: "", category: "" },
  ]);

  const [message, setMessage] = useState("");

  // ================= LOAD FROM PREVIOUS PAGE =================
  useEffect(() => {
    if (location.state) {
      setSelectedLocation(location.state.locationId || "");
      setSelectedScreen(location.state.screenId || "");
    }
  }, []);

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
      } catch {
        setLocations([]);
      }
    };

    fetchLocations();
  }, []);

  // ================= FETCH SCREENS =================
  useEffect(() => {
    if (!selectedLocation) return;

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

        console.log("Screens:", res.data);
        setScreens(res.data || []);
      } catch {
        setScreens([]);
      }
    };

    fetchScreens();
  }, [selectedLocation]);

  // ================= FETCH CATEGORIES =================
  useEffect(() => {
    if (!selectedLocation || !selectedScreen) return;

    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/theater/provider/location/${selectedLocation}/seat-categories`,
          {
            params: { screen_id: selectedScreen },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("Categories:", res.data);
        setCategories(res.data || []);
      } catch {
        setCategories([]);
      }
    };

    fetchCategories();
  }, [selectedLocation, selectedScreen]);

  // ================= HANDLE ROW =================
  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const addRow = () => {
    const nextLetter = String.fromCharCode(65 + rows.length);
    setRows([...rows, { row: nextLetter, seats: "", category: "" }]);
  };

  const removeRow = (index) => {
    const updated = [...rows];
    updated.splice(index, 1);
    setRows(updated);
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (!selectedLocation || !selectedScreen) {
      setMessage("⚠️ Select location and screen");
      return;
    }

    const invalidRow = rows.find(
      (row) => !row.seats || isNaN(Number(row.seats)) || Number(row.seats) <= 0
    );
    const invalidCategory = rows.find((row) => !row.category);

    if (invalidRow) {
      setMessage("⚠️ Please enter a valid seat count for every row.");
      return;
    }

    if (invalidCategory) {
      setMessage("⚠️ Please select a category for every row.");
      return;
    }

    const payload = {
      rows: rows.reduce((acc, row) => {
        acc[row.row] = Number(row.seats);
        return acc;
      }, {}),
      category_mapping: rows.reduce((acc, row) => {
        acc[row.row] = row.category;
        return acc;
      }, {}),
    };

    try {
      await axios.post(
        `${BASE_URL}/theater/provider/location/${selectedLocation}/generate-seats`,
        payload,
        {
          params: { screen_id: selectedScreen },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessage("✅ Seats generated successfully");
    } catch (err) {
      console.log(err.response?.data);
      setMessage(err.response?.data?.detail || "❌ Error generating seats");
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
        <div className="fixed top-5 right-5 px-4 py-3 rounded shadow-lg text-white bg-green-500">
          {message}
        </div>
      )}

      <div className="max-w-3xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-5 py-2 bg-gray-100 rounded-xl"
        >
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
            <h2 className="text-2xl font-bold">Generate Seats</h2>
          </div>

          <div className="p-6">

            {/* LOCATION */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
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

            {/* ROWS */}
            {rows.map((r, index) => (
              <div key={index} className="flex gap-2 mb-3">

                <input
                  value={r.row}
                  disabled
                  className="w-1/4 p-3 border rounded"
                />

                <input
                  placeholder="Seats"
                  value={r.seats}
                  onChange={(e) =>
                    handleChange(index, "seats", e.target.value)
                  }
                  className="w-1/4 p-3 border rounded"
                />

                <select
                  value={r.category}
                  onChange={(e) =>
                    handleChange(index, "category", e.target.value)
                  }
                  className="w-1/2 p-3 border rounded"
                >
                  <option>Select Category</option>

                  {categories.map((c) => {
                    const name = c.name || c.category_name;

                    return (
                      <option key={c.id} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>

                <button
                  onClick={() => removeRow(index)}
                  className="bg-red-500 px-3 text-white rounded"
                >
                  X
                </button>
              </div>
            ))}

            <button
              onClick={addRow}
              className="w-full py-3 mb-3 text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded"
            >
              + Add Row
            </button>

            <button
              onClick={handleSubmit}
              className="w-full py-3 mb-3 text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded"
            >
              Generate Seats
            </button>

            <button
              onClick={() =>
                navigate("/add-timeslot", {
                  state: {
                    locationId: selectedLocation,
                    screenId: selectedScreen,
                  },
                })
              }
              className="w-full py-3 border rounded"
            >
              Next →
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateSeats;