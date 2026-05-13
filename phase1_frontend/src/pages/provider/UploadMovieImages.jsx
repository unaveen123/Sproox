import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Malayalam",
  "Kannada",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "Urdu",
  "Odia",
  "Assamese",
  "Bhojpuri",
  "Konkani",
  "Manipuri",
  "Nepali",
  "Sanskrit",
  "Sindhi",
];

export default function UploadMovieImages() {
  const navigate = useNavigate();

  const [allTimeslots, setAllTimeslots] = useState([]);

  const [locationId, setLocationId] = useState("");
  const [timeslotId, setTimeslotId] = useState("");
  const [movieName, setMovieName] = useState("");
  const [language, setLanguage] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const BASE_URL = "http://127.0.0.1:8000";

  const fetchTimeslots = async (targetLocationId) => {
    const res = await axios.get(
      `${BASE_URL}/provider/location/${targetLocationId}/timeslots`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return (res.data || []).map((slot) => ({
      ...slot,
      location_id: slot.location_id || targetLocationId,
    }));
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const locRes = await axios.get(
          `${BASE_URL}/provider/location/my-locations`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const providerLocations = locRes.data || [];

        const responses = await Promise.allSettled(
          providerLocations
            .map((location) => location.id || location.location_id)
            .filter(Boolean)
            .map((id) => fetchTimeslots(id))
        );

        const slots = responses.flatMap((response) =>
          response.status === "fulfilled" ? response.value : []
        );

        setAllTimeslots(slots);
      } catch {
        setMessage("Failed to load movies");
      }
    };

    fetchInitialData();
  }, []);

  const movieOptions = Array.from(
    new Set(
      allTimeslots
        .map((slot) => slot.movie_name)
        .filter(Boolean)
    )
  );

  const handleUpload = async () => {
    try {
      if (
        !locationId ||
        !timeslotId ||
        !movieName ||
        !language ||
        files.length === 0
      ) {
        setMessage("⚠️ Please fill all fields and select images");
        return;
      }

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      setLoading(true);

      await axios.post(
        `${BASE_URL}/theater/provider/location/${locationId}/timeslot/${timeslotId}/upload-movie-images`,
        formData,
        {
          params: {
            movie_name: movieName,
            language: language,
          },
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("✅ Images uploaded successfully");

      setFiles([]);
      setMovieName("");
      setLanguage("");

    } catch (err) {
      setMessage(
        err.response?.data?.detail ||
          "❌ Upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* TOAST */}
      {message && (
        <div className="fixed top-5 right-5 px-4 py-3 rounded shadow-lg text-white bg-green-500">
          {message}
        </div>
      )}

      <div className="max-w-3xl mx-auto">

        {/* BACK */}
        <button
          onClick={() => navigate("/provider/dashboard")}
          className="mb-4 px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium"
        >
          Back
        </button>

        {/* CARD */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* HEADER */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
            <h2 className="text-2xl font-bold">
              Upload Movie Images
            </h2>
          </div>

          {/* BODY */}
          <div className="p-6 flex flex-col gap-4">

            <input
              placeholder="Location ID"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="p-3 rounded-lg border border-gray-300"
            />

            <input
              placeholder="Timeslot ID"
              value={timeslotId}
              onChange={(e) => setTimeslotId(e.target.value)}
              className="p-3 rounded-lg border border-gray-300"
            />

            <select
              value={movieName}
              onChange={(e) => setMovieName(e.target.value)}
              className="p-3 rounded-lg border border-gray-300"
            >
              <option value="">Select Movie Name</option>
              {movieOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="p-3 rounded-lg border border-gray-300"
            >
              <option value="">Select Language</option>
              {LANGUAGE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {/* FILE INPUT */}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(Array.from(e.target.files))}
              className="p-2"
            />

            {/* PREVIEW */}
            <div className="flex gap-2 flex-wrap">
              {files.map((file, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-20 h-20 object-cover rounded"
                />
              ))}
            </div>

            {/* BUTTON */}
            <button
              onClick={handleUpload}
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-500"
            >
              {loading ? "Uploading..." : "Upload Images"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
