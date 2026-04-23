import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const { token, user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setShowProfile(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setShowProfile(false);
    navigate("/login");
  };

  return (
    <header className="bg-slate-950 text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/movies" className="text-xl font-bold tracking-tight">
          Sproox
        </Link>

        <nav className="hidden gap-4 md:flex">
          <NavLink
            to="/movies"
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm transition ${
                isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            Movies
          </NavLink>
          <NavLink
            to="/bookings"
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm transition ${
                isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            My Bookings
          </NavLink>
          {user?.role === "provider" && (
            <NavLink
              to="/provider/dashboard"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm transition ${
                  isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              Provider
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3 relative">
          {token ? (
            <>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                Profile
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Signup
              </Link>
            </>
          )}

          {showProfile && token && (
            <>
              <div
                className="fixed inset-0 z-40 bg-slate-900/40"
                onClick={() => setShowProfile(false)}
              />
              <div
                className="fixed right-6 top-20 z-50 w-[320px] rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-3xl font-bold text-blue-700">
                    {user?.name
                      ? user.name.charAt(0).toUpperCase()
                      : user?.username
                      ? user.username.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Profile</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {user?.name || user?.username || "User"}
                    </p>
                    {user?.email && <p className="text-sm text-slate-500">{user.email}</p>}
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-700">
                  {user?.role && (
                    <p>
                      <span className="font-semibold">Role:</span> {user.role}
                    </p>
                  )}
                  {user?.phone && (
                    <p>
                      <span className="font-semibold">Phone:</span> {user.phone}
                    </p>
                  )}
                  {(user?.verified || user?.is_verified) && (
                    <p>
                      <span className="font-semibold">Verified:</span> True
                    </p>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    { label: "Bookings", action: "bookings" },
                    { label: "Favorites", action: "favorites" },
                    { label: "Reviews", action: "reviews" },
                    { label: "My Tickets", action: "tickets" },
                    { label: "Wallet", action: "wallet" },
                    { label: "Preferences", action: "preferences" },
                    { label: "Security", action: "security" },
                    { label: "Settings", action: "settings" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProfile(false);
                        
                        if (item.action === "bookings") {
                          navigate("/bookings");
                        } else if (item.action === "tickets") {
                          navigate("/bookings");
                        } else if (item.action === "security") {
                          navigate("/settings");
                        } else if (item.action === "settings") {
                          navigate("/settings");
                        } else {
                          alert(`${item.label} feature coming soon!`);
                        }
                      }}
                      className="w-full rounded-3xl bg-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-200 transition"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4 text-sm">
                  <p className="text-xs text-slate-500 mb-3">Need to manage your account?</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/settings");
                      setShowProfile(false);
                    }}
                    className="w-full rounded-3xl bg-blue-50 px-4 py-3 text-left font-semibold text-blue-600 hover:bg-blue-100 transition"
                  >
                    Go to Settings
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
