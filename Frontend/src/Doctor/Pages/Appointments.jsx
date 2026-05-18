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
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Loader,
  Baby,
  Users,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  AlertCircle,
  FileText,
  MessageSquare,
  Stethoscope,
  DollarSign,
  CreditCard,
  Receipt,
  Send
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const Appointments = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [consultationFee, setConsultationFee] = useState(25); // Default consultation fee

  // Load appointments from API
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    
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
    
    fetchAppointments();
  }, [isAuthenticated, navigate]);

  // Navigate to consultation page with appointment data
  const handleStartConsultation = (appointment) => {
    // Store appointment data in localStorage to pass to consultation page
    localStorage.setItem('consultationAppointment', JSON.stringify({
      patientId: appointment._id,
      childName: appointment.childName,
      childAge: appointment.childAge,
      parentName: appointment.parentName,
      parentPhone: appointment.parentPhone,
      ticketId: appointment.ticketId,
      reason: appointment.reason,
      appointmentDate: appointment.preferredDate,
      appointmentTime: appointment.preferredTime
    }));
    
    // Navigate to consultation page
    navigate('/consultations');
    toast.info(`Starting consultation for ${appointment.childName}`);
  };

  // Handle payment for consultation
  const handlePayment = (appointment) => {
    setSelectedAppointment(appointment);
    setPaymentAmount(consultationFee.toString());
    setPaymentMethod('cash');
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    const amount = parseFloat(paymentAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    
    if (amount < consultationFee) {
      toast.error(`Insufficient payment. Consultation fee is $${consultationFee}`);
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Update appointment with payment info
      const response = await fetch(`${API_BASE_URL}/api/appointments/${selectedAppointment._id}/payment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentStatus: 'paid',
          paidAmount: consultationFee,
          paymentMethod: paymentMethod,
          paymentDate: new Date().toISOString(),
          receivedBy: user?.name
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Payment of $${consultationFee} received for ${selectedAppointment.childName}`);
        
        // Update local state
        setAppointments(prev => prev.map(apt => 
          apt._id === selectedAppointment._id 
            ? { ...apt, paymentStatus: 'paid', paidAmount: consultationFee, paymentMethod: paymentMethod }
            : apt
        ));
        
        setShowPaymentModal(false);
        
        // Optionally start consultation after payment
        if (window.confirm('Payment successful! Would you like to start the consultation now?')) {
          handleStartConsultation(selectedAppointment);
        }
      } else {
        toast.error(data.msg || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Send to doctor consultation page (without payment)
  const handleSendToDoctor = (appointment) => {
    handleStartConsultation(appointment);
    toast.info(`Sending ${appointment.childName} to doctor consultation`);
  };

  const handleCancelAppointment = async (appointmentId) => {
    setCancelAppointmentId(appointmentId);
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/appointments/${cancelAppointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled', cancelledReason: 'Cancelled by reception' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Appointment cancelled successfully');
        setAppointments(prev => prev.map(apt => 
          apt._id === cancelAppointmentId ? { ...apt, status: 'cancelled' } : apt
        ));
      } else {
        toast.error(data.msg || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    } finally {
      setShowCancelModal(false);
      setCancelAppointmentId(null);
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
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

  const formatTime = (timeString) => {
    return timeString || 'N/A';
  };

  const getStatusBadge = (status, appointmentDate, paymentStatus) => {
    const aptDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (status === 'cancelled') {
      return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Cancelled</span>;
    }
    if (status === 'completed') {
      return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Completed</span>;
    }
    if (paymentStatus === 'paid') {
      return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Paid & Ready</span>;
    }
    if (aptDate < today) {
      return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">Expired</span>;
    }
    if (aptDate.toDateString() === today.toDateString()) {
      return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">Today - Pending Payment</span>;
    }
    return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Pending Payment</span>;
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    if (paymentStatus === 'paid') {
      return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><CheckCircle className="w-3 h-3" /><span>Paid</span></span>;
    }
    return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><AlertCircle className="w-3 h-3" /><span>Unpaid</span></span>;
  };

  const getStatusColor = (status, appointmentDate, paymentStatus) => {
    const aptDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (status === 'cancelled') return 'border-red-200 bg-red-50';
    if (status === 'completed') return 'border-green-200 bg-green-50';
    if (paymentStatus === 'paid') return 'border-green-200 bg-green-50';
    if (aptDate < today) return 'border-gray-200 bg-gray-50';
    if (aptDate.toDateString() === today.toDateString()) return 'border-yellow-200 bg-yellow-50';
    return 'border-blue-200 bg-blue-50';
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.childName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.parentPhone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    
    const matchesDate = !filterDate || apt.preferredDate?.split('T')[0] === filterDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Stats
  const totalAppointments = appointments.length;
  const upcomingCount = appointments.filter(apt => new Date(apt.preferredDate) >= new Date() && apt.status !== 'cancelled' && apt.status !== 'completed').length;
  const completedCount = appointments.filter(apt => apt.status === 'completed').length;
  const cancelledCount = appointments.filter(apt => apt.status === 'cancelled').length;
  const todayCount = appointments.filter(apt => 
    new Date(apt.preferredDate).toDateString() === new Date().toDateString() && 
    apt.status !== 'cancelled'
  ).length;
  const pendingPaymentCount = appointments.filter(apt => 
    apt.paymentStatus !== 'paid' && apt.status !== 'cancelled' && apt.status !== 'completed'
  ).length;

  const handleExport = () => {
    if (filteredAppointments.length === 0) {
      toast.info('No data to export');
      return;
    }
    
    const data = filteredAppointments.map(apt => ({
      'Ticket ID': apt.ticketId,
      'Child Name': apt.childName,
      'Child Age': apt.childAge,
      'Parent Name': apt.parentName,
      'Phone': apt.parentPhone,
      'Date': apt.preferredDate?.split('T')[0],
      'Time': apt.preferredTime,
      'Reason': apt.reason,
      'Payment Status': apt.paymentStatus === 'paid' ? 'Paid' : 'Unpaid',
      'Status': apt.status || 'Active'
    }));
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `appointments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#D01A2B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(user?.role === 'reception' ? '/reception-dashboard' : '/doctor-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <div>
                  <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                  <p className="text-xs text-gray-500">Appointments & Payment Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
              <Link
                to="/book-appointment"
                className="flex items-center space-x-2 px-4 py-2 bg-[#D01A2B] text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Appointment</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{totalAppointments}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{upcomingCount}</p>
            <p className="text-sm text-blue-600">Upcoming</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-sm text-green-600">Completed</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
            <p className="text-sm text-red-600">Cancelled</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-yellow-600">{todayCount}</p>
            <p className="text-sm text-yellow-600">Today</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-purple-600">{pendingPaymentCount}</p>
            <p className="text-sm text-purple-600">Pending Payment</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by child name, parent name, ticket ID or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
            />
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader className="w-8 h-8 animate-spin text-[#D01A2B]" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ticket ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentAppointments.map((apt) => (
                      <tr key={apt._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-gray-600">{apt.ticketId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{apt.childName}</p>
                            <p className="text-xs text-gray-400">Age: {apt.childAge} • Parent: {apt.parentName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-gray-700">{formatDate(apt.preferredDate)}</span>
                            <span className="text-xs text-gray-400 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(apt.preferredTime)}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(apt.status, apt.preferredDate, apt.paymentStatus)}</td>
                        <td className="px-6 py-4">{getPaymentStatusBadge(apt.paymentStatus)}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {apt.paymentStatus !== 'paid' && apt.status !== 'cancelled' && apt.status !== 'completed' && (
                              <button
                                onClick={() => handlePayment(apt)}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Process Payment"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                            )}
                            {apt.paymentStatus === 'paid' && apt.status !== 'completed' && apt.status !== 'cancelled' && (
                              <button
                                onClick={() => handleSendToDoctor(apt)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Send to Doctor"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleViewDetails(apt)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                              <button
                                onClick={() => handleCancelAppointment(apt._id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancel Appointment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAppointments.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                  <Link
                    to="/book-appointment"
                    className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-[#D01A2B] text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Book New Appointment</span>
                  </Link>
                </div>
              )}

              {/* Pagination */}
              {filteredAppointments.length > 0 && (
                <div className="px-6 py-4 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAppointments.length)} of {filteredAppointments.length} appointments
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`px-3 py-1 rounded-lg ${
                            currentPage === pageNum
                              ? 'bg-[#D01A2B] text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
              {/* Action Buttons in Modal */}
              <div className="flex space-x-3 mb-6">
                {selectedAppointment.paymentStatus !== 'paid' && selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handlePayment(selectedAppointment);
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Process Payment</span>
                  </button>
                )}
                {selectedAppointment.paymentStatus === 'paid' && selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleSendToDoctor(selectedAppointment);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send to Doctor</span>
                  </button>
                )}
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-xl mb-6 ${getStatusColor(selectedAppointment.status, selectedAppointment.preferredDate, selectedAppointment.paymentStatus)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Appointment Status</p>
                    <p className="text-lg font-semibold">
                      {selectedAppointment.status === 'cancelled' ? 'Cancelled' : 
                       selectedAppointment.status === 'completed' ? 'Completed' :
                       selectedAppointment.paymentStatus === 'paid' ? 'Paid - Ready for Doctor' :
                       new Date(selectedAppointment.preferredDate) < new Date() ? 'Expired' :
                       new Date(selectedAppointment.preferredDate).toDateString() === new Date().toDateString() ? 'Today - Pending Payment' : 'Pending Payment'}
                    </p>
                  </div>
                  {getStatusBadge(selectedAppointment.status, selectedAppointment.preferredDate, selectedAppointment.paymentStatus)}
                </div>
              </div>

              {/* Ticket Info */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#D01A2B]" />
                  <span>Ticket Information</span>
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Ticket ID</p>
                  <p className="font-mono font-semibold text-lg">{selectedAppointment.ticketId}</p>
                </div>
              </div>

              {/* Child Information */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Baby className="w-4 h-4 text-[#D01A2B]" />
                  <span>Child Information</span>
                </h4>
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

              {/* Parent/Guardian Information */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#D01A2B]" />
                  <span>Parent/Guardian Information</span>
                </h4>
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
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#D01A2B]" />
                  <span>Appointment Details</span>
                </h4>
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
                    <p className="text-sm text-gray-500">Previous Visits</p>
                    <p className="font-medium">{selectedAppointment.previousVisits === 'yes' ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-[#D01A2B]" />
                  <span>Payment Information</span>
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-600">Consultation Fee:</p>
                    <p className="font-semibold">${consultationFee}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-600">Payment Status:</p>
                    <p className="font-semibold">{selectedAppointment.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</p>
                  </div>
                  {selectedAppointment.paymentMethod && (
                    <div className="flex justify-between mt-2">
                      <p className="text-gray-600">Payment Method:</p>
                      <p className="font-semibold capitalize">{selectedAppointment.paymentMethod}</p>
                    </div>
                  )}
                  {selectedAppointment.paymentDate && (
                    <div className="flex justify-between mt-2">
                      <p className="text-gray-600">Payment Date:</p>
                      <p className="font-semibold">{new Date(selectedAppointment.paymentDate).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Appointment?</h3>
              <p className="text-gray-500">Are you sure you want to cancel this appointment? This action cannot be undone.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                No, Go Back
              </button>
              <button
                onClick={confirmCancelAppointment}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Process Payment</h3>
              <p className="text-gray-500">Collect consultation fee from {selectedAppointment.childName}</p>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Consultation Fee:</span>
                <span className="font-bold text-xl text-[#D01A2B]">${consultationFee}.00</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Amount Received *</label>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount received"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                autoFocus
              />
              {paymentAmount && parseFloat(paymentAmount) > consultationFee && (
                <p className="text-sm text-green-600 mt-1">
                  Change: ${(parseFloat(paymentAmount) - consultationFee).toFixed(2)}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${
                    paymentMethod === 'cash' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${
                    paymentMethod === 'card' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card</span>
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmPayment} disabled={processingPayment} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2">
                {processingPayment ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Process Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
