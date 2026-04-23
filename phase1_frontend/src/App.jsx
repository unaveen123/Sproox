import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Login from "./pages/user/Login.jsx";
import Register from "./pages/user/Register.jsx";
import Movies from "./pages/user/Movies.jsx";
import LocationDetails from "./pages/user/LocationDetails.jsx";
import Seats from "./pages/user/Seats.jsx";
import Summary from "./pages/user/Summary.jsx";
import Bookings from "./pages/user/Bookings.jsx";
import Profile from "./pages/user/Profile.jsx";
import BookingSuccess from "./pages/user/BookingSuccess.jsx";
import Payment from "./pages/user/Payment.jsx";
import VerifyOTP from "./pages/user/VerifyOTP.jsx";
import ForgotPassword from "./pages/user/ForgotPassword.jsx";
import Settings from "./pages/user/Settings.jsx";
import Ticket from "./pages/user/Ticket.jsx"; // ✅ NEW IMPORT

import TheaterDashboard from "./pages/provider/TheaterDashboard.jsx";
import AddScreen from "./pages/provider/AddScreen.jsx";
import AddSeatCategory from "./pages/provider/AddSeatCategory.jsx";
import GenerateSeats from "./pages/provider/GenerateSeats.jsx";
import AddTimeslot from "./pages/provider/AddTimeslot.jsx";
import DeleteScreen from "./pages/provider/DeleteScreen.jsx";
import DeleteCompletedShows from "./pages/provider/DeleteCompletedShows.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Navigate to="/movies" replace />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/shows/:id" element={<LocationDetails />} />
          <Route path="/seats/:id" element={<Seats />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/booking-success" element={<BookingSuccess />} />

          {/* ✅ NEW ROUTE */}
          <Route path="/ticket" element={<Ticket />} />

          {/* Provider */}
          <Route path="/provider/dashboard" element={<TheaterDashboard />} />
          <Route path="/add-screen" element={<AddScreen />} />
          <Route path="/seat-categories" element={<AddSeatCategory />} />
          <Route path="/generate-seats" element={<GenerateSeats />} />
          <Route path="/add-timeslot" element={<AddTimeslot />} />
          <Route path="/delete-screen" element={<DeleteScreen />} />
          <Route path="/delete-completed-shows" element={<DeleteCompletedShows />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;