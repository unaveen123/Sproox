import { BrowserRouter, Routes, Route } from "react-router-dom";

// Provider
import TheaterDashboard from "./pages/provider/TheaterDashboard.jsx";
import AddScreen from "./pages/provider/AddScreen.jsx";
import AddSeatCategory from "./pages/provider/AddSeatCategory";
import GenerateSeats from "./pages/provider/GenerateSeats";
import AddTimeslot from "./pages/provider/AddTimeslot";
import DeleteScreen from "./pages/provider/DeleteScreen.jsx";
import DeleteCompletedShows from "./pages/provider/DeleteCompletedShows.jsx";

// User
import UserHome from "./pages/user/UserHome";
import LocationDetails from "./pages/user/LocationDetails";
import SeatSelection from "./pages/user/SeatSelection";
import Profile from "./pages/user/Profile";
import SelectScreenTime from "./pages/user/SelectScreenTime"; // ✅ NEW

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PROVIDER */}
        <Route path="/provider" element={<TheaterDashboard />} />
        <Route path="/provider/add-screen" element={<AddScreen />} />
        <Route path="/provider/seat-categories" element={<AddSeatCategory />} />
        <Route path="/provider/generate-seats" element={<GenerateSeats />} />
        <Route path="/provider/add-timeslot" element={<AddTimeslot />} />
        <Route path="/provider/delete-screen" element={<DeleteScreen />} />
        <Route path="/provider/delete-completed-shows" element={<DeleteCompletedShows />} />

        {/* USER */}
        <Route path="/" element={<UserHome />} />
        <Route path="/location/:id" element={<LocationDetails />} />
        <Route path="/select/:id" element={<SelectScreenTime />} /> {/* ✅ IMPORTANT */}
        <Route path="/seats/:id" element={<SeatSelection />} />
        <Route path="/profile" element={<Profile />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;