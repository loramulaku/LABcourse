import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { API_URL } from '../api';
import { useNavigate } from 'react-router-dom';

const TopDoctors = () => {
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);

  const itemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((Array.isArray(doctors) ? doctors.length : 0) / itemsPerPage)), [doctors]);
  const currentItems = useMemo(() => {
    const doctorsArray = Array.isArray(doctors) ? doctors : [];
    return doctorsArray.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [doctors, currentPage]);

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className='flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10'>
      <h1 className='text-3xl font-medium'>Top Doctors to Book</h1>
      <p className='sm:w-1/3 text-center text-sm'>
        Simply browse through our extensive list of trusted doctors.
      </p>

      <div className='w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-5 px-3 sm:px-0'>
        {currentItems.map((item, index) => (
          <div
            className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:-translate-y-2 transition-transform duration-300 shadow-md'
            key={index}
            onClick={() => navigate(`/appointment/${item.id}`)}
          >
            <img
              className='w-full bg-blue-50 object-cover h-48'
              src={item?.image?.startsWith('http') ? item.image : `${API_URL}${item?.image || ''}`}
              alt={item.name}
              onError={(e) => { e.currentTarget.src = '/public/vite.svg'; }}
            />
            <div className='p-4'>
              <div className='flex items-center gap-2 text-sm text-green-500'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <p>Available</p>
              </div>
              <p className='font-semibold mt-2'>{item.name}</p>
              <p className='text-sm text-gray-500'>{item.speciality}</p>
            </div>
          </div>
        ))}
      </div>

      <div className='flex gap-2 items-center justify-center'>
        <button
          className='mt-4 bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 transition'
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>{currentPage} / {totalPages}</span>
        <button
          className='mt-4 bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 transition'
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TopDoctors;
