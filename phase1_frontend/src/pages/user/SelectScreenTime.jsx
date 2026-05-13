import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const SelectScreenTime = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [screens, setScreens] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // ✅ SELECTED SEATS
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    fetchScreens();
    fetchTimeslots();
  }, []);

  // ================= FETCH SCREENS =================
  const fetchScreens = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://127.0.0.1:8000/user/locations/${id}/screens`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setScreens(res.data || []);
    } catch (err) {
      console.error("❌ SCREEN ERROR:", err.response || err);
    }
  };

  // ================= FETCH TIMESLOTS =================
  const fetchTimeslots = async () => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/user/locations/${id}/timeslots`
      );

      setTimeslots(res.data || []);
    } catch (err) {
      console.error("❌ TIMESLOT ERROR:", err);
    }
  };

  // ================= FILTER TIMESLOTS =================
  const filteredTimeslots = selectedScreen
    ? timeslots.filter(
        (slot) =>
          String(slot.screen_id) === String(selectedScreen)
      )
    : [];

  // ================= CONTINUE =================
  const handleContinue = () => {
    if (!selectedScreen) {
      alert("Select screen");
      return;
    }

    if (!selectedTime) {
      alert("Select time slot");
      return;
    }

    navigate(`/booking-summary`);
  };

  // ================= TOGGLE SEAT =================
  const toggleSeat = (row, seatNumber) => {
    const seatId = `${row}${seatNumber}`;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(
        selectedSeats.filter((s) => s !== seatId)
      );
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // ================= SAMPLE LAYOUT =================
  const rows = [
    {
      row: "A",
      price: 600,
      type: "Diamond",
      seats: 15,
    },
    {
      row: "B",
      price: 600,
      type: "Diamond",
      seats: 15,
    },
    {
      row: "C",
      price: 600,
      type: "Diamond",
      seats: 15,
    },
    {
      row: "D",
      price: 300,
      type: "Gold",
      seats: 15,
    },
    {
      row: "E",
      price: 300,
      type: "Gold",
      seats: 15,
    },
    {
      row: "F",
      price: 150,
      type: "Silver",
      seats: 15,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-8">

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto bg-white rounded-[40px] shadow-lg p-10">

        {/* TOP SECTION */}
        <div className="flex flex-col lg:flex-row justify-between gap-10">

          {/* LEFT */}
          <div className="flex gap-10">

            {/* MOVIE IMAGE */}
            <img
              src="https://assets-in.bmscdn.com/iedb/movies/images/mobile/thumbnail/xlarge/toxic-et00394804-1717416410.jpg"
              alt="Movie"
              className="w-[220px] h-[320px] rounded-3xl object-cover shadow-lg"
            />

            {/* MOVIE DETAILS */}
            <div className="flex flex-col justify-center">

              <p className="tracking-[8px] text-red-500 uppercase text-sm mb-3">
                Select Seats
              </p>

              <h1 className="text-6xl font-black text-[#07132b] mb-6">
                Toxic
              </h1>

              {/* SCREENS */}
              <div className="flex gap-4 flex-wrap mb-6">

                {screens.map((scr) => (
                  <button
                    key={scr.id}
                    onClick={() => {
                      setSelectedScreen(scr.id);
                      setSelectedTime(null);
                    }}
                    className={`
                      px-6 py-3 rounded-full border text-lg transition

                      ${
                        String(selectedScreen) === String(scr.id)
                          ? "bg-[#07132b] text-white border-[#07132b]"
                          : "bg-white text-[#07132b] border-gray-300"
                      }
                    `}
                  >
                    {scr.name}
                  </button>
                ))}
              </div>

              {/* TIMESLOTS */}
              <div className="flex gap-4 flex-wrap mb-6">

                {filteredTimeslots.map((slot) => (
                  <button
                    key={slot.slot_id}
                    onClick={() => setSelectedTime(slot.slot_id)}
                    className={`
                      px-6 py-3 rounded-full border transition

                      ${
                        selectedTime === slot.slot_id
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-white text-[#07132b] border-gray-300"
                      }
                    `}
                  >
                    {slot.start_time} - {slot.end_time}
                  </button>
                ))}
              </div>

              <h3 className="text-3xl text-gray-700 font-medium">
                Naveen IMAX
              </h3>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center justify-center">

            <div className="bg-[#020b2d] text-white rounded-[30px] w-[130px] h-[200px] flex flex-col justify-center items-center shadow-xl">

              <p className="text-2xl mb-4">
                Selected
              </p>

              <h1 className="text-6xl font-bold">
                {selectedSeats.length}
              </h1>

              <p className="text-2xl mt-4">
                ₹{selectedSeats.length * 300}
              </p>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">

          <div className="bg-white rounded-3xl shadow-md p-8 border">
            <p className="uppercase text-gray-500 mb-4">
              Available
            </p>

            <h1 className="text-6xl font-bold">
              75
            </h1>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-8 border border-red-200">
            <p className="uppercase text-gray-500 mb-4">
              Selected
            </p>

            <h1 className="text-6xl font-bold text-red-500">
              {selectedSeats.length}
            </h1>
          </div>

          <div className="bg-white rounded-3xl shadow-md p-8 border">
            <p className="uppercase text-gray-500 mb-4">
              Booked
            </p>

            <h1 className="text-6xl font-bold text-gray-400">
              0
            </h1>
          </div>
        </div>

        {/* SEAT LAYOUT */}
        <div className="bg-white rounded-[40px] shadow-lg mt-16 p-10">

          {/* LEGEND */}
          <div className="flex gap-6 flex-wrap mb-14">

            <div className="px-8 py-4 rounded-full bg-gray-100 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gray-500"></div>
              <span className="text-xl">Available</span>
            </div>

            <div className="px-8 py-4 rounded-full bg-gray-100 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-xl">Selected</span>
            </div>

            <div className="px-8 py-4 rounded-full bg-gray-100 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              <span className="text-xl">Booked</span>
            </div>
          </div>

          {/* SCREEN */}
          <div className="flex justify-center mb-20">
            <div className="w-[500px] h-20 bg-gradient-to-b from-blue-100 to-white rounded-t-full shadow-lg border text-center pt-6 text-gray-600 font-semibold">
              All Eyes This Way Please
            </div>
          </div>

          {/* ROWS */}
          <div className="flex flex-col gap-16">

            {rows.map((section, sectionIndex) => (

              <div
                key={sectionIndex}
                className="border rounded-[35px] p-10 bg-[#fafafa]"
              >

                {/* SECTION HEADER */}
                <div className="flex justify-between items-center mb-10">

                  <div>
                    <p className="tracking-[8px] uppercase text-gray-500 text-sm mb-2">
                      {section.type}
                    </p>

                    <h1 className="text-5xl font-bold">
                      ₹{section.price}
                    </h1>
                  </div>

                  <div className="bg-yellow-100 text-yellow-700 px-6 py-3 rounded-full font-semibold text-lg">
                    {section.type} Seats
                  </div>
                </div>

                {/* ROW */}
                <div className="flex items-center gap-10">

                  {/* ROW LABEL */}
                  <div className="text-3xl font-semibold text-gray-700 w-10">
                    {section.row}
                  </div>

                  {/* SEATS */}
                  <div className="flex gap-4 flex-wrap">

                    {Array.from({
                      length: section.seats,
                    }).map((_, index) => {

                      const seatId = `${section.row}${index + 1}`;

                      const isSelected =
                        selectedSeats.includes(seatId);

                      return (
                        <button
                          key={index}
                          onClick={() =>
                            toggleSeat(
                              section.row,
                              index + 1
                            )
                          }
                          className={`
                            w-14 h-14 rounded-xl
                            text-lg font-semibold
                            transition border

                            ${
                              isSelected
                                ? "bg-red-500 text-white border-red-500"
                                : "bg-white border-gray-300 text-[#07132b] hover:border-red-400"
                            }
                          `}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* BUTTON */}
          <div className="mt-20">
            <button
              onClick={handleContinue}
              className="
                w-full
                py-5
                rounded-2xl
                text-white
                text-2xl
                font-bold
                shadow-lg
                bg-gradient-to-r
                from-pink-500
                to-red-500
                hover:scale-[1.01]
                transition
              "
            >
              Continue to Confirm & Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectScreenTime;