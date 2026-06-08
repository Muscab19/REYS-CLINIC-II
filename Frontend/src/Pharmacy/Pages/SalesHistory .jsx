import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Loader, 
  Pill, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Filter, 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Heart,
  LogOut,
  Menu,
  Home,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Truck,
  Box,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Bell,
  FileText,
  XCircle,
  Save,
  Upload,
  Receipt,
  CreditCard,
  Wallet,
  Smartphone,
  Building,
  History,
  FileCheck,
  Users,
  Percent,
  PieChart
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const SalesHistory = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mobileNumber, setMobileNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    averageMargin: 0,
    paidSales: 0,
    partialSales: 0,
    unpaidSales: 0,
    totalOutstanding: 0,
    cashSales: 0,
    mobileSales: 0,
    bankSales: 0,
    walkinSales: 0,
    prescriptionSales: 0,
    topSellingProduct: '',
    topProfitProduct: ''
  });

  // Check if user is pharmacist
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

  // Load sales from API/localStorage
  useEffect(() => {
    fetchSales();
  }, []);

  // Helper function to get cost of an item (fetch from inventory if needed)
  const getItemCost = async (itemName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory?search=${encodeURIComponent(itemName)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        return data.data[0].cost || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching item cost:', error);
      return 0;
    }
  };

  // Calculate profit for a sale
  const calculateSaleProfit = async (sale) => {
    let totalCost = 0;
    let totalRevenue = sale.total || sale.subtotal || 0;
    
    if (sale.items && sale.items.length > 0) {
      for (const item of sale.items) {
        // If item has cost already stored, use it
        if (item.cost) {
          totalCost += item.cost * item.quantity;
        } else {
          // Try to get cost from inventory
          const cost = await getItemCost(item.name);
          totalCost += cost * item.quantity;
        }
      }
    }
    
    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    return { cost: totalCost, profit, margin };
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      // First try to get from localStorage (for walk-in sales)
      const localSales = JSON.parse(localStorage.getItem('walkinSales') || '[]');
      
      // Try to get from API for prescription sales
      const token = localStorage.getItem('token');
      let apiSales = [];
      try {
        const response = await fetch(`${API_BASE_URL}/api/sales`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          apiSales = data.data;
        }
      } catch (error) {
        console.log('API sales not available, using local data only');
      }
      
      // Combine sales and add payment tracking and profit calculation
      const allSales = [];
      for (const sale of [...localSales, ...apiSales]) {
        const profitData = await calculateSaleProfit(sale);
        allSales.push({
          ...sale,
          remainingAmount: sale.total - (sale.paidAmount || sale.total || 0),
          paymentStatus: getPaymentStatus(sale),
          cost: profitData.cost,
          profit: profitData.profit,
          margin: profitData.margin
        });
      }
      
      setSales(allSales);
      calculateStats(allSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = (sale) => {
    const total = sale.total || sale.subtotal || 0;
    const paid = sale.paidAmount || 0;
    
    if (paid >= total) return 'paid';
    if (paid > 0 && paid < total) return 'partial';
    return 'unpaid';
  };

  const calculateStats = (salesList) => {
    const totalRevenue = salesList.reduce((sum, sale) => sum + (sale.total || sale.subtotal || 0), 0);
    const totalCost = salesList.reduce((sum, sale) => sum + (sale.cost || 0), 0);
    const totalProfit = salesList.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const totalOutstanding = salesList.reduce((sum, sale) => sum + (sale.remainingAmount || 0), 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    const paidSales = salesList.filter(s => getPaymentStatus(s) === 'paid').length;
    const partialSales = salesList.filter(s => getPaymentStatus(s) === 'partial').length;
    const unpaidSales = salesList.filter(s => getPaymentStatus(s) === 'unpaid').length;
    
    const cashSales = salesList.filter(s => s.paymentMethod === 'cash').length;
    const mobileSales = salesList.filter(s => s.paymentMethod === 'mobile').length;
    const bankSales = salesList.filter(s => s.paymentMethod === 'bank').length;
    
    const walkinSales = salesList.filter(s => s.saleType === 'walkin' || !s.saleType).length;
    const prescriptionSales = salesList.filter(s => s.saleType === 'prescription').length;
    
    // Calculate top selling product
    const productSales = {};
    const productProfit = {};
    salesList.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const productName = item.name;
          const quantity = item.quantity || 0;
          const revenue = (item.price || 0) * quantity;
          const cost = (item.cost || 0) * quantity;
          const profit = revenue - cost;
          
          productSales[productName] = (productSales[productName] || 0) + quantity;
          productProfit[productName] = (productProfit[productName] || 0) + profit;
        });
      }
    });
    
    const topSelling = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];
    const topProfit = Object.entries(productProfit).sort((a, b) => b[1] - a[1])[0];
    
    setStats({
      totalSales: salesList.length,
      totalRevenue,
      totalCost,
      totalProfit,
      averageMargin: avgMargin,
      paidSales,
      partialSales,
      unpaidSales,
      totalOutstanding,
      cashSales,
      mobileSales,
      bankSales,
      walkinSales,
      prescriptionSales,
      topSellingProduct: topSelling ? topSelling[0] : 'N/A',
      topProfitProduct: topProfit ? topProfit[0] : 'N/A'
    });
  };

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setShowDetailsModal(true);
  };

  const handleMakePayment = (sale) => {
    setSelectedSale(sale);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setMobileNumber('');
    setBankName('');
    setTransactionId('');
    setPaymentNote('');
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedSale) return;
    
    const totalAmount = selectedSale.total || selectedSale.subtotal || 0;
    const currentPaid = selectedSale.paidAmount || 0;
    const remaining = totalAmount - currentPaid;
    const payment = parseFloat(paymentAmount);
    
    if (!payment || payment <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    
    if (payment > remaining) {
      toast.error(`Payment exceeds remaining balance. Remaining: $${remaining.toFixed(2)}`);
      return;
    }
    
    // Validate payment method specific fields
    if (paymentMethod === 'mobile' && !mobileNumber) {
      toast.error('Please enter mobile number');
      return;
    }
    if (paymentMethod === 'bank' && (!bankName || !transactionId)) {
      toast.error('Please enter bank name and transaction ID');
      return;
    }
    
    const newPaidAmount = currentPaid + payment;
    const newPaymentStatus = newPaidAmount >= totalAmount ? 'paid' : 'partial';
    
    // Update sale in localStorage
    const updatedSales = sales.map(sale => {
      if (sale.id === selectedSale.id) {
        const paymentHistory = sale.paymentHistory || [];
        return {
          ...sale,
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus,
          remainingAmount: totalAmount - newPaidAmount,
          paymentHistory: [...paymentHistory, {
            date: new Date().toISOString(),
            amount: payment,
            method: paymentMethod,
            note: paymentNote,
            receivedBy: user?.name,
            mobileNumber: paymentMethod === 'mobile' ? mobileNumber : null,
            bankName: paymentMethod === 'bank' ? bankName : null,
            transactionId: paymentMethod === 'bank' ? transactionId : null
          }]
        };
      }
      return sale;
    });
    
    // Update localStorage
    localStorage.setItem('walkinSales', JSON.stringify(updatedSales.filter(s => s.saleType !== 'prescription')));
    
    setSales(updatedSales);
    calculateStats(updatedSales);
    setShowPaymentModal(false);
    setSelectedSale(null);
    
    toast.success(`Payment of $${payment.toFixed(2)} recorded successfully!`);
  };

  const getPaymentStatusBadge = (sale) => {
    const status = getPaymentStatus(sale);
    switch(status) {
      case 'paid':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><CheckCircle className="w-3 h-3" /><span>Paid</span></span>;
      case 'partial':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><AlertTriangle className="w-3 h-3" /><span>Partial</span></span>;
      default:
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><XCircle className="w-3 h-3" /><span>Unpaid</span></span>;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch(method) {
      case 'cash': return <DollarSign className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'bank': return <Building className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
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

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.saleId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.soldBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items?.some(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || 
      (filterType === 'walkin' && (!sale.saleType || sale.saleType === 'walkin')) ||
      (filterType === 'prescription' && sale.saleType === 'prescription');
    
    const matchesPaymentStatus = filterPaymentStatus === 'all' || getPaymentStatus(sale) === filterPaymentStatus;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || sale.paymentMethod === filterPaymentMethod;
    
    let matchesDate = true;
    if (startDate && sale.date) {
      const saleDate = new Date(sale.date).toDateString();
      const start = new Date(startDate).toDateString();
      matchesDate = saleDate >= start;
    }
    if (endDate && sale.date) {
      const saleDate = new Date(sale.date).toDateString();
      const end = new Date(endDate).toDateString();
      matchesDate = matchesDate && saleDate <= end;
    }
    
    return matchesSearch && matchesType && matchesPaymentStatus && matchesPaymentMethod && matchesDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleExport = () => {
    const data = filteredSales.map(sale => ({
      'Sale ID': sale.saleId,
      'Date': formatDate(sale.date),
      'Type': sale.saleType || 'Walk-in',
      'Items': sale.items?.map(i => `${i.name} x${i.quantity}`).join(', '),
      'Revenue': sale.total || sale.subtotal,
      'Cost': sale.cost || 0,
      'Profit': sale.profit || 0,
      'Margin %': sale.margin ? sale.margin.toFixed(1) : '0',
      'Paid': sale.paidAmount || 0,
      'Remaining': (sale.total || sale.subtotal) - (sale.paidAmount || 0),
      'Payment Status': getPaymentStatus(sale),
      'Payment Method': sale.paymentMethod,
      'Sold By': sale.soldBy
    }));
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Sales exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isAuthenticated || user?.role !== 'pharmacy') {
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
              <button onClick={() => navigate('/pharmacy-dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <img src={logo} alt="REYS CLINIC Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                  <p className="text-xs text-gray-500">Sales History & Profit Analytics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={handleExport} className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
              </button>
              <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Printer className="w-4 h-4" /><span className="hidden sm:inline">Print</span>
              </button>
              <button onClick={fetchSales} className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
            <p className="text-sm text-gray-500">Total Sales</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-green-600">Total Revenue</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalCost)}</p>
            <p className="text-sm text-red-600">Total Cost</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalProfit)}</p>
            <p className="text-sm text-purple-600">Total Profit</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{stats.averageMargin.toFixed(1)}%</p>
            <p className="text-sm text-indigo-600">Avg. Margin</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalOutstanding)}</p>
            <p className="text-sm text-orange-600">Outstanding</p>
          </div>
        </div>

        {/* Stats Cards - Row 2 (Payment Status & Top Products) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.paidSales}</span>
            </div>
            <p className="text-sm text-gray-600">Fully Paid</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-yellow-600">{stats.partialSales}</span>
            </div>
            <p className="text-sm text-gray-600">Partial Payments</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 truncate">{stats.topSellingProduct}</p>
                <p className="text-xs text-gray-500">Top Selling</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 truncate">{stats.topProfitProduct}</p>
                <p className="text-xs text-gray-500">Top Profit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Cash</span>
            </div>
            <span className="font-bold">{stats.cashSales}</span>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Mobile</span>
            </div>
            <span className="font-bold">{stats.mobileSales}</span>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Bank</span>
            </div>
            <span className="font-bold">{stats.bankSales}</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by sale ID, sold by, or product..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
              />
            </div>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Types</option>
              <option value="walkin">Walk-in</option>
              <option value="prescription">Prescription</option>
            </select>
            <select value={filterPaymentStatus} onChange={(e) => { setFilterPaymentStatus(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <select value={filterPaymentMethod} onChange={(e) => { setFilterPaymentMethod(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="mobile">Mobile</option>
              <option value="bank">Bank</option>
            </select>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg" placeholder="Start Date" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg" placeholder="End Date" />
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-[#D01A2B]" /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sale ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Margin</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentSales.map((sale) => {
                      const total = sale.total || sale.subtotal || 0;
                      const paid = sale.paidAmount || 0;
                      const profit = sale.profit || 0;
                      const margin = sale.margin || 0;
                      
                      return (
                        <tr key={sale.id || sale._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm font-semibold text-[#D01A2B]">{sale.saleId || sale._id?.slice(-8)}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{formatDate(sale.date || sale.createdAt)}</td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {sale.items?.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="text-sm">{item.name} x{item.quantity}</div>
                              ))}
                              {sale.items?.length > 2 && (
                                <div className="text-xs text-gray-500">+{sale.items.length - 2} more</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(total)}</td>
                          <td className="px-6 py-4 text-red-600">{formatCurrency(sale.cost || 0)}</td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                              {formatCurrency(profit)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                              margin >= 50 ? 'bg-green-100 text-green-700' :
                              margin >= 25 ? 'bg-blue-100 text-blue-700' :
                              margin >= 10 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-green-600">{formatCurrency(paid)}</td>
                          <td className="px-6 py-4">{getPaymentStatusBadge(sale)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-1">
                              {getPaymentMethodIcon(sale.paymentMethod)}
                              <span className="text-sm capitalize">{sale.paymentMethod}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button onClick={() => handleViewDetails(sale)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                                <Eye className="w-4 h-4" />
                              </button>
                              {getPaymentStatus(sale) !== 'paid' && (
                                <button onClick={() => handleMakePayment(sale)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Make Payment">
                                  <DollarSign className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredSales.length === 0 && (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No sales found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              )}

              {/* Pagination */}
              {filteredSales.length > 0 && (
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSales.length)} of {filteredSales.length} sales
                  </p>
                  <div className="flex space-x-2">
                    <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-2 border rounded-lg disabled:opacity-50">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 bg-[#D01A2B] text-white rounded-lg">{currentPage}</span>
                    <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border rounded-lg disabled:opacity-50">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sale Details Modal */}
      {showDetailsModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Sale Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {/* Sale Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Sale ID</p>
                    <p className="text-2xl font-mono font-bold text-[#D01A2B]">{selectedSale.saleId || selectedSale._id?.slice(-8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">{formatDate(selectedSale.date || selectedSale.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  {getPaymentStatusBadge(selectedSale)}
                  <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {getPaymentMethodIcon(selectedSale.paymentMethod)}
                    <span className="capitalize">{selectedSale.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Items with Profit Breakdown */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Package className="w-4 h-4 text-[#D01A2B]" />
                  <span>Items Purchased</span>
                </h4>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Product</th>
                        <th className="px-4 py-2 text-center text-sm font-semibold">Qty</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Cost</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Price</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Profit</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.items?.map((item, idx) => {
                        const itemCost = item.cost || 0;
                        const itemPrice = item.price || 0;
                        const itemProfit = (itemPrice - itemCost) * item.quantity;
                        const itemMargin = itemPrice > 0 ? ((itemPrice - itemCost) / itemPrice * 100) : 0;
                        return (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 text-sm">{item.name}</td>
                            <td className="px-4 py-2 text-center text-sm">{item.quantity}</td>
                            <td className="px-4 py-2 text-right text-sm text-red-600">${itemCost.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right text-sm text-green-600">${itemPrice.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right text-sm text-purple-600">${itemProfit.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                itemMargin >= 50 ? 'bg-green-100 text-green-700' :
                                itemMargin >= 25 ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {itemMargin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan="2" className="px-4 py-2 text-right font-semibold">Totals:</td>
                        <td className="px-4 py-2 text-right font-semibold text-red-600">{formatCurrency(selectedSale.cost || 0)}</td>
                        <td className="px-4 py-2 text-right font-semibold text-green-600">{formatCurrency(selectedSale.total || selectedSale.subtotal || 0)}</td>
                        <td className="px-4 py-2 text-right font-bold text-purple-600">{formatCurrency(selectedSale.profit || 0)}</td>
                        <td className="px-4 py-2 text-right">
                          <span className="font-bold text-indigo-600">{((selectedSale.profit || 0) / (selectedSale.total || 1) * 100).toFixed(1)}%</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-[#D01A2B]" />
                  <span>Payment Summary</span>
                </h4>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedSale.total || selectedSale.subtotal || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Cost</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(selectedSale.cost || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Profit</p>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(selectedSale.profit || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Paid Amount</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedSale.paidAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(((selectedSale.total || selectedSale.subtotal || 0) - (selectedSale.paidAmount || 0)))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Margin</p>
                    <p className="text-xl font-bold text-indigo-600">{((selectedSale.profit || 0) / (selectedSale.total || 1) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {selectedSale.paymentHistory && selectedSale.paymentHistory.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <History className="w-4 h-4 text-[#D01A2B]" />
                    <span>Payment History</span>
                  </h4>
                  <div className="bg-gray-50 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold">Amount</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Method</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Received By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSale.paymentHistory.map((payment, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 text-sm">{formatDate(payment.date)}</td>
                            <td className="px-4 py-2 text-right text-sm font-semibold text-green-600">{formatCurrency(payment.amount)}</td>
                            <td className="px-4 py-2 text-sm capitalize">{payment.method}</td>
                            <td className="px-4 py-2 text-sm">{payment.receivedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sale Info */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <User className="w-4 h-4 text-[#D01A2B]" />
                  <span>Sale Information</span>
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p><strong>Sold By:</strong> {selectedSale.soldBy || selectedSale.soldByName || 'N/A'}</p>
                  {selectedSale.paymentNote && <p className="mt-2"><strong>Note:</strong> {selectedSale.paymentNote}</p>}
                </div>
              </div>

              <div className="flex space-x-3">
                {getPaymentStatus(selectedSale) !== 'paid' && (
                  <button onClick={() => { setShowDetailsModal(false); handleMakePayment(selectedSale); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                    Make Payment
                  </button>
                )}
                <button onClick={() => setShowDetailsModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Record Payment</h3>
              <p className="text-gray-500">Sale ID: {selectedSale.saleId || selectedSale._id?.slice(-8)}</p>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold">${(selectedSale.total || selectedSale.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Already Paid:</span>
                <span className="text-green-600">${(selectedSale.paidAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining:</span>
                <span className="text-red-600 font-bold">${((selectedSale.total || selectedSale.subtotal || 0) - (selectedSale.paidAmount || 0)).toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setPaymentMethod('cash')} className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-1 ${paymentMethod === 'cash' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'}`}>
                  <DollarSign className="w-5 h-5" /><span className="text-xs">Cash</span>
                </button>
                <button type="button" onClick={() => setPaymentMethod('mobile')} className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-1 ${paymentMethod === 'mobile' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'}`}>
                  <Smartphone className="w-5 h-5" /><span className="text-xs">Mobile</span>
                </button>
                <button type="button" onClick={() => setPaymentMethod('bank')} className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-1 ${paymentMethod === 'bank' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'}`}>
                  <Building className="w-5 h-5" /><span className="text-xs">Bank</span>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Payment Amount *</label>
              <input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]" autoFocus />
            </div>

            {paymentMethod === 'mobile' && (
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Mobile Number *</label>
                <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="Enter mobile number" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]" />
              </div>
            )}

            {paymentMethod === 'bank' && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Bank Name *</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Enter bank name" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]" />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Transaction ID *</label>
                  <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter transaction ID" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]" />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Note (Optional)</label>
              <textarea value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Any notes about this payment" rows="2" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]" />
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">Cancel</button>
              <button onClick={confirmPayment} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold">Record Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
