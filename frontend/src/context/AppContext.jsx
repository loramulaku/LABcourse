import { createContext, useContext, useEffect, useState } from "react";
import { API_URL } from "../api";

const AppContext = createContext();
export { AppContext };

export const AppProvider = ({ children }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/doctors`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          setDoctors(data);
        } else {
          console.warn("Doctors data is not an array:", data);
          setDoctors([]);
        }
      } catch (err) {
        console.error("❌ Gabim duke marrë doktorët:", err);
        setDoctors([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  return (
    <AppContext.Provider value={{ 
      doctors, 
      loading, 
      currencySymbol: '€' // Default currency symbol
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

export default AppProvider;
