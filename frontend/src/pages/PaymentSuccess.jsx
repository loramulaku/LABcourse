import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const t = setTimeout(() => navigate('/my-appointments'), 2500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      {show && (
        <div className="bg-white border border-green-200 shadow-lg rounded-xl p-8 text-center">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-semibold text-green-700">Payment Successful</h1>
          <p className="text-gray-600 mt-2">Your appointment has been confirmed.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;


