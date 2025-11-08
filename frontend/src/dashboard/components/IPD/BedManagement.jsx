import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function BedManagement() {
  const [beds, setBeds] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [formData, setFormData] = useState({
    room_id: '',
    bed_number: '',
    status: 'Available',
  });

  const bedStatuses = ['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance'];
  const statusColors = {
    Available: 'bg-green-100 text-green-800',
    Occupied: 'bg-red-100 text-red-800',
    Reserved: 'bg-yellow-100 text-yellow-800',
    Cleaning: 'bg-blue-100 text-blue-800',
    Maintenance: 'bg-gray-100 text-gray-800',
  };

  useEffect(() => {
    fetchWards();
  }, []);

  useEffect(() => {
    if (selectedWard) {
      fetchRooms(selectedWard);
    }
  }, [selectedWard]);

  useEffect(() => {
    fetchBeds();
  }, [selectedRoom]);

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

  const fetchRooms = async (wardId) => {
    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/rooms?wardId=${wardId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchBeds = async () => {
    try {
      setLoading(true);
      const url = selectedRoom
        ? `${API_URL}/api/ipd/admin/beds?roomId=${selectedRoom}`
        : `${API_URL}/api/ipd/admin/beds`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBeds(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
      toast.error('Error fetching beds');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.room_id || !formData.bed_number) {
      toast.error('Room and bed number are required');
      return;
    }

    try {
      const url = editingBed
        ? `${API_URL}/api/ipd/admin/beds/${editingBed.id}`
        : `${API_URL}/api/ipd/admin/beds`;

      const response = await fetch(url, {
        method: editingBed ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingBed ? 'Bed updated successfully' : 'Bed created successfully');
        setShowForm(false);
        fetchBeds();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save bed');
      }
    } catch (error) {
      console.error('Error saving bed:', error);
      toast.error('Error saving bed');
    }
  };

  const handleDelete = async (bedId) => {
    if (!window.confirm('Are you sure you want to delete this bed?')) return;

    try {
      const response = await fetch(`${API_URL}/api/ipd/admin/beds/${bedId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Bed deleted successfully');
        fetchBeds();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete bed');
      }
    } catch (error) {
      console.error('Error deleting bed:', error);
      toast.error('Error deleting bed');
    }
  };

  const wardsList = Array.isArray(wards) ? wards : [];
  const roomsList = Array.isArray(rooms) ? rooms : [];
  const bedsList = Array.isArray(beds) ? beds : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bed Management
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Manage beds across all wards and rooms</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={selectedWard}
            onChange={(e) => {
              setSelectedWard(e.target.value);
              setSelectedRoom('');
            }}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="">All Wards</option>
            {wardsList.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.name}
              </option>
            ))}
          </select>
          {selectedWard && (
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="">All Rooms</option>
              {roomsList.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.room_number}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              setEditingBed(null);
              setFormData({ room_id: '', bed_number: '', status: 'Available' });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Bed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : bedsList.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl p-8">
            <p className="text-gray-500 dark:text-gray-400">
              No beds found. {selectedWard ? 'Please select a ward and room, then add beds.' : 'Please add wards and rooms first.'}
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* Hierarchical View */}
          {selectedWard && selectedRoom ? (
            <>
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <div className="flex items-center text-sm">
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    {wardsList.find(w => w.id === parseInt(selectedWard))?.name}
                  </span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    Room {roomsList.find(r => r.id === parseInt(selectedRoom))?.room_number}
                  </span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-gray-600 dark:text-gray-400">{bedsList.length} bed(s)</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {bedsList.map((bed) => (
                  <div key={bed.id} className={`border-2 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 ${statusColors[bed.status] || 'bg-gray-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-lg">Bed {bed.bed_number}</div>
                        <div className="text-xs text-gray-600 mt-1">{bed.room?.room_type}</div>
                      </div>
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => {
                      setEditingBed(bed);
                      setFormData({
                        room_id: bed.room_id,
                        bed_number: bed.bed_number,
                        status: bed.status,
                      });
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(bed.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
                    <div className="text-sm font-semibold mt-2">{bed.status}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bedsList.map((bed) => (
                <div key={bed.id} className={`border-2 rounded-lg p-4 ${statusColors[bed.status] || 'bg-gray-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg">Bed {bed.bed_number}</div>
                      <div className="text-xs text-gray-600">{bed.room?.ward?.name}</div>
                      <div className="text-xs text-gray-600">Room {bed.room?.room_number}</div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => {
                          setEditingBed(bed);
                          setFormData({
                            room_id: bed.room_id,
                            bed_number: bed.bed_number,
                            status: bed.status,
                          });
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bed.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-semibold mt-2">{bed.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{editingBed ? 'Edit Bed' : 'Add New Bed'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Ward *</label>
                  <select
                    value={formData.room_id ? rooms.find(r => r.id === parseInt(formData.room_id))?.ward_id : ''}
                    onChange={(e) => {
                      fetchRooms(e.target.value);
                      setFormData({ ...formData, room_id: '' });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
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
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Room *</label>
                  <select
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    required
                  >
                    <option value="">Select Room</option>
                    {roomsList.map((room) => (
                      <option key={room.id} value={room.id}>
                        Room {room.room_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Bed Number *</label>
                  <input
                    type="text"
                    value={formData.bed_number}
                    onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-100 dark:text-gray-200 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  >
                    {bedStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
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
                  {editingBed ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
