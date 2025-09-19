import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, { Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const Doctors = React.lazy(() => import('./pages/Doctors'));
const Login = React.lazy(() => import('./pages/Login'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const MyProfile = React.lazy(() => import('./pages/MyProfile'));
const MyAppointments = React.lazy(() => import('./pages/MyAppointments'));
const Appointment = React.lazy(() => import('./pages/Appointment'));
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancelled = React.lazy(() => import('./pages/PaymentCancelled'));
const Pacientet = React.lazy(() => import('./components/Pacientet'));
const UserSimple = React.lazy(() => import('./components/UserSimple'));
const AnalysisRequestForm = React.lazy(() => import('./components/AnalysisRequestForm'));
const MyAnalyses = React.lazy(() => import('./components/MyAnalyses'));
const LaboratoriesList = React.lazy(() => import('./components/LaboratoriesList'));
// ====== Dashboard imports (lazy loaded) ======

import { ScrollToTop } from './dashboard/components/common/ScrollToTop';
import { SidebarProvider } from './dashboard/context/SidebarContext';

// Lazy load dashboard components
const AdminProfile = React.lazy(() => import('./dashboard/pages/AdminProfile.jsx'));
const Calendar = React.lazy(() => import('./dashboard/pages/Calendar'));
const Blank = React.lazy(() => import('./dashboard/pages/Blank'));
const FormElements = React.lazy(() => import('./dashboard/pages/Forms/FormElements'));
const BasicTables = React.lazy(() => import('./dashboard/pages/Tables/BasicTables'));
const Alerts = React.lazy(() => import('./dashboard/pages/UiElements/Alerts'));
const Avatars = React.lazy(() => import('./dashboard/pages/UiElements/Avatars'));
const Badges = React.lazy(() => import('./dashboard/pages/UiElements/Badges'));
const Buttons = React.lazy(() => import('./dashboard/pages/UiElements/Buttons'));
const Images = React.lazy(() => import('./dashboard/pages/UiElements/Images'));
const Videos = React.lazy(() => import('./dashboard/pages/UiElements/Videos'));
const LineChart = React.lazy(() => import('./dashboard/pages/Charts/LineChart'));
const BarChart = React.lazy(() => import('./dashboard/pages/Charts/BarChart'));
const NotFound = React.lazy(() => import('./dashboard/pages/OtherPage/NotFound'));
const BasicTableOne = React.lazy(() => import('./dashboard/components/tables/BasicTables/BasicTableOne'));
const AppLayout = React.lazy(() => import('./dashboard/layout/AppLayout'));
const DoctorsCrud = React.lazy(() => import('./dashboard/pages/DoctorsCrud.jsx'));
const AdminLaboratories = React.lazy(() => import('./dashboard/pages/AdminLaboratories.jsx'));
const LaboratoriesCrud = React.lazy(() => import('./dashboard/pages/LaboratoriesCrud.jsx'));
const AnalysisTypes = React.lazy(() => import('./dashboard/pages/AnalysisTypes.jsx'));
const AdminMessaging = React.lazy(() => import('./dashboard/pages/AdminMessaging.jsx'));
const DoctorRefused = React.lazy(() => import('./pages/DoctorRefused.jsx'));
const DoctorTherapy = React.lazy(() => import('./pages/DoctorTherapy.jsx'));
const DoctorTherapyDashboard = React.lazy(() => import('./pages/DoctorTherapyDashboard.jsx'));
const MyTherapies = React.lazy(() => import('./pages/MyTherapies.jsx'));
const TherapyDashboard = React.lazy(() => import('./dashboard/pages/DoctorTherapyDashboard.jsx'));
const TherapyCreateForm = React.lazy(() => import('./dashboard/pages/TherapyCreateForm.jsx'));
const TherapyCalendar = React.lazy(() => import('./dashboard/pages/TherapyCalendar.jsx'));
const LabLayout = React.lazy(() => import('./lab/layout/LabLayout.jsx'));
const LabHistory = React.lazy(() => import('./lab/pages/LabHistory.jsx'));
const LabCalendar = React.lazy(() => import('./lab/pages/LabCalendar.jsx'));
const LabCalendarDate = React.lazy(() => import('./lab/pages/LabCalendarDate.jsx'));
const LabConfirmed = React.lazy(() => import('./lab/pages/LabConfirmed.jsx'));
const LabPendingResult = React.lazy(() => import('./lab/pages/LabPendingResult.jsx'));
const LabProfile = React.lazy(() => import('./lab/pages/LabProfile.jsx'));
const LabAnalysisTypes = React.lazy(() => import('./lab/pages/LabAnalysisTypes.jsx'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const App = () => {
  const location = useLocation(); // kjo ndjek path-in aktual

  return (
    <ErrorBoundary>
      <div className="mx-4 sm:mx-[10%]">
        {/* Navbar gjithmonë on top */}
        <Navbar />
        <ToastContainer position="top-center" autoClose={3000} />
        <ScrollToTop />

        <Suspense fallback={<LoadingSpinner />}>

      <Routes>
        {/* =================== APP NORMAL =================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/doctors" element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
        <Route path="/doctors/:speciality" element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
        <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
        <Route path="/my-appointments" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
        <Route path="/appointment/:docId" element={<ProtectedRoute><Appointment /></ProtectedRoute>} />
        <Route path="/doctor/refused" element={<ProtectedRoute requireRole="doctor"><DoctorRefused /></ProtectedRoute>} />
        <Route path="/doctor/therapy/:appointmentId" element={<ProtectedRoute requireRole="doctor"><DoctorTherapy /></ProtectedRoute>} />
        <Route path="/doctor/therapy-dashboard" element={<ProtectedRoute requireRole="doctor"><DoctorTherapyDashboard /></ProtectedRoute>} />
        <Route path="/my-therapies" element={<ProtectedRoute><MyTherapies /></ProtectedRoute>} />
        <Route path="/pacientet" element={<ProtectedRoute><Pacientet /></ProtectedRoute>} />
        <Route path="/usersimple" element={<ProtectedRoute><UserSimple /></ProtectedRoute>} />
        <Route path="/laboratories" element={<LaboratoriesList />} />
        <Route path="/laboratory/:labId/request" element={<AnalysisRequestForm />} />
        <Route path="/my-analyses" element={<MyAnalyses />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancelled" element={<PaymentCancelled />} />
        {/* =================== DASHBOARD (ADMIN) =================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireRole="admin">
              <SidebarProvider>
                <Suspense fallback={<LoadingSpinner />}>
                  <AppLayout /> {/* Sidebar + Outlet */}
                </Suspense>
              </SidebarProvider>
            </ProtectedRoute>
          }
        >
          
          <Route path="profile" element={<AdminProfile />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="users" element={<BasicTableOne />} />
          <Route path="messaging" element={<AdminMessaging />} />
          <Route path="blank" element={<Blank />} />
          <Route path="doctors-crud" element={<DoctorsCrud />} />
          <Route path="add-laboratory" element={<AdminLaboratories />} />
          <Route path="laboratories-crud" element={<LaboratoriesCrud />} />
          <Route path="analysis-types" element={<AnalysisTypes />} />
          <Route path="form-elements" element={<FormElements />} />
          <Route path="basic-tables" element={<BasicTables />} />
          <Route path="therapy" element={<TherapyDashboard />} />
          <Route path="therapy/create" element={<TherapyCreateForm />} />
          <Route path="therapy/calendar" element={<TherapyCalendar />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="avatars" element={<Avatars />} />
          <Route path="badge" element={<Badges />} />
          <Route path="buttons" element={<Buttons />} />
          <Route path="images" element={<Images />} />
          <Route path="videos" element={<Videos />} />
          <Route path="line-chart" element={<LineChart />} />
          <Route path="bar-chart" element={<BarChart />} />
        </Route>

        {/* =================== LAB DASHBOARD (LAB ROLE) =================== */}
        <Route
          path="/lab"
          element={
            <ProtectedRoute requireRole="lab">
              <Suspense fallback={<LoadingSpinner />}>
                <LabLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route path="profile" element={<LabProfile />} />
          <Route path="analysis-types" element={<LabAnalysisTypes />} />
          <Route path="history" element={<LabHistory />} />
          <Route path="calendar" element={<LabCalendar />} />
          <Route path="calendar/:date" element={<LabCalendarDate />} />
          <Route path="confirmed" element={<LabConfirmed />} />
          <Route path="pending" element={<LabPendingResult />} />
        </Route>


        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
        </Suspense>

        {/* Footer vetëm kur nuk je në dashboard */}
        {!location.pathname.startsWith("/dashboard") && <Footer />}
      </div>
    </ErrorBoundary>
  );
};

export default App;