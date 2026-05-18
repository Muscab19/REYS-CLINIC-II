import React, { useState, useEffect } from 'react';
import { 
  Heart, CheckCircle, LogOut, Search, Eye, Package, 
  ClipboardList, AlertTriangle, RefreshCw, ChevronLeft, 
  ChevronRight, X, Loader, FileText, User, Clock, 
  Menu, ArrowLeft, Pill, Truck, Plus, Microscope,
  TestTube, FileCheck, AlertCircle, Download, Printer,
  Calendar, Activity, TrendingUp, TrendingDown, Users,
  Home, Settings, Bell, Edit, Trash2, BarChart3, Shield
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';

// ==================== LAB-TECH DASHBOARD MAIN PAGE ====================
const LabTechDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [labTests, setLabTests] = useState([]);
  const [stats, setStats] = useState({
    totalTests: 0,
    pendingTests: 0,
    completedTests: 0,
    inProgressTests: 0
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    if (user?.role === 'lab-tech') {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    setLoading(true);
    const storedLabTests = JSON.parse(localStorage.getItem('labTests') || '[]');
    setLabTests(storedLabTests);
    
    const totalTests = storedLabTests.length;
    const pendingTests = storedLabTests.filter(t => t.status === 'pending').length;
    const completedTests = storedLabTests.filter(t => t.status === 'completed').length;
    const inProgressTests = storedLabTests.filter(t => t.status === 'in-progress').length;
    
    setStats({ totalTests, pendingTests, completedTests, inProgressTests });
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const pendingCount = labTests.filter(t => t.status === 'pending').length;
  const recentTests = [...labTests].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  ).slice(0, 5);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" />, path: '/labtech-dashboard' },
    { id: 'tests', label: 'Lab Tests Requests', icon: <TestTube className="w-5 h-5" />, path: '/labtech-tests' },
    { id: 'results', label: 'Test Results', icon: <FileCheck className="w-5 h-5" />, path: '/labtech-results' },
    { id: 'tests', label: 'Lab Tests', icon: <TestTube className="w-5 h-5" />, path: '/lab-tests' },
  ];

  if (!isAuthenticated || user?.role !== 'lab-tech') {
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
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white shadow-xl z-40 transition-transform duration-300 lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } w-72`}>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          </div>
          
          <div className="flex items-center space-x-3 mb-8 p-3 bg-blue-50 rounded-xl">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase() || 'L'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name || 'Lab Technician'}</p>
              <p className="text-xs text-gray-500">Lab Technician</p>
              <p className="text-xs text-gray-400">{user?.staffId || 'LT0001'}</p>
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

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <main className="lg:ml-72 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Lab Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.name}!</p>
          </div>
          <Link
            to="/labtech-tests/new"
            className="mt-4 md:mt-0 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Lab Test</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-[#D01A2B]" /></div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Microscope className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTests}</p>
                <p className="text-gray-500 text-sm mt-1">Total Tests</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingTests}</p>
                <p className="text-gray-500 text-sm mt-1">Pending Tests</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.inProgressTests}</p>
                <p className="text-gray-500 text-sm mt-1">In Progress</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.completedTests}</p>
                <p className="text-gray-500 text-sm mt-1">Completed</p>
              </div>
            </div>

            {/* Pending Tests Alert */}
            {pendingCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Pending Tests</h3>
                    <p className="text-sm text-yellow-700">{pendingCount} test(s) waiting to be processed</p>
                  </div>
                  <Link to="/labtech-tests" className="ml-auto text-yellow-700 text-sm font-medium hover:underline">
                    View Tests →
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Link to="/labtech-tests" className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <TestTube className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-blue-600 text-sm font-medium">View All →</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Process Lab Tests</h3>
                <p className="text-sm text-gray-600">View and process pending laboratory tests</p>
              </Link>
              
              <Link to="/labtech-results" className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-green-600 text-sm font-medium">Manage →</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Test Results</h3>
                <p className="text-sm text-gray-600">Submit and manage test results</p>
              </Link>
            </div>

            {/* Recent Lab Tests */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Recent Lab Tests</h2>
                <Link to="/labtech-tests" className="text-blue-600 text-sm">View All →</Link>
              </div>
              <div className="divide-y">
                {recentTests.length > 0 ? (
                  recentTests.map(test => (
                    <div key={test.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <TestTube className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{test.testName}</p>
                          <p className="text-sm text-gray-500">Patient: {test.patientName} • {test.testType}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          test.status === 'completed' ? 'bg-green-100 text-green-700' :
                          test.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {test.status === 'completed' ? 'Completed' : 
                           test.status === 'in-progress' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Microscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No lab tests yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default LabTechDashboard;