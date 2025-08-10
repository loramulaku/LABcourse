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
import Footer from './components/Footer';
import Pacientet from './components/Pacientet';
import UserSimple from './components/UserSimple'


const App = () => {
  return (
    <div className='mx-4 sm:mx-[10%]'>

      <Navbar />
   
      <ToastContainer position='top-center' autoClose={3000} />
       
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<Doctors />} />
        <Route path='/doctors/:speciality' element={<Doctors />} />
        <Route path='/login' element={<Login />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/my-profile' element={<MyProfile />} />
        <Route path='/my-appointments' element={<MyAppointments />} />
        <Route path='/appointment/:docId' element={<Appointment />} />
        <Route path='/pacientet' element={<Pacientet />} />
        <Route path='/usersimple' element={<UserSimple />} />

      </Routes>
      <Footer/>
    </div>
  )
}

export default App
