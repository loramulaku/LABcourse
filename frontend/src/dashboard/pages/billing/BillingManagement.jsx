import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../utils/api';
import { toast } from 'react-toastify';

const BillingManagement = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const response = await api.get('/api/billing/bills');
      setBills(response.data.bills);
      
      // Calculate total revenue
      const total = response.data.bills.reduce((acc, bill) => {
        return acc + (bill.isPaid ? parseFloat(bill.totalAmount || 0) : 0);
      }, 0);
      setTotalRevenue(total);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading bills:', error);
      toast.error('Failed to load billing data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="flex flex-col gap-5 md:gap-8">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">Billing Management</h2>
          <Link
            to="/dashboard/billing/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Bill
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-black text-sm font-medium">Total Revenue</h3>
            <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-black text-sm font-medium">Total Bills</h3>
            <p className="text-2xl font-bold text-blue-600">{bills.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-black text-sm font-medium">Pending Bills</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {bills.filter(bill => !bill.isPaid).length}
            </p>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-xl font-semibold text-black">Recent Bills</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left text-black font-semibold">Bill ID</th>
                  <th className="py-3 px-4 text-left text-black font-semibold">Patient</th>
                  <th className="py-3 px-4 text-left text-black font-semibold">Date</th>
                  <th className="py-3 px-4 text-right text-black font-semibold">Amount</th>
                  <th className="py-3 px-4 text-center text-black font-semibold">Status</th>
                  <th className="py-3 px-4 text-center text-black font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-black">{bill.id}</td>
                    <td className="py-3 px-4 text-black">{bill.patientName}</td>
                    <td className="py-3 px-4 text-black">
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right text-black font-medium">${parseFloat(bill.totalAmount || 0).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex justify-center items-center px-3 py-1 rounded-full text-sm ${
                          bill.isPaid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {bill.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/dashboard/billing/invoice/${bill.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingManagement;