import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Heart, 
  CheckCircle,
  Home,
  Calendar as CalendarIcon,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  Menu,
  Bed,
  X,
  Loader,
  FileText,
  CreditCard,
  BarChart3,
  Activity,
  Shield,
  Star,
  MessageSquare,
  BookOpen,
  Database,
  Stethoscope
} from 'lucide-react';
import { useNavigate, Link, Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

// Import page components
import AppointmentsPage from './Pages/Appointments';
import DoctorConsultation from './Pages/DoctorConsultation';
import DoctorMasterData from './Pages/DoctorMasterData';
// import ProfilePage from './ProfilePage';

// ==================== DASHBOARD OVERVIEW PAGE ====================
const DashboardOverview = ({ user, appointments, stats, formatDate, getStatusBadge }) => {
  const navigate = useNavigate();
  
  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-green-600 flex items-center">
              <TrendingUp className="w-4 h-4" />
              12%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalAppointments}</p>
          <p className="text-gray-500 text-sm mt-1">Total Appointments</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
          <p className="text-gray-500 text-sm mt-1">Upcoming</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.completedAppointments}</p>
          <p className="text-gray-500 text-sm mt-1">Completed</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <Stethoscope className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPatients || 0}</p>
          <p className="text-gray-500 text-sm mt-1">Total Patients</p>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Today's Appointments</h2>
        </div>
        <div className="divide-y">
          {appointments.filter(apt => new Date(apt.preferredDate).toDateString() === new Date().toDateString() && apt.status !== 'cancelled').length > 0 ? (
            appointments.filter(apt => new Date(apt.preferredDate).toDateString() === new Date().toDateString() && apt.status !== 'cancelled').map(apt => (
              <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-[#D01A2B]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{apt.childName}</p>
                    <p className="text-sm text-gray-500">{apt.preferredTime} • {apt.reason}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">ID: {apt.ticketId}</span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No appointments for today</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/consultations" className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-blue-600 text-sm font-medium">Start →</span>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Patient Consultation</h3>
          <p className="text-sm text-gray-600">Start a new consultation with a patient</p>
        </Link>
        
        
        
        <Link to="/doctor-master-data" className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <span className="text-purple-600 text-sm font-medium">Manage →</span>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Master Data</h3>
          <p className="text-sm text-gray-600">Manage diagnoses and services</p>
        </Link>
      </div>
    </div>
  );
};

// ==================== MAIN DOCTOR DASHBOARD COMPONENT ====================
const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0
  });

  // Check if user is doctor
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (user?.role !== 'doctor') {
      navigate('/');
      return;
    }
  }, [user, isAuthenticated, navigate]);

  // Load data
  useEffect(() => {
    if (user?.role === 'doctor') {
      const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      // Filter appointments for this doctor
      const doctorAppointments = allAppointments;
      setAppointments(doctorAppointments);
      
      // Extract unique patients from appointments
      const uniquePatients = [];
      const patientMap = new Map();
      doctorAppointments.forEach(apt => {
        if (!patientMap.has(apt.childName)) {
          patientMap.set(apt.childName, {
            name: apt.childName,
            parentName: apt.parentName,
            age: apt.childAge,
            phone: apt.parentPhone,
            lastVisit: apt.preferredDate
          });
          uniquePatients.push({
            name: apt.childName,
            parentName: apt.parentName,
            age: apt.childAge,
            phone: apt.parentPhone,
            lastVisit: apt.preferredDate
          });
        }
      });
      setPatients(uniquePatients);
      
      const today = new Date();
      const upcoming = doctorAppointments.filter(apt => new Date(apt.preferredDate) >= today && apt.status !== 'cancelled');
      const completed = doctorAppointments.filter(apt => new Date(apt.preferredDate) < today && apt.status !== 'cancelled');
      
      setStats({
        totalAppointments: doctorAppointments.length,
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        totalPatients: uniquePatients.length
      });
    }
  }, [user]);

  const handleCancelAppointment = (appointmentId) => {
    setCancelAppointmentId(appointmentId);
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = () => {
    const updatedAppointments = appointments.map(apt => 
      apt.id === cancelAppointmentId ? { ...apt, status: 'cancelled' } : apt
    );
    setAppointments(updatedAppointments);
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    setShowCancelModal(false);
    setCancelAppointmentId(null);
    
    const today = new Date();
    const upcoming = updatedAppointments.filter(apt => new Date(apt.preferredDate) >= today && apt.status !== 'cancelled');
    const completed = updatedAppointments.filter(apt => new Date(apt.preferredDate) < today && apt.status !== 'cancelled');
    setStats(prev => ({
      ...prev,
      upcomingAppointments: upcoming.length,
      completedAppointments: completed.length
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status, appointmentDate) => {
    const aptDate = new Date(appointmentDate);
    const today = new Date();
    
    if (status === 'cancelled') {
      return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">Cancelled</span>;
    }
    if (aptDate < today) {
      return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Completed</span>;
    }
    if (aptDate.toDateString() === today.toDateString()) {
      return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Today</span>;
    }
    return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">Upcoming</span>;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Sidebar menu items - each navigates to a different route
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: <Home className="w-5 h-5" />, path: '/doctor-dashboard' },
    { id: 'consultations', label: 'Consultations', icon: <BookOpen className="w-5 h-5" />, path: '/consultations' },
    { id: 'master-data', label: 'Master Data', icon: <Database className="w-5 h-5" />, path: '/doctor-master-data' },
  ];

  if (!isAuthenticated || user?.role !== 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#D01A2B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white shadow-xl z-40 transition-transform duration-300 lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } w-72`}>
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-8">
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-8 p-3 bg-red-50 rounded-xl">
            <div className="w-12 h-12 bg-[#D01A2B] rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name || 'Doctor'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              <p className="text-xs text-gray-400">{user?.staffId || 'DR0001'}</p>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="space-y-2">
            {menuItems.map(item => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors w-full"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors mt-8"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-72 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {window.location.pathname === '/doctor-dashboard' && 'Doctor Dashboard'}
              {window.location.pathname === '/consultations' && 'Patient Consultations'}
              {window.location.pathname === '/appointments' && 'Appointments Management'}
              {window.location.pathname === '/doctor-master-data' && 'Master Data Management'}
              {window.location.pathname === '/profile' && 'Doctor Profile'}
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back, Dr. {user?.name}!
            </p>
          </div>
        </div>

        {/* Nested Routes */}
        <Routes>
          <Route index element={
            <DashboardOverview 
              user={user}
              appointments={appointments}
              stats={stats}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
            />
          } />
          <Route path="appointments" element={
            <AppointmentsPage 
              appointments={appointments}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
              handleCancelAppointment={handleCancelAppointment}
            />
          } />
          <Route path="consultations" element={<DoctorConsultation />} />
          <Route path="doctor-master-data" element={<DoctorMasterData />} />
          {/* <Route path="profile" element={<ProfilePage user={user} />} /> */}
        </Routes>
      </main>

      {/* Cancel Appointment Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Appointment?</h3>
              <p className="text-gray-500">Are you sure you want to cancel this appointment? This action cannot be undone.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                No, Go Back
              </button>
              <button
                onClick={confirmCancelAppointment}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;