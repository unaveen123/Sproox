import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const LocationDetails = () => {
  const { id: locationId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const selectedLocation = state?.location;

  const [screens, setScreens] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedScreen, setSelectedScreen] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [screensRes, timeslotsRes] = await Promise.all([
          api.get(`/user/locations/${locationId}/screens`),
          api.get(`/user/locations/${locationId}/timeslots`),
        ]);

        setScreens(screensRes.data || []);
        setTimeslots(timeslotsRes.data || []);
      } catch (err) {
        console.error("Error loading location details:", err);
        setError(err.response?.data?.detail || err.message || "Unable to load screens and timeslots.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm text-slate-700">
          Loading screens and showtimes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="rounded-3xl border border-red-200 bg-rose-50 p-10 shadow-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const normalizeScreenIdentifier = (value) => {
    if (value === undefined || value === null) return "";
    const str = String(value).trim().toLowerCase();
    return str
      .replace(/^screen\s*/i, "")
      .replace(/[^a-z0-9]/gi, "")
      .replace(/\s+/g, "");
  };

  const isScreenMatch = (slot, screen) => {
    const slotId = normalizeScreenIdentifier(slot.screen_id);
    const slotName = normalizeScreenIdentifier(slot.screen);
    const screenId = normalizeScreenIdentifier(screen.id);
    const screenName = normalizeScreenIdentifier(screen.name);

    if (!screenId && !screenName) return false;
    if (!slotId && !slotName) return false;

    return (
      (slotId && (slotId === screenId || slotId === screenName)) ||
      (slotName && (slotName === screenId || slotName === screenName)) ||
      (screenId && slotId && slotId.endsWith(screenId)) ||
      (screenName && slotName && slotName.endsWith(screenName))
    );
  };

  const filteredTimeslots = selectedScreen
    ? timeslots.filter((slot) => isScreenMatch(slot, selectedScreen))
    : [];

  // ✅ SCREEN SELECT
  const handleScreenSelect = (screen) => {
    setSelectedScreen(screen);
    setSelectedSlot(null); // reset slot when screen changes
  };

  // ✅ SLOT SELECT (ONLY ONE)
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  // ✅ CONTINUE
  const handleContinue = () => {
    if (!selectedScreen) {
      alert("Please select a screen");
      return;
    }

    if (!selectedSlot) {
      alert("Please select a time slot");
      return;
    }

    const normalize = (value) => {
      if (value === undefined || value === null) return "";
      return String(value)
        .trim()
        .toLowerCase()
        .replace(/^screen\s*/i, "")
        .replace(/[^a-z0-9]/gi, "")
        .replace(/\s+/g, "");
    };

    const slotId = normalize(selectedSlot.screen_id);
    const slotName = normalize(selectedSlot.screen);
    const selectedId = normalize(selectedScreen.id);
    const selectedName = normalize(selectedScreen.name);

    const isSlotMatch =
      (slotId && (slotId === selectedId || slotId === selectedName)) ||
      (slotName && (slotName === selectedId || slotName === selectedName)) ||
      (slotId && selectedId && slotId.endsWith(selectedId)) ||
      (slotName && selectedName && slotName.endsWith(selectedName));

    if (selectedSlot.screen_id && !isSlotMatch) {
      alert(
        "The selected time slot does not belong to the selected screen. Please choose a matching slot."
      );
      return;
    }

    navigate(`/seats/${locationId}`, {
      state: {
        location: selectedLocation,
        movie: selectedLocation,
        show: selectedLocation,
        screen_id: selectedScreen.id,
        slot_id: selectedSlot.slot_id,
        screen: selectedScreen,
        slot: selectedSlot,
        slots: filteredTimeslots,
      },
    });
  };

  const slotMovieTitle = selectedSlot?.movie_name || selectedSlot?.title || selectedSlot?.name || selectedSlot?.show_name;
  const slotLanguage = selectedSlot?.language || selectedSlot?.lang || selectedSlot?.language_name;
  const locationMovieTitle = selectedLocation?.movie_name || selectedLocation?.title || selectedLocation?.name;
  const locationLanguage = selectedLocation?.language || selectedLocation?.lang || selectedLocation?.language_name;
  const movieTitle = slotMovieTitle || locationMovieTitle || "Select a show";
  const movieLanguage = slotLanguage || locationLanguage;
  const subtitle = slotMovieTitle ? "Selected show details" : "Choose a screen and time to see movie details";

  return (
    <div className="p-6">
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold">{movieTitle}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        {movieLanguage && (
          <p className="mt-2 text-sm text-slate-500">Language: {movieLanguage}</p>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-6">Select Screen & Time</h1>

      {/* ================= SCREENS ================= */}
      <h2 className="text-lg font-semibold mb-2">Screens</h2>

      {screens.length === 0 ? (
        <p className="text-red-500">❌ No screens available</p>
      ) : (
        <div className="flex flex-wrap gap-3 mb-6">
          {screens.map((screen) => (
            <button
              key={screen.id}
              onClick={() => handleScreenSelect(screen)}
              className={`px-4 py-2 border rounded ${
                selectedScreen?.id === screen.id
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              {screen.name}
            </button>
          ))}
        </div>
      )}

      {/* ================= TIMESLOTS ================= */}
      <h2 className="text-lg font-semibold mb-2">Time Slots</h2>

      {!selectedScreen ? (
        <p className="text-gray-500">Select a screen first to view matching time slots.</p>
      ) : filteredTimeslots.length === 0 ? (
        <p className="text-red-500">
          No time slots available for {selectedScreen.name}.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {filteredTimeslots.map((slot) => (
            <button
              key={slot.slot_id}
              onClick={() => handleSlotSelect(slot)}
              className={`px-4 py-2 border rounded ${
                selectedSlot?.slot_id === slot.slot_id
                  ? "bg-green-500 text-white"
                  : "bg-white"
              }`}
            >
              {slot.start_time} - {slot.end_time}
              {slot.screen && slot.screen_id && (
                <span className="ml-2 text-xs text-slate-500">
                  ({slot.screen})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ================= BUTTON ================= */}
      <button
        onClick={handleContinue}
        className="mt-6 bg-linear-to-r from-blue-500 to-teal-500 text-white px-6 py-2 rounded-lg"
      >
        Continue to Seats
      </button>
    </div>
  );
};

export default LocationDetails;