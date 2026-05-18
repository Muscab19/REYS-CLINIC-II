import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Heart, 
  CheckCircle,
  ArrowLeft,
  X,
  Loader,
  Baby,
  Users,
  Stethoscope,
  Microscope,
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  CreditCard,
  Receipt,
  Printer,
  Download,
  Search,
  Filter,
  Eye,
  Send,
  Activity,
  ClipboardList,
  Syringe,
  FileCheck,
  AlertTriangle,
  Trash2,
  ShoppingCart,
  History,
  TestTube,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const CompletedCheckouts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCheckout, setSelectedCheckout] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalCheckouts: 0,
    totalRevenue: 0,
    fullyPaid: 0,
    partialPaid: 0,
    unpaid: 0,
    totalOutstanding: 0,
    thisMonth: 0,
    thisWeek: 0
  });

  // Load completed checkouts
  useEffect(() => {
    loadCheckouts();
  }, []);

  const loadCheckouts = () => {
    setLoading(true);
    try {
      // Load invoices from localStorage (from PatientCheckout)
      const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      
      // Also load any pending payments from consultations and lab requests
      const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
      const labRequests = JSON.parse(localStorage.getItem('labRequests') || '[]');
      
      // Process checkouts
      const allCheckouts = [];
      
      // Add invoices as completed checkouts
      storedInvoices.forEach(invoice => {
        const total = invoice.total;
        const paid = invoice.paidAmount || total;
        const remaining = total - paid;
        
        allCheckouts.push({
          id: invoice.invoiceId,
          checkoutId: invoice.invoiceId,
          patientId: invoice.patientId,
          patientName: invoice.patientName,
          parentName: invoice.parentName,
          phone: invoice.phone,
          ticketId: invoice.ticketId,
          services: invoice.services,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: total,
          paidAmount: paid,
          remainingAmount: remaining,
          paymentStatus: remaining <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid'),
          paymentMethod: invoice.paymentMethod,
          paymentDate: invoice.paymentDate,
          paymentHistory: invoice.paymentHistory || [{
            date: invoice.paymentDate,
            amount: paid,
            method: invoice.paymentMethod,
            receivedBy: invoice.receivedBy
          }],
          receivedBy: invoice.receivedBy,
          status: 'completed',
          createdAt: invoice.paymentDate
        });
      });
      
      // Sort by date (newest first)
      allCheckouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setCheckouts(allCheckouts);
      calculateStats(allCheckouts);
      
    } catch (error) {
      console.error('Error loading checkouts:', error);
      toast.error('Failed to load checkout history');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (checkoutsList) => {
    const totalRevenue = checkoutsList.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const totalOutstanding = checkoutsList.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);
    
    const fullyPaid = checkoutsList.filter(c => c.paymentStatus === 'paid').length;
    const partialPaid = checkoutsList.filter(c => c.paymentStatus === 'partial').length;
    const unpaid = checkoutsList.filter(c => c.paymentStatus === 'unpaid').length;
    
    const now = new Date();
    const thisMonth = checkoutsList.filter(c => {
      const date = new Date(c.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    
    const thisWeek = checkoutsList.filter(c => {
      const date = new Date(c.createdAt);
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;
    
    setStats({
      totalCheckouts: checkoutsList.length,
      totalRevenue,
      fullyPaid,
      partialPaid,
      unpaid,
      totalOutstanding,
      thisMonth,
      thisWeek
    });
  };

  const handleViewDetails = (checkout) => {
    setSelectedCheckout(checkout);
    setShowDetailsModal(true);
  };

  const handleMakePayment = (checkout) => {
    setSelectedCheckout(checkout);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentNote('');
    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
    if (!selectedCheckout) return;
    
    const payment = parseFloat(paymentAmount);
    
    if (!payment || payment <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    
    if (payment > selectedCheckout.remainingAmount) {
      toast.error(`Payment exceeds remaining balance. Remaining: $${selectedCheckout.remainingAmount.toFixed(2)}`);
      return;
    }
    
    const newPaidAmount = selectedCheckout.paidAmount + payment;
    const newRemaining = selectedCheckout.total - newPaidAmount;
    const newPaymentStatus = newRemaining <= 0 ? 'paid' : 'partial';
    
    // Update checkout in localStorage
    const updatedCheckouts = checkouts.map(c => {
      if (c.id === selectedCheckout.id) {
        return {
          ...c,
          paidAmount: newPaidAmount,
          remainingAmount: newRemaining,
          paymentStatus: newPaymentStatus,
          paymentHistory: [...(c.paymentHistory || []), {
            date: new Date().toISOString(),
            amount: payment,
            method: paymentMethod,
            note: paymentNote,
            receivedBy: user?.name
          }]
        };
      }
      return c;
    });
    
    // Update invoices in localStorage
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const updatedInvoices = invoices.map(inv => {
      if (inv.invoiceId === selectedCheckout.id) {
        return {
          ...inv,
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus,
          paymentHistory: [...(inv.paymentHistory || []), {
            date: new Date().toISOString(),
            amount: payment,
            method: paymentMethod,
            note: paymentNote,
            receivedBy: user?.name
          }]
        };
      }
      return inv;
    });
    
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    
    setCheckouts(updatedCheckouts);
    calculateStats(updatedCheckouts);
    setShowPaymentModal(false);
    setSelectedCheckout(null);
    
    toast.success(`Payment of $${payment.toFixed(2)} recorded successfully!`);
  };

  const getPaymentStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><CheckCircle className="w-3 h-3" /><span>Fully Paid</span></span>;
      case 'partial':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><AlertTriangle className="w-3 h-3" /><span>Partial Payment</span></span>;
      default:
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><XCircle className="w-3 h-3" /><span>Unpaid</span></span>;
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

  const filteredCheckouts = checkouts.filter(checkout => {
    const matchesSearch = 
      checkout.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkout.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkout.checkoutId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkout.ticketId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || checkout.status === filterStatus;
    const matchesPayment = filterPaymentStatus === 'all' || checkout.paymentStatus === filterPaymentStatus;
    
    let matchesDate = true;
    if (startDate && checkout.createdAt) {
      const checkoutDate = new Date(checkout.createdAt).toDateString();
      const start = new Date(startDate).toDateString();
      matchesDate = checkoutDate >= start;
    }
    if (endDate && checkout.createdAt) {
      const checkoutDate = new Date(checkout.createdAt).toDateString();
      const end = new Date(endDate).toDateString();
      matchesDate = matchesDate && checkoutDate <= end;
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCheckouts = filteredCheckouts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCheckouts.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleExport = () => {
    const data = filteredCheckouts.map(checkout => ({
      'Checkout ID': checkout.checkoutId,
      'Patient Name': checkout.patientName,
      'Parent Name': checkout.parentName,
      'Phone': checkout.phone,
      'Ticket ID': checkout.ticketId,
      'Total Amount': checkout.total,
      'Paid Amount': checkout.paidAmount,
      'Remaining': checkout.remainingAmount,
      'Payment Status': checkout.paymentStatus,
      'Payment Method': checkout.paymentMethod,
      'Date': formatDate(checkout.createdAt),
      'Received By': checkout.receivedBy
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
    link.setAttribute('download', `checkouts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Checkouts exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/reception-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <img src={logo} alt="REYS CLINIC Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                  <p className="text-xs text-gray-500">Completed Checkouts & Payment Tracking</p>
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
              <button onClick={loadCheckouts} className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCheckouts}</p>
            <p className="text-sm text-gray-500">Total Checkouts</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-green-600">Total Revenue</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">${stats.totalOutstanding.toFixed(2)}</p>
            <p className="text-sm text-red-600">Outstanding</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.partialPaid}</p>
            <p className="text-sm text-yellow-600">Partial Payments</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.unpaid}</p>
            <p className="text-sm text-purple-600">Unpaid</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{stats.fullyPaid}</p>
            <p className="text-sm text-indigo-600">Fully Paid</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek} checkouts</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonth} checkouts</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name, parent name, checkout ID, or ticket ID..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
              />
            </div>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
            </select>
            <select value={filterPaymentStatus} onChange={(e) => { setFilterPaymentStatus(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Payment Status</option>
              <option value="paid">Fully Paid</option>
              <option value="partial">Partial Payment</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg" placeholder="Start Date" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg" placeholder="End Date" />
          </div>
        </div>

        {/* Checkouts Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-[#D01A2B]" /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Checkout ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Remaining</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Received By</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentCheckouts.map((checkout) => (
                      <tr key={checkout.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-[#D01A2B]">{checkout.checkoutId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{checkout.patientName}</p>
                            <p className="text-xs text-gray-500">Parent: {checkout.parentName}</p>
                            <p className="text-xs text-gray-400">Ticket: {checkout.ticketId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(checkout.createdAt)}</td>
                        <td className="px-6 py-4 font-semibold">${checkout.total.toFixed(2)}</td>
                        <td className="px-6 py-4 text-green-600">${checkout.paidAmount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={checkout.remainingAmount > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                            ${checkout.remainingAmount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">{getPaymentStatusBadge(checkout.paymentStatus)}</td>
                        <td className="px-6 py-4">
                          <span className="capitalize">{checkout.paymentMethod}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{checkout.receivedBy}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button onClick={() => handleViewDetails(checkout)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            {checkout.paymentStatus !== 'paid' && (
                              <button onClick={() => handleMakePayment(checkout)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Make Payment">
                                <DollarSign className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredCheckouts.length === 0 && (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No checkouts found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              )}

              {/* Pagination */}
              {filteredCheckouts.length > 0 && (
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCheckouts.length)} of {filteredCheckouts.length} checkouts
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

      {/* Checkout Details Modal */}
      {showDetailsModal && selectedCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Checkout Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Checkout ID</p>
                    <p className="text-2xl font-mono font-bold text-[#D01A2B]">{selectedCheckout.checkoutId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">{formatDate(selectedCheckout.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-3">
                  {getPaymentStatusBadge(selectedCheckout.paymentStatus)}
                </div>
              </div>

              {/* Patient Information */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <User className="w-4 h-4 text-[#D01A2B]" />
                  <span>Patient Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div><p className="text-sm text-gray-500">Patient Name</p><p className="font-semibold">{selectedCheckout.patientName}</p></div>
                  <div><p className="text-sm text-gray-500">Parent/Guardian</p><p>{selectedCheckout.parentName}</p></div>
                  <div><p className="text-sm text-gray-500">Phone</p><p>{selectedCheckout.phone}</p></div>
                  <div><p className="text-sm text-gray-500">Ticket ID</p><p className="font-mono">{selectedCheckout.ticketId}</p></div>
                </div>
              </div>

              {/* Services */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <ClipboardList className="w-4 h-4 text-[#D01A2B]" />
                  <span>Services Rendered</span>
                </h4>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Service</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Provider</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCheckout.services.map((service, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-2 text-sm">{service.name}</td>
                          <td className="px-4 py-2 text-sm">{service.doctorName || service.performedBy || '—'}</td>
                          <td className="px-4 py-2 text-right text-sm">${service.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr><td colSpan="2" className="px-4 py-2 text-right font-semibold">Subtotal:</td><td className="px-4 py-2 text-right">${selectedCheckout.subtotal.toFixed(2)}</td></tr>
                      <tr><td colSpan="2" className="px-4 py-2 text-right font-semibold">Tax (5%):</td><td className="px-4 py-2 text-right">${selectedCheckout.tax.toFixed(2)}</td></tr>
                      <tr className="bg-gray-200"><td colSpan="2" className="px-4 py-2 text-right font-bold">TOTAL:</td><td className="px-4 py-2 text-right font-bold text-[#D01A2B]">${selectedCheckout.total.toFixed(2)}</td></tr>
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
                  <div><p className="text-sm text-gray-500">Total Amount</p><p className="text-xl font-bold">${selectedCheckout.total.toFixed(2)}</p></div>
                  <div><p className="text-sm text-gray-500">Paid Amount</p><p className="text-xl font-bold text-green-600">${selectedCheckout.paidAmount.toFixed(2)}</p></div>
                  <div><p className="text-sm text-gray-500">Remaining</p><p className="text-xl font-bold text-red-600">${selectedCheckout.remainingAmount.toFixed(2)}</p></div>
                </div>
              </div>

              {/* Payment History */}
              {selectedCheckout.paymentHistory && selectedCheckout.paymentHistory.length > 0 && (
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
                        {selectedCheckout.paymentHistory.map((payment, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 text-sm">{formatDate(payment.date)}</td>
                            <td className="px-4 py-2 text-right text-sm font-semibold text-green-600">${payment.amount.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm capitalize">{payment.method}</td>
                            <td className="px-4 py-2 text-sm">{payment.receivedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                {selectedCheckout.paymentStatus !== 'paid' && (
                  <button onClick={() => { setShowDetailsModal(false); handleMakePayment(selectedCheckout); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
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
      {showPaymentModal && selectedCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Record Payment</h3>
              <p className="text-gray-500">Checkout ID: {selectedCheckout.checkoutId}</p>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold">${selectedCheckout.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Already Paid:</span>
                <span className="text-green-600">${selectedCheckout.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining:</span>
                <span className="text-red-600 font-bold">${selectedCheckout.remainingAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Payment Amount *</label>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPaymentMethod('cash')} className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${paymentMethod === 'cash' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'}`}>
                  <DollarSign className="w-4 h-4" /><span>Cash</span>
                </button>
                <button onClick={() => setPaymentMethod('card')} className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${paymentMethod === 'card' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'}`}>
                  <CreditCard className="w-4 h-4" /><span>Card</span>
                </button>
              </div>
            </div>

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

export default CompletedCheckouts;