import React, { useState } from "react";
import contactImage from "../assets/contact_image.png";
import { API_URL } from "../api";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
    attachment: null
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      attachment: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('message', formData.message);
      if (formData.attachment) {
        formDataToSend.append('attachment', formData.attachment);
      }

      const response = await fetch(`${API_URL}/api/contact/send-message`, {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          message: "",
          attachment: null
        });
      } else {
        alert("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 mx-4 sm:mx-[10%]">
        <div className="bg-white shadow-xl rounded-2xl max-w-2xl w-full p-10 text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Message Sent Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for contacting us. We'll get back to you soon.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 mx-4 sm:mx-[10%]">
      <div className="flex flex-col md:flex-row bg-white shadow-xl rounded-2xl max-w-5xl w-full">
        {/* Left Image Section */}
        <div className="md:w-1/2">
          <img
            src={contactImage}
            alt="Contact"
            className="h-full w-full object-cover rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
          />
        </div>

        {/* Right Form Section */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Let's Get In Touch.
          </h2>
          <p className="text-gray-500 mb-8">
            Send us a message and we'll get back to you as soon as possible.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                placeholder="Enter your first name..."
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                placeholder="Enter your last name..."
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <input
              type="email"
              id="email"
              autoComplete="email"
              name="email"
              placeholder="Enter your email address..."
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <textarea
              id="message"
              name="message"
              placeholder="Enter your message here..."
              rows="4"
              maxLength={500}
              value={formData.message}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>

            {/* File Attachment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attach File (Optional)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Message →"}
              </button>
            </div>
            
            {/* Check Replies Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm mb-2">
                Want to check for replies to your messages?
              </p>
              <a
                href="/check-replies"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                <span>📧 Check Your Replies</span>
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
