import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import LazyImage from "../components/LazyImage";
import NavMenu from "../components/Navbar";   // import Nav
import Footer from "../components/Footer";     // import Footer
import { API_URL } from "../api";

const Doctors = () => {
  const { department } = useParams();
  const [filterDoc, setFilterDoc] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { doctors } = useAppContext();

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${API_URL}/api/departments`);
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Get department name by ID
  const getDepartmentName = (deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept?.name || "Unknown";
  };

  const applyFilter = () => {
    if (department) {
      const filtered = doctors.filter((doc) => {
        const deptName = getDepartmentName(doc.department_id);
        return deptName === department;
      });
      setFilterDoc(filtered);
    } else {
      setFilterDoc(doctors);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [doctors, department, departments]);

  return (
    <>
      <NavMenu /> {/* Navbar */}
      <div className="mx-4 sm:mx-[10%] mt-6">
        <p className="text-gray-600">Browse through the doctors specialist.</p>
        <p className="text-sm text-blue-600 font-semibold mt-3 mb-4">📋 Filter by department</p>
        <div className="flex flex-col sm:flex-row items-start gap-5 mt-5">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${
              showFilter ? "bg-primary text-white" : ""
            }`}
          >
            Filters
          </button>

          <div
            className={`flex-col gap-4 text-sm text-gray-600 ${
              showFilter ? "flex" : "hidden sm:flex"
            }`}
          >
            {departments.map((dept) => (
              <p
                key={dept.id}
                onClick={() =>
                  department === dept.name ? navigate("/doctors") : navigate(`/doctors/${dept.name}`)
                }
                className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
                  department === dept.name ? "bg-[#E2E5FF] text-black" : ""
                }`}
              >
                {dept.name}
              </p>
            ))}
          </div>

          <div className="w-full grid gap-y-6 gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filterDoc.map((item, index) => (
              <div
                onClick={() => {
                  navigate(`/appointment/${item.id}`);
                  scrollTo(0, 0);
                }}
                className="border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
                key={index}
              >
                <LazyImage
                  className="bg-[#EAEFFF] w-full h-48 object-cover"
                  src={
                    item?.image?.startsWith("http")
                      ? item.image
                      : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${
                          item?.image || ""
                        }`
                  }
                  alt={`Dr. ${item.User?.name || item.name}`}
                  fallbackSrc="/vite.svg"
                  placeholder={<div className="text-gray-400">👨‍⚕️</div>}
                />
                <div className="p-4">
                  <div
                    className={`flex items-center gap-2 text-sm text-center ${
                      item.available ? "text-green-500" : "text-gray-500"
                    }`}
                  >
                    <p
                      className={`w-2 h-2 rounded-full ${
                        item.available ? "bg-green-500" : "bg-gray-500"
                      }`}
                    ></p>
                    <p>{item.available ? "Available" : "Not Available"}</p>
                  </div>
                  <p className="text-[#262626] text-lg font-medium">{item.User?.name || item.name}</p>
                  <p className="text-[#5C5C5C] text-sm">{getDepartmentName(item.department_id)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer /> {/* Footer */}
    </>
  );
};

export default Doctors;

