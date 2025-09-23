import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, getAccessToken } from "../../api";
import { toast } from "react-toastify";
import PageMeta from "../../dashboard/components/common/PageMeta";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";

const DoctorCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("week"); // week, month, day
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      
      if (view === "week") {
        startDate.setDate(currentDate.getDate() - currentDate.getDay());
        endDate.setDate(currentDate.getDate() + (6 - currentDate.getDay()));
      } else if (view === "month") {
        startDate.setDate(1);
        endDate.setMonth(currentDate.getMonth() + 1, 0);
      }

      const [appointmentsRes, slotsRes] = await Promise.all([
        fetch(`${API_URL}/api/doctor/calendar/appointments?start=${startDate.toISOString()}&end=${endDate.toISOString()}`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
        fetch(`${API_URL}/api/doctor/calendar/available-slots?start=${startDate.toISOString()}&end=${endDate.toISOString()}`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: "include",
        }),
      ]);

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setAppointments(appointmentsData);
      }

      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        setAvailableSlots(slotsData);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (dateTime) => {
    try {
      const response = await fetch(`${API_URL}/api/doctor/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          scheduled_for: dateTime,
          status: "available",
        }),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Time slot created successfully");
        fetchCalendarData();
      } else {
        toast.error("Failed to create time slot");
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error("Error creating appointment");
    }
  };

  const blockTimeSlot = async (dateTime) => {
    try {
      const response = await fetch(`${API_URL}/api/doctor/calendar/block-slot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          datetime: dateTime,
          reason: "Blocked by doctor",
        }),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Time slot blocked successfully");
        fetchCalendarData();
      } else {
        toast.error("Failed to block time slot");
      }
    } catch (error) {
      console.error("Error blocking time slot:", error);
      toast.error("Error blocking time slot");
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWeekDays = () => {
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getTimeSlots = () => {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push({
          hour,
          minute,
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        });
      }
    }
    return slots;
  };

  const getAppointmentForSlot = (date, timeSlot) => {
    const slotDateTime = new Date(date);
    slotDateTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
    
    return appointments.find(appointment => {
      const appointmentTime = new Date(appointment.scheduled_for);
      return appointmentTime.toDateString() === slotDateTime.toDateString() &&
             appointmentTime.getHours() === timeSlot.hour &&
             appointmentTime.getMinutes() === timeSlot.minute;
    });
  };

  const getSlotStatus = (date, timeSlot) => {
    const appointment = getAppointmentForSlot(date, timeSlot);
    if (appointment) {
      return {
        type: "appointment",
        status: appointment.status,
        appointment,
      };
    }
    
    const slotDateTime = new Date(date);
    slotDateTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
    const isBlocked = availableSlots.some(slot => 
      new Date(slot.datetime).getTime() === slotDateTime.getTime() && slot.status === "blocked"
    );
    
    if (isBlocked) {
      return { type: "blocked" };
    }
    
    return { type: "available" };
  };

  const getSlotColor = (slotStatus) => {
    switch (slotStatus.type) {
      case "appointment":
        switch (slotStatus.status) {
          case "confirmed":
            return "bg-green-200 hover:bg-green-300";
          case "pending":
            return "bg-yellow-200 hover:bg-yellow-300";
          case "cancelled":
            return "bg-red-200 hover:bg-red-300";
          default:
            return "bg-blue-200 hover:bg-blue-300";
        }
      case "blocked":
        return "bg-gray-300 hover:bg-gray-400";
      case "available":
        return "bg-white hover:bg-gray-100 border border-gray-200";
      default:
        return "bg-white hover:bg-gray-100 border border-gray-200";
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Calendar" description="Real-time appointment calendar" />
      <PageBreadcrumb pageTitle="Calendar" />

      <div className="p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Calendar</h1>
              <p className="text-gray-600">Manage your schedule and view real-time availability</p>
            </div>
            <div className="flex gap-3">
              <select
                value={view}
                onChange={(e) => setView(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="day">Day View</option>
                <option value="week">Week View</option>
                <option value="month">Month View</option>
              </select>
              <button
                onClick={() => navigate("/doctor/appointments")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                List View
              </button>
            </div>
          </div>

          {/* Calendar Navigation */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => view === "week" ? navigateWeek(-1) : navigateMonth(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {formatDate(currentDate)}
                </h2>
                <button
                  onClick={() => view === "week" ? navigateWeek(1) : navigateMonth(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          {view === "week" && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="grid grid-cols-8 border-b border-gray-200">
                <div className="p-4 bg-gray-50 font-semibold text-gray-900">Time</div>
                {getWeekDays().map((day) => (
                  <div key={day.toISOString()} className="p-4 bg-gray-50 border-l border-gray-200 text-center">
                    <div className="font-semibold text-gray-900">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="text-sm text-gray-600">{day.getDate()}</div>
                  </div>
                ))}
              </div>
              
              <div className="max-h-96 overflow-y-auto no-scrollbar">
                {getTimeSlots().map((timeSlot) => (
                  <div key={timeSlot.time} className="grid grid-cols-8 border-b border-gray-100">
                    <div className="p-3 bg-gray-50 text-sm text-gray-600 border-r border-gray-200">
                      {timeSlot.time}
                    </div>
                    {getWeekDays().map((day) => {
                      const slotStatus = getSlotStatus(day, timeSlot);
                      return (
                        <div
                          key={`${day.toISOString()}-${timeSlot.time}`}
                          className={`p-3 min-h-[50px] border-l border-gray-100 cursor-pointer ${getSlotColor(slotStatus)}`}
                          onClick={() => {
                            if (slotStatus.type === "available") {
                              createAppointment(new Date(day.setHours(timeSlot.hour, timeSlot.minute, 0, 0)));
                            } else if (slotStatus.type === "appointment") {
                              navigate(`/doctor/appointment/${slotStatus.appointment.id}`);
                            }
                          }}
                        >
                          {slotStatus.type === "appointment" && (
                            <div className="text-xs">
                              <div className="font-medium">{slotStatus.appointment.patient_name}</div>
                              <div className="text-gray-600">{slotStatus.appointment.status}</div>
                            </div>
                          )}
                          {slotStatus.type === "blocked" && (
                            <div className="text-xs text-gray-600">Blocked</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "day" && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{formatDate(selectedDate)}</h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto no-scrollbar">
                {getTimeSlots().map((timeSlot) => {
                  const slotStatus = getSlotStatus(selectedDate, timeSlot);
                  return (
                    <div
                      key={timeSlot.time}
                      className={`p-4 border-b border-gray-100 cursor-pointer ${getSlotColor(slotStatus)}`}
                      onClick={() => {
                        if (slotStatus.type === "available") {
                          createAppointment(new Date(selectedDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0)));
                        } else if (slotStatus.type === "appointment") {
                          navigate(`/doctor/appointment/${slotStatus.appointment.id}`);
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{timeSlot.time}</span>
                        {slotStatus.type === "appointment" ? (
                          <div className="text-sm">
                            <div className="font-medium">{slotStatus.appointment.patient_name}</div>
                            <div className="text-gray-600">{slotStatus.appointment.status}</div>
                          </div>
                        ) : slotStatus.type === "blocked" ? (
                          <span className="text-gray-600 text-sm">Blocked</span>
                        ) : (
                          <span className="text-green-600 text-sm">Available</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-200 rounded"></div>
                <span className="text-sm text-gray-600">Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-200 rounded"></div>
                <span className="text-sm text-gray-600">Cancelled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                <span className="text-sm text-gray-600">Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorCalendar;
