import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import apiFetch, { API_URL } from "../../api";

const localizer = momentLocalizer(moment);

export default function AppointmentsCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const data = await apiFetch(`${API_URL}/api/appointments`, {
        credentials: "include",
      });

      // Transform appointments data into calendar events
      const calendarEvents = data.map((appointment) => ({
        id: appointment.id,
        title: `${appointment.doctor_name || "Doctor"} - ${appointment.reason}`,
        start: new Date(appointment.scheduled_for),
        end: new Date(appointment.scheduled_for),
        resource: {
          status: appointment.status,
          payment_status: appointment.payment_status,
          doctor: appointment.doctor_name,
          patient: appointment.user_name,
          reason: appointment.reason,
          amount: appointment.amount,
        },
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = "#3174ad";

    switch (event.resource?.status) {
      case "CONFIRMED":
        backgroundColor = "#28a745";
        break;
      case "PENDING":
        backgroundColor = "#ffc107";
        break;
      case "DECLINED":
      case "CANCELLED":
        backgroundColor = "#dc3545";
        break;
      default:
        backgroundColor = "#3174ad";
    }

    // Add payment status indicator
    if (event.resource?.payment_status === "paid") {
      backgroundColor = "#17a2b8"; // Teal for paid appointments
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Appointments Calendar
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">View and manage appointment schedules</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20 dark:border-gray-700/50">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20 dark:border-gray-700/50">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20 dark:border-gray-700/50">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Cancelled/Declined</span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20 dark:border-gray-700/50">
            <div className="w-3 h-3 bg-teal-500 rounded"></div>
            <span>Paid</span>
          </div>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
        <style jsx>{`
          .rbc-calendar {
            background: transparent !important;
          }
          .rbc-month-view {
            background: transparent !important;
          }
          .rbc-date-cell {
            background: rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
          }
          .rbc-off-range-bg {
            background: rgba(255, 255, 255, 0.1) !important;
          }
          .rbc-today {
            background: rgba(59, 130, 246, 0.1) !important;
          }
          .rbc-header {
            background: rgba(255, 255, 255, 0.1) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
          }
          .rbc-toolbar {
            background: transparent !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
            margin-bottom: 1rem !important;
          }
          .rbc-toolbar button {
            background: rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            color: white !important;
            border-radius: 0.5rem !important;
            padding: 0.5rem 1rem !important;
            margin: 0 0.25rem !important;
          }
          .rbc-toolbar button:hover {
            background: rgba(255, 255, 255, 0.2) !important;
          }
          .rbc-toolbar button.rbc-active {
            background: rgba(59, 130, 246, 0.3) !important;
            border-color: rgba(59, 130, 246, 0.5) !important;
          }
          .rbc-toolbar-label {
            color: white !important;
            font-weight: 600 !important;
          }
        `}</style>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          views={["month", "week", "day", "agenda"]}
          defaultView="month"
          popup
          showMultiDayTimes
        />
      </div>
    </div>
  );
}
