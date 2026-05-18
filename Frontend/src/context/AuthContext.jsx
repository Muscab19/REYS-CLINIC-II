import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Configure axios defaults
  axios.defaults.baseURL = `${API_URL}/api`;

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Ensure username is a string and clean it
      let cleanUsername = '';
      let cleanPassword = '';
      
      if (typeof username === 'string') {
        cleanUsername = username.trim();
      } else if (username && typeof username === 'object') {
        // If username is an object, try to extract the username property
        cleanUsername = username.username || username.name || String(username);
        cleanUsername = String(cleanUsername).trim();
      } else {
        cleanUsername = String(username).trim();
      }
      
      if (typeof password === 'string') {
        cleanPassword = password.trim();
      } else {
        cleanPassword = String(password).trim();
      }

      console.log('Login - Clean username:', cleanUsername);
      console.log('Login - Clean password length:', cleanPassword.length);

      if (!cleanUsername || !cleanPassword) {
        toast.error('Please enter both username and password');
        return { success: false, msg: 'Please enter both username and password' };
      }

      const response = await axios.post('/auth/signin', { 
        username: cleanUsername, 
        password: cleanPassword 
      });
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        toast.success(`Welcome back, ${user.name}!`);
        return { success: true, user };
      }
      return { success: false, msg: response.data.msg };
    } catch (error) {
      console.error('Login error:', error);
      const msg = error.response?.data?.msg || 'Login failed. Please try again.';
      toast.error(msg);
      return { success: false, msg };
    }
  };

  const signup = async (username, name, password) => {
    try {
      // Clean the inputs
      const cleanUsername = String(username).trim().toLowerCase();
      const cleanName = String(name).trim();
      const cleanPassword = String(password).trim();

      console.log('Signup - Clean username:', cleanUsername);
      console.log('Signup - Clean name:', cleanName);
      console.log('Signup - Password length:', cleanPassword.length);

      if (!cleanUsername || !cleanName || !cleanPassword) {
        toast.error('All fields are required');
        return { success: false, msg: 'All fields are required' };
      }

      if (cleanUsername.length < 3) {
        toast.error('Username must be at least 3 characters');
        return { success: false, msg: 'Username must be at least 3 characters' };
      }

      if (cleanPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return { success: false, msg: 'Password must be at least 6 characters' };
      }

      const response = await axios.post('/auth/signup', { 
        username: cleanUsername, 
        name: cleanName, 
        password: cleanPassword 
      });
      
      if (response.data.success) {
        toast.success('Account created successfully! Please login.');
        return { success: true };
      }
      return { success: false, msg: response.data.msg };
    } catch (error) {
      console.error('Signup error:', error);
      const msg = error.response?.data?.msg || 'Registration failed. Please try again.';
      toast.error(msg);
      return { success: false, msg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    toast.info('Logged out successfully');
  };

  const updateProfile = async (data) => {
    try {
      const response = await axios.put('/auth/update-profile', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const updatedUser = { ...user, ...response.data.data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully');
        return { success: true };
      }
      return { success: false, msg: response.data.msg };
    } catch (error) {
      const msg = error.response?.data?.msg || 'Update failed';
      toast.error(msg);
      return { success: false, msg };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.put('/auth/change-password', { currentPassword, newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Password changed successfully');
        return { success: true };
      }
      return { success: false, msg: response.data.msg };
    } catch (error) {
      const msg = error.response?.data?.msg || 'Password change failed';
      toast.error(msg);
      return { success: false, msg };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;