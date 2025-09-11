import { createContext, useContext, useEffect, useState } from "react";
import { API_URL } from "../api";

const AppContext = createContext();
export { AppContext };

export const AppProvider = ({ children }) => {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/doctors`)
      .then((res) => res.json())
      .then((data) => setDoctors(data))
      .catch((err) => console.error("❌ Gabim duke marrë doktorët:", err));
  }, []);

  return (
    <AppContext.Provider value={{ doctors }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

export default AppProvider;
