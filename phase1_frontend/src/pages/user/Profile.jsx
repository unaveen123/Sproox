import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get("/user/booking-history");
        const data = res.data;
        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([...(data?.active || []), ...(data?.completed || []), ...(data?.others || [])]);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || err.message || "Unable to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const backendUrl = "http://127.0.0.1:8000";

  const renderBookingCard = (booking) => {
    return (
      <div key={booking.booking_id || booking.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-slate-900">{booking.movie || booking.workspace || "Theater"}</span>
            <span className="text-sm text-slate-500">{booking.status || "Confirmed"}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-3">
            <div>
              <p className="font-medium text-slate-900">Theater</p>
              <p>{booking.workspace || "-"}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Seat</p>
              <p>{booking.seat || "-"}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Date</p>
              <p>{booking.date || "TBA"}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Time</p>
              <p>{booking.start_time ? `${booking.start_time} - ${booking.end_time || ""}` : "TBA"}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Total</p>
              <p>₹{booking.price || 0}</p>
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
          </div>

          {booking.qr_code_url && (
            <div className="mt-4 rounded-2xl bg-blue-50 p-3">
              <p className="text-sm font-semibold text-blue-900">Ticket QR Code</p>
              <img
                src={`${backendUrl}${booking.qr_code_url}`}
                alt="Booking QR code"
                className="mt-3 h-40 w-40 rounded-lg border border-blue-200"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 overflow-hidden rounded-[2rem] bg-white shadow-xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.85fr] p-8">
            <div className="flex flex-col gap-8">
              <div className="rounded-[1.75rem] bg-slate-50 p-8 shadow-sm">
                <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-white text-5xl font-bold text-slate-800 shadow-sm">
                      {user?.name ? user.name.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Profile</p>
                      <h1 className="mt-3 text-4xl font-bold text-slate-950">{user?.name || user?.username || "User"}</h1>
                      <p className="mt-3 max-w-2xl text-slate-600">
                        {user?.name ? `Welcome back, ${user.name}.` : "Manage your account details and review bookings."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {user?.email && (
                      <div className="rounded-3xl bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
                        <p className="font-semibold text-slate-900">Email</p>
                        <p className="mt-1 break-all">{user.email}</p>
                      </div>
                    )}
                    {user?.role && (
                      <div className="rounded-3xl bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
                        <p className="font-semibold text-slate-900">Role</p>
                        <p className="mt-1 capitalize">{user.role}</p>
                      </div>
                    )}
                    {user?.phone && (
                      <div className="rounded-3xl bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
                        <p className="font-semibold text-slate-900">Phone</p>
                        <p className="mt-1">{user.phone}</p>
                      </div>
                    )}
                    {(user?.verified || user?.is_verified) && (
                      <div className="rounded-3xl bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
                        <p className="font-semibold text-slate-900">Verified</p>
                        <p className="mt-1">True</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-950">Your Bookings</h2>
                <p className="mt-2 text-slate-600">Review all your current and past ticket bookings from here.</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Quick actions</p>
                <button
                  onClick={() => navigate("/bookings")}
                  className="w-full rounded-3xl bg-white px-5 py-4 text-left text-sm font-semibold text-slate-900 hover:bg-slate-100 transition"
                >
                  Bookings
                </button>
                <button className="w-full rounded-3xl bg-white px-5 py-4 text-left text-sm text-slate-900 hover:bg-slate-100 transition">
                  Favorites
                </button>
                <button className="w-full rounded-3xl bg-white px-5 py-4 text-left text-sm text-slate-900 hover:bg-slate-100 transition">
                  Reviews
                </button>
                <button className="w-full rounded-3xl bg-white px-5 py-4 text-left text-sm text-slate-900 hover:bg-slate-100 transition">
                  My Tickets
                </button>
                <button className="w-full rounded-3xl bg-white px-5 py-4 text-left text-sm text-slate-900 hover:bg-slate-100 transition">
                  Wallet
                </button>
                <button className="w-full rounded-3xl bg-white px-5 py-4 text-left text-sm text-slate-900 hover:bg-slate-100 transition">
                  Preferences
                </button>
                <button className="w-full rounded-3xl bg-white px-5 py-4 text-left text-sm text-slate-900 hover:bg-slate-100 transition">
                  Security
                </button>
                <button className="w-full rounded-3xl bg-white px-5 py-4 text-left text-sm text-slate-900 hover:bg-slate-100 transition">
                  Settings
                </button>
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <button className="w-full rounded-3xl bg-white px-5 py-4 text-left text-sm text-red-600 hover:bg-slate-100 transition">
                    Delete Account
                  </button>
                  <button
                    onClick={handleLogout}
                    className="mt-3 w-full rounded-3xl bg-white px-5 py-4 text-left text-sm font-semibold text-red-600 hover:bg-slate-100 transition"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-10 shadow-xl text-center text-slate-600">
            Loading your bookings...
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-10 shadow-xl text-center text-red-600">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 shadow-xl text-center text-slate-600">
            You have no bookings yet. Book a show to see it here.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-3xl bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-semibold mb-4">Your Bookings</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {bookings.map(renderBookingCard)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
