import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

const ShowTimings = () => {
  const { movieId } = useParams();
  const { state } = useLocation();
  const movie = state?.movie;
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShows = async () => {
      try {
        const res = await api.get("/shows", { params: { movie_id: movieId } });
        setShows(res.data || []);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Unable to load show timings.");
      } finally {
        setLoading(false);
      }
    };

    fetchShows();
  }, [movieId]);

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Now Showing</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-950">{movie?.title || movie?.name || "Select a show"}</h1>
              <p className="mt-2 text-slate-600">Choose the theater, date and a showtime that fits your schedule.</p>
            </div>
            <button
              onClick={() => navigate("/movies")}
              className="rounded-full border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Back to Movies
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading show times..." />
        ) : error ? (
          <div className="rounded-3xl bg-white p-10 text-center text-red-600 shadow-sm">{error}</div>
        ) : shows.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-slate-600 shadow-sm">No showtimes available yet.</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {shows.map((show) => {
              const showId = show.show_id || show.id || show._id;
              const title = show.theater_name || show.venue || show.location || "Theater";
              const startTime = show.start_time || show.time || show.show_time || "TBA";
              const endTime = show.end_time || show.end || "";

              return (
                <div key={showId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
                      <p className="mt-2 text-sm text-slate-500">{show.city || show.address || "City theater"}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">{show.available_seats || show.seat_count || "Seats"}</span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Show</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{startTime}{endTime ? ` - ${endTime}` : ""}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Price</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">₹{show.price || show.ticket_price || "199"}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate(`/seats/${showId}`, { state: { movie, show } })}
                      className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Select Seats
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowTimings;
