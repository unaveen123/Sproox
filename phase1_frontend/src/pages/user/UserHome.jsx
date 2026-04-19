import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserHome = () => {
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const fetchLocations = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/user/locations");
      setLocations(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUser = async (authToken) => {
    if (!authToken) {
      setUser(null);
      return;
    }

    try {
      const res = await axios.get("http://127.0.0.1:8000/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setUser(res.data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    fetchLocations();
    fetchUser(storedToken);
  }, []);

  // 🔥 UPDATE TOKEN WHEN USER RETURNS TO PAGE
  useEffect(() => {
    const handleFocus = () => {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
      fetchUser(storedToken);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const filteredLocations = locations.filter((loc) =>
    `${loc.name} ${loc.city} ${loc.address}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setShowProfile(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* 🔥 HEADER */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-white px-6 py-8 md:py-12 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold">Browse Theaters</h1>
            <p className="mt-4 text-lg md:text-xl text-cyan-100">
              Discover top cinemas, choose showtimes and book the best seats in your city.
            </p>
          </div>

          {/* 🔥 PROFILE BUTTON */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProfile(!showProfile);
              }}
              className="bg-white text-blue-700 px-5 py-3 rounded-full font-semibold shadow-md hover:shadow-xl transition"
            >
              {token ? "👤 Account" : "Login / Register"}
            </button>

            {showProfile && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-900/40"
                  onClick={() => setShowProfile(false)}
                />

                <div className="fixed right-6 top-28 z-50 w-[320px] rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl">
                  <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-3xl font-bold text-blue-700">
                      {user?.name
                        ? user.name.charAt(0).toUpperCase()
                        : user?.username
                        ? user.username.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Profile</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {user?.name || user?.username || "Guest"}
                      </p>
                      {user?.email && <p className="text-sm text-slate-500">{user.email}</p>}
                    </div>
                  </div>

                  {token ? (
                    <>
                      <div className="space-y-3 text-sm text-slate-700">
                        {user?.role && (
                          <p>
                            <span className="font-semibold">Role:</span>{" "}
                            {user.role}
                          </p>
                        )}
                        {user?.phone && (
                          <p>
                            <span className="font-semibold">Phone:</span>{" "}
                            {user.phone}
                          </p>
                        )}
                        {(user?.verified || user?.is_verified) && (
                          <p>
                            <span className="font-semibold">Verified:</span>{" "}
                            True
                          </p>
                        )}
                      </div>

                      <div className="mt-5 space-y-2">
                        {[
                          "Bookings",
                          "Favorites",
                          "Reviews",
                          "My Tickets",
                          "Wallet",
                          "Preferences",
                          "Security",
                          "Settings",
                        ].map((item) => (
                          <button
                            key={item}
                            onClick={() => {
                              if (item === "Bookings") {
                                setShowProfile(false);
                                navigate("/bookings");
                              }
                            }}
                            className="w-full rounded-3xl bg-slate-100 px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-200 transition"
                          >
                            {item}
                          </button>
                        ))}
                      </div>

                      <div className="mt-5 border-t border-slate-200 pt-4 space-y-2 text-sm">
                        <button className="w-full rounded-3xl bg-white px-4 py-3 text-left text-slate-800 hover:bg-slate-100 transition text-red-600">
                          Delete Account
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full rounded-3xl bg-white px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-slate-100 transition"
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          navigate("/login");
                        }}
                        className="w-full rounded-3xl bg-blue-600 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-blue-700 transition"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          navigate("/register");
                        }}
                        className="w-full rounded-3xl bg-slate-100 px-4 py-3 text-left text-sm text-slate-900 hover:bg-slate-200 transition"
                      >
                        Register
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 🔍 SEARCH */}
        <div className="mt-10 max-w-5xl mx-auto">
          <input
            type="text"
            placeholder="Search theaters, city, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-3xl border border-white/20 bg-white/10 py-4 px-5 text-white placeholder-white/70 shadow-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>

      {/* 🎬 THEATERS */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Popular Theaters</h2>
            <p className="mt-2 text-gray-600">{filteredLocations.length} venues near you</p>
          </div>

          {!token && (
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-white font-semibold shadow-lg hover:bg-blue-700 transition"
            >
              Login to Book
            </button>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2">
          {filteredLocations.map((loc) => (
            <div
              key={loc.location_id}
              className="rounded-3xl border bg-white shadow hover:shadow-xl transition"
            >
              <div className="h-52 bg-gray-200">
                <img
                  src={loc.image_url || "https://via.placeholder.com/640x360"}
                  alt={loc.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold">{loc.name}</h3>
                <p className="text-sm text-gray-500">{loc.city}</p>

                <button
                  onClick={() => navigate(`/location/${loc.location_id}`)}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white px-5 py-2 rounded"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredLocations.length === 0 && (
          <div className="text-center mt-10 text-gray-500">
            No theaters found for "{search}"
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHome;