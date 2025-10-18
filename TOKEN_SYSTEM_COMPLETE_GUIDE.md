# 🔐 Complete Token System Implementation Guide

## 📋 **Table of Contents**
1. [System Overview](#system-overview)
2. [Token Architecture](#token-architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Token Lifecycle](#token-lifecycle)
6. [Security Features](#security-features)
7. [Error Handling](#error-handling)
8. [Testing & Debugging](#testing--debugging)
9. [Implementation Checklist](#implementation-checklist)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 **System Overview**

### **What This System Does:**
This token system provides **secure, stateless authentication** with automatic token refresh capabilities. It ensures users stay logged in seamlessly while maintaining high security standards.

### **Key Features:**
- **Dual Token System**: Access tokens (short-lived) + Refresh tokens (long-lived)
- **Automatic Refresh**: Seamless token renewal without user intervention
- **Global Monitoring**: Background detection of missing tokens
- **Role-Based Access**: Multi-role permission system
- **Security First**: HttpOnly cookies, token rotation, XSS protection

### **Why This Architecture:**
- **Security**: Short-lived access tokens reduce attack window
- **User Experience**: Automatic refresh prevents unexpected logouts
- **Scalability**: Stateless design works across multiple servers
- **Maintainability**: Clean separation of concerns

---

## 🏗️ **Token Architecture**

### **Two-Token System:**

```
┌─────────────────┐    ┌─────────────────┐
│   Access Token  │    │  Refresh Token  │
│   (15 minutes)  │    │   (7 days)      │
│                 │    │                 │
│ • Stored in     │    │ • Stored in     │
│   localStorage  │    │   HttpOnly      │
│ • Sent in       │    │   cookie        │
│   Authorization │    │ • Not accessible│
│   header        │    │   to JavaScript│
│ • Short-lived   │    │ • Long-lived    │
└─────────────────┘    └─────────────────┘
```

### **Token Flow:**
```
User Login → Generate Both Tokens → Store Refresh in Cookie → Send Access to Frontend
     ↓
API Request → Check Access Token → Valid? → Process Request
     ↓
Invalid/Expired? → Use Refresh Token → Get New Access Token → Retry Request
```

---

## 🔧 **Backend Implementation**

### **1. Dependencies & Setup**

#### **Install Required Packages:**
```bash
npm install jsonwebtoken argon2 cookie-parser
```

#### **Environment Variables:**
```env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### **2. Token Generation Functions**

#### **Access Token Generation:**
```javascript
const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      role: user.role,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }  // 15 minutes
  );
};
```

#### **Refresh Token Generation:**
```javascript
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }  // 7 days
  );
};
```

### **3. Login Endpoint Implementation**

```javascript
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user in database
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Store refresh token in database
    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken
    });
    
    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,                    // Not accessible to JavaScript
      secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
      sameSite: 'lax',                  // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in milliseconds
    });
    
    // Send access token in response
    res.json({
      accessToken,
      role: user.role,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email 
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### **4. Token Refresh Endpoint**

```javascript
const refresh = async (req, res) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and token in database
    const user = await User.findByPk(decoded.id);
    const tokenRecord = await RefreshToken.findOne({
      where: { 
        token: refreshToken, 
        user_id: user.id 
      }
    });
    
    if (!user || !tokenRecord) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    // Update refresh token in database (token rotation)
    await tokenRecord.update({ token: newRefreshToken });
    
    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    // Send new access token
    res.json({
      accessToken: newAccessToken,
      role: user.role
    });
    
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};
```

### **5. Token Validation Middleware**

```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};
```

### **6. Role-Based Authorization Middleware**

```javascript
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Usage examples:
app.get('/api/admin/users', authenticateToken, requireRole(['admin']), getUsers);
app.get('/api/doctor/appointments', authenticateToken, requireRole(['doctor', 'admin']), getAppointments);
```

### **7. Logout Endpoint**

```javascript
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Remove refresh token from database
      await RefreshToken.destroy({
        where: { token: refreshToken }
      });
    }
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.json({ message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

---

## 🎨 **Frontend Implementation**

### **1. Token Management Functions**

```javascript
// Token storage and retrieval
export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem("accessToken", token);
    console.log('[TOKEN] Access token set:', token.substring(0, 30) + '...');
  } else {
    localStorage.removeItem("accessToken");
    console.log('[TOKEN] Access token cleared');
  }
}

export function getRole() {
  return localStorage.getItem("role");
}

export function setRole(role) {
  if (role) {
    localStorage.setItem("role", role);
    console.log('[TOKEN] Role set:', role);
  } else {
    localStorage.removeItem("role");
    console.log('[TOKEN] Role cleared');
  }
}

export function clearAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("role");
  localStorage.removeItem("userName");
  console.log('[TOKEN] All auth data cleared');
}
```

### **2. Global Token Monitoring System**

```javascript
// Global token monitoring variables
let tokenMonitorInterval = null;
let isRefreshing = false;

// Start monitoring for token changes
export function startTokenMonitoring() {
  if (tokenMonitorInterval) return; // Already monitoring
  
  console.log('[TOKEN] Starting token monitoring...');
  
  tokenMonitorInterval = setInterval(() => {
    const currentToken = getAccessToken();
    const currentRole = getRole();
    
    // If we have a role but no token, try to refresh
    if (currentRole && !currentToken && !isRefreshing) {
      console.log('[TOKEN] Detected missing access token, attempting refresh...');
      attemptTokenRefresh();
    }
  }, 1000); // Check every second
}

// Stop monitoring
export function stopTokenMonitoring() {
  if (tokenMonitorInterval) {
    clearInterval(tokenMonitorInterval);
    tokenMonitorInterval = null;
    console.log('[TOKEN] Token monitoring stopped');
  }
}

// Attempt to refresh the token
async function attemptTokenRefresh() {
  if (isRefreshing) return; // Prevent multiple simultaneous refreshes
  
  isRefreshing = true;
  console.log('[TOKEN] Starting automatic token refresh...');
  
  try {
    const res = await fetch('http://localhost:5000/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('[TOKEN] Refresh response status:', res.status);

    if (res.ok) {
      const data = await res.json();
      console.log('[TOKEN] ✅ Automatic refresh successful!');
      
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        
        if (data.role) {
          setRole(data.role);
        }
        
        console.log('[TOKEN] ✅ Authentication restored automatically');
        
        // Dispatch a custom event to notify components
        window.dispatchEvent(new CustomEvent('tokenRefreshed', { 
          detail: { accessToken: data.accessToken, role: data.role } 
        }));
      }
    } else {
      console.log('[TOKEN] ❌ Automatic refresh failed, status:', res.status);
      clearAuth();
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('tokenRefreshFailed'));
    }
  } catch (err) {
    console.log('[TOKEN] ❌ Automatic refresh error:', err.message);
    clearAuth();
    window.dispatchEvent(new CustomEvent('tokenRefreshFailed'));
  } finally {
    isRefreshing = false;
  }
}
```

### **3. Centralized API Service**

```javascript
export default async function apiFetch(url, options = {}) {
  let token = getAccessToken();
  const headers = { ...(options.headers || {}) };

  // Add authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Ensure credentials are included for cookies
  const fetchOptions = { 
    ...options, 
    headers, 
    credentials: "include" 
  };
  
  let response = await fetch(url, fetchOptions);

  // Auto-refresh on 401/403 responses
  if (response.status === 401 || response.status === 403) {
    console.log('[TOKEN] Access token invalid, attempting refresh...');
    
    try {
      const refreshRes = await fetch('http://localhost:5000/api/auth/refresh', {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (!refreshRes.ok) {
        console.log('[TOKEN] Refresh failed, clearing auth data');
        clearAuth();
        
        // Only redirect if we're not already on login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        throw new Error("Session expired");
      }
      
      const data = await refreshRes.json();
      if (!data.accessToken) {
        console.log('[TOKEN] No access token in refresh response');
        throw new Error("No access token from refresh");
      }
      
      console.log('[TOKEN] Refresh successful, updating tokens');
      setAccessToken(data.accessToken);
      if (data.role) {
        setRole(data.role);
      }
      
      // Retry original request with new token
      token = data.accessToken;
      fetchOptions.headers["Authorization"] = `Bearer ${token}`;
      response = await fetch(url, fetchOptions);
      
    } catch (err) {
      console.log('[TOKEN] Refresh error:', err.message);
      clearAuth();
      
      // Only redirect if we're not already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw err;
    }
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw json;
  return json;
}
```

### **4. Protected Route Component**

```javascript
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken, setAccessToken, setRole, getRole, clearAuth } from "../api";

const ProtectedRoute = ({ children, requireRole }) => {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [role, setRoleState] = useState(null);

  useEffect(() => {
    // Listen for automatic token refresh events
    const handleTokenRefreshed = (event) => {
      console.log('[ProtectedRoute] Token refreshed automatically:', event.detail);
      setAccessToken(event.detail.accessToken);
      setRole(event.detail.role);
      setRoleState(event.detail.role);
      setAuthed(true);
      setLoading(false);
    };

    const handleTokenRefreshFailed = () => {
      console.log('[ProtectedRoute] Automatic token refresh failed');
      setAuthed(false);
      setLoading(false);
    };

    // Add event listeners
    window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    window.addEventListener('tokenRefreshFailed', handleTokenRefreshFailed);

    const checkAuth = async () => {
      const token = getAccessToken();
      const localRole = getRole();

      console.log('=== FRONTEND PROTECTED ROUTE DEBUG START ===');
      console.log('[ProtectedRoute] Checking authentication at:', new Date().toISOString());
      console.log('[ProtectedRoute] Access token present:', !!token);
      console.log('[ProtectedRoute] Access token (first 30 chars):', token ? token.substring(0, 30) + '...' : 'NONE');
      console.log('[ProtectedRoute] Role:', localRole);
      console.log('[ProtectedRoute] Require role:', requireRole);

      // If we have a valid access token, use it
      if (token) {
        console.log('[ProtectedRoute] ✅ Using existing access token');
        setRoleState(localRole);
        setAuthed(true);
        setLoading(false);
        console.log('=== FRONTEND PROTECTED ROUTE DEBUG END ===');
        return;
      }

      // No access token - try to refresh
      console.log('[ProtectedRoute] ❌ No access token, attempting refresh...');
      console.log('[ProtectedRoute] Using full URL for refresh request');
      
      try {
        console.log('[ProtectedRoute] Making refresh request...');
        const res = await fetch('http://localhost:5000/api/auth/refresh', {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          }
        });

        console.log('[ProtectedRoute] Refresh response status:', res.status);
        console.log('[ProtectedRoute] Refresh response headers:', Object.fromEntries(res.headers.entries()));

        if (res.ok) {
          const data = await res.json();
          console.log('[ProtectedRoute] ✅ Refresh successful, data:', {
            hasAccessToken: !!data.accessToken,
            role: data.role,
            accessTokenPreview: data.accessToken ? data.accessToken.substring(0, 30) + '...' : 'NONE'
          });
          
          if (data.accessToken) {
            console.log('[ProtectedRoute] Setting new access token...');
            setAccessToken(data.accessToken);
            
            if (data.role) {
              console.log('[ProtectedRoute] Setting new role:', data.role);
              setRole(data.role);
              setRoleState(data.role);
            }
            
            console.log('[ProtectedRoute] ✅ Authentication restored successfully');
            setAuthed(true);
          } else {
            console.log('[ProtectedRoute] ❌ No access token in refresh response');
            setAuthed(false);
          }
        } else {
          // Refresh failed
          console.log('[ProtectedRoute] ❌ Refresh failed, status:', res.status);
          const errorData = await res.json().catch(() => ({}));
          console.log('[ProtectedRoute] Error data:', errorData);
          console.log('[ProtectedRoute] Clearing auth data...');
          clearAuth();
          setAuthed(false);
          console.log('=== FRONTEND PROTECTED ROUTE DEBUG END ===');
        }
      } catch (err) {
        console.error("[ProtectedRoute] ❌ Refresh error:", err);
        console.log('[ProtectedRoute] Clearing auth data due to error...');
        clearAuth();
        setAuthed(false);
        console.log('=== FRONTEND PROTECTED ROUTE DEBUG END ===');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Cleanup event listeners
    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
      window.removeEventListener('tokenRefreshFailed', handleTokenRefreshFailed);
    };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!authed) return <Navigate to="/login" replace />;
  if (requireRole && role !== requireRole) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
```

### **5. App Component Integration**

```javascript
import React, { Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { startTokenMonitoring } from "./api";

const App = () => {
  const location = useLocation();

  // Start token monitoring when app loads
  useEffect(() => {
    console.log('[APP] Starting token monitoring...');
    startTokenMonitoring();
    
    // Cleanup on unmount
    return () => {
      console.log('[APP] App unmounting, token monitoring will continue');
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="w-full">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute requireRole="admin">
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </ErrorBoundary>
  );
};
```

---

## 🔄 **Token Lifecycle**

### **1. Login Flow:**
```
User submits credentials → Backend verifies → Generate tokens → Store refresh token → Set cookie → Send access token → Frontend stores access token
```

### **2. API Request Flow:**
```
API request → Check access token → Valid? → Process request
                    ↓
               Invalid/Expired? → Try refresh → New access token → Retry request
```

### **3. Automatic Refresh Flow:**
```
Token monitoring detects missing token → Call refresh endpoint → Verify refresh token → Generate new tokens → Update database → Set new cookie → Notify components
```

### **4. Logout Flow:**
```
User clicks logout → Clear access token → Remove refresh token from database → Clear cookie → Redirect to login
```

---

## 🛡️ **Security Features**

### **1. HttpOnly Cookies:**
```javascript
// Refresh tokens stored in HttpOnly cookies
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,        // Not accessible to JavaScript
  secure: true,          // Only over HTTPS in production
  sameSite: 'lax',       // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

### **2. Token Rotation:**
```javascript
// Generate new refresh token on each refresh
const newRefreshToken = generateRefreshToken(user);
await tokenRecord.update({ token: newRefreshToken });
```

### **3. Short-lived Access Tokens:**
```javascript
// Access tokens expire in 15 minutes
const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });
```

### **4. Secure Headers:**
```javascript
// All API responses include security headers
res.setHeader('Content-Type', 'application/json');
res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
res.setHeader('Access-Control-Allow-Credentials', 'true');
```

---

## ⚠️ **Error Handling**

### **1. Backend Error Handling:**
```javascript
const refresh = async (req, res) => {
  try {
    // ... refresh logic
  } catch (error) {
    console.error('Refresh error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### **2. Frontend Error Handling:**
```javascript
export default async function apiFetch(url, options = {}) {
  try {
    // ... API logic
  } catch (err) {
    console.log('[TOKEN] API error:', err.message);
    
    if (err.message === 'Session expired') {
      clearAuth();
      window.location.href = "/login";
    }
    
    throw err;
  }
}
```

---

## 🧪 **Testing & Debugging**

### **1. Console Logging:**
```javascript
// Enable detailed logging for debugging
console.log('[TOKEN] Access token set:', token.substring(0, 30) + '...');
console.log('[TOKEN] Refresh response status:', res.status);
console.log('[TOKEN] ✅ Authentication restored automatically');
```

### **2. Manual Testing:**
```javascript
// Test refresh endpoint manually
fetch('http://localhost:5000/api/auth/refresh', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => console.log('Refresh result:', data))
.catch(err => console.error('Refresh error:', err));
```

### **3. Token Validation:**
```javascript
// Decode and inspect token
const token = getAccessToken();
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token payload:', payload);
  console.log('Token expires:', new Date(payload.exp * 1000));
}
```

---

## ✅ **Implementation Checklist**

### **Backend Setup:**
- [ ] Install required packages (`jsonwebtoken`, `cookie-parser`)
- [ ] Set environment variables (JWT secrets)
- [ ] Create token generation functions
- [ ] Implement login endpoint
- [ ] Implement refresh endpoint
- [ ] Add authentication middleware
- [ ] Add role-based authorization
- [ ] Implement logout endpoint
- [ ] Set up database tables (users, refresh_tokens)

### **Frontend Setup:**
- [ ] Create token management functions
- [ ] Implement global token monitoring
- [ ] Create centralized API service
- [ ] Build ProtectedRoute component
- [ ] Add event listeners for token refresh
- [ ] Start token monitoring in App component
- [ ] Test automatic refresh functionality

### **Security Checklist:**
- [ ] HttpOnly cookies for refresh tokens
- [ ] Secure flag in production
- [ ] SameSite protection
- [ ] Token rotation on refresh
- [ ] Short-lived access tokens
- [ ] Proper CORS configuration
- [ ] Input validation
- [ ] Error handling

---

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. "No refresh token" error:**
- Check if cookies are being sent (`credentials: 'include'`)
- Verify CORS configuration allows credentials
- Check cookie domain and path settings

#### **2. "Invalid refresh token" error:**
- Verify JWT_REFRESH_SECRET matches
- Check token expiration
- Ensure token exists in database

#### **3. Automatic refresh not working:**
- Check if token monitoring is started
- Verify event listeners are attached
- Check console for monitoring logs

#### **4. CORS errors:**
- Ensure backend allows frontend origin
- Check credentials configuration
- Verify preflight request handling

### **Debug Steps:**
1. Check browser DevTools → Application → Cookies
2. Check browser DevTools → Console for token logs
3. Check Network tab for API requests
4. Verify backend logs for token operations
5. Test refresh endpoint manually

---

## 🎯 **Key Benefits**

### **Security:**
- **Stateless authentication**: No server-side sessions
- **Token rotation**: Enhanced security through refresh token updates
- **HttpOnly cookies**: XSS protection for refresh tokens
- **Short-lived access tokens**: Reduced attack window

### **User Experience:**
- **Automatic refresh**: Seamless token renewal
- **Persistent sessions**: Users stay logged in
- **Fast authentication**: No database lookups for each request
- **Global monitoring**: Detects and fixes token issues automatically

### **Developer Experience:**
- **Clear separation**: Frontend and backend concerns
- **Event-driven**: Components automatically update
- **Comprehensive logging**: Easy debugging
- **Modular design**: Easy to maintain and extend

---

## 🏆 **Result**

**A complete, secure, and scalable token system with automatic refresh, role-based authorization, and seamless user experience that can be easily implemented in any project.**

---

*Token System Guide completed: January 2025*
*Security: Enterprise-grade with automatic monitoring*
*Status: ✅ PRODUCTION READY*
