import React, { useEffect, useMemo, useState } from "react";
import apiFetch, { API_URL } from "../../api";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';

export default function LabCalendar() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [byDate, setByDate] = useState({});
  const navigate = useNavigate();

  const events = useMemo(() => {
    // Build events per date cell with list of names
    const evs = [];
    Object.entries(byDate).forEach(([date, items]) => {
      const names = items.map(i => i.user_name).slice(0, 3);
      const extra = items.length > 3 ? ` +${items.length - 3}` : '';
      evs.push({ id: date, title: names.join(', ') + extra, start: date, allDay: true });
    });
    return evs;
  }, [byDate]);

  useEffect(() => {
    const load = async () => {
      try {
        const [list, grouped] = await Promise.all([
          apiFetch(`${API_URL}/api/laboratories/dashboard/appointments`),
          apiFetch(`${API_URL}/api/laboratories/dashboard/appointments-by-date`),
        ]);
        setAppointments(list);
        setByDate(grouped || {});
      } catch (e) {
        console.error(e);
        setAppointments([]);
        setByDate({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="rounded-2xl border p-5">Loading...</div>;

  const handleDateClick = (info) => {
    const dateStr = info.dateStr;
    const list = byDate[dateStr] || [];
    setSelected({ date: dateStr, items: list });
  };

  const confirm = async (id) => {
    try {
      const updated = await apiFetch(`${API_URL}/api/laboratories/dashboard/confirm/${id}`, { method: 'POST' });
      // Refresh grouped + list
      const grouped = await apiFetch(`${API_URL}/api/laboratories/dashboard/appointments-by-date`);
      setByDate(grouped || {});
      setAppointments((prev) => prev.map(x => x.id === id ? { ...x, status: 'confirmed' } : x));
      if (selected) {
        setSelected(s => ({ ...s, items: (s?.items || []).map(x => x.id === id ? { ...x, status: 'confirmed' } : x) }));
      }
      // Show success message
      alert('Patient confirmed successfully!');
      // Navigate to Confirmed Patients so the user sees the updated list immediately
      navigate('/lab/confirmed');
    } catch (e) {
      console.error(e);
      alert('Failed to confirm patient. Please try again.');
    }
  };

  return (
    <div>
      <h3 className="mb-6 text-2xl font-bold text-green-800 flex items-center">
        <img src="/src/lab/labicon/6.jpg" alt="Calendar" className="w-8 h-8 mr-3" />
        Appointments Calendar
      </h3>
      <div className="bg-white rounded-xl shadow-lg border border-green-200 p-6">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          height="auto"
        />
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-green-200">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-bold text-green-800">Appointments on {selected.date}</h4>
              <button onClick={() => setSelected(null)} className="rounded-lg px-3 py-2 text-sm hover:bg-green-50 text-green-600 border border-green-300 transition-all">Close</button>
            </div>
            <div className="space-y-3 text-sm">
              {(selected.items || []).map(item => (
                <div key={item.id} className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-green-800">{item.user_name}</div>
                      <div className="text-green-600 text-xs">{item.user_email} {item.user_phone ? `• ${item.user_phone}` : ''}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${ (item.status||'').toLowerCase()==='confirmed' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300'}`}>{item.status}</span>
                  </div>
                  <div className="mt-2 text-green-700">Time: {item.time}</div>
                  <div className="text-green-700">Analysis: {item.analysis_name}</div>
                  {item.notes && <div className="text-green-700">Notes: {item.notes}</div>}
                  {(item.status||'').toLowerCase() !== 'confirmed' && (
                    <div className="mt-3">
                      <button onClick={() => confirm(item.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl">Confirm</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


