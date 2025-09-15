import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancelled = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="bg-white border border-yellow-200 shadow-lg rounded-xl p-8 text-center">
        <div className="text-5xl mb-3">⚠️</div>
        <h1 className="text-2xl font-semibold text-yellow-700">Payment Cancelled</h1>
        <p className="text-gray-600 mt-2">You can try again or choose another time.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default PaymentCancelled;


