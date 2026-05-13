import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function AddTimeslot() {
  const navigate = useNavigate();
  const location = useLocation();

  const [locations, setLocations] = useState([]);
  const [screens, setScreens] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");

  const [startTime, setStartTime] = useState("");
  const [startPeriod, setStartPeriod] = useState("AM");

  useEffect(() => {
    if (location.state) {
      const { locationId, screenId } = location.state;
      if (locationId) setSelectedLocation(locationId);
      if (screenId) setSelectedScreen(screenId);
    }
  }, [location.state]);

  const [endTime, setEndTime] = useState("");
  const [endPeriod, setEndPeriod] = useState("AM");

  const [movieName, setMovieName] = useState("");
  const [language, setLanguage] = useState("");

  const [loadingScreens, setLoadingScreens] = useState(false);
  const [message, setMessage] = useState("");

  const BASE_URL = "http://127.0.0.1:8000";

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("⚠️ Please login again");
      throw new Error("No token");
    }
    return token;
  };

  const handleTimeChange = (value, setTime) => {
    let cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) {
      cleaned = cleaned.slice(0, 2) + ":" + cleaned.slice(2);
    }
    setTime(cleaned);
  };

  const convertTo24Hour = (time, period) => {
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours);

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  };

  const isValidTime = (time) => {
    return /^(0?[1-9]|1[0-2]):[0-5][0-9]$/.test(time);
  };

  // FETCH LOCATIONS
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/provider/location/my-locations`,
          {
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );
        setLocations(res.data);
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
        setLoadingScreens(true);

        const res = await axios.get(
          `${BASE_URL}/provider/location/${selectedLocation}/screens`,
          {
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );

        setScreens(res.data);
      } catch {
        setMessage("❌ Failed to load screens");
      } finally {
        setLoadingScreens(false);
      }
    };

    fetchScreens();
  }, [selectedLocation]);

  // SUBMIT
  const handleSubmit = async () => {
    try {
      const token = getToken();

      if (!selectedLocation || !selectedScreen) {
        setMessage("⚠️ Select Location and Screen");
        return;
      }

      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        setMessage("⚠️ Enter valid time (HH:MM)");
        return;
      }

      await axios.post(
        `${BASE_URL}/provider/location/${selectedLocation}/add-timeslot`,
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

      setMessage("✅ Timeslot Added Successfully");

      setSelectedLocation("");
      setSelectedScreen("");
      setStartTime("");
      setStartPeriod("AM");
      setEndTime("");
      setEndPeriod("AM");
      setMovieName("");
      setLanguage("");

      setTimeout(() => navigate("/provider/dashboard"), 1500);

    } catch (err) {
      setMessage(err.response?.data?.detail || "❌ Error adding timeslot");
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
          onClick={() => navigate(-1)}
          className="mb-4 px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium"
        >
          Back
        </button>

        {/* CARD */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* HEADER */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
            <h2 className="text-2xl font-bold">Add Timeslot</h2>
          </div>

          {/* BODY */}
          <div className="p-6">

            {/* LOCATION */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-3 mb-4 rounded-lg border border-gray-300"
            >
              <option value="">Select Location</option>
              {locations.map((loc, index) => {
                const id = loc.id || loc.location_id;
                return (
                  <option key={id || index} value={id}>
                    {loc.name || loc.location_name}
                  </option>
                );
              })}
            </select>

            {/* SCREEN */}
            <select
              value={selectedScreen}
              onChange={(e) => setSelectedScreen(e.target.value)}
              className="w-full p-3 mb-4 rounded-lg border border-gray-300"
              disabled={!selectedLocation || loadingScreens}
            >
              <option value="">
                {loadingScreens ? "Loading..." : "Select Screen"}
              </option>

              {screens.map((scr) => (
                <option key={scr.id} value={scr.id}>
                  {scr.name}
                </option>
              ))}
            </select>

            {/* TIME */}
            <div className="flex gap-2 mb-4">
              <input
                placeholder="HH:MM"
                value={startTime}
                onChange={(e) =>
                  handleTimeChange(e.target.value, setStartTime)
                }
                className="w-2/3 p-3 rounded-lg border border-gray-300"
              />
              <select
                value={startPeriod}
                onChange={(e) => setStartPeriod(e.target.value)}
                className="w-1/3 p-3 rounded-lg border border-gray-300"
              >
                <option>AM</option>
                <option>PM</option>
              </select>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                placeholder="HH:MM"
                value={endTime}
                onChange={(e) =>
                  handleTimeChange(e.target.value, setEndTime)
                }
                className="w-2/3 p-3 rounded-lg border border-gray-300"
              />
              <select
                value={endPeriod}
                onChange={(e) => setEndPeriod(e.target.value)}
                className="w-1/3 p-3 rounded-lg border border-gray-300"
              >
                <option>AM</option>
                <option>PM</option>
              </select>
            </div>

            {/* MOVIE */}
            <input
              placeholder="Movie Name"
              value={movieName}
              onChange={(e) => setMovieName(e.target.value)}
              className="w-full p-3 mb-4 rounded-lg border border-gray-300"
            />

            {/* LANGUAGE */}
            <input
              placeholder="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-3 mb-6 rounded-lg border border-gray-300"
            />

            {/* SUBMIT */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-3 rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-500 font-semibold"
            >
              Add Timeslot
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}