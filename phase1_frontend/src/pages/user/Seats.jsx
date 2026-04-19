import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import SeatGrid from "../../components/SeatGrid.jsx";

const Seats = () => {
  const { id: locationId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const screen = state?.screen;
  const slot = state?.slot;
  const selectedLocation = state?.location;

  // ✅ FIXED MOVIE DATA (IMPORTANT)
  const movieName = slot?.movie_name || "Movie";
  const language = slot?.language || "";

  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const bookingDate = new Date().toISOString().split("T")[0];

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
  }, [locationId, slot]);

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
        selectedSeats,
        totalPrice,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* 🔥 HEADER FIXED */}
        <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Seat Selection
              </p>

              {/* 🎬 MOVIE NAME */}
              <h1 className="mt-3 text-4xl font-semibold text-slate-950">
                {movieName}
              </h1>

              {/* 🌐 LANGUAGE */}
              {language && (
                <p className="mt-2 text-sm text-slate-500">
                  Language: {language}
                </p>
              )}

              {/* 🎥 SCREEN + TIME */}
              <p className="mt-2 text-slate-600">
                {screen?.name || "Screen"} •{" "}
                {slot?.start_time} - {slot?.end_time}
              </p>

              {/* 🏢 THEATER NAME (OPTIONAL) */}
              {selectedLocation?.name && (
                <p className="mt-1 text-sm text-gray-400">
                  {selectedLocation.name}
                </p>
              )}
            </div>

            <button
              onClick={() => navigate(-1)}
              className="rounded-full border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Back to screenings
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading seats..." />
        ) : error ? (
          <div className="rounded-3xl bg-white p-10 text-center text-red-600 shadow-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Screen Layout
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Select your seats, then continue to the next page.
              </p>
              <div className="mt-4 h-3 rounded-full bg-slate-300"></div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase text-slate-500">Available</p>
                <p className="mt-3 text-3xl font-semibold">
                  {availableSeatsCount}
                </p>
              </div>

              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase text-slate-500">Selected</p>
                <p className="mt-3 text-3xl font-semibold text-amber-600">
                  {selectedSeatIds.length}
                </p>
              </div>

              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <p className="text-xs uppercase text-slate-500">Booked</p>
                <p className="mt-3 text-3xl font-semibold text-gray-400">
                  {bookedSeatsCount}
                </p>
              </div>
            </div>

            <SeatGrid
              seats={seats}
              selectedSeats={selectedSeats}
              onToggleSeat={toggleSeat}
            />

            <button
              onClick={handleContinue}
              className="w-full rounded-3xl bg-emerald-600 px-6 py-4 text-white"
            >
              Continue to booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Seats;