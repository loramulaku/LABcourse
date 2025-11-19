import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../utils/api';
import { toast } from 'react-toastify';

const CreateBill = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientId: '',
    items: [{ description: '', amount: '', quantity: 1 }],
    notes: '',
    billType: 'other',
    paymentMethod: '',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const selectedPackage = packages.find((p) => String(p.id) === String(formData.packageId || '')) || null;

  useEffect(() => {
    loadPatients();
    loadPackages();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await api.get('/api/users');
      // Filter only users with role 'user' (patients)
      const patientUsers = response.data.filter(user => user.role === 'user');
      setPatients(patientUsers);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadPackages = async () => {
    try {
      setLoadingPackages(true);
      const response = await api.get('/api/packages');
      const active = Array.isArray(response.data.packages) ? response.data.packages.filter((p) => p.isActive) : [];
      setPackages(active);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData({ ...formData, items: updatedItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', amount: '', quantity: 1 }],
    });
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const handlePackageSelect = (pkgId) => {
    const selected = packages.find((p) => String(p.id) === String(pkgId));
    if (!selected) {
      setFormData({ ...formData, packageId: '', items: [{ description: '', amount: '', quantity: 1 }] });
      return;
    }
    const pkgItem = { description: `Package: ${selected.name}`, amount: selected.price, quantity: 1 };
    setFormData({ ...formData, packageId: selected.id, items: [pkgItem] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/billing/bills', formData);
      toast.success('Bill created successfully');
      navigate('/dashboard/billing');
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-black mb-6">Create New Bill</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Select Patient
            </label>
            {loadingPatients ? (
              <div className="text-black">Loading patients...</div>
            ) : (
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                required
              >
                <option value="">-- Select a patient --</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Bill Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-black">Bill Items</h3>
              {formData.billType !== 'package' && (
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add Item
                </button>
              )}
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-black mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                    required
                    disabled={formData.billType === 'package'}
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-black mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                    required
                    disabled={formData.billType === 'package'}
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-black mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                    required
                    disabled={formData.billType === 'package'}
                  />
                </div>
                {formData.billType !== 'package' && formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="mt-6 p-2 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Bill Type and Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Bill Type
              </label>
              <select
                value={formData.billType}
                onChange={(e) => {
                  const newType = e.target.value;
                  if (newType !== 'package') {
                    setFormData({ ...formData, billType: newType, packageId: '', items: formData.items.length ? formData.items : [{ description: '', amount: '', quantity: 1 }] });
                  } else {
                    setFormData({ ...formData, billType: newType });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="other">Other</option>
                <option value="consultation">Consultation</option>
                <option value="treatment">Treatment</option>
                <option value="lab_test">Lab Test</option>
                <option value="package">Package</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Payment Method (Optional)
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="">-- Not Selected --</option>
                <option value="cash">Cash</option>
                <option value="card">Credit/Debit Card</option>
                <option value="insurance">Insurance</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online Payment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>

          {/* Package Selection */}
          {formData.billType === 'package' && (
            <div>
              <label className="block text-sm font-medium text-black mb-2">Select Package</label>
              {loadingPackages ? (
                <div className="text-black">Loading packages...</div>
              ) : (
                <select
                  value={formData.packageId || ''}
                  onChange={(e) => handlePackageSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  required
                >
                  <option value="">-- Select a package --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} (${parseFloat(pkg.price).toFixed(2)})
                    </option>
                  ))}
                </select>
              )}
              {selectedPackage && Array.isArray(selectedPackage.includedServices) && selectedPackage.includedServices.length > 0 && (
                <div className="mt-3 bg-gray-50 rounded p-3">
                  <h4 className="text-sm font-semibold text-black mb-2">Included Services</h4>
                  <ul className="list-disc list-inside text-sm text-black">
                    {selectedPackage.includedServices.map((s, idx) => (
                      <li key={idx}>{typeof s === 'string' ? s : s?.name || JSON.stringify(s)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/billing')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBill;