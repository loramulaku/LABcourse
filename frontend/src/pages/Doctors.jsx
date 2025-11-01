import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import LazyImage from "../components/LazyImage";
import NavMenu from "../components/Navbar";
import Footer from "../components/Footer";
import { API_URL } from "../api";

const Doctors = () => {
  const { department } = useParams();
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

  // Memoize department lookup map for better performance
  const departmentMap = useMemo(() => {
    const map = new Map();
    departments.forEach(dept => map.set(dept.id, dept.name));
    return map;
  }, [departments]);

  // Get department name by ID using memoized map
  const getDepartmentName = useCallback((deptId) => {
    return departmentMap.get(deptId) || "Unknown";
  }, [departmentMap]);

  // Apply filtering with useMemo for automatic recalculation
  const filterDoc = useMemo(() => {
    console.log('=== FILTERING DEBUG ===');
    console.log('Department filter:', department);
    console.log('Total doctors:', doctors.length);
    console.log('Departments loaded:', departments.length);

    // If no department filter, show all doctors
    if (!department) {
      console.log('No filter - showing all doctors');
      return doctors;
    }

    // Wait for departments to load before filtering
    if (departments.length === 0) {
      console.log('Waiting for departments to load...');
      return [];
    }

    // Filter doctors by department
    const filtered = doctors.filter((doc) => {
      const deptName = getDepartmentName(doc.department_id);
      const matches = deptName === department;
      console.log(`Doctor ${doc.User?.name}: department_id=${doc.department_id}, deptName="${deptName}", matches=${matches}`);
      return matches;
    });

    console.log(`Filtered result: ${filtered.length} doctors`);
    return filtered;
  }, [doctors, department, departments, getDepartmentName]);

  return (
    <>
      <NavMenu /> {/* Navbar */}
      <div className="mt-8 mb-12">
        {/* Dynamic Hero Section */}
        <div className="mb-8 text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
            {department ? (
              `Browse ${department} Doctors`
            ) : (
              "Browse Our Doctors"
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto">
            {department 
              ? `Find specialized ${department.toLowerCase()} doctors for your healthcare needs` 
              : "Explore our team of experienced medical professionals across all specialties"}
          </p>
        </div>

        {/* Filter Section with Modern Design */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-6 mb-8 shadow-sm mx-4 sm:mx-6 lg:mx-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filter by Department</h2>
          </div>
        </div>

        {/* Doctors Grid Section */}
        <div className="flex flex-col sm:flex-row items-start gap-5 mt-5 mx-4 sm:mx-6 lg:mx-8">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${
              showFilter ? "bg-primary text-white" : ""
            }`}
          >
            Filters
          </button>

          {/* Vertical Filter Sidebar */}
          <div
            className={`flex-col gap-4 text-sm text-gray-600 ${
              showFilter ? "flex" : "hidden sm:flex"
            }`}
          >
            {/* All Doctors Button */}
            <p
              onClick={() => navigate("/doctors")}
              className={`w-[94vw] sm:w-auto pl-3 py-2 pr-16 border border-gray-300 rounded-lg transition-all cursor-pointer font-semibold ${
                !department ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              All Doctors
            </p>
            
            {/* Department Filters */}
            {departments.map((dept) => (
              <p
                key={dept.id}
                onClick={() =>
                  department === dept.name ? navigate("/doctors") : navigate(`/doctors/${dept.name}`)
                }
                className={`w-[94vw] sm:w-auto pl-3 py-2 pr-16 border border-gray-300 rounded-lg transition-all cursor-pointer ${
                  department === dept.name ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {dept.name}
              </p>
            ))}
          </div>

          <div className="w-full">
            {/* Results Counter */}
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Showing <span className="font-semibold" style={{ color: '#000' }}>{filterDoc.length}</span> doctor{filterDoc.length !== 1 ? 's' : ''}
                {department && <> in <span className="font-semibold" style={{ color: '#000' }}>{department}</span></>}
              </p>
            </div>

            {/* Doctors Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filterDoc.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No doctors found in this department</p>
                <button
                  onClick={() => navigate('/doctors')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Show All Doctors
                </button>
              </div>
            )}
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
      </div>
      <Footer /> {/* Footer */}
    </>
  );
};

export default Doctors;

