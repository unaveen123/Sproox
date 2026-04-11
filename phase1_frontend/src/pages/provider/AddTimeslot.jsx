import { useState, useEffect } from "react";
import axios from "axios";

export default function AddTimeslot() {
  const [locations, setLocations] = useState([]);
  const [screens, setScreens] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");

  const [startTime, setStartTime] = useState("");
  const [startPeriod, setStartPeriod] = useState("AM");

  const [endTime, setEndTime] = useState("");
  const [endPeriod, setEndPeriod] = useState("AM");

  const [movieName, setMovieName] = useState("");
  const [language, setLanguage] = useState("");

  const [loadingScreens, setLoadingScreens] = useState(false);

  // 🔐 TOKEN (same as GenerateSeats)
  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      throw new Error("No token");
    }
    return token;
  };

  // 🔥 TIME INPUT CONTROL (IMPORTANT FIX)
  const handleTimeChange = (value, setTime) => {
    let cleaned = value.replace(/\D/g, ""); // remove non-numbers

    cleaned = cleaned.slice(0, 4); // max 4 digits

    if (cleaned.length >= 3) {
      cleaned = cleaned.slice(0, 2) + ":" + cleaned.slice(2);
    }

    setTime(cleaned);
  };

  // 🔥 Convert to 24-hour
  const convertTo24Hour = (time, period) => {
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours);

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  };

  // 🔒 Validate
  const isValidTime = (time) => {
    return /^(0?[1-9]|1[0-2]):[0-5][0-9]$/.test(time);
  };

  // =========================
  // 📍 FETCH LOCATIONS
  // =========================
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = getToken();

        const res = await axios.get(
          "http://127.0.0.1:8000/provider/location/my-locations",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setLocations(res.data);
      } catch (err) {
        console.error("Location error:", err);
      }
    };

    fetchLocations();
  }, []);

  // =========================
  // 🎬 FETCH SCREENS
  // =========================
  useEffect(() => {
    if (!selectedLocation) {
      setScreens([]);
      setSelectedScreen("");
      return;
    }

    const fetchScreens = async () => {
      try {
        setLoadingScreens(true);

        const token = getToken();

        const res = await axios.get(
          `http://127.0.0.1:8000/provider/location/${selectedLocation}/screens`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setScreens(res.data);

      } catch (err) {
        console.error("Screen error:", err);
      } finally {
        setLoadingScreens(false);
      }
    };

    fetchScreens();
  }, [selectedLocation]);

  // =========================
  // 🚀 SUBMIT
  // =========================
  const handleSubmit = async () => {
    try {
      const token = getToken();

      if (!selectedLocation || !selectedScreen) {
        alert("Select Location and Screen");
        return;
      }

      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        alert("Enter valid time (HH:MM)");
        return;
      }

      await axios.post(
        `http://127.0.0.1:8000/provider/location/${selectedLocation}/add-timeslot`,
        null,
        {
          params: {
            start_time: convertTo24Hour(startTime, startPeriod),
            end_time: convertTo24Hour(endTime, endPeriod),
            screen_id: selectedScreen,
            movie_name: movieName,
            language: language,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Timeslot Added ✅");

      setStartTime("");
      setEndTime("");
      setMovieName("");
      setLanguage("");

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error ❌");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white flex items-center justify-center">
      <div className="bg-purple-900/40 p-8 rounded-xl w-full max-w-lg">

        <h1 className="text-2xl mb-6 text-center">⏰ Add Timeslot</h1>

        {/* LOCATION */}
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-purple-800"
        >
          <option value="">Select Location</option>

          {locations.map((loc, index) => {
            const id = loc.id || loc.location_id;
            const name = loc.name || loc.location_name;

            return (
              <option key={id || index} value={id}>
                {name}
              </option>
            );
          })}
        </select>

        {/* SCREEN */}
        <select
          value={selectedScreen}
          onChange={(e) => setSelectedScreen(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-purple-800"
          disabled={!selectedLocation || loadingScreens}
        >
          <option value="">
            {loadingScreens ? "Loading screens..." : "Select Screen"}
          </option>

          {screens.map((scr) => (
            <option key={scr.id} value={scr.id}>
              {scr.name}
            </option>
          ))}
        </select>

        {/* START TIME */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="HH:MM"
            value={startTime}
            onChange={(e) =>
              handleTimeChange(e.target.value, setStartTime)
            }
            className="w-2/3 p-3 rounded bg-purple-800"
          />

          <select
            value={startPeriod}
            onChange={(e) => setStartPeriod(e.target.value)}
            className="w-1/3 p-3 rounded bg-purple-800"
          >
            <option>AM</option>
            <option>PM</option>
          </select>
        </div>

        {/* END TIME */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="HH:MM"
            value={endTime}
            onChange={(e) =>
              handleTimeChange(e.target.value, setEndTime)
            }
            className="w-2/3 p-3 rounded bg-purple-800"
          />

          <select
            value={endPeriod}
            onChange={(e) => setEndPeriod(e.target.value)}
            className="w-1/3 p-3 rounded bg-purple-800"
          >
            <option>AM</option>
            <option>PM</option>
          </select>
        </div>

        {/* MOVIE */}
        <input
          type="text"
          placeholder="Movie Name"
          value={movieName}
          onChange={(e) => setMovieName(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-purple-800"
        />

        {/* LANGUAGE */}
        <input
          type="text"
          placeholder="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-3 mb-6 rounded bg-purple-800"
        />

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          className="w-full bg-purple-600 p-3 rounded hover:bg-purple-500"
        >
          Add Timeslot
        </button>

      </div>
    </div>
  );
}