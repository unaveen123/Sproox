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

  const movieMap = new Map();

  locations.forEach((location) => {
    const movieNames = Array.isArray(location.movie_names) ? location.movie_names.filter(Boolean) : [];
    const poster = location.poster_url || location.image_url || location.poster;
    const posterMap = new Map(
      Array.isArray(location.movie_posters)
        ? location.movie_posters.map((item) => [String(item.movie_name || "").trim().toLowerCase(), item.image_url])
        : []
    );

    movieNames.forEach((name) => {
      const title = String(name || "").trim();
      const key = title.toLowerCase();
      if (!key) return;
      const moviePoster = posterMap.get(key) || poster;

      if (!movieMap.has(key)) {
        movieMap.set(key, {
          key,
          title,
          poster_url: moviePoster,
          showCount: 1,
          theaterCount: 1,
          city: location.city,
          subtitle: `${location.name}, ${location.city}`,
          locationId: location.location_id,
          locationName: location.name,
          locations: [location],
        });
      } else {
        const existing = movieMap.get(key);
        existing.showCount += 1;

        const theaterIds = new Set(existing.locations.map((item) => item.location_id));
        if (!theaterIds.has(location.location_id)) {
          existing.theaterCount += 1;
          existing.locations.push(location);
        }

        if (!existing.poster_url && moviePoster) {
          existing.poster_url = moviePoster;
        }
      }
    });
  });

  const movies = Array.from(movieMap.values());

  const filteredLocations = movies.filter((movie) => {
    const searchText = `${movie.title} ${movie.subtitle || ""}`;
    return searchText.toLowerCase().includes(search.toLowerCase());
  });

  const movieCount = movies.length;

  return (
    <div className="min-h-screen bg-slate-100">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-red-300">
              Sproox Movies
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight">
              Find your cinema. Pick a show. Book the best seats.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              Browse nearby theaters, compare show availability, and continue straight to seat selection.
            </p>

            <div className="mt-8 max-w-2xl">
              <p className="text-lg text-slate-300">Browse nearby theaters, compare show availability, and continue straight to seat selection.</p>
            </div>
          </div>

    <div className="hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-red-500 via-slate-900 to-slate-950 p-8 shadow-2xl lg:block">
      <p className="text-sm uppercase tracking-[0.35em] text-red-100">Now Playing</p>
      <h2 className="mt-3 text-3xl font-bold">Browse by movie</h2>
      <p className="mt-4 text-slate-300">Tap a movie to view screens, showtimes, and book your seat in just a few steps.</p>
    </div>
  </div>
</section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="-mt-16 mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
          <div className="grid gap-4 lg:grid-cols-1 lg:items-end">
            <label className="block">
              <span className="text-sm font-bold text-slate-900">Search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by theater or address"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </label>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading theaters..." />
        ) : error ? (
          <div className="rounded-3xl bg-white p-10 text-center text-red-600 shadow-sm">{error}</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2">
            {filteredLocations.map((movie) => (
              <MovieCard
                key={movie.key}
                movie={{
                  ...movie,
                  city: movie.subtitle,
                  show_count: movie.showCount,
                }}
                onBook={() =>
                  navigate(`/shows/${movie.locationId}`, {
                    state: {
                      location: movie.locations[0],
                      movieName: movie.title || movie.key,
                      movieTitle: movie.title || movie.key,
                      moviePoster: movie.poster_url,
                      movieLocations: movie.locations,
                    },
                  })
                }
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
