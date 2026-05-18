import React, { createContext, useState, useEffect, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Apps from './Apps';
import './index.css';

// Create Auth Context
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data from localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Verify token is still valid
        // You might want to add a token validation API call here
        setUser({ ...parsedUser, token });
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser({ ...userData, token });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Redirect to login page
    window.location.href = '/signIn';
  };

  const isSuperAdmin = () => {
    return user?.role === 'superadmin';
  };

  const isAdmin = () => {
    return user?.role === 'admin' || user?.role === 'superadmin';
  };

  const hasRole = (requiredRole) => {
    if (!user) return false;
    if (requiredRole === 'admin') return isAdmin();
    if (requiredRole === 'superadmin') return isSuperAdmin();
    return user.role === requiredRole;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      isSuperAdmin, 
      isAdmin,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to sign in with return URL
        navigate('/signIn', { 
          state: { from: location.pathname },
          replace: true 
        });
      } else if (requiredRole) {
        // Check role
        let hasAccess = false;
        if (requiredRole === 'superadmin' && user.role !== 'superadmin') {
          hasAccess = false;
        } else if (requiredRole === 'admin' && !(user.role === 'admin' || user.role === 'superadmin')) {
          hasAccess = false;
        } else {
          hasAccess = true;
        }
        
        if (!hasAccess) {
          // Redirect to home page if no access
          navigate('/', { replace: true });
        }
      }
    }
  }, [user, loading, navigate, location, requiredRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00453C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will be redirected by useEffect
  }

  if (requiredRole) {
    // Final role check
    if (requiredRole === 'superadmin' && user.role !== 'superadmin') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-red-50 rounded-lg">
            <h2 className="text-xl font-bold text-red-700">Access Denied</h2>
            <p className="mt-2 text-red-600">Superadmin privileges required.</p>
          </div>
        </div>
      );
    }
    
    if (requiredRole === 'admin' && !(user.role === 'admin' || user.role === 'superadmin')) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-red-50 rounded-lg">
            <h2 className="text-xl font-bold text-red-700">Access Denied</h2>
            <p className="mt-2 text-red-600">Admin privileges required.</p>
          </div>
        </div>
      );
    }
  }

  return children;
};

// Main App Wrapper
const AppWrapper = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Apps />
      </AuthProvider>
    </BrowserRouter>
  );
};

// Render the app
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);