import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedWard, setSelectedWard] = useState('');
  const [formData, setFormData] = useState({
    ward_id: '',
    room_number: '',
    room_type: 'General',
    is_active: true,
  });

  const roomTypes = ['Single', 'Double', 'ICU', 'Maternity', 'Pediatric', 'Emergency', 'General'];

  useEffect(() => {
    fetchWards();
    fetchRooms();
  }, [selectedWard]);

  const fetchWards = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/wards`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setWards(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const url = selectedWard
        ? `${API_URL}/api/ipd/admin/rooms?wardId=${selectedWard}`
        : `${API_URL}/api/ipd/admin/rooms`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Error fetching rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.ward_id || !formData.room_number) {
      toast.error('Ward and room number are required');
      return;
    }

    try {
      const url = editingRoom
        ? `${API_URL}/api/ipd/admin/rooms/${editingRoom.id}`
        : `${API_URL}/api/ipd/admin/rooms`;

      const response = await fetch(url, {
        method: editingRoom ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingRoom ? 'Room updated successfully' : 'Room created successfully');
        setShowForm(false);
        fetchRooms();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save room');
      }
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error('Error saving room');
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Room deleted successfully');
        fetchRooms();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Error deleting room');
    }
  };

  const wardsList = Array.isArray(wards) ? wards : [];
  const roomsList = Array.isArray(rooms) ? rooms : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Room Management
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Manage rooms across all wards</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="">All Wards</option>
            {wardsList.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditingRoom(null);
              setFormData({ ward_id: '', room_number: '', room_type: 'General', is_active: true });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Room
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomsList.map((room) => (
            <div key={room.id} className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">Room {room.room_number}</h3>
                  <p className="text-sm text-gray-600">{room.ward?.name}</p>
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                    {room.room_type}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingRoom(room);
                      setFormData({
                        ward_id: room.ward_id,
                        room_number: room.room_number,
                        room_type: room.room_type,
                        is_active: room.is_active,
                      });
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Beds: {room.beds?.length || 0}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Ward *</label>
                  <select
                    value={formData.ward_id}
                    onChange={(e) => setFormData({ ...formData, ward_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    required
                  >
                    <option value="">Select Ward</option>
                    {wardsList.map((ward) => (
                      <option key={ward.id} value={ward.id}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Room Number *</label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Room Type</label>
                  <select
                    value={formData.room_type}
                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  >
                    {roomTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="room_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="room_active" className="ml-2 text-sm text-gray-100 dark:text-gray-200">Active</label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingRoom ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
