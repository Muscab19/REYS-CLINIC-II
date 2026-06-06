import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Bed,
  Mail, 
  MapPin, 
  Heart, 
  CheckCircle,
  Home,
  Calendar as CalendarIcon,
  LogOut,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  Menu,
  X,
  Loader,
  FileText,
  Activity,
  Shield,
  Star,
  MessageSquare,
  Baby,
  FileCheck,
  UserX,
  AlertCircle,
  UserPlus,
  DollarSign,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  History
} from 'lucide-react';
import { useNavigate, Link, Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';
import RegisterPatient from './Pages/RegisterPatient';
import PatientCheckout from './Pages/PatientCheckout';
import CompletedCheckouts from './Pages/CompletedCheckouts';
import Appointments from '../Doctor/Pages/Appointments';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://161.35.107.64:3000';

// ==================== RECEPTION OVERVIEW PAGE ====================
const ReceptionOverview = ({ user, appointments, stats, formatDate, getStatusBadge, handleViewDetails, handleStatusChange }) => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => 
    apt.preferredDate?.split('T')[0] === today && apt.status !== 'cancelled'
  );

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.todayAppointments}</p>
          <p className="text-xs text-yellow-600">Today</p>
        </div>
        
        <div className="bg-blue-50 rounded-xl p-4 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.upcomingAppointments}</p>
          <p className="text-xs text-blue-600">Upcoming</p>
        </div>
        
        <div className="bg-green-50 rounded-xl p-4 shadow-sm">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.completedAppointments}</p>
          <p className="text-xs text-green-600">Completed</p>
        </div>
        
        <div className="bg-red-50 rounded-xl p-4 shadow-sm">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-2">
            <UserX className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.cancelledAppointments}</p>
          <p className="text-xs text-red-600">Cancelled</p>
        </div>
        
        <div className="bg-purple-50 rounded-xl p-4 shadow-sm">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.pendingAppointments}</p>
          <p className="text-xs text-purple-600">Pending</p>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Today's Schedule</h2>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="divide-y">
          {todayAppointments.length > 0 ? (
            todayAppointments.map(apt => (
              <div key={apt._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Baby className="w-6 h-6 text-[#D01A2B]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{apt.childName}</p>
                    <p className="text-sm text-gray-500">{apt.preferredTime} • {apt.reason}</p>
                    <p className="text-xs text-gray-400">Parent: {apt.parentName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(apt.status, apt.preferredDate)}
                  <button
                    onClick={() => handleViewDetails(apt)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No appointments scheduled for today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN RECEPTION DASHBOARD COMPONENT ====================
const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    pendingAppointments: 0
  });

  // Check if user is receptionist
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (user?.role !== 'reception') {
      navigate('/');
      return;
    }
  }, [user, isAuthenticated, navigate]);

  // Fetch appointments
  useEffect(() => {
    if (user?.role === 'reception') {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.data);
        calculateStats(data.data);
      } else {
        toast.error(data.msg || 'Failed to load appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointmentsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayApps = appointmentsList.filter(apt => 
      new Date(apt.preferredDate).toDateString() === today.toDateString() && 
      apt.status !== 'cancelled'
    ).length;
    
    const upcoming = appointmentsList.filter(apt => 
      new Date(apt.preferredDate) >= today && 
      apt.status !== 'cancelled' && 
      apt.status !== 'completed'
    ).length;
    
    const completed = appointmentsList.filter(apt => apt.status === 'completed').length;
    const cancelled = appointmentsList.filter(apt => apt.status === 'cancelled').length;
    const pending = appointmentsList.filter(apt => apt.status === 'pending').length;
    
    setStats({
      totalAppointments: appointmentsList.length,
      todayAppointments: todayApps,
      upcomingAppointments: upcoming,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      pendingAppointments: pending
    });
  };

  const updateAppointmentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/appointments/${selectedAppointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Appointment ${newStatus} successfully`);
        fetchAppointments();
        setShowStatusModal(false);
        setSelectedAppointmentId(null);
        setNewStatus('');
      } else {
        toast.error(data.msg || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update appointment status');
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleStatusChange = (appointmentId, currentStatus) => {
    setSelectedAppointmentId(appointmentId);
    setNewStatus(currentStatus === 'pending' ? 'confirmed' : 'completed');
    setShowStatusModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status, appointmentDate) => {
    const aptDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
      'no-show': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'No Show' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    if (status === 'cancelled') {
      return <span className={`${config.bg} ${config.text} px-2 py-1 rounded-full text-xs font-semibold`}>{config.label}</span>;
    }
    if (aptDate < today && status !== 'completed') {
      return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">Expired</span>;
    }
    return <span className={`${config.bg} ${config.text} px-2 py-1 rounded-full text-xs font-semibold`}>{config.label}</span>;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <Home className="w-5 h-5" />, path: '/reception-dashboard' },
    { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-5 h-5" />, path: '/appointments' },
    { id: 'register-patient', label: 'Register Patient', icon: <UserPlus className="w-5 h-5" />, path: '/register-patient' },
    { id: 'patients-history', label: 'Patients History', icon: <Users className="w-5 h-5" />, path: '/patients' },
    { id: 'inpatient', label: 'Inpatient', icon: <Bed className="w-5 h-5" />, path: '/inpatients' },
    { id: 'checkout', label: 'Patient Checkout', icon: <DollarSign className="w-5 h-5" />, path: '/checkout' },
  ];

  if (!isAuthenticated || user?.role !== 'reception') {
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
          <div className="flex items-center space-x-2 mb-8">
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          </div>
          
          <div className="flex items-center space-x-3 mb-8 p-3 bg-red-50 rounded-xl">
            <div className="w-12 h-12 bg-[#D01A2B] rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase() || 'R'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name || 'Receptionist'}</p>
              <p className="text-xs text-gray-500">Receptionist</p>
              <p className="text-xs text-gray-400">{user?.staffId || 'RC0001'}</p>
            </div>
          </div>
          
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reception Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.name}!</p>
          </div>
        </div>

        {/* Nested Routes */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 animate-spin text-[#D01A2B]" />
          </div>
        ) : (
          <Routes>
            <Route index element={
              <ReceptionOverview 
                user={user}
                appointments={appointments}
                stats={stats}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
                handleViewDetails={handleViewDetails}
                handleStatusChange={handleStatusChange}
              />
            } />
            <Route path="appointments" element={
              <Appointments />
            } />
            <Route path="register-patient" element={<RegisterPatient />} />
            <Route path="checkout" element={<PatientCheckout />} />
            <Route path="completed-checkouts" element={<CompletedCheckouts />} />
          </Routes>
        )}
      </main>

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Appointment Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {/* Ticket Info */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Ticket Information</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Ticket ID</p>
                  <p className="font-mono font-semibold text-lg">{selectedAppointment.ticketId}</p>
                  <p className="text-sm text-gray-500 mt-2">Booked On</p>
                  <p className="text-gray-700">{selectedAppointment.bookedAt ? new Date(selectedAppointment.bookedAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>

              {/* Child Information */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Child Information</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{selectedAppointment.childName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium">{selectedAppointment.childAge} years</p>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Parent/Guardian Information</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{selectedAppointment.parentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium">{selectedAppointment.parentPhone}</p>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Appointment Details</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(selectedAppointment.preferredDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{selectedAppointment.preferredTime}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Reason for Visit</p>
                    <p className="font-medium">{selectedAppointment.reason}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Status</p>
                    {getStatusBadge(selectedAppointment.status, selectedAppointment.preferredDate)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6 pt-4 border-t">
                {selectedAppointment.status === 'pending' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleStatusChange(selectedAppointment._id, selectedAppointment.status);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Confirm Appointment
                  </button>
                )}
                {selectedAppointment.status === 'confirmed' && new Date(selectedAppointment.preferredDate) < new Date() && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleStatusChange(selectedAppointment._id, selectedAppointment.status);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                newStatus === 'confirmed' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {newStatus === 'confirmed' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <FileCheck className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {newStatus === 'confirmed' ? 'Confirm Appointment?' : 'Mark as Completed?'}
              </h3>
              <p className="text-gray-500">
                {newStatus === 'confirmed' 
                  ? 'Are you sure you want to confirm this appointment?'
                  : 'Are you sure you want to mark this appointment as completed?'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateAppointmentStatus}
                className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionDashboard;