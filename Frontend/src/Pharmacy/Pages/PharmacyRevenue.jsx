import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Loader,
  FileText,
  Package,
  Pill,
  Receipt,
  CreditCard,
  Wallet,
  Smartphone,
  Building,
  CheckCircle,
  AlertTriangle,
  XCircle,
  PieChart,
  BarChart3,
  Users,
  Clock,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const PharmacyRevenue = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [walkinSales, setWalkinSales] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    averageMargin: 0,
    prescriptionRevenue: 0,
    prescriptionCost: 0,
    prescriptionProfit: 0,
    walkinRevenue: 0,
    walkinCost: 0,
    walkinProfit: 0,
    totalTransactions: 0,
    prescriptionCount: 0,
    walkinCount: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    cashAmount: 0,
    mobileAmount: 0,
    bankAmount: 0,
    cardAmount: 0
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

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch prescriptions from API
      let prescriptionsData = [];
      try {
        const prescriptionsResponse = await fetch(`${API_BASE_URL}/api/prescriptions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const prescriptionsResult = await prescriptionsResponse.json();
        if (prescriptionsResult.success) {
          prescriptionsData = prescriptionsResult.data;
        }
      } catch (error) {
        console.log('Error fetching prescriptions:', error);
      }

      // Fetch inventory for cost data
      let inventoryMap = {};
      try {
        const inventoryResponse = await fetch(`${API_BASE_URL}/api/inventory`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const inventoryResult = await inventoryResponse.json();
        if (inventoryResult.success) {
          inventoryResult.data.forEach(item => {
            inventoryMap[item.name.toLowerCase()] = {
              price: item.price,
              cost: item.cost || 0
            };
          });
        }
      } catch (error) {
        console.log('Error fetching inventory:', error);
      }

      // Process prescriptions with cost data
      const processedPrescriptions = prescriptionsData.map(pres => {
        let totalRevenue = 0;
        let totalCost = 0;
        
        if (pres.medications) {
          pres.medications.forEach(med => {
            const inventoryData = inventoryMap[med.name?.toLowerCase()] || { price: 0, cost: 0 };
            totalRevenue += inventoryData.price;
            totalCost += inventoryData.cost;
          });
        }
        
        return {
          ...pres,
          type: 'prescription',
          revenue: totalRevenue,
          cost: totalCost,
          profit: totalRevenue - totalCost,
          margin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0,
          paidAmount: pres.paidAmount || 0,
          remainingAmount: totalRevenue - (pres.paidAmount || 0),
          paymentMethod: pres.paymentMethod || 'cash',
          paymentStatus: pres.paymentStatus || 'unpaid',
          transactionId: pres.prescriptionId,
          patientName: pres.patientName,
          date: pres.createdAt
        };
      });

      // Fetch walk-in sales from localStorage
      const localSales = JSON.parse(localStorage.getItem('walkinSales') || '[]');
      const processedWalkin = localSales.map(sale => {
        let totalCost = 0;
        if (sale.items) {
          sale.items.forEach(item => {
            const inventoryData = inventoryMap[item.name?.toLowerCase()] || { cost: 0 };
            totalCost += (inventoryData.cost || 0) * (item.quantity || 1);
          });
        }
        const revenue = sale.total || sale.subtotal || 0;
        
        return {
          ...sale,
          type: 'walkin',
          revenue: revenue,
          cost: totalCost,
          profit: revenue - totalCost,
          margin: revenue > 0 ? ((revenue - totalCost) / revenue * 100) : 0,
          paidAmount: sale.paidAmount || revenue,
          remainingAmount: (sale.total || sale.subtotal || 0) - (sale.paidAmount || revenue),
          paymentMethod: sale.paymentMethod || 'cash',
          paymentStatus: sale.paidAmount >= revenue ? 'paid' : (sale.paidAmount > 0 ? 'partial' : 'unpaid'),
          transactionId: sale.saleId || `SALE-${sale.id}`,
          patientName: sale.customerName || 'Walk-in Customer',
          date: sale.date || sale.createdAt
        };
      });

      setPrescriptions(processedPrescriptions);
      setWalkinSales(processedWalkin);
      calculateStats(processedPrescriptions, processedWalkin);
      
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (prescriptionsList, walkinList) => {
    const allTransactions = [...prescriptionsList, ...walkinList];
    
    const prescriptionRevenue = prescriptionsList.reduce((sum, t) => sum + t.revenue, 0);
    const prescriptionCost = prescriptionsList.reduce((sum, t) => sum + t.cost, 0);
    const prescriptionProfit = prescriptionRevenue - prescriptionCost;
    
    const walkinRevenue = walkinList.reduce((sum, t) => sum + t.revenue, 0);
    const walkinCost = walkinList.reduce((sum, t) => sum + t.cost, 0);
    const walkinProfit = walkinRevenue - walkinCost;
    
    const totalRevenue = prescriptionRevenue + walkinRevenue;
    const totalCost = prescriptionCost + walkinCost;
    const totalProfit = totalRevenue - totalCost;
    
    // Payment method totals
    let cashAmount = 0, mobileAmount = 0, bankAmount = 0, cardAmount = 0;
    allTransactions.forEach(t => {
      const method = t.paymentMethod?.toLowerCase();
      const paid = t.paidAmount || 0;
      if (method === 'cash') cashAmount += paid;
      else if (method === 'mobile') mobileAmount += paid;
      else if (method === 'bank') bankAmount += paid;
      else if (method === 'card') cardAmount += paid;
    });
    
    setStats({
      totalRevenue,
      totalCost,
      totalProfit,
      averageMargin: totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0,
      prescriptionRevenue,
      prescriptionCost,
      prescriptionProfit,
      walkinRevenue,
      walkinCost,
      walkinProfit,
      totalTransactions: allTransactions.length,
      prescriptionCount: prescriptionsList.length,
      walkinCount: walkinList.length,
      paidCount: allTransactions.filter(t => t.paymentStatus === 'paid').length,
      partialCount: allTransactions.filter(t => t.paymentStatus === 'partial').length,
      unpaidCount: allTransactions.filter(t => t.paymentStatus === 'unpaid').length,
      cashAmount,
      mobileAmount,
      bankAmount,
      cardAmount
    });
  };

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getPaymentStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><CheckCircle className="w-3 h-3" /><span>Paid</span></span>;
      case 'partial':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><AlertTriangle className="w-3 h-3" /><span>Partial</span></span>;
      default:
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><XCircle className="w-3 h-3" /><span>Unpaid</span></span>;
    }
  };

  const getMarginBadge = (margin) => {
    if (margin >= 50) return 'bg-green-100 text-green-700';
    if (margin >= 25) return 'bg-blue-100 text-blue-700';
    if (margin >= 10) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    const allTransactions = [...prescriptions, ...walkinSales];
    const data = allTransactions.map(t => ({
      'Transaction ID': t.transactionId,
      'Type': t.type === 'prescription' ? 'Prescription' : 'Walk-in Sale',
      'Date': formatDate(t.date),
      'Patient/Customer': t.patientName,
      'Revenue': t.revenue.toFixed(2),
      'Cost': t.cost.toFixed(2),
      'Profit': t.profit.toFixed(2),
      'Margin %': t.margin.toFixed(1),
      'Paid Amount': (t.paidAmount || 0).toFixed(2),
      'Balance Due': t.remainingAmount.toFixed(2),
      'Payment Status': t.paymentStatus,
      'Payment Method': t.paymentMethod
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
    link.setAttribute('download', `pharmacy_revenue_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Revenue data exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  // Combine and filter transactions
  const allTransactions = [...prescriptions, ...walkinSales];
  
  const filteredTransactions = allTransactions.filter(t => {
    const matchesSearch = 
      t.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || t.type === filterType;
    
    const matchesPayment = filterPaymentStatus === 'all' || t.paymentStatus === filterPaymentStatus;
    
    let matchesDate = true;
    if (startDate && t.date) {
      const transactionDate = new Date(t.date).toDateString();
      const start = new Date(startDate).toDateString();
      matchesDate = transactionDate >= start;
    }
    if (endDate && t.date) {
      const transactionDate = new Date(t.date).toDateString();
      const end = new Date(endDate).toDateString();
      matchesDate = matchesDate && transactionDate <= end;
    }
    
    return matchesSearch && matchesType && matchesPayment && matchesDate;
  });

  // Sort by date (newest first)
  filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
                  <p className="text-xs text-gray-500">Pharmacy Revenue Analytics</p>
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
              <button onClick={fetchRevenueData} className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-gray-500">Total Revenue</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalCost)}</p>
            <p className="text-sm text-gray-500">Total Cost</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalProfit)}</p>
            <p className="text-sm text-gray-500">Total Profit</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{stats.averageMargin.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Avg. Margin</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            <p className="text-sm text-gray-500">Transactions</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.unpaidCount}</p>
            <p className="text-sm text-gray-500">Unpaid</p>
          </div>
        </div>

        {/* Breakdown by Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Prescription Revenue */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-[#D01A2B]" />
              <h3 className="font-semibold text-gray-900">Prescription Revenue</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.prescriptionRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cost</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(stats.prescriptionCost)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Profit</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.prescriptionProfit)}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">{stats.prescriptionCount} prescriptions processed</p>
          </div>

          {/* Walk-in Revenue */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="w-5 h-5 text-[#D01A2B]" />
              <h3 className="font-semibold text-gray-900">Walk-in Sales Revenue</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.walkinRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cost</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(stats.walkinCost)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Profit</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.walkinProfit)}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">{stats.walkinCount} walk-in sales</p>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Cash</span>
            </div>
            <span className="font-bold text-green-600">{formatCurrency(stats.cashAmount)}</span>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Mobile</span>
            </div>
            <span className="font-bold text-blue-600">{formatCurrency(stats.mobileAmount)}</span>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Bank</span>
            </div>
            <span className="font-bold text-purple-600">{formatCurrency(stats.bankAmount)}</span>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span className="text-sm text-gray-600">Card</span>
            </div>
            <span className="font-bold text-indigo-600">{formatCurrency(stats.cardAmount)}</span>
          </div>
        </div>

        {/* Payment Status Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Fully Paid</span>
            </div>
            <span className="font-bold text-green-600">{stats.paidCount}</span>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-gray-600">Partial</span>
            </div>
            <span className="font-bold text-yellow-600">{stats.partialCount}</span>
          </div>
          <div className="bg-red-50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">Unpaid</span>
            </div>
            <span className="font-bold text-red-600">{stats.unpaidCount}</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by transaction ID or patient/customer name..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="prescription">Prescriptions</option>
              <option value="walkin">Walk-in Sales</option>
            </select>
            <select
              value={filterPaymentStatus}
              onChange={(e) => { setFilterPaymentStatus(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Revenue Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader className="w-8 h-8 animate-spin text-[#D01A2B]" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient/Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Margin</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentTransactions.map((transaction, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-[#D01A2B]">{transaction.transactionId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            transaction.type === 'prescription' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {transaction.type === 'prescription' ? 'Prescription' : 'Walk-in'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{transaction.patientName}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(transaction.date)}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(transaction.revenue)}</td>
                        <td className="px-6 py-4 text-red-600">{formatCurrency(transaction.cost)}</td>
                        <td className="px-6 py-4 font-semibold text-purple-600">{formatCurrency(transaction.profit)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getMarginBadge(transaction.margin)}`}>
                            {transaction.margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-green-600">{formatCurrency(transaction.paidAmount || 0)}</td>
                        <td className="px-6 py-4">
                          <span className={transaction.remainingAmount > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                            {formatCurrency(transaction.remainingAmount)}
                          </span>
                        </td>
                        <td className="px-6 py-4">{getPaymentStatusBadge(transaction.paymentStatus)}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(transaction)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              )}

              {/* Pagination */}
              {filteredTransactions.length > 0 && (
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} transactions
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border rounded-lg disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 bg-[#D01A2B] text-white rounded-lg">{currentPage}</span>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border rounded-lg disabled:opacity-50"
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

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Transaction Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <p className="text-2xl font-mono font-bold text-[#D01A2B]">{selectedTransaction.transactionId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">{formatDate(selectedTransaction.date)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedTransaction.type === 'prescription' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedTransaction.type === 'prescription' ? 'Prescription' : 'Walk-in Sale'}
                  </span>
                  {getPaymentStatusBadge(selectedTransaction.paymentStatus)}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-[#D01A2B]" />
                  <span>Financial Summary</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedTransaction.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cost</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(selectedTransaction.cost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Profit</p>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(selectedTransaction.profit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Margin</p>
                    <p className="text-xl font-bold text-indigo-600">{selectedTransaction.margin.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Paid Amount</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedTransaction.paidAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Balance Due</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(selectedTransaction.remainingAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="text-lg font-semibold capitalize">{selectedTransaction.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              {selectedTransaction.items && selectedTransaction.items.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <Package className="w-4 h-4 text-[#D01A2B]" />
                    <span>Items</span>
                  </h4>
                  <div className="bg-gray-50 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Item</th>
                          <th className="px-4 py-2 text-center text-sm font-semibold">Qty</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold">Price</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.items.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 text-sm">{item.name}</td>
                            <td className="px-4 py-2 text-center text-sm">{item.quantity}</td>
                            <td className="px-4 py-2 text-right text-sm">{formatCurrency(item.price)}</td>
                            <td className="px-4 py-2 text-right text-sm font-semibold">{formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Medications Section for Prescriptions */}
              {selectedTransaction.medications && selectedTransaction.medications.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <Pill className="w-4 h-4 text-[#D01A2B]" />
                    <span>Medications</span>
                  </h4>
                  <div className="bg-gray-50 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Medication</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Dosage</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Frequency</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.medications.map((med, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 text-sm font-medium">{med.name}</td>
                            <td className="px-4 py-2 text-sm">{med.dosage}</td>
                            <td className="px-4 py-2 text-sm">{med.frequency}</td>
                            <td className="px-4 py-2 text-sm">{med.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-6 pt-4 border-t">
                <button onClick={() => setShowDetailsModal(false)} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyRevenue;
