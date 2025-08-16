import React, { useState } from 'react'

const Login = () => {
  const [state, setState] = useState('Sign Up') // 'Sign Up' ose 'Log in'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('') // për feedback nga backend

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {
      const payload = state === 'Sign Up' 
        ? { name, email, password } 
        : { email, password }

          const url = state === 'Sign Up' 
        ? 'http://localhost:5000/api/users' 
        : 'http://localhost:5000/api/login';

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Ka ndodhur një gabim')
      } else {
        setMessage(data.message)
        if (state === 'Log in') {
          // ruaj token në localStorage për përdorim të mëvonshëm
          localStorage.setItem('token', data.token);
        }
        // pas suksesi, pastro input-et
        setName('')
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setMessage('Gabim në lidhje me serverin')
      console.error(err)
    }
  }

  return (
    <form className='min-h-[80vh] flex items-center justify-center' onSubmit={onSubmitHandler}>
      <div className='flex flex-col gap-3 items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>
          {state === 'Sign Up' ? "Create Account" : "Login"}
        </p>
        <p>Please {state === 'Sign Up' ? "Sign Up" : "Log in"} to book appointment</p>

        {state === "Sign Up" && (
          <div className='w-full'>
            <p>Full Name</p>
            <input
              className='border border-zinc-300 rounded w-full p-2 mt-1'
              type="text"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />
          </div>
        )}

        <div className='w-full'>
          <p>Email</p>
          <input
            className='border border-zinc-300 rounded w-full p-2 mt-1'
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
        </div>

        <div className='w-full'>
          <p>Password</p>
          <input
            className='border border-zinc-300 rounded w-full p-2 mt-1'
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
          />
        </div>

        <button
          type="submit"
          className='bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded-md text-base'
        >
          {state === 'Sign Up' ? "Create Account" : "Login"}
        </button>

        {message && <p className='text-green-600 mt-2'>{message}</p>}

        {state === "Sign Up" ? (
          <p>
            Already have an account?{' '}
            <span
              onClick={() => setState('Log in')}
              className='text-blue-600 underline cursor-pointer'
            >
              Login here
            </span>
          </p>
        ) : (
          <p>
            Create a new Account?{' '}
            <span
              onClick={() => setState('Sign Up')}
              className='text-blue-600 underline cursor-pointer'
            >
              Click Here
            </span>
          </p>
        )}
      </div>
    </form>
  )
}

export default Login
