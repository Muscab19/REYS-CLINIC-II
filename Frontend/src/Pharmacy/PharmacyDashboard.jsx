import React, { useState, useEffect } from 'react';
import { 
  Heart, CheckCircle, LogOut, Search, Eye, Package, 
  ClipboardList, AlertTriangle, RefreshCw, ChevronLeft, 
  ChevronRight, X, Loader, FileText, User, Clock, 
  Menu, ArrowLeft, Pill, Truck, Plus, DollarSign,
  Receipt, History, ShoppingCart, Store
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';

// ==================== PHARMACY DASHBOARD MAIN PAGE ====================
const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalPrescriptions: 0,
    completedPrescriptions: 0,
    pendingPrescriptions: 0,
    totalSales: 0,
    todaySales: 0,
    outstandingBalance: 0
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (user?.role !== 'pharmacy') {
      navigate('/');
      return;
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    if (user?.role === 'pharmacy') {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    setLoading(true);
    
    // Load prescriptions
    const storedPrescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
    setPrescriptions(storedPrescriptions);
    
    // Load inventory
    const storedInventory = JSON.parse(localStorage.getItem('inventory') || '[]');
    setInventory(storedInventory);
    
    // Load sales
    const storedSales = JSON.parse(localStorage.getItem('walkinSales') || '[]');
    setSales(storedSales);
    
    // Calculate non-financial stats
    const totalPrescriptions = storedPrescriptions.length;
    const completedPrescriptions = storedPrescriptions.filter(p => p.status === 'dispensed').length;
    const pendingPrescriptions = storedPrescriptions.filter(p => p.status === 'pending').length;
    const totalProducts = storedInventory.length;
    
    setStats({ 
      totalProducts, 
      totalPrescriptions, 
      completedPrescriptions, 
      pendingPrescriptions,
      totalSales: 0,
      todaySales: 0,
      outstandingBalance: 0
    });
    
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const lowStockCount = inventory.filter(item => item.currentStock < item.minStock).length;
  const recentPrescriptions = [...prescriptions].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  ).slice(0, 5);
  const recentSales = [...sales].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  ).slice(0, 5);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Heart className="w-5 h-5" />, path: '/pharmacy-dashboard' },
    { id: 'prescriptions', label: 'Prescriptions', icon: <FileText className="w-5 h-5" />, path: '/pharmacy-prescriptions' },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-5 h-5" />, path: '/pharmacy-inventory' },
    { id: 'walkin-sales', label: 'Walk-in Sales', icon: <Store className="w-5 h-5" />, path: '/sales' },
    { id: 'sales-history', label: 'Sales History', icon: <History className="w-5 h-5" />, path: '/sales-history' },
    { id: 'pharmacy-revenue', label: 'Pharmacy Revenue', icon: <DollarSign className="w-5 h-5" />, path: '/pharmacy-revenue' }
  ];

  if (!isAuthenticated || user?.role !== 'pharmacy') {
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
          
          <div className="flex items-center space-x-3 mb-8 p-3 bg-red-50 rounded-xl">
            <div className="w-12 h-12 bg-[#D01A2B] rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name || 'Pharmacist'}</p>
              <p className="text-xs text-gray-500">Pharmacist</p>
              <p className="text-xs text-gray-400">{user?.staffId || 'PH0001'}</p>
            </div>
          </div>
          
          <nav className="space-y-0">
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pharmacy Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.name}!</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-[#D01A2B]" /></div>
        ) : (
          <>
            {/* Stats Cards - No Financial Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-gray-500 text-sm mt-1">Total Products</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                  <ClipboardList className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPrescriptions}</p>
                <p className="text-gray-500 text-sm mt-1">Total Prescriptions</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.completedPrescriptions}</p>
                <p className="text-gray-500 text-sm mt-1">Dispensed</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingPrescriptions}</p>
                <p className="text-gray-500 text-sm mt-1">Pending</p>
              </div>
            </div>

            {/* Second Row - Operational Stats Only */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Pending Prescriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingPrescriptions}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Low Stock Items</p>
                    <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Low Stock Alert</h3>
                    <p className="text-sm text-yellow-700">{lowStockCount} products are running low on stock</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Link to="/pharmacy-prescriptions" className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-blue-600 text-xs font-medium">View →</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Process Prescriptions</h3>
                <p className="text-xs text-gray-600">View and dispense pending prescriptions</p>
              </Link>
              
              <Link to="/pharmacy-inventory" className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-green-600 text-xs font-medium">Manage →</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Inventory Management</h3>
                <p className="text-xs text-gray-600">Track and manage medication stock</p>
              </Link>
              
              <Link to="/pharmacy-walkin-sales" className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-purple-600 text-xs font-medium">Sell →</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Walk-in Sales</h3>
                <p className="text-xs text-gray-600">Sell medications without prescription</p>
              </Link>
              
              <Link to="/pharmacy-sales-history" className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-orange-600 text-xs font-medium">History →</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Sales History</h3>
                <p className="text-xs text-gray-600">Track all sales and payments</p>
              </Link>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Prescriptions */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-900">Recent Prescriptions</h2>
                  <Link to="/pharmacy-prescriptions" className="text-[#D01A2B] text-sm">View All →</Link>
                </div>
                <div className="divide-y">
                  {recentPrescriptions.length > 0 ? (
                    recentPrescriptions.map(pres => (
                      <div key={pres.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-[#D01A2B]" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{pres.patientName}</p>
                            <p className="text-sm text-gray-500">{pres.medications?.length || 0} medications • {pres.doctor}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          pres.status === 'dispensed' ? 'bg-green-100 text-green-700' :
                          pres.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {pres.status === 'dispensed' ? 'Dispensed' : pres.status === 'pending' ? 'Pending' : 'Cancelled'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No prescriptions yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Sales - Without Financial Details */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-900">Recent Sales</h2>
                  <Link to="/pharmacy-sales-history" className="text-[#D01A2B] text-sm">View All →</Link>
                </div>
                <div className="divide-y">
                  {recentSales.length > 0 ? (
                    recentSales.map(sale => (
                      <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{sale.saleId || `SALE-${sale.id}`}</p>
                            <p className="text-sm text-gray-500">{sale.items?.length || 0} items</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            (sale.paidAmount || 0) >= (sale.total || sale.subtotal) ? 'bg-green-100 text-green-700' :
                            (sale.paidAmount || 0) > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {(sale.paidAmount || 0) >= (sale.total || sale.subtotal) ? 'Paid' :
                             (sale.paidAmount || 0) > 0 ? 'Partial' : 'Unpaid'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No sales yet</p>
                      <Link to="/pharmacy-walkin-sales" className="text-sm text-[#D01A2B] mt-2 inline-block">
                        Start a sale →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PharmacyDashboard;
