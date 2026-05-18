import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Heart, 
  CheckCircle,
  ArrowLeft,
  X,
  Loader,
  Baby,
  Users,
  Stethoscope,
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  Package,
  Pill,
  Syringe,
  ClipboardList,
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckSquare,
  XCircle,
  RefreshCw,
  DollarSign,
  Receipt,
  CreditCard,
  History,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const PharmacyPrescriptions = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [inventoryMap, setInventoryMap] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    dispensed: 0,
    cancelled: 0,
    paid: 0,
    partial: 0,
    unpaid: 0,
    totalRevenue: 0
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

  // Load prescriptions and inventory when component loads
  useEffect(() => {
    fetchPrescriptions();
    fetchInventoryPrices();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/prescriptions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPrescriptions(data.data);
        calculateStats(data.data);
      } else {
        toast.error(data.msg || 'Failed to load prescriptions');
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryPrices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        // Create a map of medication name -> price (case-insensitive)
        const priceMap = {};
        data.data.forEach(item => {
          priceMap[item.name.toLowerCase()] = item.price;
        });
        setInventoryMap(priceMap);
        console.log('Inventory price map:', priceMap);
      }
    } catch (error) {
      console.error('Error fetching inventory prices:', error);
    }
  };

  const calculateStats = (prescriptionsList) => {
    const totalRevenue = prescriptionsList.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    setStats({
      total: prescriptionsList.length,
      pending: prescriptionsList.filter(p => p.status === 'pending').length,
      dispensed: prescriptionsList.filter(p => p.status === 'dispensed').length,
      cancelled: prescriptionsList.filter(p => p.status === 'cancelled').length,
      paid: prescriptionsList.filter(p => p.paymentStatus === 'paid').length,
      partial: prescriptionsList.filter(p => p.paymentStatus === 'partial').length,
      unpaid: prescriptionsList.filter(p => p.paymentStatus === 'unpaid' || !p.paymentStatus).length,
      totalRevenue: totalRevenue
    });
  };

  const calculatePrescriptionTotal = (prescription) => {
    let total = 0;
    if (prescription.medications) {
      prescription.medications.forEach(med => {
        // Get price from inventory map (case-insensitive), fallback to 0
        const price = inventoryMap[med.name?.toLowerCase()] || 0;
        total += price;
      });
    }
    return total;
  };

  const getMedicationPrice = (medName) => {
    return inventoryMap[medName?.toLowerCase()] || 0;
  };

  const calculateRemainingAmount = (prescription) => {
    const total = calculatePrescriptionTotal(prescription);
    const paid = prescription.paidAmount || 0;
    return total - paid;
  };

  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  const handleDispense = (prescription) => {
    // Check if all medications are in stock
    let outOfStock = [];
    if (prescription.medications) {
      prescription.medications.forEach(med => {
        const price = inventoryMap[med.name?.toLowerCase()];
        if (price === undefined) {
          outOfStock.push(med.name);
        }
      });
    }
    
    if (outOfStock.length > 0) {
      toast.warning(`The following medications are not in inventory: ${outOfStock.join(', ')}`);
    }
    
    setSelectedPrescription(prescription);
    setShowDispenseModal(true);
  };

  const handleMakePayment = (prescription) => {
    setSelectedPrescription(prescription);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentNote('');
    setShowPaymentModal(true);
  };

  const confirmDispense = async () => {
  // First, check if we need to deduct stock from inventory
  try {
    const token = localStorage.getItem('token');
    const outOfStock = [];
    const stockUpdates = [];
    
    // First, check all medications for stock availability
    for (const med of selectedPrescription.medications) {
      // Find inventory item by name (case-insensitive)
      const inventoryResponse = await fetch(`${API_BASE_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const inventoryData = await inventoryResponse.json();
      
      if (inventoryData.success) {
        const inventoryItem = inventoryData.data.find(
          item => item.name.toLowerCase() === med.name.toLowerCase()
        );
        
        if (!inventoryItem) {
          outOfStock.push(`${med.name} (Not in inventory)`);
        } else {
          // Parse dosage to get quantity (e.g., "500mg" might mean 1 tablet, or could be numeric)
          let quantityToDeduct = 1; // Default to 1
          
          // Try to extract quantity from dosage field
          if (med.dosage) {
            // Look for patterns like "2 tablets", "2 pills", "2x", etc.
            const tabletMatch = med.dosage.match(/^(\d+)\s*(?:tablet|pill|tab|capsule|cap)/i);
            const xMatch = med.dosage.match(/^(\d+)\s*x/i);
            const numberMatch = med.dosage.match(/^(\d+)/);
            
            if (tabletMatch) {
              quantityToDeduct = parseInt(tabletMatch[1]);
            } else if (xMatch) {
              quantityToDeduct = parseInt(xMatch[1]);
            } else if (numberMatch && parseInt(numberMatch[1]) <= 10) {
              quantityToDeduct = parseInt(numberMatch[1]);
            }
          }
          
          // Also check duration for total quantity (e.g., "7 days" means 7 tablets if taken once daily)
          let totalQuantity = quantityToDeduct;
          if (med.duration) {
            const daysMatch = med.duration.match(/(\d+)\s*(?:day|days)/i);
            if (daysMatch && med.frequency) {
              const days = parseInt(daysMatch[1]);
              let timesPerDay = 1;
              if (med.frequency.toLowerCase().includes('twice') || med.frequency === '2x' || med.frequency === '2x3') {
                timesPerDay = 2;
              } else if (med.frequency.toLowerCase().includes('three') || med.frequency === '3x') {
                timesPerDay = 3;
              } else if (med.frequency.toLowerCase().includes('four') || med.frequency === '4x') {
                timesPerDay = 4;
              }
              totalQuantity = quantityToDeduct * timesPerDay * days;
            }
          }
          
          if (inventoryItem.currentStock < totalQuantity) {
            outOfStock.push(`${med.name} (Need ${totalQuantity}, Only ${inventoryItem.currentStock} in stock)`);
          } else {
            stockUpdates.push({
              id: inventoryItem._id,
              name: med.name,
              currentStock: inventoryItem.currentStock,
              quantity: totalQuantity
            });
          }
        }
      }
    }
    
    if (outOfStock.length > 0) {
      toast.error(`Cannot dispense:\n${outOfStock.join('\n')}`);
      return;
    }
    
    // Perform stock deductions
    for (const update of stockUpdates) {
      const newStock = update.currentStock - update.quantity;
      await fetch(`${API_BASE_URL}/api/inventory/${update.id}/stock`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newStock })
      });
      console.log(`Deducted ${update.quantity} ${update.name} (${update.currentStock} -> ${newStock})`);
    }
    
    // Then mark prescription as dispensed
    const response = await fetch(`${API_BASE_URL}/api/prescriptions/${selectedPrescription._id}/dispense`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dispensedBy: user?.name })
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast.success(`Prescription ${selectedPrescription.prescriptionId} dispensed successfully!`);
      fetchPrescriptions();
      fetchInventoryPrices(); // Refresh inventory prices
      setShowDispenseModal(false);
      setSelectedPrescription(null);
    } else {
      toast.error(data.msg || 'Failed to dispense prescription');
    }
  } catch (error) {
    console.error('Error dispensing prescription:', error);
    toast.error('Failed to dispense prescription');
  }
};

  const confirmPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const totalAmount = calculatePrescriptionTotal(selectedPrescription);
    const currentPaid = selectedPrescription.paidAmount || 0;
    const newPaidAmount = currentPaid + parseFloat(paymentAmount);
    
    let paymentStatus = 'partial';
    if (newPaidAmount >= totalAmount) {
      paymentStatus = 'paid';
    } else if (newPaidAmount === 0) {
      paymentStatus = 'unpaid';
    } else {
      paymentStatus = 'partial';
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/${selectedPrescription._id}/payment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paidAmount: newPaidAmount,
          paymentStatus: paymentStatus,
          paymentMethod: paymentMethod,
          paymentNote: paymentNote,
          paymentDate: new Date().toISOString()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Payment of $${paymentAmount} recorded successfully!`);
        fetchPrescriptions();
        setShowPaymentModal(false);
        setSelectedPrescription(null);
        setPaymentAmount('');
        setPaymentNote('');
      } else {
        toast.error(data.msg || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const getPaymentStatusBadge = (paymentStatus, paidAmount, totalAmount) => {
    if (paymentStatus === 'paid' || (paidAmount && paidAmount >= totalAmount)) {
      return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Paid</span>;
    } else if (paymentStatus === 'partial' || (paidAmount && paidAmount > 0)) {
      return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Partial</span>;
    } else {
      return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">Unpaid</span>;
    }
  };

  const filteredPrescriptions = prescriptions.filter(pres => {
    const matchesSearch = 
      pres.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pres.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pres.prescriptionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pres.doctor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || pres.status === filterStatus;
    
    let matchesPayment = true;
    if (filterPaymentStatus !== 'all') {
      const total = calculatePrescriptionTotal(pres);
      const paid = pres.paidAmount || 0;
      if (filterPaymentStatus === 'paid') matchesPayment = paid >= total;
      else if (filterPaymentStatus === 'partial') matchesPayment = paid > 0 && paid < total;
      else if (filterPaymentStatus === 'unpaid') matchesPayment = paid === 0;
    }
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPrescriptions = filteredPrescriptions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPrescriptions.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>;
      case 'dispensed':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">Dispensed</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  const getUrgencyBadge = (urgency) => {
    if (urgency === 'urgent') {
      return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><AlertTriangle className="w-3 h-3" /><span>Urgent</span></span>;
    }
    return null;
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
              <button
                onClick={() => navigate('/pharmacy-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex flex-col items-center space-y-1">
                <img src={logo} alt="REYS CLINIC Logo" className="h-10 w-auto object-contain" />
                <p className="text-xs pl-10 text-gray-500">Pharmacy - Prescriptions & Payments</p>
              </div>
            </div>
            <button onClick={fetchPrescriptions} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by prescription ID, patient name, parent name, or doctor..."
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
              <option value="dispensed">Dispensed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterPaymentStatus}
              onChange={(e) => {
                setFilterPaymentStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
            >
              <option value="all">All Payment</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Prescriptions Table */}
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Prescription ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentPrescriptions.map((pres) => {
                      const totalAmount = calculatePrescriptionTotal(pres);
                      const paidAmount = pres.paidAmount || 0;
                      const balance = totalAmount - paidAmount;
                      return (
                        <tr key={pres._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm font-semibold text-[#D01A2B]">{pres.prescriptionId}</span>
                              {getUrgencyBadge(pres.urgency)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{pres.patientName}</p>
                              <p className="text-xs text-gray-400">Parent: {pres.parentName}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{pres.doctor}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(pres.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold">${totalAmount.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-green-600">${paidAmount.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                              ${balance.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {getPaymentStatusBadge(pres.paymentStatus, paidAmount, totalAmount)}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(pres.status)}</td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewDetails(pres)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {pres.status === 'pending' && (
                                <button
                                  onClick={() => handleDispense(pres)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Dispense"
                                >
                                  <Package className="w-4 h-4" />
                                </button>
                              )}
                              {pres.status === 'dispensed' && balance > 0 && (
                                <button
                                  onClick={() => handleMakePayment(pres)}
                                  className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg"
                                  title="Make Payment"
                                >
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

              {filteredPrescriptions.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No prescriptions found</h3>
                  <p className="text-gray-500">Prescriptions will appear here when doctors send them</p>
                </div>
              )}

              {/* Pagination */}
              {filteredPrescriptions.length > 0 && (
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPrescriptions.length)} of {filteredPrescriptions.length} prescriptions
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

      {/* Prescription Details Modal */}
      {showDetailsModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Prescription Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {/* Prescription Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Prescription ID</p>
                    <p className="text-2xl font-mono font-bold text-[#D01A2B]">{selectedPrescription.prescriptionId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">{new Date(selectedPrescription.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {selectedPrescription.urgency === 'urgent' && (
                  <div className="mt-3 inline-flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Urgent Prescription</span>
                  </div>
                )}
              </div>

              {/* Patient Information */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <User className="w-4 h-4 text-[#D01A2B]" />
                  <span>Patient Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div><p className="text-sm text-gray-500">Patient Name</p><p className="font-semibold">{selectedPrescription.patientName}</p></div>
                  <div><p className="text-sm text-gray-500">Age</p><p>{selectedPrescription.patientAge} years</p></div>
                  <div><p className="text-sm text-gray-500">Parent/Guardian</p><p>{selectedPrescription.parentName}</p></div>
                  <div><p className="text-sm text-gray-500">Phone</p><p>{selectedPrescription.parentPhone}</p></div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-[#D01A2B]" />
                  <span>Payment Summary</span>
                </h4>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                  <div><p className="text-sm text-gray-500">Total Amount</p><p className="text-xl font-bold">${calculatePrescriptionTotal(selectedPrescription).toFixed(2)}</p></div>
                  <div><p className="text-sm text-gray-500">Paid Amount</p><p className="text-xl font-bold text-green-600">${(selectedPrescription.paidAmount || 0).toFixed(2)}</p></div>
                  <div><p className="text-sm text-gray-500">Balance Due</p><p className="text-xl font-bold text-red-600">${(calculatePrescriptionTotal(selectedPrescription) - (selectedPrescription.paidAmount || 0)).toFixed(2)}</p></div>
                </div>
              </div>

              {/* Medications */}
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
                        <th className="px-4 py-2 text-left text-sm font-semibold">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPrescription.medications.map((med, idx) => {
                        const price = getMedicationPrice(med.name);
                        return (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 text-sm font-medium">{med.name}</td>
                            <td className="px-4 py-2 text-sm">{med.dosage}</td>
                            <td className="px-4 py-2 text-sm">{med.frequency}</td>
                            <td className="px-4 py-2 text-sm">{med.duration}</td>
                            <td className="px-4 py-2 text-sm">${price.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment History */}
              {selectedPrescription.paymentHistory && selectedPrescription.paymentHistory.length > 0 && (
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
                          <th className="px-4 py-2 text-left text-sm font-semibold">Amount</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Method</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Received By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPrescription.paymentHistory.map((payment, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 text-sm">{new Date(payment.date).toLocaleDateString()}</td>
                            <td className="px-4 py-2 text-sm font-semibold text-green-600">${payment.amount.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm capitalize">{payment.method}</td>
                            <td className="px-4 py-2 text-sm">{payment.receivedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Doctor Notes */}
              {selectedPrescription.notes && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <ClipboardList className="w-4 h-4 text-[#D01A2B]" />
                    <span>Doctor's Notes</span>
                  </h4>
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <p className="text-gray-700">{selectedPrescription.notes}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6 pt-4 border-t">
                {selectedPrescription.status === 'pending' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleDispense(selectedPrescription);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                  >
                    <Package className="w-4 h-4 inline mr-2" /> Dispense
                  </button>
                )}
                {selectedPrescription.status === 'dispensed' && (calculatePrescriptionTotal(selectedPrescription) - (selectedPrescription.paidAmount || 0)) > 0 && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleMakePayment(selectedPrescription);
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                  >
                    <DollarSign className="w-4 h-4 inline mr-2" /> Make Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispense Confirmation Modal */}
      {showDispenseModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dispense Medication</h3>
              <p className="text-gray-500">Dispense medications for {selectedPrescription.patientName}?</p>
              <div className="mt-3 text-left bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-semibold">Prescription: {selectedPrescription.prescriptionId}</p>
                <p className="text-sm text-gray-600 mt-1">Medications:</p>
                <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                  {selectedPrescription.medications.map((med, idx) => (
                    <li key={idx}>{med.name} - {med.dosage} ({med.frequency})</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowDispenseModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">Cancel</button>
              <button onClick={confirmDispense} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold">Confirm Dispense</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Make Payment</h3>
              <p className="text-gray-500">Record payment for {selectedPrescription.patientName}</p>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold">${calculatePrescriptionTotal(selectedPrescription).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Already Paid:</span>
                <span className="text-green-600">${(selectedPrescription.paidAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Balance Due:</span>
                <span className="text-red-600 font-bold">${(calculatePrescriptionTotal(selectedPrescription) - (selectedPrescription.paidAmount || 0)).toFixed(2)}</span>
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

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Note (Optional)</label>
              <textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Payment reference or note"
                rows="2"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
              />
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

export default PharmacyPrescriptions;

// const confirmDispense = async () => {