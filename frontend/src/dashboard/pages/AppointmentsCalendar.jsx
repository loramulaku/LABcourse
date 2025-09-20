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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Appointments Calendar
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Cancelled/Declined</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-teal-500 rounded"></div>
            <span>Paid</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
