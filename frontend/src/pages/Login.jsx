import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../api"; // ✅ Përmirësim: përdorim wrapper me auto-refresh dhe menaxhim token
import ForgotPassword from "../components/ForgotPassword";

const Login = () => {
  const [state, setState] = useState("Log in"); // ose 'Sign Up'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      if (state === "Sign Up") {
        // Thirrje e thjeshtë fetch për Sign Up, nuk ka token akoma
        const response = await fetch("http://localhost:5000/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
          credentials: "include", // ✅ shto këtë
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || "Ka ndodhur një gabim");
        } else {
          setMessage(data.message);
          setState("Log in"); // ✅ Përmirësim: pas signup ridrejto te login
        }
      } else {
        // Login → përdorim apiFetch me auto-refresh
        const data = await apiFetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        // Handle inactive doctor accounts
        if (data.status === 'inactive') {
          setMessage(data.error);
          return;
        }

        // ✅ Përmirësim: ruaj access token dhe role në localStorage
        if (data.accessToken)
          localStorage.setItem("accessToken", data.accessToken);
        if (data.role) localStorage.setItem("role", data.role);

        if (window.handleLogin) window.handleLogin();

        // ✅ Përmirësim: ridrejto në dashboard ose home sipas role
        if (data.role === 'admin') {
          navigate('/dashboard');
        } else if (data.role === 'doctor') {
          navigate('/doctor');
        } else if (data.role === 'lab') {
          navigate('/lab');
        } else {
          navigate('/');
        }
      }

      // Pastrimi i form-it
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error(err);
      setMessage(err.error || "Gabim në lidhje me serverin");
    }
  };

  // Handle forgot password view
  if (showForgotPassword) {
    return (
      <ForgotPassword 
        onBackToLogin={() => setShowForgotPassword(false)} 
      />
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form
        className="flex flex-col gap-4 p-8 border rounded-xl shadow-lg min-w-[340px] text-zinc-600"
        onSubmit={onSubmitHandler}
      >
        <h2 className="text-2xl font-semibold">
          {state === "Sign Up" ? "Create Account" : "Login"}
        </h2>
        <p>Please {state === "Sign Up" ? "Sign Up" : "Log in"} to continue</p>

        {state === "Sign Up" && (
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
          {state === "Sign Up" ? "Create Account" : "Login"}
        </button>

        {message && <p className="text-red-600 mt-2">{message}</p>}

        <p>
          {state === "Sign Up"
            ? "Already have an account? "
            : "Create a new account? "}
          <span
            onClick={() => setState(state === "Sign Up" ? "Log in" : "Sign Up")}
            className="text-blue-600 underline cursor-pointer"
          >
            {state === "Sign Up" ? "Login here" : "Click here"}
          </span>
        </p>

        {state === "Log in" && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Forgot Password?
            </button>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Medical professionals: Contact admin for account setup
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
