import { useEffect, useState } from "react";
import api from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get("/user/booking-history");
      const data = res.data || {};

      let allBookings = [];

      if (data.active || data.completed || data.others) {
        allBookings = [
          ...(data.active || []),
          ...(data.completed || []),
          ...(data.others || []),
        ];
      } else if (Array.isArray(data)) {
        allBookings = data;
      }

      setBookings(allBookings);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to load bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔥 GROUP BOOKINGS
  const grouped = Object.values(
    bookings.reduce((acc, b) => {
      const key = b.slot_id || b.booking_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(b);
      return acc;
    }, {})
  );

  // ❌ CANCEL BOOKING WITH CONFIRMATION
  const cancelBooking = async (group) => {
    const bookingCount = group.length;
    const totalPrice = group.reduce((sum, b) => sum + (b.price || 0), 0);
    const seats = group.map((b) => b.seat).join(", ");

    const confirmMsg = `Cancel booking for:\n\n${group[0].movie_name}\nSeats: ${seats}\nTotal: ₹${totalPrice}\n\nRefund will be processed to your original payment method.`;
    
    if (!window.confirm(confirmMsg)) return;

    setCancellingId(group[0].booking_id);
    try {
      await Promise.all(
        group.map((b) =>
          api.patch(`/user/cancel-booking/${b.booking_id}`)
        )
      );

      setBookings((prev) =>
        prev.filter(
          (b) => !group.some((g) => g.booking_id === b.booking_id)
        )
      );

      alert("✓ Booking cancelled successfully.\nRefund will be processed within 3-5 business days.");
    } catch (err) {
      console.error("Cancel error:", err);
      alert(`Cancel failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  // 📄 DOWNLOAD PDF - SIMPLIFIED AND RELIABLE
  const downloadPDF = async (group) => {
    setDownloadingId(group[0].booking_id);
    try {
      const element = document.getElementById(`ticket-${group[0].booking_id}`);

      if (!element) {
        setShareMessage("❌ Ticket not found");
        setTimeout(() => setShareMessage(""), 3000);
        return;
      }

      // Wait for images to load
      const images = element.querySelectorAll("img");
      const imageLoads = Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.addEventListener("load", resolve);
              img.addEventListener("error", resolve);
            }
          })
      );
      await Promise.all(imageLoads);
      
      // Small delay for rendering
      await new Promise((resolve) => setTimeout(resolve, 800));

      const canvas = await html2canvas(element, {
        allowTaint: true,
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: 3,
        logging: false,
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 277;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const movieName = (group[0].movie || group[0].movie_name || "ticket").replace(/[^a-z0-9]/gi, "");
      pdf.save(`Sproox_${movieName}_${Date.now()}.pdf`);

      setShareMessage("✓ Ticket downloaded successfully!");
      setTimeout(() => setShareMessage(""), 3000);
    } catch (err) {
      console.error("PDF Download Error:", err);
      setShareMessage("❌ Download failed. Please try again.");
      setTimeout(() => setShareMessage(""), 4000);
    } finally {
      setDownloadingId(null);
    }
  };

  // 📤 SHARE - IMPROVED WITH WEB SHARE API
  const shareTicket = async (group) => {
    const seats = group.map((b) => b.seat).join(", ");
    const totalPrice = group.reduce((sum, b) => sum + (b.price || 0), 0);
    const movieTitle = group[0].movie || group[0].movie_name || group[0].workspace || "Movie";
    
    const shareData = {
      title: `Sproox - ${movieTitle}`,
      text: `🎬 Movie: ${movieTitle}
🎭 Language: ${group[0].language}
📍 Screen: ${group[0].screen}
🕐 Time: ${group[0].start_time} - ${group[0].end_time}
🎟 Seats: ${seats}
💰 Total: ₹${totalPrice}

Check out my booking on Sproox!`,
    };

    try {
      // Try Web Share API first (mobile/modern browsers)
      if (navigator.share) {
        await navigator.share(shareData);
        setShareMessage("✓ Shared successfully!");
      } else {
        // Fallback: Copy to clipboard
        const text = shareData.text;
        await navigator.clipboard.writeText(text);
        setShareMessage("✓ Booking details copied to clipboard!");
      }

      setTimeout(() => setShareMessage(""), 3000);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Share error:", err);
        // Try clipboard as last resort
        try {
          const text = shareData.text;
          await navigator.clipboard.writeText(text);
          setShareMessage("✓ Copied to clipboard!");
          setTimeout(() => setShareMessage(""), 3000);
        } catch (clipErr) {
          alert("Share failed. Please try again.");
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-bold">My Bookings</h1>
        </div>

        {shareMessage && (
          <div className="mb-4 rounded-3xl bg-emerald-50 p-4 text-emerald-700 border border-emerald-200 text-center font-semibold">
            {shareMessage}
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Loading bookings..." />
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : grouped.length === 0 ? (
          <p className="text-center">No booking details found</p>
        ) : (
          <div className="space-y-6">
            {grouped.map((group, idx) => {
              const first = group[0];

              return (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow">

                  {/* 🎟 REAL TICKET */}
                  <div
                    id={`ticket-${first.booking_id}`}
                    className="bg-white w-[350px] p-5 rounded-xl border shadow relative mx-auto"
                  >
                    <h2 className="text-lg font-bold">
                      {first.movie || first.movie_name || first.workspace || "Movie"}
                    </h2>

                    <p className="text-sm text-gray-500">
                      {first.language} • {first.screen}
                    </p>

                    <p className="text-sm mt-2">
                      {first.start_time} - {first.end_time}
                    </p>

                    <p className="mt-2">
                      Seats: {group.map((b) => b.seat).join(", ")}
                    </p>

                    <p className="font-semibold">
                      ₹{group.reduce((s, b) => s + (b.price || 0), 0)}
                    </p>

                    {/* 🎬 CUT DESIGN */}
                    <div className="absolute left-0 top-1/2 w-4 h-4 bg-gray-100 rounded-full -translate-x-1/2"></div>
                    <div className="absolute right-0 top-1/2 w-4 h-4 bg-gray-100 rounded-full translate-x-1/2"></div>

                    {/* QR FIX */}
                    {first.qr_code_url && (
                      <img
                        src={`http://127.0.0.1:8000${first.qr_code_url}`}
                        crossOrigin="anonymous"
                        className="mt-4 w-24 mx-auto"
                        onError={(e) => {
                          console.error("QR image failed to load");
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                  </div>

                  {/* 🎯 BUTTONS */}
                  <div className="flex gap-3 mt-6 justify-center flex-wrap">

                    <button
                      onClick={() => downloadPDF(group)}
                      disabled={downloadingId === first.booking_id}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
                    >
                      {downloadingId === first.booking_id ? (
                        <>
                          <span className="animate-spin">⏳</span> Downloading...
                        </>
                      ) : (
                        <>📥 Download Ticket</>
                      )}
                    </button>

                    <button
                      onClick={() => cancelBooking(group)}
                      disabled={cancellingId === first.booking_id}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
                    >
                      {cancellingId === first.booking_id ? (
                        <>
                          <span className="animate-spin">⏳</span> Cancelling...
                        </>
                      ) : (
                        <>✕ Cancel Booking</>
                      )}
                    </button>

                    <button
                      onClick={() => shareTicket(group)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
                    >
                      📤 Share Ticket
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;