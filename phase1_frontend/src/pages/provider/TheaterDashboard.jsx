import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUserCircle,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUsers,
  FaTimesCircle,
} from "react-icons/fa";

const safeDate = (value) => {
  if (!value) return null;
  const [datePart] = value.toString().split("T");
  const parts = datePart.split("-").map(Number);

  if (parts.length === 3 && parts.every(Boolean)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export default function TheaterDashboard() {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const [user, setUser] = useState(null);
  const [theaterName, setTheaterName] = useState("My Theater");

  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    cancelled: 0,
    revenue: 0,
    occupancy: "0%",
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const token = localStorage.getItem("token");

  // 🔥 FETCH USER
  const fetchUser = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(res.data);
    } catch (err) {
      console.log("User Error:", err);
    }
  };

  // 🔥 FETCH DASHBOARD
  const fetchDashboard = async () => {
    setLastUpdated(new Date().toISOString());

    try {
      const locRes = await axios.get(
        "http://127.0.0.1:8000/provider/location/my-locations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const locations = locRes.data;

      if (locations.length > 0) {
        setTheaterName(
          locations.length === 1
            ? locations[0].name || locations[0].location_name || "My Theater"
            : "All Theaters"
        );

        const bookingResponses = await Promise.allSettled(
          locations
            .map((location) => location.id || location.location_id)
            .filter(Boolean)
            .map((locationId) =>
              axios.get(
                `http://127.0.0.1:8000/provider/location-bookings/${locationId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              )
            )
        );

        const bookings = bookingResponses.flatMap((response) =>
          response.status === "fulfilled" ? response.value.data || [] : []
        );

        const todayDate = getTodayStart();

        const todayDateString = getTodayStart().toISOString().slice(0, 10);

        const bookingsWithDates = bookings.map((b) => {
          const rawDate = String(b.date || "").split("T")[0];
          return {
            ...b,
            status: (b.status || "").toLowerCase(),
            rawDate,
            _date: safeDate(rawDate) || safeDate(b.date),
          };
        });

        const paidBookings = bookingsWithDates.filter(
          (b) => b.status === "confirmed"
        );
        const total = bookingsWithDates.length;
        const cancelled = bookingsWithDates.filter(
          (b) => b.status === "cancelled"
        ).length;

        const today = bookingsWithDates.filter((b) => {
          return b.rawDate === todayDateString;
        }).length;

        const revenue = paidBookings.reduce(
          (sum, b) => sum + Number(b.price || b.amount || 0),
          0
        );

        const sortedBookings = bookingsWithDates.sort((a, b) => {
          const dateA = a._date ? a._date.getTime() : 0;
          const dateB = b._date ? b._date.getTime() : 0;
          if (dateA !== dateB) return dateB - dateA;
          return (b.start_time || "").localeCompare(a.start_time || "");
        });

        setRecentBookings(sortedBookings.slice(0, 3));
        setLastUpdated(new Date().toISOString());

        setStats({
          totalBookings: total,
          todayBookings: today,
          cancelled: cancelled,
          revenue: revenue,
          occupancy:
            total > 0
              ? ((paidBookings.length / total) * 100).toFixed(2) + "%"
              : "0%",
        });
      }
    } catch (err) {
      console.error("Dashboard Error:", err.message);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchDashboard();

    const interval = setInterval(fetchDashboard, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="bg-linear-to-r from-purple-600 to-pink-500 px-6 py-4 flex flex-col gap-3 shadow md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">
            🎬 Theater Dashboard
          </h1>
          <p className="text-sm text-white/80 mt-1">
            Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Loading..."} · Auto refresh every 2 seconds
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-white"
          >
            <FaUserCircle />
            {user ? user.name : "Profile"}
          </button>

          {showProfile && user && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-xl p-5 z-50">
              <div className="flex items-center gap-3 mb-3">
                <FaUserCircle className="text-purple-600 text-4xl" />
                <div>
                  <p className="font-semibold text-lg">{user.name}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>

              <div className="text-sm space-y-2">
                <p><b>Email:</b> {user.email}</p>
                <p><b>Phone:</b> {user.phone}</p>
                <p><b>Role:</b> {user.role}</p>
              </div>

              <div className="mt-3 text-green-600 text-sm font-medium">
                👋 Welcome {user.name}
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/login");
                }}
                className="mt-4 text-red-500 text-sm hover:underline"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="p-6 flex flex-col gap-6">

        {/* 🔵 TOP ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <ActionButton title="Add Screen" onClick={() => navigate("/add-screen")} />
          <ActionButton title="Seat Categories" onClick={() => navigate("/seat-categories")} />
          <ActionButton title="Generate Seats" onClick={() => navigate("/generate-seats")} />
          <ActionButton title="Add Timeslot" onClick={() => navigate("/add-timeslot")} />
        </div>

        {/* 🔴 BOTTOM ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ActionButton title="Delete Screen" onClick={() => navigate("/delete-screen")} />
          <ActionButton title="Delete Completed Shows" onClick={() => navigate("/delete-completed-shows")} />
          <ActionButton title="Upload Movie Images" onClick={() => navigate("/upload-movie-images")} />
          <ActionButton title="Add Movie Cast" onClick={() => navigate("/add-movie-cast")} />
        </div>

      </div>

      {/* STATS */}
      <div className="px-6">
        <h2 className="text-xl font-bold mb-4">Dashboard Overview</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
          <StatCard title="Total Bookings" value={stats.totalBookings} icon={<FaCalendarAlt />} color="bg-blue-100 text-blue-700" />
          <StatCard title="Today's Bookings" value={stats.todayBookings} icon={<FaUsers />} color="bg-green-100 text-green-700" />
          <StatCard title="Cancelled" value={stats.cancelled} icon={<FaTimesCircle />} color="bg-red-100 text-red-700" />
          <StatCard title="Revenue" value={`₹${stats.revenue}`} icon={<FaMoneyBillWave />} color="bg-yellow-100 text-yellow-700" />
          <StatCard title="Occupancy" value={stats.occupancy} icon={<FaUsers />} color="bg-purple-100 text-purple-700" />
        </div>
      </div>

      {/* BOOKINGS */}
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>

        <div className="space-y-3">
          {recentBookings.length === 0 ? (
            <p>No bookings yet</p>
          ) : (
            recentBookings.map((b, i) => (
              <div
                key={i}
                className="bg-white px-4 py-3 rounded-lg shadow flex flex-col gap-3 md:grid md:grid-cols-[1.2fr_1.4fr_0.8fr_1fr_0.8fr_auto] md:items-center"
              >
                <div>
                  <p className="font-semibold text-gray-900">{b.user_name}</p>
                  <p className="text-xs text-gray-500">{b.user_phone}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">{b.movie || "Movie"}</p>
                  <p className="text-xs text-gray-500">Seat: {b.seat}</p>
                </div>

                <p className="text-sm text-gray-600">{b.date}</p>

                <p className="text-sm text-gray-600">
                  {b.start_time} - {b.end_time}
                </p>

                <p className="text-sm font-semibold text-gray-900">
                  â‚¹{b.price || b.amount || 0}
                </p>

                <div className="md:text-right">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    b.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {b.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ title, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-linear-to-r from-purple-600 to-purple-800 text-white p-4 rounded-xl shadow hover:scale-105 transition"
    >
      {title}
    </button>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`p-4 rounded-xl shadow flex justify-between items-center ${color}`}>
      <div>
        <p className="text-sm">{title}</p>
        <h3 className="text-xl font-bold">{value}</h3>
      </div>
      <div className="text-2xl opacity-70">{icon}</div>
    </div>
  );
}
