import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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
            <button
              onClick={handleLogout}
              className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              Logout
            </button>
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
        </div>
      </div>
    </header>
  );
};

export default Navbar;
