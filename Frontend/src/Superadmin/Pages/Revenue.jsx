import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, DollarSign, Calendar, TrendingUp, TrendingDown,
  PieChart, BarChart3, Download, Printer, Filter, Search,
  Loader, CheckCircle, XCircle, AlertCircle, Users, Stethoscope,
  Microscope, Pill, Hospital, CreditCard, Smartphone, Building, RefreshCw,
  Wallet, Receipt, FileText, Package, FlaskConical, Clock,
  ChevronLeft, ChevronRight, Eye, X, Trash2, TrendingUp as ProfitIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const Revenue = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [inventoryMap, setInventoryMap] = useState({});
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    doctorFees: 0,
    labTestsRegistration: 0,
    labTestsDoctor: 0,
    inpatient: 0,
    pharmacyPrescriptions: 0,
    pharmacyPrescriptionsCost: 0,
    pharmacyPrescriptionsProfit: 0,
    walkinSales: 0,
    walkinSalesCost: 0,
    walkinSalesProfit: 0,
    totalPharmacyProfit: 0,
    byPaymentMethod: {
      cash: 0,
      mobile: 0,
      bank: 0,
      card: 0
    },
    dailyRevenue: [],
    monthlyRevenue: []
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

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
    fetchRevenueData();
  }, [dateRange]);

  // Fetch inventory for cost data
  const fetchInventoryData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        const inventoryDataMap = {};
        data.data.forEach(item => {
          inventoryDataMap[item.name.toLowerCase()] = {
            price: item.price,
            cost: item.cost || 0
          };
        });
        setInventoryMap(inventoryDataMap);
        return inventoryDataMap;
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
    return {};
  };

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch inventory for cost data first
      const inventoryData = await fetchInventoryData();
      
      // Fetch all revenue sources
      const [
        patientsRes,
        labRequestsRes,
        inpatientsRes,
        prescriptionsRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/patients?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/lab-requests?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/inpatients?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/prescriptions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const patientsData = await patientsRes.json();
      const labRequestsData = await labRequestsRes.json();
      const inpatientsData = await inpatientsRes.json();
      const prescriptionsData = await prescriptionsRes.json();
      
      // Get consultations from localStorage
      let consultationsData = JSON.parse(localStorage.getItem('consultations') || '[]');
      const uniqueConsultations = [];
      const seenConsultationIds = new Set();
      for (const cons of consultationsData) {
        if (!seenConsultationIds.has(cons.id)) {
          seenConsultationIds.add(cons.id);
          uniqueConsultations.push(cons);
        }
      }
      consultationsData = uniqueConsultations;
      
      // Get walk-in sales from localStorage
      let walkinSalesData = JSON.parse(localStorage.getItem('walkinSales') || '[]');
      const uniqueWalkinSales = [];
      const seenSaleIds = new Set();
      for (const sale of walkinSalesData) {
        if (!seenSaleIds.has(sale.id)) {
          seenSaleIds.add(sale.id);
          uniqueWalkinSales.push(sale);
        }
      }
      walkinSalesData = uniqueWalkinSales;

      // Process all transactions
      const allTransactions = [];

      // 1. Doctor Consultation Fees from Patient Registration
      let doctorFeesTotal = 0;
      let labTestsRegistrationTotal = 0;
      
      if (patientsData.success) {
        const uniquePatients = [];
        const seenPatientIds = new Set();
        for (const patient of patientsData.data) {
          if (!seenPatientIds.has(patient._id)) {
            seenPatientIds.add(patient._id);
            uniquePatients.push(patient);
          }
        }
        
        uniquePatients.forEach(patient => {
          if (patient.referredTo === 'doctor') {
            const isPaid = patient.paymentStatus === 'paid' || (patient.paidAmount > 0);
            const amount = patient.paidAmount > 0 ? patient.paidAmount : (patient.ticketFee || 0);
            
            if (amount > 0) {
              const transaction = {
                id: `REG-DOC-${patient._id}`,
                date: patient.registrationDate,
                source: 'Doctor Consultation Fee',
                category: 'doctor_fee',
                amount: amount,
                paymentMethod: patient.paymentMethod || 'cash',
                description: `${isPaid ? 'Paid' : 'Pending'}: Doctor consultation for ${patient.childName}`,
                patientName: patient.childName,
                patientId: patient.patientId,
                reference: patient.ticketId,
                status: isPaid ? 'completed' : 'pending',
                sourceType: 'patient',
                sourceId: patient._id
              };
              allTransactions.push(transaction);
              if (isPaid) {
                doctorFeesTotal += amount;
              }
            }
          }
          
          if (patient.referredTo === 'lab-tech' && patient.selectedLabTests && patient.selectedLabTests.length > 0 && patient.paidAmount) {
            const transaction = {
              id: `REG-LAB-${patient._id}`,
              date: patient.registrationDate,
              source: 'Lab Tests (Walk-in)',
              category: 'lab_registration',
              amount: patient.paidAmount,
              paymentMethod: patient.paymentMethod || 'cash',
              description: `Lab tests for ${patient.childName}: ${patient.selectedLabTests.length} test(s)`,
              patientName: patient.childName,
              patientId: patient.patientId,
              reference: patient.ticketId,
              status: 'completed',
              sourceType: 'patient',
              sourceId: patient._id
            };
            allTransactions.push(transaction);
            labTestsRegistrationTotal += patient.paidAmount;
          }
        });
      }

      // 2. Doctor-Requested Lab Tests (from consultations)
      let labTestsDoctorTotal = 0;
      const processedConsultationLabIds = new Set();
      
      if (consultationsData.length > 0) {
        consultationsData.forEach(consultation => {
          const uniqueLabKey = `${consultation.patientId}-${consultation.consultationId}-${consultation.labPaidAt}`;
          
          if (consultation.labTestsRequested && consultation.labTestsRequested.length > 0 && 
              consultation.labPaymentStatus === 'paid' && !processedConsultationLabIds.has(uniqueLabKey)) {
            
            processedConsultationLabIds.add(uniqueLabKey);
            const labTotal = consultation.labPaidAmount || consultation.labTestsRequested.reduce((sum, t) => sum + (t.price || 0), 0);
            
            if (labTotal > 0) {
              const transaction = {
                id: `CONS-LAB-${consultation.id}`,
                date: consultation.labPaidAt || consultation.date,
                source: 'Lab Tests (Doctor Request)',
                category: 'lab_doctor',
                amount: labTotal,
                paymentMethod: consultation.labPaymentMethod || 'cash',
                description: `Lab tests requested by Dr. ${consultation.doctorName} for ${consultation.patientName}`,
                patientName: consultation.patientName,
                doctorName: consultation.doctorName,
                reference: consultation.consultationId,
                status: 'completed',
                sourceType: 'consultation',
                sourceId: consultation.id
              };
              allTransactions.push(transaction);
              labTestsDoctorTotal += labTotal;
            }
          }
        });
      }

      // 3. Lab Requests from API
      if (labRequestsData.success) {
        labRequestsData.data.forEach(request => {
          if (request.paymentStatus === 'paid' && request.paidAmount) {
            const transaction = {
              id: `LAB-${request.requestId}`,
              date: request.paymentDate || request.createdAt,
              source: 'Lab Test (Direct)',
              category: 'lab_direct',
              amount: request.paidAmount,
              paymentMethod: request.paymentMethod || 'cash',
              description: `Lab test: ${request.testName} for ${request.patientName}`,
              patientName: request.patientName,
              reference: request.requestId,
              status: 'completed',
              sourceType: 'lab_request',
              sourceId: request._id
            };
            allTransactions.push(transaction);
          }
        });
      }

      // 4. Inpatient Payments
      let inpatientTotal = 0;
      if (inpatientsData.success) {
        inpatientsData.data.forEach(inpatient => {
          if (inpatient.paymentStatus === 'paid' && inpatient.paidAmount) {
            const transaction = {
              id: `INP-${inpatient.inpatientId || inpatient._id}`,
              date: inpatient.paymentDate || inpatient.dischargeDate,
              source: 'Inpatient Stay',
              category: 'inpatient',
              amount: inpatient.paidAmount,
              paymentMethod: inpatient.paymentMethod || 'cash',
              description: `${inpatient.nightsCount || 0} nights stay - Room ${inpatient.roomNumber}, Bed ${inpatient.bedNumber}`,
              patientName: inpatient.childName || inpatient.patientName,
              reference: inpatient.inpatientId,
              status: 'completed',
              sourceType: 'inpatient',
              sourceId: inpatient._id
            };
            allTransactions.push(transaction);
            inpatientTotal += inpatient.paidAmount;
          }
        });
      }

      // 5. Pharmacy Prescriptions - WITH COST & PROFIT CALCULATION
      let prescriptionsTotal = 0;
      let prescriptionsCostTotal = 0;
      let prescriptionsProfitTotal = 0;
      
      if (prescriptionsData.success) {
        for (const prescription of prescriptionsData.data) {
          const isPaid = prescription.paymentStatus === 'paid' || (prescription.paidAmount > 0);
          
          // Calculate revenue, cost, and profit
          let revenue = 0;
          let cost = 0;
          
          if (prescription.medications) {
            for (const med of prescription.medications) {
              const inventoryItem = inventoryData[med.name?.toLowerCase()] || { price: 0, cost: 0 };
              const medRevenue = inventoryItem.price;
              const medCost = inventoryItem.cost;
              revenue += medRevenue;
              cost += medCost;
            }
          }
          
          const profit = revenue - cost;
          const amount = isPaid ? (prescription.paidAmount > 0 ? prescription.paidAmount : revenue) : 0;
          
          if (amount > 0) {
            const transaction = {
              id: `RX-${prescription.prescriptionId}`,
              date: prescription.dispensedAt || prescription.createdAt,
              source: 'Pharmacy Prescription',
              category: 'pharmacy',
              amount: amount,
              revenue: revenue,
              cost: cost,
              profit: profit,
              paymentMethod: prescription.paymentMethod || 'cash',
              description: `${prescription.medications?.length || 0} medication(s) for ${prescription.patientName}`,
              patientName: prescription.patientName,
              doctorName: prescription.doctor,
              reference: prescription.prescriptionId,
              status: prescription.status === 'dispensed' ? 'dispensed' : 'completed',
              sourceType: 'prescription',
              sourceId: prescription._id
            };
            allTransactions.push(transaction);
            prescriptionsTotal += amount;
            prescriptionsCostTotal += cost;
            prescriptionsProfitTotal += profit;
          }
        }
      }

      // 6. Walk-in Sales - WITH COST & PROFIT CALCULATION
      let walkinTotal = 0;
      let walkinCostTotal = 0;
      let walkinProfitTotal = 0;
      
      if (walkinSalesData.length > 0) {
        for (const sale of walkinSalesData) {
          let revenue = sale.total || sale.subtotal || 0;
          let cost = 0;
          
          if (sale.items) {
            for (const item of sale.items) {
              const inventoryItem = inventoryData[item.name?.toLowerCase()] || { cost: 0 };
              cost += (inventoryItem.cost || 0) * (item.quantity || 1);
            }
          }
          
          const profit = revenue - cost;
          
          const transaction = {
            id: sale.saleId || sale.id,
            date: sale.date,
            source: 'Walk-in Sale',
            category: 'walkin',
            amount: sale.paidAmount || revenue,
            revenue: revenue,
            cost: cost,
            profit: profit,
            paymentMethod: sale.paymentMethod || 'cash',
            description: `${sale.items?.length || 0} item(s) sold`,
            reference: sale.saleId,
            items: sale.items,
            status: 'completed',
            sourceType: 'walkin',
            sourceId: sale.id
          };
          allTransactions.push(transaction);
          walkinTotal += sale.paidAmount || revenue;
          walkinCostTotal += cost;
          walkinProfitTotal += profit;
        }
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Calculate totals by payment method
      const paymentMethodTotals = {
        cash: 0,
        mobile: 0,
        bank: 0,
        card: 0
      };
      
      allTransactions.forEach(t => {
        const method = t.paymentMethod?.toLowerCase() || 'cash';
        if (paymentMethodTotals[method] !== undefined) {
          paymentMethodTotals[method] += t.amount;
        } else {
          paymentMethodTotals.cash += t.amount;
        }
      });

      setTransactions(allTransactions);
      setSummary({
        totalRevenue: allTransactions.reduce((sum, t) => sum + t.amount, 0),
        doctorFees: doctorFeesTotal,
        labTestsRegistration: labTestsRegistrationTotal,
        labTestsDoctor: labTestsDoctorTotal,
        inpatient: inpatientTotal,
        pharmacyPrescriptions: prescriptionsTotal,
        pharmacyPrescriptionsCost: prescriptionsCostTotal,
        pharmacyPrescriptionsProfit: prescriptionsProfitTotal,
        walkinSales: walkinTotal,
        walkinSalesCost: walkinCostTotal,
        walkinSalesProfit: walkinProfitTotal,
        totalPharmacyProfit: prescriptionsProfitTotal + walkinProfitTotal,
        byPaymentMethod: paymentMethodTotals
      });

    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleDeleteTransaction = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      
      switch (transactionToDelete.sourceType) {
        case 'patient':
          await fetch(`${API_BASE_URL}/api/patients/${transactionToDelete.sourceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          break;
        case 'consultation':
          const consultations = JSON.parse(localStorage.getItem('consultations') || '[]');
          const updatedConsultations = consultations.filter(c => c.id !== transactionToDelete.sourceId);
          localStorage.setItem('consultations', JSON.stringify(updatedConsultations));
          break;
        case 'walkin':
          const walkinSales = JSON.parse(localStorage.getItem('walkinSales') || '[]');
          const updatedWalkinSales = walkinSales.filter(s => s.id !== transactionToDelete.sourceId);
          localStorage.setItem('walkinSales', JSON.stringify(updatedWalkinSales));
          break;
        case 'inpatient':
          await fetch(`${API_BASE_URL}/api/inpatients/${transactionToDelete.sourceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          break;
        case 'lab_request':
          await fetch(`${API_BASE_URL}/api/lab-requests/${transactionToDelete.sourceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          break;
        case 'prescription':
          await fetch(`${API_BASE_URL}/api/prescriptions/${transactionToDelete.sourceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          break;
        default:
          toast.error('Cannot delete this transaction');
          setShowDeleteConfirm(false);
          setTransactionToDelete(null);
          return;
      }
      
      toast.success('Transaction deleted successfully');
      fetchRevenueData();
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
    }
  };

  const handleExportCSV = () => {
    const filtered = getFilteredTransactions();
    if (filtered.length === 0) {
      toast.info('No data to export');
      return;
    }

    const csvData = filtered.map(t => ({
      'Date': new Date(t.date).toLocaleDateString(),
      'Source': t.source,
      'Description': t.description,
      'Patient/Customer': t.patientName || t.customerName || 'N/A',
      'Amount': t.amount,
      'Payment Method': t.paymentMethod,
      'Reference': t.reference || 'N/A',
      'Status': t.status
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(csvData[0]).join(",") + "\n"
      + csvData.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `revenue_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const getFilteredTransactions = () => {
    let filtered = [...transactions];
    
    if (selectedSource !== 'all') {
      filtered = filtered.filter(t => {
        if (selectedSource === 'doctor_fee') return t.category === 'doctor_fee';
        if (selectedSource === 'lab_registration') return t.category === 'lab_registration';
        if (selectedSource === 'lab_doctor') return t.category === 'lab_doctor';
        if (selectedSource === 'inpatient') return t.category === 'inpatient';
        if (selectedSource === 'pharmacy') return t.category === 'pharmacy';
        if (selectedSource === 'walkin') return t.category === 'walkin';
        return t.source === selectedSource;
      });
    }
    
    if (selectedPaymentMethod !== 'all') {
      filtered = filtered.filter(t => t.paymentMethod?.toLowerCase() === selectedPaymentMethod.toLowerCase());
    }
    
    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();
  const totalFiltered = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getSourceIcon = (source) => {
    switch(source) {
      case 'Doctor Consultation Fee':
      case 'doctor_fee':
        return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case 'Lab Tests (Walk-in)':
      case 'lab_registration':
      case 'Lab Test (Direct)':
        return <FlaskConical className="w-4 h-4 text-purple-600" />;
      case 'Lab Tests (Doctor Request)':
      case 'lab_doctor':
        return <Microscope className="w-4 h-4 text-purple-600" />;
      case 'Inpatient Stay':
      case 'inpatient':
        return <Hospital className="w-4 h-4 text-red-600" />;
      case 'Pharmacy Prescription':
      case 'pharmacy':
        return <Pill className="w-4 h-4 text-green-600" />;
      case 'Walk-in Sale':
      case 'walkin':
        return <Package className="w-4 h-4 text-orange-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!isAuthenticated || user?.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#D01A2B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 print:shadow-none print:border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/superadmin')}
                className="p-2 hover:bg-gray-100 rounded-full print:hidden"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <img src={logo} alt="REYS CLINIC Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                  <p className="text-xs text-gray-500">Revenue & Financial Report</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 print:hidden">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span>Super Admin - Revenue Dashboard</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-4">
        {/* Report Title - Print Only */}
        <div className="hidden print:block text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Revenue Report</h2>
          <p className="text-gray-500">
            Period: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
          </p>
          <p className="text-gray-400 text-sm">Generated on {new Date().toLocaleString()}</p>
        </div>

        {/* Date Range Filter - Hide on Print */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 print:hidden">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
              >
                <option value="all">All Sources</option>
                <option value="doctor_fee">Doctor Consultation Fees</option>
                <option value="lab_registration">Lab Tests (Walk-in/Registration)</option>
                <option value="lab_doctor">Lab Tests (Doctor Requested)</option>
                <option value="inpatient">Inpatient Stays</option>
                <option value="pharmacy">Pharmacy Prescriptions</option>
                <option value="walkin">Walk-in Sales</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="mobile">Mobile Money</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card</option>
              </select>
            </div>
            <button
              onClick={fetchRevenueData}
              className="px-4 py-2 bg-[#D01A2B] text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 print:grid-cols-4 print:gap-2">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-4 text-white print:bg-gray-800 print:text-black print:border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-sm print:text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center print:hidden">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <p className="text-white/70 text-xs mt-2 print:text-gray-500">{filteredTransactions.length} transactions</p>
          </div>

          {/* Pharmacy Revenue Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm print:border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Pharmacy Revenue</p>
                <p className="text-2xl font-bold text-green-600 print:text-black">{formatCurrency(summary.pharmacyPrescriptions + summary.walkinSales)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Prescriptions: {formatCurrency(summary.pharmacyPrescriptions)} | Walk-in: {formatCurrency(summary.walkinSales)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center print:hidden">
                <Pill className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          {/* Pharmacy Profit Card */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 text-white print:bg-gray-800 print:text-black print:border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-sm print:text-gray-500">Pharmacy Profit</p>
                <p className="text-3xl font-bold">{formatCurrency(summary.totalPharmacyProfit)}</p>
                <p className="text-white/70 text-xs mt-1">
                  Margin: {summary.pharmacyPrescriptions + summary.walkinSales > 0 
                    ? ((summary.totalPharmacyProfit / (summary.pharmacyPrescriptions + summary.walkinSales)) * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center print:hidden">
                <ProfitIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm print:border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Doctor Fees</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.doctorFees)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center print:hidden">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm print:border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Lab Tests</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.labTestsRegistration + summary.labTestsDoctor)}</p>
                <p className="text-xs text-gray-400">Walk-in: {formatCurrency(summary.labTestsRegistration)} | Doctor: {formatCurrency(summary.labTestsDoctor)}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center print:hidden">
                <FlaskConical className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm print:border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Inpatient</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.inpatient)}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center print:hidden">
                <Hospital className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Profit Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 print:grid-cols-2 print:gap-2">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200 print:border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-green-700 text-sm font-semibold">Prescription Profit</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(summary.pharmacyPrescriptionsProfit)}</p>
              </div>
              <div className="text-right">
                <p className="text-green-600 text-xs">Revenue: {formatCurrency(summary.pharmacyPrescriptions)}</p>
                <p className="text-red-500 text-xs">Cost: {formatCurrency(summary.pharmacyPrescriptionsCost)}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 print:border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-orange-700 text-sm font-semibold">Walk-in Sales Profit</p>
                <p className="text-2xl font-bold text-orange-800">{formatCurrency(summary.walkinSalesProfit)}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-600 text-xs">Revenue: {formatCurrency(summary.walkinSales)}</p>
                <p className="text-red-500 text-xs">Cost: {formatCurrency(summary.walkinSalesCost)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 print:grid-cols-4 print:gap-2">
          <div className="bg-yellow-50 rounded-xl p-3 flex items-center justify-between print:border">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-yellow-600 print:hidden" />
              <span className="text-sm font-medium">Cash</span>
            </div>
            <span className="font-bold">{formatCurrency(summary.byPaymentMethod.cash)}</span>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between print:border">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-blue-600 print:hidden" />
              <span className="text-sm font-medium">Mobile Money</span>
            </div>
            <span className="font-bold">{formatCurrency(summary.byPaymentMethod.mobile)}</span>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 flex items-center justify-between print:border">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-purple-600 print:hidden" />
              <span className="text-sm font-medium">Bank Transfer</span>
            </div>
            <span className="font-bold">{formatCurrency(summary.byPaymentMethod.bank)}</span>
          </div>
          <div className="bg-green-50 rounded-xl p-3 flex items-center justify-between print:border">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-green-600 print:hidden" />
              <span className="text-sm font-medium">Card</span>
            </div>
            <span className="font-bold">{formatCurrency(summary.byPaymentMethod.card)}</span>
          </div>
        </div>

        {/* Actions - Hide on Print */}
        <div className="flex justify-end space-x-3 mb-4 print:hidden">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden print:shadow-none print:border">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader className="w-8 h-8 animate-spin text-[#D01A2B]" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b print:bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase print:text-gray-700">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase print:text-gray-700">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase print:text-gray-700">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase print:text-gray-700">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase print:text-gray-700">Payment Method</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredTransactions.map((transaction, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 print:hover:bg-white">
                        <td className="px-6 py-4 text-sm">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getSourceIcon(transaction.source)}
                            <span className="text-sm font-medium">{transaction.source}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {transaction.description}
                          {transaction.patientName && (
                            <p className="text-xs text-gray-400">Patient: {transaction.patientName}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-green-600 print:text-black">{formatCurrency(transaction.amount)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-sm">{transaction.paymentMethod}</span>
                        </td>
                        <td className="px-6 py-4 print:hidden">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(transaction)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(transaction)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t print:bg-gray-100">
                    <tr>
                      <td colSpan="3" className="px-6 py-3 text-right font-semibold">Total:</td>
                      <td className="px-6 py-3 font-bold text-[#D01A2B] print:text-black">{formatCurrency(totalFiltered)}</td>
                      <td colSpan="2" className="print:hidden"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
                  <p className="text-gray-500">Try adjusting your date range or filters</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer for Print */}
        <div className="hidden print:block mt-8 text-center text-sm text-gray-400">
          <p>REYS CLINIC - Official Financial Report</p>
          <p>This is a computer-generated document. No signature required.</p>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Transaction Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Transaction ID:</span></div>
                <div className="font-mono text-right">{selectedTransaction.id}</div>
                
                <div><span className="text-gray-500">Date:</span></div>
                <div className="text-right">{new Date(selectedTransaction.date).toLocaleString()}</div>
                
                <div><span className="text-gray-500">Source:</span></div>
                <div className="text-right font-medium">{selectedTransaction.source}</div>
                
                <div><span className="text-gray-500">Amount:</span></div>
                <div className="text-right font-bold text-green-600">{formatCurrency(selectedTransaction.amount)}</div>
                
                {selectedTransaction.revenue !== undefined && (
                  <>
                    <div><span className="text-gray-500">Revenue:</span></div>
                    <div className="text-right text-green-600">{formatCurrency(selectedTransaction.revenue)}</div>
                    
                    <div><span className="text-gray-500">Cost:</span></div>
                    <div className="text-right text-red-600">{formatCurrency(selectedTransaction.cost)}</div>
                    
                    <div><span className="text-gray-500">Profit:</span></div>
                    <div className="text-right text-purple-600 font-bold">{formatCurrency(selectedTransaction.profit)}</div>
                    
                    <div><span className="text-gray-500">Margin:</span></div>
                    <div className="text-right">{selectedTransaction.revenue > 0 ? ((selectedTransaction.profit / selectedTransaction.revenue) * 100).toFixed(1) : 0}%</div>
                  </>
                )}
                
                <div><span className="text-gray-500">Payment Method:</span></div>
                <div className="text-right capitalize">{selectedTransaction.paymentMethod}</div>
                
                {selectedTransaction.patientName && (
                  <>
                    <div><span className="text-gray-500">Patient Name:</span></div>
                    <div className="text-right">{selectedTransaction.patientName}</div>
                  </>
                )}
                
                {selectedTransaction.doctorName && (
                  <>
                    <div><span className="text-gray-500">Doctor:</span></div>
                    <div className="text-right">Dr. {selectedTransaction.doctorName}</div>
                  </>
                )}
                
                <div><span className="text-gray-500">Description:</span></div>
                <div className="text-right">{selectedTransaction.description}</div>
                
                <div><span className="text-gray-500">Reference:</span></div>
                <div className="text-right font-mono text-sm">{selectedTransaction.reference || 'N/A'}</div>
                
                <div><span className="text-gray-500">Status:</span></div>
                <div className="text-right">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                    {selectedTransaction.status}
                  </span>
                </div>
              </div>

              {selectedTransaction.items && selectedTransaction.items.length > 0 && (
                <div className="border-t pt-3">
                  <p className="font-semibold text-sm mb-2">Items Sold:</p>
                  <div className="space-y-1">
                    {selectedTransaction.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name} x {item.quantity}</span>
                        <span>{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && transactionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Transaction</h3>
              <p className="text-gray-500 mb-4">
                Are you sure you want to delete this transaction?
                <br />
                <span className="text-sm font-medium">Amount: {formatCurrency(transactionToDelete.amount)}</span>
                <br />
                <span className="text-xs text-gray-400">This action cannot be undone.</span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setTransactionToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTransaction}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border {
            border: 1px solid #e5e7eb !important;
          }
          .print\\:bg-gray-800 {
            background-color: #1f2937 !important;
          }
          .print\\:text-black {
            color: #000000 !important;
          }
          .print\\:text-gray-700 {
            color: #374151 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .print\\:gap-2 {
            gap: 0.5rem !important;
          }
          .print\\:py-4 {
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Revenue;
