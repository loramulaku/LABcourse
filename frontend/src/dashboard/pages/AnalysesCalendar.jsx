import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import apiFetch, { API_URL } from "../../api";

const localizer = momentLocalizer(moment);

export default function AnalysesCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const data = await apiFetch(`${API_URL}/api/patient-analyses`, {
        credentials: "include",
      });

      // Transform analyses data into calendar events
      const calendarEvents = data.map((analysis) => ({
        id: analysis.id,
        title: `${analysis.analysis_type} - ${analysis.patient_name || "Patient"}`,
        start: new Date(analysis.scheduled_date),
        end: new Date(analysis.scheduled_date),
        resource: {
          status: analysis.status,
          laboratory: analysis.laboratory_name,
          patient: analysis.patient_name,
          type: analysis.analysis_type,
        },
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching analyses:", error);
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = "#3174ad";

    switch (event.resource?.status) {
      case "completed":
        backgroundColor = "#28a745";
        break;
      case "pending":
        backgroundColor = "#ffc107";
        break;
      case "cancelled":
        backgroundColor = "#dc3545";
        break;
      default:
        backgroundColor = "#3174ad";
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
          Analyses Calendar
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Scheduled</span>
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
