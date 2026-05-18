import React, { useState, useEffect } from 'react';
import { 
  Heart, CheckCircle, LogOut, Search, Eye, Package, 
  ClipboardList, AlertTriangle, RefreshCw, ChevronLeft, 
  ChevronRight, X, Loader, FileText, User, Clock, 
  Menu, ArrowLeft, Pill, Truck, Plus, Microscope,
  TestTube, FileCheck, AlertCircle, Download, Printer,
  Calendar, Activity, TrendingUp, TrendingDown, Users,
  Home, Settings, Bell, Edit, Trash2, BarChart3, Shield,
  Stethoscope, Syringe, Droplet, Brain, Bone,
  FlaskConical, Scissors, Thermometer, HeartPulse
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const LabTechTests = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [testRequests, setTestRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTest, setSelectedTest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [additionalComments, setAdditionalComments] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    urgent: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (user?.role !== 'lab-tech') {
      navigate('/');
      return;
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    fetchTestRequests();
  }, []);

  const fetchTestRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/lab-requests`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setTestRequests(data.data);
        calculateStats(data.data);
      } else {
        toast.error(data.msg || 'Failed to load test requests');
      }
    } catch (error) {
      console.error('Error fetching test requests:', error);
      toast.error('Failed to load test requests. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tests) => {
    setStats({
      total: tests.length,
      pending: tests.filter(t => t.status === 'pending').length,
      inProgress: tests.filter(t => t.status === 'in-progress').length,
      completed: tests.filter(t => t.status === 'completed').length,
      urgent: tests.filter(t => t.priority === 'urgent' && t.status !== 'completed').length
    });
  };

  const handleStartProcessing = async (test) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/lab-requests/${test._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'in-progress' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Started processing ${test.testName} for ${test.patientName}`);
        fetchTestRequests();
      } else {
        toast.error(data.msg || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error starting processing:', error);
      toast.error('Failed to start processing');
    }
  };

  const handleProcessTest = (test) => {
    setSelectedTest(test);
    // Initialize result fields for the test
    const initialResults = {};
    if (test.parameters && test.parameters.length > 0) {
      test.parameters.forEach(param => {
        initialResults[param] = '';
      });
    }
    setTestResults(initialResults);
    setAdditionalComments('');
    setShowProcessModal(true);
  };

  const handleSubmitResults = async () => {
    if (!selectedTest) return;
    
    // Validate that all required parameters have results
    if (selectedTest.parameters && selectedTest.parameters.length > 0) {
      const missingParams = selectedTest.parameters.filter(param => !testResults[param]);
      if (missingParams.length > 0) {
        toast.error(`Please enter results for: ${missingParams.join(', ')}`);
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/lab-requests/${selectedTest._id}/results`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          results: testResults,
          additionalComments: additionalComments,
          performedBy: user?.name,
          completedAt: new Date().toISOString()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Test results submitted for ${selectedTest.patientName}`);
        fetchTestRequests();
        setShowProcessModal(false);
        setSelectedTest(null);
        setTestResults({});
        setAdditionalComments('');
      } else {
        toast.error(data.msg || 'Failed to submit results');
      }
    } catch (error) {
      console.error('Error submitting results:', error);
      toast.error('Failed to submit results');
    }
  };

  const handleViewDetails = (test) => {
    setSelectedTest(test);
    setShowDetailsModal(true);
  };

  const handleCancelTest = async (test) => {
    if (window.confirm(`Are you sure you want to cancel this test request for ${test.patientName}?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/lab-requests/${test._id}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'cancelled' })
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success(`Test request cancelled`);
          fetchTestRequests();
        } else {
          toast.error(data.msg || 'Failed to cancel request');
        }
      } catch (error) {
        console.error('Error cancelling test:', error);
        toast.error('Failed to cancel test request');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTests = testRequests.filter(test => {
    const matchesSearch = 
      test.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.requestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || test.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTests = filteredTests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  
  const goToPage = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>;
      case 'in-progress':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">In Progress</span>;
      case 'completed':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Completed</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'urgent') {
      return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><AlertCircle className="w-3 h-3" /><span>Urgent</span></span>;
    }
    return null;
  };

  if (!isAuthenticated || user?.role !== 'lab-tech') {
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
                onClick={() => navigate('/labtech-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <img src={logo} alt="REYS CLINIC Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                  <p className="text-xs text-gray-500">Laboratory - Test Requests</p>
                </div>
              </div>
            </div>
            <button onClick={fetchTestRequests} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TestTube className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Requests</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-yellow-600">Pending</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-sm text-blue-600">In Progress</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-green-600">Completed</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
            <p className="text-sm text-red-600">Urgent</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by test name, patient, request ID, or doctor..."
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
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent Only</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>

        {/* Test Requests Table */}
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Request ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Test Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Requested By</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentTests.map((test) => (
                      <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm font-semibold text-[#D01A2B]">{test.requestId}</span>
                            {getPriorityBadge(test.priority)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{test.testName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{test.patientName}</p>
                            <p className="text-xs text-gray-500">Age: {test.patientAge} years</p>
                            <p className="text-xs text-gray-400">Parent: {test.parentName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{test.requestedBy}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(test.requestDate)}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(test.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(test)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {test.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStartProcessing(test)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Start Processing"
                                >
                                  <Activity className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleProcessTest(test)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Process & Submit Results"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {test.status === 'in-progress' && (
                              <button
                                onClick={() => handleProcessTest(test)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Submit Results"
                              >
                                <FileCheck className="w-4 h-4" />
                              </button>
                            )}
                            {test.status === 'pending' && (
                              <button
                                onClick={() => handleCancelTest(test)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Cancel Request"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTests.length === 0 && (
                <div className="text-center py-12">
                  <Microscope className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No test requests found</h3>
                  <p className="text-gray-500">Test requests will appear here when doctors send them</p>
                </div>
              )}

              {/* Pagination */}
              {filteredTests.length > 0 && totalPages > 0 && (
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTests.length)} of {filteredTests.length} requests
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-1 rounded-lg transition-colors ${
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
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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

      {/* Test Details Modal */}
      {showDetailsModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Test Request Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Request ID</p>
                    <p className="text-2xl font-mono font-bold text-[#D01A2B]">{selectedTest.requestId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Request Date</p>
                    <p className="font-semibold">{formatDate(selectedTest.requestDate)}</p>
                  </div>
                </div>
                {selectedTest.priority === 'urgent' && (
                  <div className="mt-3 inline-flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>Urgent Request</span>
                  </div>
                )}
              </div>

              {/* Test Information */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <TestTube className="w-4 h-4 text-[#D01A2B]" />
                  <span>Test Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div><p className="text-sm text-gray-500">Test Name</p><p className="font-semibold">{selectedTest.testName}</p></div>
                  <div><p className="text-sm text-gray-500">Parameters</p><p>{selectedTest.parameters?.length || 0} parameters</p></div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <User className="w-4 h-4 text-[#D01A2B]" />
                  <span>Patient Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div><p className="text-sm text-gray-500">Patient Name</p><p className="font-semibold">{selectedTest.patientName}</p></div>
                  <div><p className="text-sm text-gray-500">Age</p><p>{selectedTest.patientAge} years</p></div>
                  <div><p className="text-sm text-gray-500">Parent/Guardian</p><p>{selectedTest.parentName}</p></div>
                  <div><p className="text-sm text-gray-500">Phone</p><p>{selectedTest.parentPhone}</p></div>
                </div>
              </div>

              {/* Requesting Doctor */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Stethoscope className="w-4 h-4 text-[#D01A2B]" />
                  <span>Requesting Doctor</span>
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="font-semibold">{selectedTest.requestedBy}</p>
                </div>
              </div>

              {/* Clinical Information */}
              {selectedTest.clinicalInfo && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <ClipboardList className="w-4 h-4 text-[#D01A2B]" />
                    <span>Clinical Information</span>
                  </h4>
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <p className="text-gray-700">{selectedTest.clinicalInfo}</p>
                  </div>
                </div>
              )}

              {/* Doctor's Notes */}
              {selectedTest.notes && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#D01A2B]" />
                    <span>Doctor's Notes</span>
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700">{selectedTest.notes}</p>
                  </div>
                </div>
              )}

              {/* Test Results (if completed) */}
              {selectedTest.status === 'completed' && selectedTest.results && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-green-600" />
                    <span>Test Results</span>
                  </h4>
                  <div className="bg-green-50 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-green-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Parameter</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedTest.results).map(([param, value]) => (
                          <tr key={param} className="border-t border-green-200">
                            <td className="px-4 py-2 text-sm font-medium">{param}</td>
                            <td className="px-4 py-2 text-sm">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    <p>Performed By: {selectedTest.performedBy}</p>
                    <p>Completed At: {formatDate(selectedTest.completedAt)}</p>
                    {selectedTest.additionalComments && <p>Comments: {selectedTest.additionalComments}</p>}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                {selectedTest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleStartProcessing(selectedTest);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Start Processing
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleProcessTest(selectedTest);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      Submit Results
                    </button>
                  </>
                )}
                {selectedTest.status === 'in-progress' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleProcessTest(selectedTest);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                  >
                    Submit Results
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Test Modal - Enter Results */}
      {showProcessModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Enter Test Results</h3>
              <button onClick={() => setShowProcessModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <p><span className="font-semibold">Patient:</span> {selectedTest.patientName}</p>
                  <p><span className="font-semibold">Test:</span> {selectedTest.testName}</p>
                  <p><span className="font-semibold">Request ID:</span> {selectedTest.requestId}</p>
                </div>

                <h4 className="font-semibold text-gray-900 mb-4">Test Parameters</h4>
                <div className="space-y-4">
                  {(selectedTest.parameters || []).map((param) => (
                    <div key={param} className="border rounded-lg p-4">
                      <label className="block font-semibold text-gray-900 mb-2">{param}</label>
                      <input
                        type="text"
                        value={testResults[param] || ''}
                        onChange={(e) => setTestResults({ ...testResults, [param]: e.target.value })}
                        placeholder={`Enter ${param} value`}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B] focus:outline-none"
                      />
                      {selectedTest.normalRanges && selectedTest.normalRanges[param] && (
                        <p className="text-xs text-gray-500 mt-1">
                          Normal Range: {selectedTest.normalRanges[param]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <label className="block font-semibold text-gray-900 mb-2">Additional Comments</label>
                  <textarea
                    rows="3"
                    value={additionalComments}
                    onChange={(e) => setAdditionalComments(e.target.value)}
                    placeholder="Any additional notes about the test results..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResults}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Submit Results
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabTechTests;