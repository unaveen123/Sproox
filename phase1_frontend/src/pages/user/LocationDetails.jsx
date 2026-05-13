import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const API_BASE_URL = api.defaults.baseURL || "http://127.0.0.1:8000";

const normalizeImageUrl = (value) => {
  const rawUrl =
    typeof value === "string"
      ? value
      : value?.image_url || value?.url || value?.poster_url || value?.src;

  if (!rawUrl) return null;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  const cleanedPath = rawUrl.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE_URL}/${cleanedPath}`;
};

const getPosterUrl = (slot, location) => {
  const posterCandidates = [
    slot?.poster_url,
    slot?.image_url,
    slot?.poster,
    slot?.thumbnail,
    Array.isArray(slot?.images) ? slot.images[0] : slot?.images,
    Array.isArray(slot?.movie_images) ? slot.movie_images[0] : slot?.movie_images,
    location?.poster_url,
    location?.image_url,
    location?.poster,
    Array.isArray(location?.images) ? location.images[0] : location?.images,
  ];

  return posterCandidates.map(normalizeImageUrl).find(Boolean);
};

const LocationDetails = () => {
  const { id: locationId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState(state?.location || null);

  const [screens, setScreens] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [movieCast, setMovieCast] = useState([]);
  const [movieCrew, setMovieCrew] = useState([]);
  const [castLoading, setCastLoading] = useState(false);
  const [castError, setCastError] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedScreen, setSelectedScreen] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(state?.language || "");

  const selectedMovieName = state?.movieName || state?.movieTitle;
  const selectedMoviePoster = state?.moviePoster;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ If location not in state, fetch it from API
        if (!selectedLocation) {
          const locRes = await api.get(`/user/locations`);
          const allLocations = locRes.data || [];
          const matchedLocation = allLocations.find(loc => loc.location_id === locationId);
          if (matchedLocation) {
            setSelectedLocation(matchedLocation);
          }
        }

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
  }, [locationId, selectedLocation]);

  useEffect(() => {
    const fetchMovieMembers = async () => {
      if (!selectedMovieName || !selectedLocation) {
        setMovieCast([]);
        setMovieCrew([]);
        return;
      }

      setCastLoading(true);
      setCastError(null);

      try {
        const res = await api.get(
          `/user/locations/${locationId}/movie-cast`,
          {
            params: {
              movie_name: selectedMovieName,
            },
          }
        );

        setMovieCast(res.data.cast || []);
        setMovieCrew(res.data.crew || []);
      } catch (err) {
        console.error("Movie cast fetch error:", err);
        setCastError(err.response?.data?.detail || "Unable to load movie cast and crew.");
      } finally {
        setCastLoading(false);
      }
    };

    fetchMovieMembers();
  }, [locationId, selectedLocation, selectedMovieName]);

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

  const getScreenNumber = (screen) => {
    const match = String(screen?.name || screen?.id || "").match(/\d+/);
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
  };

  const getScreenLabel = (screen) => {
    const screenNumber = getScreenNumber(screen);
    return Number.isFinite(screenNumber) && screenNumber !== Number.MAX_SAFE_INTEGER
      ? `Screen ${screenNumber}`
      : screen?.name || "Screen";
  };

  const parseShowTime = (value) => {
    const match = String(value || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return Number.MAX_SAFE_INTEGER;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3]?.toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const movieFilteredTimeslots = selectedMovieName
    ? timeslots.filter(
        (slot) =>
          String(slot.movie_name || "").trim().toLowerCase() ===
          String(selectedMovieName).trim().toLowerCase()
      )
    : timeslots;

  const availableLanguages = Array.from(
    new Set(
      movieFilteredTimeslots
        .map((slot) => String(slot.language || slot.lang || slot.language_name || "").trim())
        .filter(Boolean)
    )
  );

  const languageFilteredTimeslots = selectedLanguage
    ? movieFilteredTimeslots.filter(
        (slot) =>
          String(slot.language || slot.lang || slot.language_name || "").trim().toLowerCase() ===
          String(selectedLanguage).trim().toLowerCase()
      )
    : movieFilteredTimeslots;

  const visibleTimeslots = selectedLanguage || availableLanguages.length <= 1
    ? languageFilteredTimeslots
    : [];

  const shouldShowScreenTime = availableLanguages.length <= 1 || Boolean(selectedLanguage);

  const screenRows = Object.values(
    screens.reduce((acc, screen) => {
      const label = getScreenLabel(screen);
      const key = normalizeScreenIdentifier(label);

      if (!acc[key]) {
        acc[key] = {
          key,
          label,
          order: getScreenNumber(screen),
          screens: [],
        };
      }

      acc[key].screens.push(screen);
      return acc;
    }, {})
  )
    .map((row) => ({
      ...row,
      slots: visibleTimeslots
        .filter((slot) => row.screens.some((screen) => isScreenMatch(slot, screen)))
        .sort((a, b) => parseShowTime(a.start_time) - parseShowTime(b.start_time)),
    }))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));

  const filteredTimeslots = selectedScreen
    ? visibleTimeslots.filter((slot) => isScreenMatch(slot, selectedScreen))
    : [];

  const visibleScreenRows = selectedMovieName
    ? screenRows.filter((row) => row.slots.length > 0)
    : screenRows;

  // ✅ SCREEN SELECT
  const handleScreenSelect = (screen) => {
    setSelectedScreen(screen);
    setSelectedSlot(null); // reset slot when screen changes
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setSelectedScreen(null);
    setSelectedSlot(null);
  };

  // ✅ SLOT SELECT (ONLY ONE)
  const handleSlotSelect = (slot, screen = selectedScreen) => {
    if (screen) {
      setSelectedScreen(screen);
    }
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
        language: selectedLanguage || movieLanguage,
        slots: filteredTimeslots,
      },
    });
  };

  const previewSlot = selectedSlot || visibleTimeslots[0] || timeslots[0];
  const slotMovieTitle = previewSlot?.movie_name || previewSlot?.title || previewSlot?.name || previewSlot?.show_name;
  const slotLanguage = previewSlot?.language || previewSlot?.lang || previewSlot?.language_name;
  const locationMovieTitle = selectedMovieName || selectedLocation?.movie_name || selectedLocation?.title || selectedLocation?.name;
  const locationLanguage = selectedLocation?.language || selectedLocation?.lang || selectedLocation?.language_name;
  const movieTitle = selectedMovieName || slotMovieTitle || locationMovieTitle || "Select a show";
  const movieLanguage = selectedLanguage || slotLanguage || locationLanguage;
  const subtitle = selectedSlot
    ? "Selected show details"
    : previewSlot
    ? `Showing ${selectedMovieName ? selectedMovieName : "the first available movie"}`
    : "Choose a screen and time to see movie details";
  const posterUrl = normalizeImageUrl(selectedMoviePoster) || getPosterUrl(previewSlot, selectedLocation);

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        ← Back
      </button>

      <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 md:grid-cols-[160px_1fr] md:items-center">
          <div className="mx-auto flex h-56 w-40 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 md:mx-0">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={movieTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                🎭
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-red-500">
              Now Showing
            </p>
            <h1 className="mt-3 text-4xl font-bold text-slate-950">{movieTitle}</h1>
            <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
            {movieLanguage && (
              <p className="mt-3 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                {movieLanguage}
              </p>
            )}
            {selectedLocation?.name && (
              <p className="mt-4 text-slate-600">{selectedLocation.name}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Cast</h2>
            <p className="mt-2 text-sm text-slate-500">Meet the actors for this movie.</p>
          </div>
          <div className="text-right">
            {castLoading && <p className="text-sm text-slate-500">Loading cast...</p>}
            {castError && <p className="text-sm text-red-500">{castError}</p>}
          </div>
        </div>

        <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {movieCast.length > 0 ? (
            movieCast.map((member) => (
              <div key={`cast-${member.id}`} className="min-w-[200px] rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center shadow-sm">
                <div className="mx-auto mb-4 h-40 w-40 overflow-hidden rounded-[2rem] bg-white">
                  <img
                    src={normalizeImageUrl(member.photo_url)}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-lg font-semibold text-slate-900">{member.name}</p>
                <p className="mt-2 text-sm text-slate-500">{member.role}</p>
              </div>
            ))
          ) : (
            <div className="min-w-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-500">No cast information available yet.</p>
            </div>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">Crew</h2>
          <p className="mt-2 text-sm text-slate-500">See the team behind the movie.</p>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
            {movieCrew.length > 0 ? (
              movieCrew.map((member) => (
                <div key={`crew-${member.id}`} className="min-w-[200px] rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center shadow-sm">
                  <div className="mx-auto mb-4 h-40 w-40 overflow-hidden rounded-[2rem] bg-white">
                    <img
                      src={normalizeImageUrl(member.photo_url)}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{member.name}</p>
                  <p className="mt-2 text-sm text-slate-500">{member.role}</p>
                </div>
              ))
            ) : (
              <div className="min-w-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">No crew information available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-6">Select Screen & Time</h1>

      {availableLanguages.length > 1 && !selectedLanguage ? (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-lg font-semibold text-slate-900">Choose a language for this movie</p>
          <div className="flex flex-wrap gap-3">
            {availableLanguages.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => handleLanguageSelect(language)}
                className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
                  selectedLanguage === language
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {language}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Select a language to view screens and showtimes for this movie.
          </p>
        </div>
      ) : shouldShowScreenTime && visibleScreenRows.length === 0 ? (
        <p className="text-red-500">❌ No screens available</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {visibleScreenRows.map((row) => {
            const representativeScreen = row.screens[0];
            const rowSelected = row.screens.some((screen) => selectedScreen?.id === screen.id);

            return (
              <div
                key={row.key}
                className={`grid gap-4 border-b border-slate-200 p-5 last:border-b-0 md:grid-cols-[220px_1fr] ${
                  rowSelected ? "bg-red-50" : "bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleScreenSelect(representativeScreen)}
                  className="text-left"
                >
                  <p className="text-lg font-bold text-slate-900">{row.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">
                    Screen ID
                  </p>
                </button>

                {row.slots.length === 0 ? (
                  <p className="text-sm text-slate-500">No time slots available.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {row.slots.map((slot) => {
                      const slotScreen =
                        row.screens.find((screen) => isScreenMatch(slot, screen)) ||
                        representativeScreen;
                      const selected = selectedSlot?.slot_id === slot.slot_id;

                      return (
                        <button
                          key={slot.slot_id}
                          type="button"
                          onClick={() => handleSlotSelect(slot, slotScreen)}
                          className={`min-w-[132px] rounded border px-4 py-3 text-center transition ${
                            selected
                              ? "border-red-500 bg-red-500 text-white shadow"
                              : "border-red-300 bg-white text-slate-800 hover:bg-red-50"
                          }`}
                        >
                          <span className="block text-sm font-bold">
                            {slot.start_time}
                          </span>
                          <span className={`mt-1 block text-[11px] uppercase ${
                            selected ? "text-red-50" : "text-slate-500"
                          }`}>
                            {slot.language || "Show"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= BUTTON ================= */}
      <button
        onClick={handleContinue}
        disabled={!selectedSlot}
        className={`mt-6 px-6 py-2 rounded-lg text-white ${
          selectedSlot
            ? "bg-gradient-to-r from-red-500 to-pink-600"
            : "cursor-not-allowed bg-slate-300"
        }`}
      >
        Continue to Seats
      </button>
    </div>
  );
};

export default LocationDetails;
