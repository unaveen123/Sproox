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
    try {
      const locRes = await axios.get(
        "http://127.0.0.1:8000/provider/location/my-locations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const locations = locRes.data;

      if (locations.length > 0) {
        const location = locations[0];
        setTheaterName(location.name);

        const bookingRes = await axios.get(
          `http://127.0.0.1:8000/provider/location-bookings/${location.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const bookings = bookingRes.data || [];
        setRecentBookings(bookings.slice(0, 3));

        const total = bookings.length;
        const cancelled = bookings.filter(
          (b) => b.status === "cancelled"
        ).length;

        const today = bookings.filter((b) => {
          const todayDate = new Date().toISOString().split("T")[0];
          return b.booking_date?.startsWith(todayDate);
        }).length;

        const revenue = bookings
          .filter((b) => b.status === "confirmed")
          .reduce((sum, b) => sum + (b.price || 0), 0);

        setStats({
          totalBookings: total,
          todayBookings: today,
          cancelled: cancelled,
          revenue: revenue,
          occupancy: total
            ? ((total / 100) * 100).toFixed(2) + "%"
            : "0%",
        });
      }
    } catch (err) {
      console.log("Dashboard Error:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchDashboard();

    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-white text-2xl font-bold">
          🎬 Theater Dashboard
        </h1>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ActionButton title="Delete Screen" onClick={() => navigate("/delete-screen")} />
          <ActionButton title="Delete Completed Shows" onClick={() => navigate("/delete-completed-shows")} />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recentBookings.length === 0 ? (
            <p>No bookings yet</p>
          ) : (
            recentBookings.map((b, i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow">
                <p className="font-semibold">{b.movie || "Movie"}</p>
                <p className="text-sm">Seat: {b.seat_id}</p>
                <p className="text-sm text-gray-500">
                  Status: {b.status}
                </p>
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
      className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 rounded-xl shadow hover:scale-105 transition"
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