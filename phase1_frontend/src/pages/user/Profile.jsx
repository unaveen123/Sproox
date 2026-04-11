import React from "react";

const Profile = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-lg shadow-lg w-96 text-center">
        
        <h1 className="text-2xl font-bold mb-4">User Profile</h1>

        <p className="text-gray-600">Welcome 👋</p>

        <div className="mt-6">
          <button className="bg-red-500 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>

      </div>

    </div>
  );
};

export default Profile;