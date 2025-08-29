import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import React from 'react'
import { Route, Routes } from 'react-router-dom'

import Navbar from './components/Navbar'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import Appointment from './pages/Appointment'
import Footer from './components/Footer'
import Pacientet from './components/Pacientet'
import ProtectedRoute from './components/ProtectedRoute'
import UserSimple from './components/UserSimple'

// ====== Dashboard imports ======
import AppLayout from './dashboard/layout/AppLayout'
import { ScrollToTop } from './dashboard/components/common/ScrollToTop'
import DashboardHome from './dashboard/pages/Dashboard/Home'
import UserProfiles from './dashboard/pages/UserProfiles'
import Calendar from './dashboard/pages/Calendar'
import Blank from './dashboard/pages/Blank'
import FormElements from './dashboard/pages/Forms/FormElements'
import BasicTables from './dashboard/pages/Tables/BasicTables'
import Alerts from './dashboard/pages/UiElements/Alerts'
import Avatars from './dashboard/pages/UiElements/Avatars'
import Badges from './dashboard/pages/UiElements/Badges'
import Buttons from './dashboard/pages/UiElements/Buttons'
import Images from './dashboard/pages/UiElements/Images'
import Videos from './dashboard/pages/UiElements/Videos'
import LineChart from './dashboard/pages/Charts/LineChart'
import BarChart from './dashboard/pages/Charts/BarChart'
import SignIn from './dashboard/pages/AuthPages/SignIn'
import SignUp from './dashboard/pages/AuthPages/SignUp'
import NotFound from './dashboard/pages/OtherPage/NotFound'
import BasicTableOne from './dashboard/components/tables/BasicTables/BasicTableOne'

const App = () => {
  return (
    <div className='mx-4 sm:mx-[10%]'>
      <Navbar />
      <ToastContainer position='top-center' autoClose={3000} />

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

        {/* =================== DASHBOARD =================== */}
        <Route path="/dashboard" element={
          <ProtectedRoute requireRole="admin">
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="profile" element={<UserProfiles />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="users" element={<BasicTableOne />} /> 
          <Route path="blank" element={<Blank />} />
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

        {/* =================== AUTH PAGES nga dashboard =================== */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </div>
  )
}

export default App
