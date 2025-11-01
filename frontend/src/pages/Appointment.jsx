import TopDoctors from "../components/TopDoctors";
import AppointmentConfirmation from "../components/AppointmentConfirmation";
import { toast } from "react-toastify";
import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import { API_URL, getAccessToken } from "../api";

const Appointment = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  const fetchDocInfo = async () => {
    try {
      setLoading(true);
      // Try to find in context list first for basic fields
      const basic = doctors.find((doc) => String(doc.id) === String(docId));
      if (basic) setDocInfo(basic);

      // Always fetch full details from backend to avoid static fields
      const res = await fetch(`${API_URL}/api/doctors/${docId}`);
      if (res.ok) {
        const full = await res.json();
        setDocInfo(full);
      } else {
        toast.error("Failed to load doctor information");
      }
    } catch (error) {
      console.error("Error fetching doctor info:", error);
      toast.error("Failed to load doctor information");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSlots = () => {
    setDocSlots([]);
    const today = new Date();
    const slots = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      // Set start and end times for the day
      const startTime = new Date(currentDate);
      const endTime = new Date(currentDate);

      if (i === 0) {
        // For today, start from next hour if it's before 10 AM, otherwise from current hour + 1
        const now = new Date();
        if (now.getHours() < 10) {
          startTime.setHours(10, 0, 0, 0);
        } else {
          startTime.setHours(now.getHours() + 1, 0, 0, 0);
        }
      } else {
        startTime.setHours(10, 0, 0, 0);
      }

      endTime.setHours(21, 0, 0, 0);

      const timeSlots = [];
      const slotTime = new Date(startTime);

      while (slotTime < endTime) {
        const formattedTime = slotTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        timeSlots.push({
          datetime: new Date(slotTime),
          time: formattedTime,
        });

        slotTime.setMinutes(slotTime.getMinutes() + 30);
      }

      slots.push(timeSlots);
    }

    setDocSlots(slots);
  };

  const proceedToConfirmation = () => {
    // Check if user is logged in
    const token = getAccessToken();
    if (!token) {
      toast.error("Please log in to book an appointment.");
      navigate("/login");
      return;
    }

    if (!slotTime) {
      toast.error("Please select a time slot before booking.");
      return;
    }

    // Build scheduled_for from selected day index and slotTime string
    const daySlots = docSlots[slotIndex];
    if (!daySlots || daySlots.length === 0) {
      toast.error("No time slots available for the selected date.");
      return;
    }

    const chosen = daySlots.find((s) => s.time === slotTime);
    if (!chosen) {
      toast.error("Selected time slot is no longer available.");
      return;
    }

    setSelectedDateTime(chosen.datetime);
    setShowConfirmation(true);
  };

  const handleBookingSuccess = () => {
    toast.success("Appointment booked successfully!");
    navigate("/my-appointments");
  };

  const handleBackToTimeSelection = () => {
    setShowConfirmation(false);
    setSelectedDateTime(null);
  };

  useEffect(() => {
    if (doctors.length > 0) {
      fetchDocInfo();
    }
  }, [doctors, docId]);

  useEffect(() => {
    if (docInfo) {
      getAvailableSlots();
    }
  }, [docInfo]);

  if (loading && !docInfo) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor information...</p>
        </div>
      </div>
    );
  }

  if (!docInfo) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 text-lg">
            Failed to load doctor information
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show confirmation form if user has selected a time slot
  if (showConfirmation && selectedDateTime && docInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AppointmentConfirmation
          doctor={docInfo}
          selectedDate={selectedDateTime}
          selectedTime={slotTime}
          onBack={handleBackToTimeSelection}
          onSuccess={handleBookingSuccess}
        />
      </div>
    );
  }

  return (
    <div>
      {/* ---------- Doctor Details ----------- */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <img
            className="bg-primary w-full sm:max-w-72 rounded-lg"
            src={
              docInfo?.image?.startsWith("http")
                ? docInfo.image
                : `${API_URL}${docInfo?.image || ""}`
            }
            alt=""
            onError={(e) => {
              e.currentTarget.src = "/vite.svg";
            }}
          />
        </div>

        <div className="flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
          <p className="flex items-center gap-2 text-3xl font-medium text-gray-700">
            {docInfo.User?.name || docInfo.name}{" "}
            <img className="w-5" src={assets.verified_icon} alt="" />
          </p>
          <div className="flex items-center gap-2 mt-1 text-gray-600">
            <p>
              {[docInfo.degree, docInfo.specialization || docInfo.speciality].filter(Boolean).join(" - ")}
            </p>
            {(docInfo.experience_years || docInfo.experience) && (
              <button className="py-0.5 px-2 border text-xs rounded-full">
                {docInfo.experience_years || docInfo.experience} years
              </button>
            )}
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">📧 Email:</span>
              <span>{docInfo.User?.email || docInfo.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">📞 Phone:</span>
              <span>{docInfo.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">🏥 Department:</span>
              <span>{docInfo.department?.name || 'General'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">🎓 Degree:</span>
              <span>{docInfo.degree || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">💼 Experience:</span>
              <span>{docInfo.experience_years ? `${docInfo.experience_years} years` : 'N/A'}</span>
            </div>
          </div>

          {/* About Section */}
          {docInfo.about && (
            <div className="mt-6 p-4 rounded-lg">
              <p className="flex items-center gap-2 text-sm font-semibold text-black mb-2">
                <img className="w-4" src={assets.info_icon} alt="" />
                About Dr. {docInfo.User?.name || docInfo.first_name}
              </p>
              <p className="text-sm text-black leading-relaxed">
                {docInfo.about}
              </p>
            </div>
          )}

          {/* Professional Experience */}
          {docInfo.experience && (
            <div className="mt-4 p-4 rounded-lg">
              <p className="text-sm font-semibold text-black mb-2">
                💼 Professional Experience
              </p>
              <p className="text-sm text-black leading-relaxed whitespace-pre-line">
                {docInfo.experience}
              </p>
            </div>
          )}

          <p className="text-gray-600 font-medium mt-4">
            Appointment fee:{" "}
            <span className="text-gray-800">€{docInfo.consultation_fee || docInfo.fees || '50'}</span>
          </p>
        </div>
      </div>

      {/* Booking slots */}
      <div className="sm:ml-72 sm:pl-4 mt-10 font-medium text-[#565656]">
        <p className="text-lg font-semibold text-gray-800">Select Date</p>

        {/* Datat */}
        <div className="flex gap-3 items-center w-full overflow-x-auto mt-4 pb-2">
          {docSlots.length > 0 &&
            docSlots.map((item, index) => (
              <div
                key={index}
                onClick={() => setSlotIndex(index)}
                className={`text-center px-4 py-4 min-w-[70px] rounded-xl font-medium text-sm transition-all duration-300 cursor-pointer shadow-sm ${
                  slotIndex === index
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-blue-100"
                }`}
              >
                <p className="text-xs font-semibold">
                  {item[0] && daysOfWeek[item[0].datetime.getDay()]}
                </p>
                <p className="text-base">
                  {item[0] && item[0].datetime.getDate()}
                </p>
              </div>
            ))}
        </div>

        {/* Orët */}
        <p className="text-lg font-semibold text-gray-800 mt-8">
          Select a Time Slot
        </p>
        <div className="flex items-center gap-3 w-full overflow-x-auto mt-4">
          {docSlots.length > 0 &&
            docSlots[slotIndex].map((item, index) => (
              <p
                onClick={() => setSlotTime(item.time)}
                key={index}
                className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer transition-colors duration-300 ${
                  item.time === slotTime
                    ? "bg-blue-600 text-white font-medium"
                    : "text-[#949494] border border-[#B4B4B4] hover:bg-blue-100"
                }`}
              >
                {item.time.toLowerCase()}
              </p>
            ))}
        </div>

        {/* Butoni */}
        <button
          onClick={proceedToConfirmation}
          disabled={!slotTime}
          className={`text-sm font-light px-20 py-3 rounded-full my-8 transition-colors duration-300 ${
            !slotTime
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Continue to Booking
        </button>
      </div>

      <TopDoctors />
    </div>
  );
};

export default Appointment;
