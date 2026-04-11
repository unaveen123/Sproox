import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function GenerateSeats() {
  const navigate = useNavigate();
  const locationState = useLocation();

  const [locations, setLocations] = useState([]);
  const [screens, setScreens] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");

  const [rowsData, setRowsData] = useState([
    { row: "", seats: "", category: "" }
  ]);

  const BASE_URL = "http://127.0.0.1:8000";

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please login again");
      window.location.href = "/login";
      throw new Error("No token");
    }
    return token;
  };

  // ✅ PREFILL
  useEffect(() => {
    if (locationState.state) {
      setSelectedLocation(locationState.state.locationId || "");
      setSelectedScreen(locationState.state.screenId || "");
    }
  }, [locationState.state]);

  // ✅ FETCH LOCATIONS
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/provider/location/my-locations`,
          {
            headers: { Authorization: `Bearer ${getToken()}` },
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
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );
        setScreens(res.data || []);
      } catch (err) {
        console.error("SCREEN ERROR:", err);
      }
    };

    fetchScreens();
  }, [selectedLocation]);

  // ✅ FETCH CATEGORIES
  useEffect(() => {
    if (!selectedLocation || !selectedScreen) {
      setCategories([]);
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/theater/provider/location/${selectedLocation}/seat-categories`,
          {
            params: { screen_id: selectedScreen },
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );

        const data = Array.isArray(res.data) ? res.data : [];
        const unique = [...new Map(data.map(c => [c.name, c])).values()];

        setCategories(unique);

      } catch (err) {
        console.error("CATEGORY ERROR:", err);
      }
    };

    fetchCategories();
  }, [selectedLocation, selectedScreen]);

  const addRow = () => {
    setRowsData([...rowsData, { row: "", seats: "", category: "" }]);
  };

  const removeRow = (index) => {
    const updated = [...rowsData];
    updated.splice(index, 1);
    setRowsData(updated);
  };

  // ✅ DUPLICATE ROW BLOCK
  const handleChange = (index, field, value) => {
    const updated = [...rowsData];

    if (field === "row") {
      const rowValue = value.toUpperCase();

      const isDuplicate = updated.some(
        (r, i) => i !== index && r.row.toUpperCase() === rowValue
      );

      if (isDuplicate) {
        alert(`❌ Row '${rowValue}' already exists`);
        return;
      }
    }

    updated[index][field] = value;
    setRowsData(updated);
  };

  // ✅ FINAL SUBMIT (100% MATCH BACKEND)
  const handleSubmit = async () => {
    try {
      let rows = {};
      let category_mapping = {};
      let rowSet = new Set();

      for (let r of rowsData) {
        if (!r.row || !r.seats || !r.category) {
          alert("❌ Fill all fields");
          return;
        }

        const rowKey = r.row.toUpperCase();

        if (rowSet.has(rowKey)) {
          alert(`❌ Row '${rowKey}' already added`);
          return;
        }

        rowSet.add(rowKey);

        // 🔥 EXACT FORMAT REQUIRED
        rows[rowKey] = Number(r.seats);
        category_mapping[rowKey] = r.category;
      }

      const payload = {
        rows,
        category_mapping
      };

      console.log("🚀 FINAL PAYLOAD:", payload);

      await axios.post(
        `${BASE_URL}/theater/provider/location/${selectedLocation}/generate-seats`,
        payload,
        {
          params: { screen_id: selectedScreen },
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      alert("✅ Seats Generated Successfully");

    } catch (err) {
      console.error("❌ ERROR:", err.response?.data || err);

      alert(
        err.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : "Error generating seats"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white flex items-center justify-center">
      <div className="bg-purple-900/40 p-8 rounded-xl w-full max-w-lg">

        <button onClick={() => navigate("/seat-categories")} className="mb-4">
          ← Back
        </button>

        <h1 className="text-2xl mb-6 text-center">🎬 Generate Seats</h1>

        {/* LOCATION */}
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-purple-700"
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
          value={selectedScreen}
          onChange={(e) => setSelectedScreen(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-purple-700"
        >
          <option value="">Select Screen</option>
          {screens.map((scr) => (
            <option key={scr.id} value={scr.id}>
              {scr.name || scr.screen_number}
            </option>
          ))}
        </select>

        {/* ROWS */}
        {rowsData.map((r, index) => (
          <div key={index} className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Row"
              className="w-1/3 p-2 rounded bg-purple-700"
              value={r.row}
              onChange={(e) =>
                handleChange(index, "row", e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Seats"
              className="w-1/3 p-2 rounded bg-purple-700"
              value={r.seats}
              onChange={(e) =>
                handleChange(index, "seats", e.target.value)
              }
            />

            <select
              className="w-1/3 p-2 rounded bg-purple-700"
              value={r.category}
              onChange={(e) =>
                handleChange(index, "category", e.target.value)
              }
            >
              <option value="">Select Category</option>

              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => removeRow(index)}
              className="bg-red-500 px-2 rounded"
            >
              X
            </button>
          </div>
        ))}

        <button
          onClick={addRow}
          className="w-full py-2 mb-3 bg-purple-500 rounded"
        >
          + Add Row
        </button>

        <button
          onClick={handleSubmit}
          className="w-full py-3 mb-3 bg-purple-400 rounded"
        >
          Generate Seats
        </button>

        <button
          onClick={() => navigate("/add-timeslot")}
          className="w-full py-3 bg-green-500 rounded"
        >
          Next →
        </button>

      </div>
    </div>
  );
}