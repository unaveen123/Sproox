const MovieCard = ({ movie, onBook }) => {
  const poster = movie.poster || movie.image_url || movie.thumbnail || "https://via.placeholder.com/420x620?text=Movie";
  const title = movie.title || movie.name || movie.movie_name || "Untitled";
  const rating = movie.rating || movie.score || movie.movie_rating;
  const duration = movie.duration || movie.runtime || movie.show_length;

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden">
        <img src={poster} alt={title} className="h-80 w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500 line-clamp-2">{movie.description || movie.synopsis || "A great movie experience awaits."}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          {rating && <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">⭐ {rating}</span>}
          {duration && <span className="rounded-full bg-slate-100 px-3 py-1">{duration} mins</span>}
        </div>

        <button
          onClick={() => onBook(movie)}
          className="w-full rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Book Now
        </button>
      </div>
    </article>
  );
};

export default MovieCard;
