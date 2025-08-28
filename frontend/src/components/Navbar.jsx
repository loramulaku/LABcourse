import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { NavLink, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(!!localStorage.getItem('accessToken')); 
  const [role, setRole] = useState(localStorage.getItem('role'));

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      localStorage.removeItem('accessToken');
      localStorage.removeItem('role');
      setToken(false);
      setRole(null);
      navigate('/login');
    } catch (err) {
      console.error('Gabim gjatë logout', err);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('role');
      setToken(false);
      setRole(null);
      navigate('/login');
    }
  };

  const handleLogin = () => {
    setToken(true);
    setRole(localStorage.getItem("role"));
  };

  useEffect(() => {
    window.handleLogin = handleLogin;
  }, []);

  const goToSignUp = () => {
    navigate('/login');
  };

  return (
    <div className="flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400">
      {/* Logo */}
      <img 
        onClick={() => navigate('/')} 
        className="w-44 cursor-pointer" 
        src={assets.logo} 
        alt="Logo" 
      />

      {/* Menu links */}
      <ul className="hidden md:flex items-start gap-5 font-medium">
        <NavLink to="/"><li>HOME</li></NavLink>
        <NavLink to="/doctors"><li>ALL DOCTORS</li></NavLink>
        <NavLink to="/about"><li>ABOUT</li></NavLink>
        <NavLink to="/contact"><li>CONTACT</li></NavLink>
      </ul>

      {/* Profile / Auth */}
      <div className="flex items-center gap-4">
        {token ? (
          <div className="flex items-center gap-2 cursor-pointer group relative">
            <img className="w-8 rounded-full" src={assets.profile_pic} alt="Profile" />
            <img className="w-2.5" src={assets.dropdown_icon} alt="Dropdown" />

            {/* Dropdown */}
            <div className="absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 
                            z-20 opacity-0 pointer-events-none 
                            group-hover:opacity-100 group-hover:pointer-events-auto 
                            transition-all duration-200">
              <div className="min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4 shadow-lg">
                <p 
                  onClick={() => navigate('/my-profile')} 
                  className="hover:text-black cursor-pointer"
                >
                  My Profile
                </p>

                <p 
                  onClick={() => navigate('/my-appointments')} 
                  className="hover:text-black cursor-pointer"
                >
                  My Appointments
                </p>

                {/* Vetëm për admin */}
                {role === "admin" && (
                  <p 
                    onClick={() => navigate('/dashboard')} 
                    className="hover:text-black cursor-pointer"
                  >
                    Admin Dashboard
                  </p>
                )}

                <p 
                  onClick={handleLogout} 
                  className="hover:text-black cursor-pointer"
                >
                  Logout
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={goToSignUp}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 
                       rounded-full font-medium hidden md:block transition-colors"
          >
            Create Account
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
