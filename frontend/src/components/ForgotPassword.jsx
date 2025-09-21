import React, { useState } from "react";
import apiFetch from "../api";

export default function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState("email"); // 'email' or 'reset'

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setMessage(response.message);
      setStep("email");
    } catch (error) {
      setMessage(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="flex flex-col gap-4 p-8 border rounded-xl shadow-lg min-w-[340px] text-zinc-600">
        <h2 className="text-2xl font-semibold">Forgot Password</h2>
        <p className="text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-zinc-300 rounded w-full p-2 mt-1"
              required
              placeholder="Enter your email address"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-base disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          {message && (
            <div className={`p-3 rounded-md ${
              message.includes("sent") 
                ? "bg-green-100 text-green-700" 
                : "bg-red-100 text-red-700"
            }`}>
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full text-blue-600 hover:text-blue-800 text-sm"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
