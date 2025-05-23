import TopDoctors from '../components/TopDoctors';
import { toast } from 'react-toastify';
import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';


const Appointment = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol } = useContext(AppContext);
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');

  const fetchDocInfo = () => {
    console.log("🔍 docId:", docId);
    console.log("📦 doctors:", doctors);
    const found = doctors.find(doc => doc._id === docId);
    setDocInfo(found);
    console.log("✅ Gjetëm këtë doktor:", found);
  };

  const getAvailableSlots = () => {
    setDocSlots([]);
    let today = new Date();

    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      let endTime = new Date(today);
      endTime.setDate(today.getDate() + i);
      endTime.setHours(21, 0, 0, 0);

      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10);
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
      } else {
        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }

      let timeSlots = [];
      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        timeSlots.push({
          datetime: new Date(currentDate),
          time: formattedTime,
        });

        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      setDocSlots((prev) => [...prev, timeSlots]);
    }
  };

  const bookAppointment = () => {
    if (!slotTime) {
      toast.error("Please select a time slot before booking.");
      return;
    }
    toast.success("Takimi u rezervua me sukses!");
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

  if (!docInfo) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading doctor information...</p>;
  }

  return (
    <div>
      {/* ---------- Doctor Details ----------- */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
        </div>

        <div className='flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>
            {docInfo.name} <img className='w-5' src={assets.verified_icon} alt="" />
          </p>
          <div className='flex items-center gap-2 mt-1 text-gray-600'>
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
          </div>

          <div>
            <p className='flex items-center gap-1 text-sm font-medium text-[#262626] mt-3'>
              About <img className='w-3' src={assets.info_icon} alt="" />
            </p>
            <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{docInfo.about}</p>
          </div>

          <p className='text-gray-600 font-medium mt-4'>
            Appointment fee: <span className='text-gray-800'>{currencySymbol}{docInfo.fees}</span>
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
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-100'
          }`}
        >
          <p className="text-xs font-semibold">{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
          <p className="text-base">{item[0] && item[0].datetime.getDate()}</p>
        </div>
      ))}
      </div>

      {/* Orët */}
      <p className="text-lg font-semibold text-gray-800 mt-8">Select a Time Slot</p>
      <div className="flex items-center gap-3 w-full overflow-x-auto mt-4">
      {docSlots.length > 0 &&
      docSlots[slotIndex].map((item, index) => (
        <p
          onClick={() => setSlotTime(item.time)}
          key={index}
          className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer transition-colors duration-300 ${
            item.time === slotTime
              ? 'bg-blue-600 text-white font-medium'
              : 'text-[#949494] border border-[#B4B4B4] hover:bg-blue-100'
          }`}
        >
          {item.time.toLowerCase()}
        </p>
      ))}
      </div>

      {/* Butoni */}
      <button
        onClick={bookAppointment}
        className="bg-blue-600 text-white text-sm font-light px-20 py-3 rounded-full my-8 hover:bg-blue-700 transition-colors duration-300"
        >
        Book an appointment
      </button>
     </div>

     <TopDoctors />

      
    </div>
  );
};

export default Appointment;
