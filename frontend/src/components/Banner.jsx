import React from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

const Banner = () => {
  const navigate = useNavigate();
  return (
    <div className="banner-container">
      {/* ------- Left Side ------- */}

      <div className="banner-content">
        <div className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold text-white">
          <p>Request Laboratory Analysis</p>
          <p className="mt-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl whitespace-nowrap">
            With Trusted & Certified Medical Laboratories
          </p>
        </div>
        <button
          onClick={() => {
            navigate("/laboratories");
            scrollTo(0, 0);
          }}
          className="bg-white text-sm sm:text-base text-[#595959] px-8 py-3 rounded-full mt-6 hover:scale-105 transition-all "
        >
          Choose a Lab
        </button>
      </div>
      {/* ------- Right Side ------- */}

      <div className="banner-image">
        <img
          src={assets.appointment_img}
          alt="Laboratory Analysis"
        />
      </div>
    </div>
  );
};

export default Banner;
