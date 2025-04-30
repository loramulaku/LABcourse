import React from 'react'
import { assets } from '../assets/assets'
import { NavLink } from 'react-router-dom'

const Navbar = () => {
  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400'>
      <img
        className='w-44 cursor-pointer'
        src={assets.logo}
        alt='Logo'
      />

      <ul className='hidden md:flex items-start gap-5 font-medium'>
        <NavLink to='/'>
          <li>HOME</li>
          <hr />
        </NavLink>

        <NavLink to='/doctors'>
          <li>ALL DOCTORS</li>
          <hr />
        </NavLink>

        <NavLink to='/about'>
          <li>ABOUT</li>
          <hr />
        </NavLink>

        <NavLink to='/contact'>
          <li>CONTACT</li>
          <hr />
        </NavLink>
      </ul>

      <div>
        <button>Create account</button>
      </div>
    </div>
  )
}

export default Navbar
