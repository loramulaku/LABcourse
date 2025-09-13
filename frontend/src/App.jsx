import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import MyProfile from './pages/MyProfile';
import MyAppointments from './pages/MyAppointments';
import Appointment from './pages/Appointment';
import Footer from './components/Footer';
import Pacientet from './components/Pacientet';
import ProtectedRoute from './components/ProtectedRoute';
import UserSimple from './components/UserSimple';
import AnalysisRequestForm from './components/AnalysisRequestForm';
import MyAnalyses from './components/MyAnalyses';
import LaboratoriesList from './components/LaboratoriesList';
// ====== Dashboard imports ======

import { ScrollToTop } from './dashboard/components/common/ScrollToTop';
import AdminProfile from "./dashboard/pages/AdminProfile.jsx";
import Calendar from './dashboard/pages/Calendar';
import Blank from './dashboard/pages/Blank';
import FormElements from './dashboard/pages/Forms/FormElements';
import BasicTables from './dashboard/pages/Tables/BasicTables';
import Alerts from './dashboard/pages/UiElements/Alerts';
import Avatars from './dashboard/pages/UiElements/Avatars';
import Badges from './dashboard/pages/UiElements/Badges';
import Buttons from './dashboard/pages/UiElements/Buttons';
import Images from './dashboard/pages/UiElements/Images';
import Videos from './dashboard/pages/UiElements/Videos';
import LineChart from './dashboard/pages/Charts/LineChart';
import BarChart from './dashboard/pages/Charts/BarChart';
import NotFound from './dashboard/pages/OtherPage/NotFound';
import BasicTableOne from './dashboard/components/tables/BasicTables/BasicTableOne';
import { SidebarProvider } from './dashboard/context/SidebarContext';
import AppLayout from './dashboard/layout/AppLayout';
import DoctorsCrud from './dashboard/pages/DoctorsCrud.jsx';
import AdminLaboratories from './dashboard/pages/AdminLaboratories.jsx';
import LaboratoriesCrud from './dashboard/pages/LaboratoriesCrud.jsx';

const App = () => {
  const location = useLocation(); // kjo ndjek path-in aktual

  return (
    <div className="mx-4 sm:mx-[10%]">
      {/* Navbar gjithmonë on top */}
      <Navbar />
      <ToastContainer position="top-center" autoClose={3000} />
      <ScrollToTop />

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
        <Route path="/pacientet" element={<ProtectedRoute><Pacientet /></ProtectedRoute>} />
        <Route path="/usersimple" element={<ProtectedRoute><UserSimple /></ProtectedRoute>} />
        <Route path="/laboratories" element={<LaboratoriesList />} />
        <Route path="/laboratory/:labId/request" element={<AnalysisRequestForm />} />
        <Route path="/my-analyses" element={<MyAnalyses />} />
        {/* =================== DASHBOARD (ADMIN) =================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireRole="admin">
              <SidebarProvider>
              <AppLayout /> {/* Sidebar + Outlet */}
              </SidebarProvider>
            </ProtectedRoute>
          }
        >
          
          <Route path="profile" element={<AdminProfile />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="users" element={<BasicTableOne />} />
          <Route path="blank" element={<Blank />} />
          <Route path="doctors-crud" element={<DoctorsCrud />} />
          <Route path="add-laboratory" element={<AdminLaboratories />} />
          <Route path="laboratories-crud" element={<LaboratoriesCrud />} />
          <Route path="form-elements" element={<FormElements />} />
          <Route path="basic-tables" element={<BasicTables />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="avatars" element={<Avatars />} />
          <Route path="badge" element={<Badges />} />
          <Route path="buttons" element={<Buttons />} />
          <Route path="images" element={<Images />} />
          <Route path="videos" element={<Videos />} />
          <Route path="line-chart" element={<LineChart />} />
          <Route path="bar-chart" element={<BarChart />} />
        </Route>


        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Footer vetëm kur nuk je në dashboard */}
      {!location.pathname.startsWith("/dashboard") && <Footer />}
    </div>
  );
};

export default App;