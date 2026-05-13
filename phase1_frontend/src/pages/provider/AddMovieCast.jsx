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

export default function AddMovieCast() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [allTimeslots, setAllTimeslots] = useState([]);

  const [locationId, setLocationId] = useState("");
  const [timeslotId, setTimeslotId] = useState("");
  const [movieName, setMovieName] = useState("");
  const [language, setLanguage] = useState("");
  const [cast, setCast] = useState([{ name: "", role: "", photo: null }]);
  const [crew, setCrew] = useState([{ name: "", role: "", photo: null }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
    const fetchMovies = async () => {
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
        setAllTimeslots([]);
      }
    };

    fetchMovies();
  }, []);

  const movieOptions = Array.from(
    new Set(allTimeslots.map((slot) => slot.movie_name).filter(Boolean))
  );

  const updateMember = (setter, index, field, value) => {
    setter((prev) =>
      prev.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    );
  };

  const addMemberRow = (setter) => {
    setter((prev) => [...prev, { name: "", role: "", photo: null }]);
  };

  const removeMemberRow = (setter, index) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const getFilledRows = (members) => {
    return members.filter(
      (member) => member.name.trim() || member.role.trim() || member.photo
    );
  };

  const handleSubmit = async () => {
    const validCastRows = getFilledRows(cast);
    const validCrewRows = getFilledRows(crew);

    if (!locationId || !timeslotId || !movieName || !language) {
      setMessage("⚠️ Please fill location, timeslot, movie, and language.");
      return;
    }

    if (validCastRows.length === 0 && validCrewRows.length === 0) {
      setMessage("⚠️ Please add at least one cast or crew member with a photo.");
      return;
    }

    const invalidCastRow = validCastRows.some(
      (member) => !member.name.trim() || !member.role.trim() || !member.photo
    );
    const invalidCrewRow = validCrewRows.some(
      (member) => !member.name.trim() || !member.role.trim() || !member.photo
    );

    if (invalidCastRow || invalidCrewRow) {
      setMessage("⚠️ Please fill name, role/department, and upload a photo for every row.");
      return;
    }

    const formData = new FormData();
    formData.append("movie_name", movieName);
    formData.append("language", language);

    validCastRows.forEach((member) => {
      formData.append("names", member.name.trim());
      formData.append("roles", member.role.trim());
      if (member.photo) {
        formData.append("photos", member.photo);
      }
    });

    validCrewRows.forEach((member) => {
      formData.append("crew_names", member.name.trim());
      formData.append("crew_roles", member.role.trim());
      if (member.photo) {
        formData.append("crew_photos", member.photo);
      }
    });

    try {
      setLoading(true);

      await axios.post(
        `http://127.0.0.1:8000/theater/provider/location/${locationId}/timeslot/${timeslotId}/add-cast-crew`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage("✅ Cast and crew added successfully");
    } catch (err) {
      setMessage(err.response?.data?.detail || "❌ Cast and crew upload failed");
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
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl">

        {/* TOAST */}
        {message && (
          <div className={`fixed top-5 right-5 z-50 rounded-2xl px-5 py-3 text-white shadow-lg ${
            message.startsWith("✅")
              ? "bg-emerald-500"
              : message.startsWith("❌")
              ? "bg-red-500"
              : "bg-amber-500 text-slate-900"
          }`}>
            {message}
          </div>
        )}

        {/* BACK */}
        <button
          onClick={() => navigate("/provider/dashboard")}
          className="mb-5 rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"
        >
          Back
        </button>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">

          {/* HEADER (UPDATED) */}
          <div className="bg-gradient-to-r from-purple-700 to-pink-500 p-6 text-white">
            <h1 className="text-3xl font-bold">Add Movie Cast & Crew</h1>
          </div>

          {/* FORM */}
          <div className="grid gap-4 p-6 md:grid-cols-2">
            <input
              placeholder="Location ID"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
            />
            <input
              placeholder="Timeslot ID"
              value={timeslotId}
              onChange={(e) => setTimeslotId(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
            />
            <select
              value={movieName}
              onChange={(e) => setMovieName(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
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
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
            >
              <option value="">Select Language</option>
              {LANGUAGE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* CAST */}
          <div className="border-t border-slate-200 p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">Cast Members</h2>
              <button
                onClick={() => addMemberRow(setCast)}
                className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"
              >
                Add Row
              </button>
            </div>

            <div className="space-y-3">
              {cast.map((member, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                  <input
                    placeholder="Actor name"
                    value={member.name}
                    onChange={(e) => updateMember(setCast, index, "name", e.target.value)}
                    className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
                  />
                  <input
                    placeholder="Role"
                    value={member.role}
                    onChange={(e) => updateMember(setCast, index, "role", e.target.value)}
                    className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
                  />
                  <label className="flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-500 shadow-sm">
                    <span className="truncate text-sm text-slate-600">
                      {member.photo ? member.photo.name : "Upload photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateMember(setCast, index, "photo", e.target.files?.[0] ?? null)}
                      className="ml-3 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <button
                    onClick={() => removeMemberRow(setCast, index)}
                    disabled={cast.length === 1}
                    className="rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-600 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 mb-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <h2 className="text-xl font-bold text-slate-900">Crew Members</h2>
              <button
                onClick={() => addMemberRow(setCrew)}
                className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"
              >
                Add Row
              </button>
            </div>

            <div className="space-y-3">
              {crew.map((member, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                  <input
                    placeholder="Crew name"
                    value={member.name}
                    onChange={(e) => updateMember(setCrew, index, "name", e.target.value)}
                    className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
                  />
                  <input
                    placeholder="Department / Role"
                    value={member.role}
                    onChange={(e) => updateMember(setCrew, index, "role", e.target.value)}
                    className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
                  />
                  <label className="flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-500 shadow-sm">
                    <span className="truncate text-sm text-slate-600">
                      {member.photo ? member.photo.name : "Upload photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateMember(setCrew, index, "photo", e.target.files?.[0] ?? null)}
                      className="ml-3 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <button
                    onClick={() => removeMemberRow(setCrew, index)}
                    disabled={crew.length === 1}
                    className="rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-600 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* SUBMIT */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Cast & Crew"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
