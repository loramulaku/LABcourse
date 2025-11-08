import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function WardManagement() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    total_beds: '',
    is_active: true,
  });

  useEffect(() => {
    fetchWards();
  }, []);

  const fetchWards = async () => {
    try {
      console.log('🔄 [Frontend] Fetching wards...');
      setLoading(true);
      const response = await fetch(`${API_URL}/api/ipd/admin/wards`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [Frontend] Received wards response:', result);
        
        // Backend returns: { success: true, data: { data: [...], count: X } }
        const wardsArray = result.data?.data || result.data || [];
        console.log('📊 [Frontend] Ward count:', wardsArray.length);
        console.log('📋 [Frontend] Ward list:', wardsArray.map(w => ({ id: w.id, name: w.name })));
        
        setWards(wardsArray);
        console.log('💾 [Frontend] State updated with', wardsArray.length, 'wards');
      } else {
        console.error('❌ [Frontend] Failed to fetch wards, status:', response.status);
        toast.error('Failed to fetch wards');
      }
    } catch (error) {
      console.error('❌ [Frontend] Error fetching wards:', error);
      toast.error('Error fetching wards');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingWard(null);
    setFormData({
      name: '',
      description: '',
      total_beds: '',
      is_active: true,
    });
    setShowForm(true);
  };

  const handleEdit = (ward) => {
    setEditingWard(ward);
    setFormData({
      name: ward.name,
      description: ward.description || '',
      total_beds: ward.total_beds || '',
      is_active: ward.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (wardId) => {
    if (!window.confirm('Are you sure you want to delete this ward?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/wards/${wardId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Ward deleted successfully');
        fetchWards();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete ward');
      }
    } catch (error) {
      console.error('Error deleting ward:', error);
      toast.error('Error deleting ward');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Ward name is required');
      return;
    }

    try {
      const url = editingWard
        ? `${API_URL}/api/ipd/admin/wards/${editingWard.id}`
        : `${API_URL}/api/ipd/admin/wards`;

      console.log('💾 [Frontend] Saving ward:', formData);
      console.log('🌐 [Frontend] URL:', url);
      console.log('🔧 [Frontend] Method:', editingWard ? 'PUT' : 'POST');

      const response = await fetch(url, {
        method: editingWard ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      console.log('📨 [Frontend] Response status:', response.status);
      const result = await response.json();
      console.log('📊 [Frontend] Response data:', result);

      if (response.ok) {
        console.log('✅ [Frontend] Ward saved successfully');
        console.log('📋 [Frontend] Saved ward:', result.data?.data || result.data);
        toast.success(editingWard ? 'Ward updated successfully' : 'Ward created successfully');
        setShowForm(false);
        console.log('🔄 [Frontend] Calling fetchWards to refresh list...');
        await fetchWards();
        console.log('✅ [Frontend] fetchWards completed');
      } else {
        console.error('❌ [Frontend] Failed to save ward:', result);
        toast.error(result.error || result.message || 'Failed to save ward');
      }
    } catch (error) {
      console.error('❌ [Frontend] Error saving ward:', error);
      toast.error('Error saving ward');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const wardsList = Array.isArray(wards) ? wards : [];

  console.log('🎨 [Frontend] Rendering WardManagement component');
  console.log('📊 [Frontend] Current wards state:', wards);
  console.log('📋 [Frontend] Wards list length:', wardsList.length);
  console.log('🔍 [Frontend] Ward IDs in UI:', wardsList.map(w => ({ id: w.id, name: w.name })));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ward Management
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Manage hospital wards and bed capacity</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Ward
        </button>
      </div>

      {/* Ward List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wardsList.map((ward) => (
          <div key={ward.id} className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ward.name}</h3>
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                    ward.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {ward.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(ward)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(ward.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {ward.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{ward.description}</p>
            )}

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 dark:bg-gray-600/30 p-2 rounded">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{ward.total_beds || 0}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Beds</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{ward.available_beds || 0}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Available</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{ward.occupied_beds || 0}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Occupied</div>
              </div>
            </div>

            {ward.occupancy_rate > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Occupancy Rate</span>
                  <span className="font-semibold">{ward.occupancy_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      ward.occupancy_rate >= 90
                        ? 'bg-red-600'
                        : ward.occupancy_rate >= 75
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${ward.occupancy_rate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {wardsList.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl p-8">
            <p className="text-gray-500 dark:text-gray-400">No wards found. Click "Add Ward" to create one.</p>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editingWard ? 'Edit Ward' : 'Add New Ward'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">
                    Ward Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">
                    Total Beds (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.total_beds}
                    onChange={(e) => setFormData({ ...formData, total_beds: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    min="0"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-100 dark:text-gray-200">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingWard ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
