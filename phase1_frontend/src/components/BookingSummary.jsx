const BookingSummary = ({ show, selectedSeats, totalPrice }) => {
  const seatLabels = selectedSeats.map((seat) => seat.seat_number || seat.label || seat.seat_id).join(", ");

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Booking Summary</p>
        <h2 className="text-2xl font-semibold text-slate-900">{show.movie_title || show.name || show.movie || "Selected Show"}</h2>
        <p className="text-sm text-slate-600">{show.theater_name || show.venue || show.location || "Theater details"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Date & Time</p>
          <p className="mt-2 text-base font-medium text-slate-900">{show.datetime || `${show.start_time || ""} - ${show.end_time || ""}`}</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Total Seats</p>
          <p className="mt-2 text-base font-medium text-slate-900">{selectedSeats.length}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-slate-950 p-5 text-white">
        <p className="text-sm text-slate-300">Seats</p>
        <p className="mt-2 text-lg font-semibold">{seatLabels || "No seats selected"}</p>
        <p className="mt-4 text-sm text-slate-300">Total Price</p>
        <p className="mt-1 text-3xl font-bold">₹{totalPrice}</p>
      </div>
    </div>
  );
};

export default BookingSummary;
