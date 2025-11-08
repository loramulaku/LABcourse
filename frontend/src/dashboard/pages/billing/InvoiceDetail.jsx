import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../utils/api';
import { toast } from 'react-toastify';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      const response = await api.get(`/api/billing/bills/${id}`);
      setInvoice(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Failed to load invoice details');
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      await api.patch(`/api/billing/bills/${id}/mark-paid`);
      toast.success('Invoice marked as paid');
      loadInvoice(); // Reload invoice data
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-4 text-center">
        <p className="text-black">Invoice not found</p>
        <button
          onClick={() => navigate('/dashboard/billing')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Billing
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10 max-w-4xl mx-auto">
      {/* Invoice Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-black">Invoice #{invoice.id}</h2>
          <p className="text-black">
            Date: {new Date(invoice.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="space-x-4">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200"
          >
            Print
          </button>
          {!invoice.isPaid && (
            <button
              onClick={handleMarkAsPaid}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-8">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            invoice.isPaid
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {invoice.isPaid ? 'Paid' : 'Pending'}
        </span>
      </div>

      {/* Bill Details */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Patient Info */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4 text-black">Patient Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-black font-medium">Patient Name</p>
              <p className="font-semibold text-black">{invoice.patientName}</p>
            </div>
            <div>
              <p className="text-sm text-black font-medium">Patient ID</p>
              <p className="font-semibold text-black">{invoice.patientId}</p>
            </div>
          </div>
        </div>

        {/* Bill Items */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-black">Bill Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left text-black font-semibold">Description</th>
                  <th className="py-3 px-4 text-right text-black font-semibold">Quantity</th>
                  <th className="py-3 px-4 text-right text-black font-semibold">Unit Price</th>
                  <th className="py-3 px-4 text-right text-black font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-3 px-4 text-black">{item.description}</td>
                    <td className="py-3 px-4 text-right text-black">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-black">
                      ${Number(item.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-black">
                      ${(item.quantity * item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t">
                <tr>
                  <td colSpan="3" className="py-3 px-4 text-right font-semibold text-black">
                    Total Amount:
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-black">
                    ${parseFloat(invoice.totalAmount || 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="p-6 border-t">
            <h3 className="text-lg font-semibold mb-2 text-black">Notes</h3>
            <p className="text-black whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail;