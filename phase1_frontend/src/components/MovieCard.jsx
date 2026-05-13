const MovieCard = ({ movie, onBook }) => {
  const toImageUrl = (value) => {
    const rawUrl =
      typeof value === "string"
        ? value
        : value?.image_url || value?.poster_url || value?.url || value?.src;

    if (!rawUrl) return null;
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

    return `http://127.0.0.1:8000/${rawUrl.replace(/\\/g, "/").replace(/^\/+/, "")}`;
  };

  const poster = toImageUrl(movie.poster_url || movie.poster || movie.image_url || movie.thumbnail);
  const title = movie.title || movie.name || movie.movie_name || "Untitled";
  const rating = movie.rating || movie.score || movie.movie_rating;
  const duration = movie.duration || movie.runtime || movie.show_length;
  const movies = Array.isArray(movie.movie_names) ? movie.movie_names.filter(Boolean) : [];
  const city = movie.city || "City";
  const description =
    movie.description ||
    movie.synopsis ||
    "Premium cinema experience with comfortable screens and fresh showtimes.";

  return (
    <article
      onClick={() => onBook(movie)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-72 overflow-hidden bg-slate-900">
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-800 text-5xl font-black text-white">
            {title.slice(0, 1)}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900">
            {movie.show_count || 0} Shows
          </span>
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
            Available
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-200">{city}</p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-sm text-slate-500 line-clamp-2">{description}</p>
          {movies.length > 0 && (
            <p className="mt-3 text-sm font-semibold text-slate-900 line-clamp-1">
              Now showing: {movies.slice(0, 2).join(", ")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          {rating && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
              Star {rating}
            </span>
          )}
          {duration && <span className="rounded-full bg-slate-100 px-3 py-1">{duration} mins</span>}
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">AC</span>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">Online booking</span>
        </div>

        <button
          onClick={() => onBook(movie)}
          className="w-full rounded-xl bg-gradient-to-r from-red-500 to-pink-600 px-5 py-3 text-sm font-bold text-white transition hover:from-red-600 hover:to-pink-700"
        >
          View Shows & Book
        </button>
      </div>
    </article>
  );
};

export default MovieCard;
