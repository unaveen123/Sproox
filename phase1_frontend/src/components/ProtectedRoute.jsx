import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect } from "react";

const ProtectedRoute = () => {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      const timeout = setTimeout(() => {
        navigate("/login", { state: { from: location }, replace: true });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [token, location, navigate]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Login required</h2>
          <p className="text-slate-600">
            You need to sign in before accessing provider pages like Generate Seats.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
