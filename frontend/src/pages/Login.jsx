import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [state, setState] = useState('Sign Up'); // 'Sign Up' ose 'Log in'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const payload = state === 'Sign Up' ? { name, email, password } : { email, password };
      const url =
        state === 'Sign Up'
          ? 'http://localhost:5000/api/auth/signup'
          : 'http://localhost:5000/api/auth/login';

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Ka ndodhur një gabim');
      } else {
        setMessage(data.message);

        if (state === 'Log in' && data.token) {
          // Ruaj token dhe role
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role);

          // Përmirësimi: thirret funksioni global i Navbar për të shfaqur profilin
          if (window.handleLogin) window.handleLogin();

          if (data.role === 'admin') navigate('/dashboard');
          else navigate('/');
        }

        if (state === 'Sign Up') {
          setState('Log in'); // pas signup ridrejto te login
        }

        setName('');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      setMessage('Gabim në lidhje me serverin');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form
        className="flex flex-col gap-4 p-8 border rounded-xl shadow-lg min-w-[340px] text-zinc-600"
        onSubmit={onSubmitHandler}
      >
        <h2 className="text-2xl font-semibold">{state === 'Sign Up' ? 'Create Account' : 'Login'}</h2>
        <p>Please {state === 'Sign Up' ? 'Sign Up' : 'Log in'} to continue</p>

        {state === 'Sign Up' && (
          <div className="w-full">
            <p>Full Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-zinc-300 rounded w-full p-2 mt-1"
              required
            />
          </div>
        )}

        <div className="w-full">
          <p>Email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            required
          />
        </div>

        <div className="w-full">
          <p>Password</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-base"
        >
          {state === 'Sign Up' ? 'Create Account' : 'Login'}
        </button>

        {message && <p className="text-red-600 mt-2">{message}</p>}

        <p>
          {state === 'Sign Up' ? 'Already have an account? ' : 'Create a new account? '}
          <span
            onClick={() => setState(state === 'Sign Up' ? 'Log in' : 'Sign Up')}
            className="text-blue-600 underline cursor-pointer"
          >
            {state === 'Sign Up' ? 'Login here' : 'Click here'}
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
