import React, { useState } from 'react'
import { assets } from '../assets/assets';

import { NavLink, useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false)
  const [token, setToken] = useState(true)

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400'>
      <img onClick={() => navigate('/')}
        className='w-44 cursor-pointer'
        src={assets.logo}
        alt='Logo'
      />

      <ul className='hidden md:flex items-start gap-5 font-medium'>
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `py-1 px-2 ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700'}`
          }
        >
          HOME
        </NavLink>

        <NavLink
          to="/doctors"
          className={({ isActive }) =>
            `py-1 px-2 ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700'}`
          }
        >
          ALL DOCTORS
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            `py-1 px-2 ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700'}`
          }
        >
          ABOUT
        </NavLink>

        <NavLink
          to="/contact"
          className={({ isActive }) =>
            `py-1 px-2 ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700'}`
          }
        >
          CONTACT
        </NavLink>

      </ul>

      <div className='flex items-center gap-4'>
        {
          token
            ? <div className='flex items-center gap-2 cursor-pointer group relative'>
              <img className='w-8 rounded-full' src={assets.profile_pic} alt="Profile" />
              <img className='w-2.5' src={assets.dropdown_icon} alt="Dropdown" />

              <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200'>
                <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>
                  <p onClick={() => navigate('my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                  <p onClick={() => navigate('my-appointments')} className='hover:text-black cursor-pointer'>My Appointments</p>
                  <p onClick={() => setToken(false)} className='hover:text-black cursor-pointer'>Logout</p>
                </div>
              </div>
            </div>
            : <button onClick={() => navigate('/login')} className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium hidden md:block transition-colors'>Create account</button>
        }

      </div>
    </div>
  )
}

export default Navbar

