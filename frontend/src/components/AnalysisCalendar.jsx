// src/components/AnalysisCalendar.jsx
import React, { useState, useEffect, useCallback } from "react";
import { API_URL } from "../api";

const AnalysisCalendar = ({
  labId,
  selectedDate,
  onDateSelect,
  onTimeSelect,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [fullyBookedDates, setFullyBookedDates] = useState(new Set());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reservedMessage, setReservedMessage] = useState("");

  // Get the first day of the month and number of days
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const lastDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Generate calendar days
  const calendarDays = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Check if a date is fully booked
  const checkDateStatus = useCallback(
    async (date) => {
      try {
        const response = await fetch(
          `${API_URL}/api/laboratories/${labId}/date-status/${date}`,
        );
        if (response.ok) {
          const data = await response.json();
          return data.isFullyBooked;
        }
      } catch (error) {
        console.error("Error checking date status:", error);
      }
      return false;
    },
    [labId],
  );

  // Load fully booked dates for the current month
  const loadFullyBookedDates = useCallback(async () => {
    setLoading(true);
    const bookedDates = new Set();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      );
      const dateString = date.toISOString().split("T")[0];

      // Skip past dates
      if (date < new Date().setHours(0, 0, 0, 0)) continue;

      const isFullyBooked = await checkDateStatus(dateString);
      if (isFullyBooked) {
        bookedDates.add(dateString);
      }
    }

    setFullyBookedDates(bookedDates);
    setLoading(false);
  }, [currentMonth, daysInMonth, checkDateStatus]);

  // Load available time slots for selected date
  const loadAvailableSlots = useCallback(
    async (date) => {
      if (!date) return;

      console.log("Loading available slots for date:", date);

      try {
        const response = await fetch(
          `${API_URL}/api/laboratories/${labId}/available-slots/${date}`,
        );
        if (response.ok) {
          const slots = await response.json();
          console.log("Available slots received:", slots);
          setAvailableSlots(slots);
        }
      } catch (error) {
        console.error("Error loading available slots:", error);
      }
    },
    [labId],
  );

  useEffect(() => {
    loadFullyBookedDates();
  }, [loadFullyBookedDates]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, loadAvailableSlots]);

  const handleDateClick = (day) => {
    if (!day) return;

    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );

    // Create date string in local timezone to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayStr = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${dayStr}`;

    console.log("Date clicked:", { day, date, dateString });

    // Don't allow selection of past dates
    if (date < new Date().setHours(0, 0, 0, 0)) return;

    onDateSelect(dateString);
  };

  const handleTimeSlotClick = (slot) => {
    console.log("Time slot clicked:", slot);
    if (slot.isAvailable) {
      setReservedMessage(""); // Clear any previous message
      onTimeSelect(slot.time);
    } else {
      // Show "Reserved hour" message for booked slots
      setReservedMessage("Reserved hour");
      // Clear the message after 3 seconds
      setTimeout(() => setReservedMessage(""), 3000);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const getDateString = (day) => {
    if (!day) return "";
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );

    // Create date string in local timezone to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayStr = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${dayStr}`;
  };

  const isDateSelected = (day) => {
    if (!day || !selectedDate) return false;
    return getDateString(day) === selectedDate;
  };

  const isDateFullyBooked = (day) => {
    if (!day) return false;
    return fullyBookedDates.has(getDateString(day));
  };

  const isPastDate = (day) => {
    if (!day) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    return date < new Date().setHours(0, 0, 0, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Select Date & Time
        </h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="text-gray-600">‹</span>
          </button>
          <span className="text-lg font-medium text-gray-700">
            {currentMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="text-gray-600">›</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={index} className="p-2"></div>;
          }

          const isSelected = isDateSelected(day);
          const isFullyBooked = isDateFullyBooked(day);
          const isPast = isPastDate(day);

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={isPast}
              className={`
                p-2 text-center text-sm rounded-lg transition-all duration-200
                ${
                  isPast
                    ? "text-gray-300 cursor-not-allowed"
                    : isSelected
                      ? "bg-blue-500 text-white font-semibold"
                      : isFullyBooked
                        ? "bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer"
                        : "text-gray-700 hover:bg-blue-50 cursor-pointer"
                }
              `}
            >
              {day}
              {isFullyBooked && !isPast && (
                <div className="w-1 h-1 bg-red-500 rounded-full mx-auto mt-1"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-800 mb-4">
            Available Time Slots for{" "}
            {new Date(selectedDate).toLocaleDateString()}
          </h4>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSlotClick(slot)}
                  disabled={!slot.isAvailable}
                  className={`
                    p-3 text-sm rounded-lg transition-all duration-200 border-2
                    ${
                      slot.isAvailable
                        ? "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer border-green-300 hover:border-green-400"
                        : "bg-red-500 text-white cursor-not-allowed border-red-500"
                    }
                  `}
                >
                  {slot.displayTime}
                </button>
              ))}
            </div>
          )}

          {reservedMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">
                ⚠️ {reservedMessage}
              </p>
            </div>
          )}

          {fullyBookedDates.has(selectedDate) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">
                ⚠️ All time slots for this date are fully booked. Please choose
                another date.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisCalendar;
