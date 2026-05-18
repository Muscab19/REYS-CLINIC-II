import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaLock, FaSignInAlt, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { BsEye, BsEyeSlash } from 'react-icons/bs';
import { MdSecurity } from 'react-icons/md';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logos.png';

function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, logout, isAuthenticated } = useAuth();

  // Clear any existing session on signin page load
  useEffect(() => {
    if (isAuthenticated) {
      logout();
    }
  }, []);

  const validateInputs = () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return false;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  const redirectBasedOnRole = (role) => {
    console.log('Redirecting based on role:', role);
    
    // Role-based dashboard routing
    switch (role) {
      case 'superadmin':
        navigate('/superadmin');
        toast.success('Welcome Super Admin!');
        break;
      case 'doctor':
        navigate('/doctor-dashboard');
        toast.success('Welcome Doctor!');
        break;
      case 'reception':
        navigate('/reception-dashboard');
        toast.success('Welcome Receptionist!');
        break;
      case 'pharmacy':
        navigate('/pharmacy-dashboard');
        toast.success('Welcome Pharmacist!');
        break;
      case 'lab-tech':
        navigate('/labtech-dashboard');
        toast.success('Welcome Lab Technician!');
        break;
      default:
        navigate('/');
        toast.success(`Welcome ${username}!`);
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success) {
        const userRole = result.user?.role;
        redirectBasedOnRole(userRole);
      } else {
        setError(result.msg || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-[#D01A2B] transition-colors duration-300 group"
      >
        <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Home</span>
      </button>

      <div className="w-full max-w-md">
        {/* Logo Area */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <NavLink to="/" className="flex justify-center">
              <img 
                src={logo} 
                alt="REYS CLINIC Logo" 
                className="h-20 w-auto object-contain"
              />
            </NavLink>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                <div className="flex items-center">
                  <MdSecurity className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D01A2B] focus:border-transparent outline-none transition duration-200 bg-gray-50"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D01A2B] focus:border-transparent outline-none transition duration-200 bg-gray-50"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <BsEyeSlash className="text-gray-400 hover:text-[#D01A2B] transition-colors" />
                    ) : (
                      <BsEye className="text-gray-400 hover:text-[#D01A2B] transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full px-4 py-3 rounded-lg font-semibold text-white 
                  transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D01A2B]
                  disabled:transform-none disabled:hover:scale-100
                  flex items-center justify-center mt-6
                  ${loading ? 'bg-gray-400' : 'hover:bg-red-700'}`}
                style={{ backgroundColor: loading ? undefined : '#D01A2B' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <FaSignInAlt className="mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">New to REYS CLINIC?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <NavLink
                to="/signup"
                className="inline-flex items-center justify-center w-full px-4 py-3 border-2 rounded-lg font-semibold transition-all duration-300 group hover:bg-[#D01A2B] hover:text-white"
                style={{ borderColor: '#D01A2B', color: '#D01A2B' }}
              >
                Create New Account
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </NavLink>
            </div>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <FaShieldAlt className="text-green-500 text-xs" />
              <span className="text-xs text-gray-400">256-bit SSL Secure Connection</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            © 2026 REYS CLINIC. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-1">Al-Baraka, Hodan, Mogadishu, Somalia | Tel: +252 61 1477201</p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;