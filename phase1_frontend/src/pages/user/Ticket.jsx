import { useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef } from "react";

const Ticket = () => {
  const { state } = useLocation();
  const ticketRef = useRef();

  const group = state?.group || [];
  const first = group[0];

  const downloadPDF = async () => {
    const canvas = await html2canvas(ticketRef.current);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 180, 100);
    pdf.save("ticket.pdf");
  };

  return (
    <div className="p-6">
      <div
        ref={ticketRef}
        className="bg-white p-6 rounded shadow w-[400px]"
      >
        <h2 className="text-xl font-bold">
          {first.movie_name}
        </h2>

        <p>{first.language}</p>
        <p>{first.screen_name}</p>
        <p>
          {first.start_time} - {first.end_time}
        </p>

        <p>
          Seats: {group.map((b) => b.seat_label).join(", ")}
        </p>
      </div>

      <button
        onClick={downloadPDF}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
      >
        Download Ticket
      </button>
    </div>
  );
};

export default Ticket;