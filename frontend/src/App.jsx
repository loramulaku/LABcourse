import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import React from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import Appointment from './pages/Appointment'
import Footer from './components/Footer';
import Pacientet from './components/Pacientet';
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import UserSimple from './components/UserSimple'


const App = () => {

     const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");


  return (
    <div className='mx-4 sm:mx-[10%]'>

      <Navbar />
   
      <ToastContainer position='top-center' autoClose={3000} />
       
     <Routes>
      {/* login është i lirë */}
      <Route path="/login" element={<Login />} />

      {/* faqet që kërkojnë vetëm token */}
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

      {/* për adminin kontrollo edhe rolin */}
      <Route
        path="/dashboard"
        element={
          token && role === "admin"
            ? <Dashboard />
            : <Navigate to="/login" />
        }
      />
    </Routes>
      <Footer/>
    </div>
  )
}

export default App
