import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, getAccessToken } from '../../api';
import { toast } from 'react-toastify';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadCrumb';

const TherapyCalendar = () => {
  const navigate = useNavigate();
  const [calendarData, setCalendarData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, view]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on current view
      const startDate = getDateRange().start;
      const endDate = getDateRange().end;
      
      const response = await fetch(
        `${API_URL}/api/therapies/doctor/calendar?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCalendarData(data);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    switch (view) {
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          start: startOfWeek.toISOString().split('T')[0],
          end: endOfWeek.toISOString().split('T')[0]
        };
      case 'month':
      default:
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);
        return {
          start: startOfMonth.toISOString().split('T')[0],
          end: endOfMonth.toISOString().split('T')[0]
        };
    }
  };

  const getCalendarDays = () => {
    if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(day);
      }
      return days;
    } else {
      // Month view
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      const days = [];
      const currentDay = new Date(startDate);
      
      // Generate 42 days (6 weeks)
      for (let i = 0; i < 42; i++) {
        days.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);
      }
      return days;
    }
  };

  const getTherapiesForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarData.filter(therapy => 
      therapy.start_date === dateStr || 
      therapy.follow_up_date?.split('T')[0] === dateStr
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-400';
      case 'pending':
        return 'bg-yellow-400';
      case 'confirmed':
        return 'bg-blue-400';
      case 'active':
        return 'bg-green-400';
      case 'on_hold':
        return 'bg-orange-400';
      case 'completed':
        return 'bg-green-600';
      case 'cancelled':
        return 'bg-red-400';
      case 'overdue':
        return 'bg-red-600';
      default:
        return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    
    setCurrentDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Therapy Calendar" description="Therapy calendar view" />
      <PageBreadcrumb pageTitle="Therapy Calendar" />

      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md">
          {/* Calendar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {formatDate(currentDate)}
                </h1>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setView('month')}
                    className={`px-3 py-1 rounded text-sm ${
                      view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setView('week')}
                    className={`px-3 py-1 rounded text-sm ${
                      view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Week
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded mr-2"></div>
                <span>Draft</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded mr-2"></div>
                <span>Confirmed</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded mr-2"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-400 rounded mr-2"></div>
                <span>On Hold</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-400 rounded mr-2"></div>
                <span>Cancelled</span>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {view === 'month' ? (
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {getCalendarDays().map((day, index) => {
                  const therapies = getTherapiesForDate(day);
                  const isCurrentMonthDay = isCurrentMonth(day);
                  const isTodayDay = isToday(day);
                  
                  return (
                    <div
                      key={index}
                      className={`bg-white min-h-[120px] p-2 border border-gray-100 ${
                        !isCurrentMonthDay ? 'bg-gray-50 text-gray-400' : ''
                      } ${isTodayDay ? 'bg-blue-50' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isTodayDay ? 'text-blue-600' : isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {day.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {therapies.slice(0, 3).map((therapy, therapyIndex) => (
                          <div
                            key={therapyIndex}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 border-l-2 ${getStatusColor(therapy.status)} ${getPriorityColor(therapy.priority)}`}
                            onClick={() => navigate(`/dashboard/therapy/view/${therapy.id}`)}
                          >
                            <div className="text-white font-medium truncate">
                              {therapy.patient_name}
                            </div>
                            <div className="text-white opacity-90 truncate">
                              {therapy.therapy_type}
                            </div>
                          </div>
                        ))}
                        {therapies.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{therapies.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Week view
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* Day headers */}
                {getCalendarDays().map((day) => (
                  <div key={day.toISOString()} className="bg-gray-50 p-2 text-center">
                    <div className="text-sm font-medium text-gray-700">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-bold ${
                      isToday(day) ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                  </div>
                ))}
                
                {/* Week days content */}
                {getCalendarDays().map((day) => {
                  const therapies = getTherapiesForDate(day);
                  const isTodayDay = isToday(day);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`bg-white min-h-[200px] p-2 border border-gray-100 ${
                        isTodayDay ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        {therapies.map((therapy, therapyIndex) => (
                          <div
                            key={therapyIndex}
                            className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 border-l-2 ${getStatusColor(therapy.status)} ${getPriorityColor(therapy.priority)}`}
                            onClick={() => navigate(`/dashboard/therapy/view/${therapy.id}`)}
                          >
                            <div className="text-white font-medium truncate">
                              {therapy.patient_name}
                            </div>
                            <div className="text-white opacity-90 truncate">
                              {therapy.therapy_type}
                            </div>
                            <div className="text-white opacity-75 text-xs">
                              {therapy.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Click on therapy entries to view details
              </div>
              <button
                onClick={() => navigate('/dashboard/therapy/create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Therapy
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TherapyCalendar;
