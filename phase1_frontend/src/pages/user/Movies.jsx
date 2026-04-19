import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import MovieCard from "../../components/MovieCard.jsx";

const Movies = () => {
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get("/user/locations");
        setLocations(res.data || []);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Unable to load locations.");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const filteredLocations = locations.filter((location) => {
    const title = location.name || location.location_name || "";
    const searchText = `${title} ${location.city || ""} ${location.address || ""}`;
    return searchText.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-4xl font-bold">Browse Theaters</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-200">
            Find cinemas near you, select a showtime and book the best seats.
          </p>
          <div className="mt-8 max-w-xl">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search theaters, city, or address..."
              className="w-full rounded-3xl border border-slate-600 bg-slate-900/70 px-5 py-4 text-white placeholder-slate-400 shadow-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300/20"
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {loading ? (
          <LoadingSpinner message="Loading theaters..." />
        ) : error ? (
          <div className="rounded-3xl bg-white p-10 text-center text-red-600 shadow-sm">{error}</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2">
            {filteredLocations.map((location) => (
              <MovieCard
                key={location.location_id || location.id}
                movie={location}
                onBook={() => navigate(`/shows/${location.location_id}`, { state: { location } })}
              />
            ))}
          </div>
        )}

        {!loading && filteredLocations.length === 0 && (
          <div className="mt-10 rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
            No theaters found for "{search}".
          </div>
        )}
      </main>
    </div>
  );
};

export default Movies;
