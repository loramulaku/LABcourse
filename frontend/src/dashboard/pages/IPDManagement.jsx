import React, { useState } from 'react';
import { 
  Activity, 
  Bed, 
  Building2, 
  Users, 
  ClipboardList, 
  BarChart3 
} from 'lucide-react';
import WardManagement from '../components/IPD/WardManagement';
import RoomManagement from '../components/IPD/RoomManagement';
import BedManagement from '../components/IPD/BedManagement';
import IPDPatientsManagement from '../components/IPD/IPDPatientsManagement';
import AdmissionRequests from '../components/IPD/AdmissionRequests';
import BedOccupancyDashboard from '../components/IPD/BedOccupancyDashboard';

export default function IPDManagement() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', name: 'Bed Occupancy', icon: BarChart3 },
    { id: 'wards', name: 'Wards', icon: Building2 },
    { id: 'rooms', name: 'Rooms', icon: Activity },
    { id: 'beds', name: 'Beds', icon: Bed },
    { id: 'patients', name: 'IPD Patients', icon: Users },
    { id: 'admissions', name: 'Admission Requests', icon: ClipboardList },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <BedOccupancyDashboard />;
      case 'wards':
        return <WardManagement />;
      case 'rooms':
        return <RoomManagement />;
      case 'beds':
        return <BedManagement />;
      case 'patients':
        return <IPDPatientsManagement />;
      case 'admissions':
        return <AdmissionRequests />;
      default:
        return <BedOccupancyDashboard />;
    }
  };

  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Inpatient Department (IPD) Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage wards, rooms, beds, and inpatient admissions
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
        <nav className="flex flex-wrap gap-2 p-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 md:p-8">
        {renderContent()}
      </div>
    </div>
  );
}
