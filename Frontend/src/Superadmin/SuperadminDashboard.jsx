import React, { useState, useEffect } from 'react';
import { 
  Heart, CheckCircle, LogOut, Search, Eye, Package, 
  ClipboardList, AlertTriangle, RefreshCw, ChevronLeft, 
  ChevronRight, X, Loader, FileText, User, Clock, 
  Menu, ArrowLeft, Users, Calendar, DollarSign, 
  TrendingUp, TrendingDown, Activity, Shield, Settings,
  BarChart3, FileCheck, Plus, Edit, Trash2, Home,
  Building, Bell, CreditCard, Download, Printer, Filter, AlertCircle 
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';

// ==================== SUPERADMIN DASHBOARD MAIN PAGE ====================
const SuperadminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Dashboard Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    pendingTasks: 0,
    doctors: 0,
    receptionists: 0,
    pharmacists: 0,
    labTechs: 0,
    patients: 0,
    todayAppointments: 0,
    weeklyAppointments: 0,
    monthlyAppointments: 0,
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    activeUsers: 0,
    inactiveUsers: 0
  });
  
  const [appointments, setAppointments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (user?.role !== 'superadmin') {
      navigate('/');
      return;
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Fetch patients from API
      const patientsRes = await fetch(`${API_BASE_URL}/api/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const patientsData = await patientsRes.json();
      
      // Fetch appointments from API
      const appointmentsRes = await fetch(`${API_BASE_URL}/api/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const appointmentsData = await appointmentsRes.json();
      
      // Fetch revenue data from API
      const revenueRes = await fetch(`${API_BASE_URL}/api/revenue/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const revenueData = await revenueRes.json();
      
      // Load users from localStorage (temporary - should be from API)
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const allUsers = [...users, { username: 'superadmin', role: 'superadmin', name: 'Super Admin', active: true }];
      
      // Calculate user stats
      const doctors = allUsers.filter(u => u.role === 'doctor').length;
      const receptionists = allUsers.filter(u => u.role === 'reception').length;
      const pharmacists = allUsers.filter(u => u.role === 'pharmacy').length;
      const labTechs = allUsers.filter(u => u.role === 'labtech').length;
      const patientsCount = patientsData.success ? patientsData.data.length : 0;
      const activeUsers = allUsers.filter(u => u.active !== false).length;
      const inactiveUsers = allUsers.filter(u => u.active === false).length;
      
      // Process appointments
      const allAppointments = appointmentsData.success ? appointmentsData.data : [];
      setAppointments(allAppointments);
      
      const today = new Date().toDateString();
      const todayAppointments = allAppointments.filter(a => new Date(a.preferredDate).toDateString() === today).length;
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyAppointments = allAppointments.filter(a => new Date(a.preferredDate) >= oneWeekAgo).length;
      
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const monthlyAppointments = allAppointments.filter(a => new Date(a.preferredDate) >= oneMonthAgo).length;
      
      // Process revenue
      const totalRevenue = revenueData.success ? revenueData.data.summary?.totalRevenue || 0 : 0;
      const todayRevenue = revenueData.success ? revenueData.data.dailyBreakdown?.find(d => d._id === today)?.total || 0 : 0;
      const weeklyRevenue = revenueData.success ? revenueData.data.weeklyRevenue || 0 : 0;
      const monthlyRevenue = revenueData.success ? revenueData.data.monthlyRevenue || 0 : 0;
      
      // Load inventory for low stock alerts (from localStorage for now)
      const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
      const lowStock = inventory.filter(item => item.currentStock < item.minStock);
      setLowStockItems(lowStock);
      
      // Load recent activities
      const activities = JSON.parse(localStorage.getItem('activities') || '[]');
      setRecentActivities(activities.slice(0, 10));
      
      setStats({
        totalUsers: allUsers.length,
        totalAppointments: allAppointments.length,
        totalRevenue,
        pendingTasks: lowStock.length + allAppointments.filter(a => a.status === 'pending').length,
        doctors,
        receptionists,
        pharmacists,
        labTechs,
        patients: patientsCount,
        todayAppointments,
        weeklyAppointments,
        monthlyAppointments,
        dailyRevenue: todayRevenue,
        weeklyRevenue,
        monthlyRevenue,
        activeUsers,
        inactiveUsers
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" />, path: '/superadmin' },
    { id: 'users', label: 'User Management', icon: <Users className="w-5 h-5" />, path: '/user-management' },
    { id: 'revenue', label: 'Revenue Dashboard', icon: <DollarSign className="w-5 h-5" />, path: '/revenue' },
  ];

  if (!isAuthenticated || user?.role !== 'superadmin') {
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
      } w-72 overflow-y-auto`}>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <img src={logo} alt="Logo" className="h-12 w-auto" />
          </div>
          
          <div className="flex items-center space-x-3 mb-8 p-3 bg-purple-50 rounded-xl">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name || 'Super Admin'}</p>
              <p className="text-xs text-gray-500">Super Administrator</p>
              <p className="text-xs text-gray-400">{user?.staffId || 'SA0001'}</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map(item => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors w-full"
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.name}! Here's your system overview</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button 
              onClick={loadDashboardData}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-purple-600" /></div>
        ) : (
          <>
            {/* Key Metrics - Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-gray-500 text-sm mt-1">Total Users</p>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Active: {stats.activeUsers}</span>
                  <span>Inactive: {stats.inactiveUsers}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAppointments}</p>
                <p className="text-gray-500 text-sm mt-1">Total Appointments</p>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Today: {stats.todayAppointments}</span>
                  <span>Week: {stats.weeklyAppointments}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-gray-500 text-sm mt-1">Total Revenue</p>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Daily: ${stats.dailyRevenue}</span>
                  <span>Monthly: ${stats.monthlyRevenue}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingTasks}</p>
                <p className="text-gray-500 text-sm mt-1">Pending Tasks</p>
                <div className="mt-2 text-xs text-orange-600">
                  {lowStockItems.length} low stock alerts
                </div>
              </div>
            </div>

            {/* User Role Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{stats.doctors}</p>
                <p className="text-xs text-gray-600">Doctors</p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.receptionists}</p>
                <p className="text-xs text-gray-600">Receptionists</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.pharmacists}</p>
                <p className="text-xs text-gray-600">Pharmacists</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.labTechs}</p>
                <p className="text-xs text-gray-600">Lab Techs</p>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">{stats.patients}</p>
                <p className="text-xs text-gray-600">Patients</p>
              </div>
            </div>

            {/* System Health & Alerts */}
            {lowStockItems.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">System Alert: Low Stock</h3>
                    <p className="text-sm text-yellow-700">{lowStockItems.length} medication items are running low on stock</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Recent Appointments */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-900">Recent Appointments</h2>
                  <Link to="/superadmin-appointments" className="text-purple-600 text-sm">View All →</Link>
                </div>
                <div className="divide-y">
                  {appointments.slice(0, 5).map(apt => (
                    <div key={apt._id || apt.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-900">{apt.childName}</p>
                        <p className="text-sm text-gray-500">{apt.preferredDate} • {apt.preferredTime}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {apt.status || 'pending'}
                      </span>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No appointments yet</div>
                  )}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-900">Recent Activities</h2>
                </div>
                <div className="divide-y">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, idx) => (
                      <div key={idx} className="p-4 flex items-center space-x-3 hover:bg-gray-50">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">No recent activities</div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Reports */}
            <div className="grid md:grid-cols-4 gap-6">
              <Link to="/user-management" className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-5 hover:shadow-md transition-shadow text-center">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">User Management</h3>
                <p className="text-xs text-gray-500">Manage all system users</p>
              </Link>
              
              <Link to="/superadmin-staff" className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 hover:shadow-md transition-shadow text-center">
                <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Create Staff</h3>
                <p className="text-xs text-gray-500">Add new staff members</p>
              </Link>
              
              <Link to="/revenue" className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-5 hover:shadow-md transition-shadow text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Revenue Dashboard</h3>
                <p className="text-xs text-gray-500">Track financial performance</p>
              </Link>
              
              <Link to="/superadmin-reports" className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-5 hover:shadow-md transition-shadow text-center">
                <BarChart3 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Reports</h3>
                <p className="text-xs text-gray-500">Generate analytics reports</p>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SuperadminDashboard;