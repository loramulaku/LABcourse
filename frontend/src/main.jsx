import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import AppContextProvider from "./context/AppContext.jsx";
import { HelmetProvider } from "react-helmet-async";
import { SidebarProvider } from "./dashboard/context/SidebarContext.js";

createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <BrowserRouter>
      <AppContextProvider>
        <SidebarProvider>
          <App />
        </SidebarProvider>
      </AppContextProvider>
    </BrowserRouter>
  </HelmetProvider>,
);
