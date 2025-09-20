import React, { useEffect, useMemo, useState } from "react";
import apiFetch, { API_URL } from "../../api";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useNavigate } from "react-router-dom";

export default function LabCalendar() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [byDate, setByDate] = useState({});
  const navigate = useNavigate();

  const events = useMemo(() => {
    // Build events per date cell with list of names
    const evs = [];
    Object.entries(byDate).forEach(([date, items]) => {
      const names = items.map((i) => i.user_name).slice(0, 3);
      const extra = items.length > 3 ? ` +${items.length - 3}` : "";

      // Determine event color based on status with clear green theming
      const hasConfirmed = items.some((i) => i.status === "pending_result");
      const hasUnconfirmed = items.some((i) => i.status === "unconfirmed");
      const hasCompleted = items.some((i) => i.status === "completed");

      let backgroundColor = "#22C55E"; // Bright green for confirmed/appointments
      let textColor = "#FFFFFF";
      let borderColor = "#16A34A";
      let availabilityText = "Available";

      if (hasCompleted) {
        backgroundColor = "#15803D"; // Dark green for completed
        borderColor = "#14532D";
        availabilityText = "Completed";
      } else if (hasConfirmed && !hasUnconfirmed) {
        backgroundColor = "#22C55E"; // Bright green for confirmed only
        borderColor = "#16A34A";
        availabilityText = "Confirmed";
      } else if (hasUnconfirmed && !hasConfirmed) {
        backgroundColor = "#84CC16"; // Light green for pending confirmation
        borderColor = "#65A30D";
        textColor = "#1F2937";
        availabilityText = "Pending";
      } else if (hasConfirmed && hasUnconfirmed) {
        backgroundColor = "#4ADE80"; // Medium green for mixed status
        borderColor = "#22C55E";
        textColor = "#1F2937";
        availabilityText = "Mixed";
      }

      const event = {
        id: date,
        title: names.join(", ") + extra,
        start: date,
        allDay: true,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        textColor: textColor,
        classNames: ["font-semibold", "shadow-sm"],
      };
      evs.push(event);
    });
    return evs;
  }, [byDate]);

  useEffect(() => {
    const load = async () => {
      try {
        const [list, grouped] = await Promise.all([
          apiFetch(`${API_URL}/api/laboratories/dashboard/appointments`),
          apiFetch(
            `${API_URL}/api/laboratories/dashboard/appointments-by-date`,
          ),
        ]);
        setAppointments(list);
        setByDate(grouped || {});
      } catch (e) {
        console.error(e);
        setAppointments([]);
        setByDate({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="rounded-2xl border p-5">Loading...</div>;

  const handleDateClick = (info) => {
    const dateStr = info.dateStr;
    // Navigate to the date-specific view instead of showing modal
    navigate(`/lab/calendar/${dateStr}`);
  };

  const confirm = async (id) => {
    try {
      const updated = await apiFetch(
        `${API_URL}/api/laboratories/dashboard/confirm/${id}`,
        { method: "POST" },
      );
      // Refresh grouped + list
      const grouped = await apiFetch(
        `${API_URL}/api/laboratories/dashboard/appointments-by-date`,
      );
      setByDate(grouped || {});
      setAppointments((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: "confirmed" } : x)),
      );
      if (selected) {
        setSelected((s) => ({
          ...s,
          items: (s?.items || []).map((x) =>
            x.id === id ? { ...x, status: "confirmed" } : x,
          ),
        }));
      }
      // Show success message
      alert("Patient confirmed successfully!");
      // Navigate to Confirmed Patients so the user sees the updated list immediately
      navigate("/lab/confirmed");
    } catch (e) {
      console.error(e);
      alert("Failed to confirm patient. Please try again.");
    }
  };

  return (
    <div>
      <h3 className="mb-6 text-2xl font-bold text-green-800 flex items-center">
        <img
          src="/src/lab/labicon/6.jpg"
          alt="Calendar"
          className="w-8 h-8 mr-3"
        />
        Appointments Calendar
      </h3>
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-xl border-2 border-green-400 p-6">
        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 rounded mr-2 border border-green-700"></div>
            <span className="text-green-800 font-medium">Confirmed</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-400 rounded mr-2 border border-green-500"></div>
            <span className="text-green-800 font-medium">Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-700 rounded mr-2 border border-green-800"></div>
            <span className="text-green-800 font-medium">Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-300 rounded mr-2 border border-green-400"></div>
            <span className="text-green-800 font-medium">Available</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-inner border border-green-200 overflow-hidden">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            dateClick={handleDateClick}
            height="auto"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkClick="popover"
            dayCellContent={(arg) => {
              // Add subtle green background for days with appointments
              const hasEvents = events.some(
                (event) => event.start === arg.date.toISOString().split("T")[0],
              );
              return (
                <div
                  className={`p-1 ${hasEvents ? "bg-green-50" : ""} hover:bg-green-100 transition-colors rounded`}
                >
                  {arg.dayNumberText}
                </div>
              );
            }}
            dayHeaderContent={(arg) => (
              <div className="text-green-800 font-semibold">{arg.text}</div>
            )}
          />
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-green-50 to-white p-6 shadow-2xl border-2 border-green-400">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-bold text-green-800 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Appointments on {selected.date}
              </h4>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium transition-all shadow-lg hover:shadow-xl"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 text-sm max-h-96 overflow-y-auto">
              {(selected.items || []).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-100 to-green-50 p-4 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-green-900 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {item.user_name}
                      </div>
                      <div className="text-green-700 text-xs mt-1">
                        {item.user_email}{" "}
                        {item.user_phone ? `• ${item.user_phone}` : ""}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                        item.status === "pending_result"
                          ? "bg-green-300 text-green-800 border-green-500"
                          : item.status === "unconfirmed"
                            ? "bg-green-200 text-green-700 border-green-400"
                            : item.status === "completed"
                              ? "bg-green-400 text-green-900 border-green-600"
                              : "bg-gray-200 text-gray-800 border-gray-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="flex items-center text-green-800">
                      <svg
                        className="w-4 h-4 mr-2 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">{item.time}</span>
                    </div>
                    <div className="flex items-center text-green-800">
                      <svg
                        className="w-4 h-4 mr-2 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="font-medium">{item.analysis_name}</span>
                    </div>
                  </div>
                  {item.notes && (
                    <div className="mt-3 bg-white p-3 rounded-lg border border-green-200">
                      <div className="flex items-start">
                        <svg
                          className="w-4 h-4 mr-2 text-green-600 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <div>
                          <div className="text-xs text-green-600 font-medium mb-1">
                            Notes:
                          </div>
                          <div className="text-green-800">{item.notes}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {(item.status || "").toLowerCase() !== "confirmed" && (
                    <div className="mt-3">
                      <button
                        onClick={() => confirm(item.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                      >
                        Confirm
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
