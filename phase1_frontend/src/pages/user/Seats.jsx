import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import SeatGrid from "../../components/SeatGrid.jsx";

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

const Seats = () => {
  const { id: locationId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const screen = state?.screen;
  const slot = state?.slot;
  const selectedLocation = state?.location;

  const movieName = slot?.movie_name || "Movie";
  const language = slot?.language || "";
  const bookingDate =
    state?.bookingDate ||
    slot?.date ||
    slot?.booking_date ||
    slot?.show_date ||
    slot?.bookingDate ||
    new Date().toISOString().split("T")[0];
  const posterUrl = getPosterUrl(slot, selectedLocation);

  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ================= FETCH SEATS =================
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const res = await api.get(
          `/user/locations/${locationId}/theater-seats`,
          {
            params: {
              slot_id: slot?.slot_id,
              booking_date: bookingDate,
            },
          }
        );

        setSeats(res.data || []);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Unable to load seats."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [locationId, slot, bookingDate]);

  // ================= COUNTS =================
  const selectedSeatIds = useMemo(
    () => selectedSeats.map((seat) => seat.seat_id || seat.id),
    [selectedSeats]
  );

  const availableSeatsCount = useMemo(
    () =>
      seats.filter(
        (seat) =>
          !(
            seat.is_booked ||
            seat.status === "booked" ||
            seat.status === "BOOKED" ||
            seat.status === "occupied"
          )
      ).length,
    [seats]
  );

  const bookedSeatsCount = useMemo(
    () =>
      seats.filter(
        (seat) =>
          seat.is_booked ||
          seat.status === "booked" ||
          seat.status === "BOOKED" ||
          seat.status === "occupied"
      ).length,
    [seats]
  );

  const totalPrice = useMemo(
    () =>
      selectedSeats.reduce(
        (sum, seat) => sum + Number(seat.price || seat.amount || 0),
        0
      ),
    [selectedSeats]
  );

  // ================= TOGGLE SEAT =================
  const toggleSeat = (seat) => {
    const booked =
      seat.is_booked ||
      seat.status === "booked" ||
      seat.status === "BOOKED" ||
      seat.status === "occupied";

    if (booked) return;

    const seatId = seat.seat_id || seat.id;

    const exists = selectedSeats.some((selected) => {
      const selectedId = selected.seat_id || selected.id;
      return selectedId === seatId;
    });

    if (exists) {
      setSelectedSeats(
        selectedSeats.filter((selected) => {
          const selectedId = selected.seat_id || selected.id;
          return selectedId !== seatId;
        })
      );
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // ================= BACK =================
  const handleBack = () => {
    navigate(-1);
  };

  // ================= CONTINUE =================
  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      setError("Select at least one seat to continue.");
      return;
    }

    navigate("/summary", {
      state: {
        location: selectedLocation,
        screen,
        slot,
        bookingDetails: selectedSeats, // ✅ IMPORTANT
        totalPrice,
        bookingDate, // ✅ IMPORTANT
      },
    });
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* HEADER */}
        <div className="mb-8 overflow-hidden rounded-4xl bg-white shadow-xl">
          <div className="grid gap-6 p-8 md:grid-cols-[180px_1fr_auto] md:items-center">
            <div className="col-span-full flex items-center justify-between">
              <button
                onClick={handleBack}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                ← Back
              </button>
            </div>
            <div className="mx-auto flex h-64 w-44 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 md:mx-0">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={movieName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-900 via-red-950 to-slate-800 text-5xl font-black text-white">
                  {movieName.slice(0, 1)}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-500">
                Select Seats
              </p>
              <h1 className="mt-3 text-5xl font-black text-slate-950">
                {movieName}
              </h1>

              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                {language && (
                  <span className="rounded-full border border-slate-200 px-4 py-2 text-slate-700">
                    {language}
                  </span>
                )}
                <span className="rounded-full border border-slate-200 px-4 py-2 text-slate-700">
                  {screen?.name || "Screen"}
                </span>
                <span className="rounded-full border border-slate-200 px-4 py-2 text-slate-700">
                  {slot?.start_time} - {slot?.end_time}
                </span>
                <span className="rounded-full border border-slate-200 px-4 py-2 text-slate-700">
                  {bookingDate}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-300">Selected</p>
              <p className="mt-2 text-4xl font-black">{selectedSeatIds.length}</p>
              <p className="mt-2 text-sm text-slate-300">₹{totalPrice}</p>
            </div>
          </div>
        </div>

        {/* LOADING / ERROR */}
        {loading ? (
          <LoadingSpinner message="Loading seats..." />
        ) : error ? (
          <div className="rounded-3xl bg-white p-10 text-center text-red-600 shadow-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-6">

            {/* STATS */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase text-slate-500">Available</p>
                <p className="mt-3 text-3xl font-semibold">
                  {availableSeatsCount}
                </p>
              </div>

              <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase text-slate-500">Selected</p>
                <p className="mt-3 text-3xl font-semibold text-red-500">
                  {selectedSeatIds.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase text-slate-500">Booked</p>
                <p className="mt-3 text-3xl font-semibold text-gray-400">
                  {bookedSeatsCount}
                </p>
              </div>
            </div>

            {/* SEAT GRID */}
            <SeatGrid
              seats={seats}
              selectedSeats={selectedSeats}
              onToggleSeat={toggleSeat}
            />

            {/* BUTTON */}
            <button
              onClick={handleContinue}
              className="w-full rounded-xl bg-linear-to-r from-red-500 to-pink-600 px-6 py-4 font-bold text-white transition hover:from-red-600 hover:to-pink-700"
            >
              Continue to Confirm & Pay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Seats;
