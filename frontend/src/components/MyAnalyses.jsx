// src/components/MyAnalyses.jsx
import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';

const MyAnalyses = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  const parseLocalDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    // Handle formats like 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DDTHH:MM(:SS)'
    const normalized = dateTimeString.replace('T', ' ');
    const [datePart, timePart = '00:00:00'] = normalized.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second = 0] = timePart.split(':').map(Number);
    return new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, second || 0);
  };

  const formatLocalDateTime = (dateTimeString, options = {}) => {
    const d = parseLocalDateTime(dateTimeString);
    if (!d) return '';
    const { includeWeekday = false, includeSeconds = false } = options;
    const dateOpts = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(includeWeekday ? { weekday: 'long' } : {})
    };
    const timeOpts = {
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {})
    };
    return `${d.toLocaleDateString(undefined, dateOpts)} at ${d.toLocaleTimeString([], timeOpts)}`;
  };

  useEffect(() => {
    const fetchMyAnalyses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/laboratories/my-analyses`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAnalyses(data);
        }
      } catch (error) {
        console.error('Error fetching analyses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyAnalyses();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Analyses</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-sky-50 to-sky-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-sky-800">My Analyses</h1>
      
      {analyses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔬</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Analysis Requests Yet</h2>
          <p className="text-gray-500 mb-4">You haven't requested any laboratory analyses yet.</p>
          <a 
            href="/laboratories" 
            className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Browse Laboratories
          </a>
        </div>
      ) : (
        <div className="grid gap-6">
          {analyses.map((analysis) => (
            <div key={analysis.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-sky-500">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getStatusIcon(analysis.status)}</span>
                    <h2 className="text-xl font-semibold">{analysis.analysis_name}</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Laboratory</p>
                      <p className="font-medium">{analysis.laboratory_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Appointment Date</p>
                      <p className="font-medium">{formatLocalDateTime(analysis.appointment_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(analysis.status)}`}>
                      {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {analysis.status === 'completed' && analysis.result && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-800">📊 Results:</h3>
                  <div className="text-green-700 whitespace-pre-wrap">{analysis.result}</div>
                  {analysis.completion_date && (
                    <p className="text-sm text-green-600 mt-2">
                      Completed on: {formatLocalDateTime(analysis.completion_date, { includeSeconds: true })}
                    </p>
                  )}
                </div>
              )}

              {analysis.status === 'pending' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700">
                    <span className="font-semibold">⏳ Waiting for Response:</span> Your analysis request is being processed by the laboratory. 
                    You will be notified once the results are available.
                  </p>
                </div>
              )}

              {analysis.notes && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold mb-2 text-gray-800">📝 Notes:</h3>
                  <p className="text-gray-700">{analysis.notes}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Request ID: #{analysis.id} • Submitted: {formatLocalDateTime(analysis.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAnalyses;