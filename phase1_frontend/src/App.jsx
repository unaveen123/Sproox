import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// USER
import Login from "./pages/user/Login.jsx";
import Register from "./pages/user/Register.jsx";
import Movies from "./pages/user/Movies.jsx";
import LocationDetails from "./pages/user/LocationDetails.jsx";
import Seats from "./pages/user/Seats.jsx";
import Summary from "./pages/user/Summary.jsx";
import Payment from "./pages/user/Payment.jsx";
import BookingSuccess from "./pages/user/BookingSuccess.jsx";
import Bookings from "./pages/user/Bookings.jsx";
import Settings from "./pages/user/Settings.jsx";
import VerifyOTP from "./pages/user/VerifyOTP.jsx";
import ForgotPassword from "./pages/user/ForgotPassword.jsx";
import Ticket from "./pages/user/Ticket.jsx";

// PROVIDER
import TheaterDashboard from "./pages/provider/TheaterDashboard.jsx";
import AddScreen from "./pages/provider/AddScreen.jsx";
import AddSeatCategory from "./pages/provider/AddSeatCategory.jsx";
import GenerateSeats from "./pages/provider/GenerateSeats.jsx";
import AddTimeslot from "./pages/provider/AddTimeslot.jsx";
import DeleteScreen from "./pages/provider/DeleteScreen.jsx";
import DeleteCompletedShows from "./pages/provider/DeleteCompletedShows.jsx";
import UploadMovieImages from "./pages/provider/UploadMovieImages.jsx"; // ✅ NEW
import AddMovieCast from "./pages/provider/AddMovieCast.jsx";

function Layout() {
  const location = useLocation();

  const hideNavbarRoutes = ["/login", "/signup", "/verify-otp", "/forgot-password"];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {!shouldHideNavbar && <Navbar />}

      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Navigate to="/movies" replace />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* PROTECTED */}
        <Route element={<ProtectedRoute />}>

          {/* USER */}
          <Route path="/shows/:id" element={<LocationDetails />} />
          <Route path="/seats/:id" element={<Seats />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/booking-success" element={<BookingSuccess />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/my-bookings" element={<Navigate to="/bookings" replace />} />
          <Route path="/profile" element={<Navigate to="/movies" replace />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ticket" element={<Ticket />} />

          {/* PROVIDER */}
          <Route path="/provider/dashboard" element={<TheaterDashboard />} />
          <Route path="/add-screen" element={<AddScreen />} />
          <Route path="/seat-categories" element={<AddSeatCategory />} />
          <Route path="/generate-seats" element={<GenerateSeats />} />
          <Route path="/add-timeslot" element={<AddTimeslot />} />
          <Route path="/delete-screen" element={<DeleteScreen />} />
          <Route path="/delete-completed-shows" element={<DeleteCompletedShows />} />

          {/* ✅ NEW ROUTE */}
          <Route path="/upload-movie-images" element={<UploadMovieImages />} />
          <Route path="/add-movie-cast" element={<AddMovieCast />} />

        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<div className="p-10 text-center">404 - Page Not Found</div>} />

      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
