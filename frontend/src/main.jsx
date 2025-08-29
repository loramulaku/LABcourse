import React from 'react'
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import AppContextProvider from './context/AppContext.jsx';
import { ThemeProvider } from './dashboard/context/ThemeContext'; // path sipas file-it tënd
import { HelmetProvider } from 'react-helmet-async';
import { SidebarProvider } from './dashboard/context/SidebarContext.js';

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
  <BrowserRouter>
  <AppContextProvider>
    <ThemeProvider>
  <SidebarProvider>
    <App/>
  </SidebarProvider>
  </ThemeProvider>
  </AppContextProvider>
  </BrowserRouter>
  </HelmetProvider>
);
