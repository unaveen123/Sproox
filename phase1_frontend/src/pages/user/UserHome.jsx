import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserHome = () => {
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/user/locations");
      setLocations(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // 🔍 FILTER
  const filteredLocations = locations.filter((loc) =>
    `${loc.name} ${loc.city} ${loc.address}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white p-6 flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">Browse Theaters</h1>
          <p className="text-sm">Discover theaters and book your seats</p>
        </div>

        {/* PROFILE */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProfile(!showProfile);
            }}
            className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold"
          >
            Profile
          </button>

          {showProfile && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-lg p-3 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm mb-2">👤 User</p>

              <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
                My Bookings
              </button>

              <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
                Settings
              </button>

              <button className="w-full text-left px-3 py-2 text-red-500 hover:bg-gray-100 rounded">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div onClick={() => setShowProfile(false)} className="p-6">

        {/* SEARCH */}
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <input
            type="text"
            placeholder="Search theaters, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {filteredLocations.map((loc) => (
            <div
              key={loc.location_id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition"
            >

              <img
                src="https://via.placeholder.com/400x200"
                alt="poster"
                className="w-full h-40 object-cover"
              />

              <div className="p-4">
                <h2 className="text-lg font-bold">{loc.name}</h2>
                <p className="text-gray-500 text-sm">{loc.city}</p>

                {/* ✅ GO TO NEXT STEP */}
                <button
                  onClick={() => navigate(`/location/${loc.location_id}`)}
                  className="mt-4 w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-2 rounded-lg hover:scale-105 transition"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}

          {filteredLocations.length === 0 && (
            <p className="text-center col-span-2 text-gray-500">
              No theaters found
            </p>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserHome;