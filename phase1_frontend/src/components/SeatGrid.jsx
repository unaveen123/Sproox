const SeatGrid = ({ seats, selectedSeats, onToggleSeat }) => {
  const categories = seats.reduce((acc, seat) => {
    const categoryName = seat.category || seat.category_name || "General";
    const categoryKey = categoryName.trim() || "General";
    if (!acc[categoryKey]) {
      acc[categoryKey] = {
        name: categoryKey,
        price: seat.price || seat.amount || 0,
        seats: [],
      };
    }
    acc[categoryKey].seats.push(seat);
    return acc;
  }, {});

  const categoryOrder = Object.values(categories).sort((a, b) => b.price - a.price);

  const getStatus = (seat) => {
    const booked = seat.is_booked || seat.status === "booked" || seat.status === "BOOKED" || seat.status === "occupied";
    const seatId = seat.seat_id || seat.id;
    const selected = selectedSeats.some((selected) => {
      const selectedId = selected.seat_id || selected.id;
      return selectedId && seatId && selectedId === seatId;
    });
    return booked ? "booked" : selected ? "selected" : "available";
  };

  const getCategoryStyle = (name) => {
    const normalized = name.toLowerCase();
    if (normalized.includes("diamond") || normalized.includes("gold") || normalized.includes("high")) return "bg-amber-100 text-amber-700";
    if (normalized.includes("silver") || normalized.includes("medium")) return "bg-sky-100 text-sky-700";
    if (normalized.includes("bronze") || normalized.includes("low")) return "bg-emerald-100 text-emerald-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-3 gap-3 text-sm text-slate-600 md:grid-cols-6 mb-6">
        <div className="flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-slate-500" /> Available
        </div>
        <div className="flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-amber-500" /> Selected
        </div>
        <div className="flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-slate-300" /> Booked
        </div>
      </div>

      {categoryOrder.map((category) => {
        const rows = category.seats.reduce((acc, seat) => {
          const rowKey = seat.row || seat.seat_number?.charAt(0) || "A";
          if (!acc[rowKey]) acc[rowKey] = [];
          acc[rowKey].push(seat);
          return acc;
        }, {});

        return (
          <div key={category.name} className="mb-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{category.name}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">₹{category.price}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${getCategoryStyle(category.name)}`}>
                {category.name} seats
              </span>
            </div>

            <div className="overflow-x-auto">
              <div className="inline-grid gap-6 p-2 min-w-full">
                {Object.keys(rows)
                  .sort()
                  .map((rowKey) => (
                    <div key={rowKey} className="space-y-3">
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                        <span className="w-8">{rowKey}</span>
                        <div className="flex-1 border-t border-slate-300" />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {rows[rowKey]
                          .sort((a, b) => (a.seat_number || "").localeCompare(b.seat_number || ""))
                          .map((seat) => {
                            const status = getStatus(seat);
                            const isBooked = status === "booked";
                            const isSelected = status === "selected";

                            return (
                              <button
                                key={seat.seat_id || seat.id || seat.seat_number}
                                type="button"
                                disabled={isBooked}
                                onClick={() => onToggleSeat(seat)}
                                className={`min-w-[56px] rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                                  isBooked
                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                    : isSelected
                                    ? "border-amber-500 bg-amber-500 text-white shadow"
                                    : "border-slate-300 bg-white text-slate-900 hover:border-slate-900 hover:bg-slate-50"
                                }`}
                              >
                                {seat.seat_number || seat.label || "-"}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SeatGrid;
