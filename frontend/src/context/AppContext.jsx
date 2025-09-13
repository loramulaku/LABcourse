import { createContext, useContext, useEffect, useState } from "react";
import { API_URL } from "../api";

const AppContext = createContext();
export { AppContext };

export const AppProvider = ({ children }) => {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/doctors`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Ensure data is an array
        if (Array.isArray(data)) {
          setDoctors(data);
        } else {
          console.warn("Doctors data is not an array:", data);
          setDoctors([]);
        }
      })
      .catch((err) => {
        console.error("❌ Gabim duke marrë doktorët:", err);
        setDoctors([]); // Set empty array on error
      });
  }, []);

  return (
    <AppContext.Provider value={{ doctors }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

export default AppProvider;
