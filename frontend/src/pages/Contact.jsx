import React from "react";  
import contactImage from "../assets/contact_image.png"; // replace with your own image

const ContactForm = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
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
            Let’s Get In Touch.
          </h2>
          <p className="text-gray-500 mb-8">
            Or just reach out manually to{" "}
            <a
              href="mailto:ritaukiqi1@gmail.com"
              className="text-indigo-600 hover:underline"
            >
              ritaukiqi1@gmail.com
            </a>
          </p>

          <form
  action="https://formspree.io/f/xrbanoje"
  method="POST"
  className="space-y-6"
>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <input
      type="text"
      name="firstName"
      placeholder="Enter your first name..."
      required
      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
    <input
      type="text"
      name="lastName"
      placeholder="Enter your last name..."
      required
      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>

  <input
    type="email"
    name="email"
    placeholder="Enter your email address..."
    required
    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  />

  <textarea
    name="message"
    placeholder="Enter your main text here..."
    rows="4"
    maxLength={300}
    required
    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  ></textarea>

  <div className="pt-4">
    <button
      type="submit"
      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
    >
      Submit Form →
    </button>
  </div>
</form>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
