import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get("/user/booking-history");
        const data = res.data || {};
        
        // Backend returns { active, completed, others }
        if (data.active || data.completed || data.others) {
          const allBookings = [
            ...(data.active || []),
            ...(data.completed || []),
            ...(data.others || [])
          ];
          setBookings(allBookings);
        } else if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([]);
        }
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Unable to load bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Your bookings</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-950">Booking History</h1>
              <p className="mt-2 text-slate-600">View all of your completed and upcoming tickets.</p>
            </div>
            <button
              onClick={() => navigate("/movies")}
              className="rounded-full border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Browse theaters
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading bookings..." />
        ) : error ? (
          <div className="rounded-3xl bg-white p-10 text-center text-red-600 shadow-sm">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-slate-600 shadow-sm">You have no bookings yet.</div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              return (
                <div key={booking.booking_id || booking.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{booking.movie || booking.workspace || "Theater"}</h2>
                      <p className="mt-1 text-sm text-slate-500">{booking.date || "Date not available"}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{booking.status || "Confirmed"}</span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-sm text-slate-600">
                    <div>
                      <p className="font-medium text-slate-900">Theater</p>
                      <p>{booking.workspace || "-"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Time</p>
                      <p>{booking.start_time ? `${booking.start_time} - ${booking.end_time || ""}` : "-"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Seat</p>
                      <p>{booking.seat || "-"}</p>
                    </div>
                    {booking.language && (
                      <div>
                        <p className="font-medium text-slate-900">Language</p>
                        <p>{booking.language}</p>
                      </div>
                    )}
                    {booking.screen && (
                      <div>
                        <p className="font-medium text-slate-900">Screen</p>
                        <p>{booking.screen}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">Total</p>
                      <p>₹{booking.price || "-"}</p>
                    </div>
                  </div>

                  {booking.qr_code_url && (
                    <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm font-semibold text-blue-900">Ticket QR Code</p>
                      <img
                        src={`http://127.0.0.1:8000${booking.qr_code_url}`}
                        alt="Booking QR"
                        className="mt-3 h-32 w-32 rounded-lg border border-blue-200"
                      />
                    </div>
                  )}

                  {booking.status?.toLowerCase() === "pending" && (
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => navigate("/payment", {
                          state: {
                            bookingDetails: [
                              {
                                booking_id: booking.booking_id,
                                seat_label: booking.seat || "Seat",
                                price: booking.price || 0,
                              },
                            ],
                            slot: {
                              start_time: booking.start_time,
                              end_time: booking.end_time,
                            },
                            screen: { name: booking.screen },
                            totalPrice: booking.price || 0,
                            bookingDate: booking.date,
                          },
                        })}
                        className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
                      >
                        Pay now
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
