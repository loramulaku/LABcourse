import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../utils/api';
import { toast } from 'react-toastify';

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: '', transactionRef: '', notes: '' });

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

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const handleMarkAsPaid = async () => {
    try {
      await api.patch(`/api/billing/bills/${id}/mark-paid`);
      toast.success('Invoice marked as paid');
      loadInvoice();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        billId: Number(id),
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        transactionRef: paymentForm.transactionRef || undefined,
        notes: paymentForm.notes || undefined,
      };
      await api.post(`/api/billing/payments`, payload);
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', paymentMethod: '', transactionRef: '', notes: '' });
      loadInvoice();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Failed to add payment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black">Invoice #{invoice.id}</h2>
          <p className="text-sm text-black">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
          <div className="mt-1 text-sm text-black">
            <span className="mr-4">Total: ${parseFloat(invoice.totalAmount || 0).toFixed(2)}</span>
            <span className="mr-4">Paid: ${parseFloat(invoice.paidAmount || 0).toFixed(2)}</span>
            <span>Due: ${Math.max(0, parseFloat(invoice.totalAmount || 0) - parseFloat(invoice.paidAmount || 0)).toFixed(2)}</span>
          </div>
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

      <div className="mb-8">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            invoice.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {invoice.isPaid ? 'Paid' : 'Pending'}
        </span>
        {!invoice.isPaid && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Payment
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4 text-black">Patient Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-black font-medium">Patient Name</p>
              <p className="font-semibold text-black">{invoice.patient?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-black font-medium">Patient ID</p>
              <p className="font-semibold text-black">{invoice.patient?.id || '-'}</p>
            </div>
          </div>
        </div>

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
                {Array.isArray(invoice.items) && invoice.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="py-3 px-4 text-black">{item.description}</td>
                    <td className="py-3 px-4 text-right text-black">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-black">${Number(item.amount).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-black">${(Number(item.quantity) * Number(item.amount)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t">
                <tr>
                  <td colSpan="3" className="py-3 px-4 text-right font-semibold text-black">Total Amount</td>
                  <td className="py-3 px-4 text-right font-bold text-black">${parseFloat(invoice.totalAmount || 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {invoice.notes && (
          <div className="p-6 border-t">
            <h3 className="text-lg font-semibold mb-2 text-black">Notes</h3>
            <p className="text-black whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        <div className="p-6 border-t">
          <h3 className="text-lg font-semibold mb-4 text-black">Payment History</h3>
          {Array.isArray(invoice.payments) && invoice.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left text-black font-semibold">Date</th>
                    <th className="py-3 px-4 text-left text-black font-semibold">Method</th>
                    <th className="py-3 px-4 text-left text-black font-semibold">Reference</th>
                    <th className="py-3 px-4 text-left text-black font-semibold">Receiver</th>
                    <th className="py-3 px-4 text-right text-black font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-3 px-4 text-black">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-black">{p.paymentMethod}</td>
                      <td className="py-3 px-4 text-black">{p.transactionRef || '-'}</td>
                      <td className="py-3 px-4 text-black">{p.receiver?.name || '-'}</td>
                      <td className="py-3 px-4 text-right text-black">${parseFloat(p.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-black">No payments recorded</p>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold text-black mb-4">Add Payment</h3>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Transaction Reference</label>
                <input
                  type="text"
                  value={paymentForm.transactionRef}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Notes</label>
                <textarea
                  rows={3}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;