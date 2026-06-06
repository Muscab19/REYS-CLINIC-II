import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Filter, Printer, Download, Eye, 
  X, Loader, User, Baby, Stethoscope, Microscope, 
  Calendar, Clock, DollarSign, CheckCircle, AlertCircle,
  FileText, Receipt, Send, Users, TrendingUp, FileCheck,
  ChevronLeft, ChevronRight, RefreshCw, Trash2, EyeOff,
  ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const PatientHistory = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Month navigation states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyStats, setMonthlyStats] = useState({
    total: 0,
    doctor: 0,
    lab: 0,
    totalRevenue: 0,
    paidCount: 0,
    pendingCount: 0
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (user?.role !== 'reception' && user?.role !== 'superadmin') {
      navigate('/');
      return;
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    filterAndCalculateStats();
  }, [registrations, searchTerm, filterDepartment, currentMonth]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setRegistrations(data.data);
      } else {
        toast.error(data.msg || 'Failed to load registrations');
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registration history');
    } finally {
      setLoading(false);
    }
  };

  const filterAndCalculateStats = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Filter by month
    let filtered = registrations.filter(r => {
      const regDate = new Date(r.registrationDate);
      return regDate.getFullYear() === year && regDate.getMonth() === month;
    });
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.childName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.parentPhone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by department
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(r => r.referredTo === filterDepartment);
    }
    
    setFilteredRegistrations(filtered);
    
    // Calculate monthly stats
    const allMonthRegistrations = registrations.filter(r => {
      const regDate = new Date(r.registrationDate);
      return regDate.getFullYear() === year && regDate.getMonth() === month;
    });
    
    const totalRevenue = allMonthRegistrations.reduce((sum, r) => sum + (r.paidAmount || r.ticketFee || 0), 0);
    const paidCount = allMonthRegistrations.filter(r => r.paymentStatus === 'paid').length;
    const pendingCount = allMonthRegistrations.filter(r => r.paymentStatus === 'pending' || r.paymentStatus === 'partial').length;
    
    setMonthlyStats({
      total: allMonthRegistrations.length,
      doctor: allMonthRegistrations.filter(r => r.referredTo === 'doctor').length,
      lab: allMonthRegistrations.filter(r => r.referredTo === 'lab-tech').length,
      totalRevenue: totalRevenue,
      paidCount: paidCount,
      pendingCount: pendingCount
    });
    
    setCurrentPage(1);
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const handleCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDepartmentFilter = (value) => {
    setFilterDepartment(value);
    setCurrentPage(1);
  };

  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration);
    setShowDetailsModal(true);
  };

  const handlePrintReferral = (registration) => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString('en-GB');
    const logoBase64 = logo;
    
    const assignedDoctorName = registration.assignedDoctor || 'Not Assigned';
    const assignedLabTechName = registration.assignedLabTech || 'Not Assigned';
    const patientId = registration.patientId || `P-${registration._id?.slice(-6)}`;
    const followUpStatus = registration.isFollowUp ? 'Yes' : 'No';
    const labTestsList = registration.labTestNames || [];
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REYS CLINIC - Patient Referral</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Times New Roman', 'Georgia', 'Arial', sans-serif;
              background: #fff;
              padding: 0;
              margin: 0;
            }
            .report {
              max-width: 100%;
              width: 100%;
              background: white;
              margin: 0;
              padding: 0;
            }
            .report-content {
              padding: 20px 25px;
            }
            .header {
              text-align: center;
              border-bottom: 1px solid #ccc;
              padding-bottom: 12px;
              margin-bottom: 18px;
            }
            .logo-img {
              max-width: 180px;
              height: auto;
              margin-bottom: 8px;
            }
            .clinic-address {
              font-size: 12px;
              font-weight: bold;
              color: #333;
              margin-top: 5px;
            }
            .contact-info {
              font-size: 12px;
              font-weight: bold;
              color: #333;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 18px;
              padding: 10px;
              background: #f8f9fa;
              border: 1px solid #e0e0e0;
            }
            .info-row {
              display: flex;
              align-items: baseline;
              font-size: 12px;
            }
            .info-label {
              font-weight: bold;
              width: 80px;
              min-width: 80px;
            }
            .info-value {
              color: #212529;
              font-weight: normal;
            }
            .section-title {
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              color: #c0392b;
              margin: 15px 0;
              padding: 8px;
              background: #f1f3f5;
              border: 1px solid #e0e0e0;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: bold;
            }
            .badge-urgent { background: #fee2e2; color: #dc2626; }
            .badge-normal { background: #dcfce7; color: #16a34a; }
            .tests-list {
              margin-top: 10px;
              padding: 8px;
              background: #f9f9f9;
              border-radius: 4px;
            }
            .test-item {
              font-size: 11px;
              padding: 4px 0;
              border-bottom: 1px dotted #ddd;
            }
            .footer {
              margin-top: 20px;
              padding: 10px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ccc;
            }
            @media print {
              body { padding: 0; margin: 0; }
              .report { box-shadow: none; margin: 0; }
              .report-content { padding: 15px 20px; }
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="report-content">
              <div class="header">
                <img src="${logoBase64}" alt="REYS CLINIC Logo" class="logo-img" />
                <div class="clinic-address">Wadada Sodonka, NBC, Albarako, Hodan, Mogadishu, Somalia</div>
                <div class="contact-info">Tel: 612674455 | 611477201</div>
              </div>
              
              <div class="info-grid">
                <div class="info-row"><span class="info-label">Patient ID:</span><span class="info-value">${patientId}</span></div>
                <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${currentDate}</span></div>
                <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${registration.childName}</span></div>
                <div class="info-row"><span class="info-label">Age:</span><span class="info-value">${registration.childAge} years</span></div>
                <div class="info-row"><span class="info-label">Sex:</span><span class="info-value">${registration.childGender || 'Not specified'}</span></div>
                <div class="info-row"><span class="info-label">Parent:</span><span class="info-value">${registration.parentName}</span></div>
                <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${registration.parentPhone}</span></div>
              </div>
              
              <div class="section-title">${registration.referredTo === 'doctor' ? 'DOCTOR REFERRAL' : 'LABORATORY REFERRAL'}</div>
              
              <div class="info-grid" style="margin-top: 0;">
                <div class="info-row"><span class="info-label">Assigned To:</span><span class="info-value">${registration.referredTo === 'doctor' ? ('Dr. ' + assignedDoctorName) : assignedLabTechName}</span></div>
                <div class="info-row"><span class="info-label">Urgency:</span><span class="info-value"><span class="badge ${registration.urgency === 'urgent' ? 'badge-urgent' : 'badge-normal'}">${registration.urgency === 'urgent' ? 'URGENT' : 'NORMAL'}</span></span></div>
                ${registration.referredTo === 'doctor' ? `
                  <div class="info-row"><span class="info-label">Reason:</span><span class="info-value">${registration.visitReason || 'N/A'}</span></div>
                  <div class="info-row"><span class="info-label">Follow-up:</span><span class="info-value">${followUpStatus}</span></div>
                ` : `
                  <div class="info-row"><span class="info-label">Tests:</span><span class="info-value">${labTestsList.length} test(s)</span></div>
                  <div class="info-row"><span class="info-label">Follow-up:</span><span class="info-value">${followUpStatus}</span></div>
                `}
                ${registration.referredTo === 'lab-tech' && labTestsList.length > 0 ? `
                  <div class="tests-list" style="grid-column: span 2;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Selected Tests:</div>
                    ${labTestsList.map(test => `<div class="test-item">• ${test}</div>`).join('')}
                  </div>
                ` : ''}
                ${registration.referredTo === 'lab-tech' && registration.labTestNotes ? `
                  <div class="info-row" style="grid-column: span 2;"><span class="info-label">Notes:</span><span class="info-value">${registration.labTestNotes}</span></div>
                ` : ''}
              </div>
              
              <div class="footer">
                <p>** END OF REFERRAL **</p>
                <p>Thank you for choosing REYS CLINIC</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintReceipt = (registration) => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString('en-GB');
    const logoBase64 = logo;
    const patientId = registration.patientId || `P-${registration._id?.slice(-6)}`;
    const refNo = `#${Math.floor(Math.random() * 100000)}`;
    const paidAmount = registration.paidAmount || registration.ticketFee || 0;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REYS CLINIC - Payment Receipt</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Times New Roman', 'Georgia', 'Arial', sans-serif;
              background: #fff;
              padding: 0;
              margin: 0;
            }
            .receipt {
              max-width: 100%;
              width: 100%;
              background: white;
              margin: 0;
              padding: 0;
            }
            .receipt-content {
              padding: 20px 25px;
            }
            .header {
              text-align: center;
              padding-bottom: 12px;
              margin-bottom: 15px;
            }
            .logo-img {
              max-width: 180px;
              height: auto;
              margin-bottom: 8px;
            }
            .clinic-address {
              font-size: 12px;
              font-weight: bold;
              color: #333;
              margin-top: 5px;
            }
            .contact-info {
              font-size: 12px;
              font-weight: bold;
              color: #333;
            }
            .top-section {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 12px;
            }
            .receipt-title {
              font-size: 22px;
              font-weight: bold;
              letter-spacing: 2px;
            }
            .info-bordered {
              border: 1px solid #ccc;
              margin-bottom: 15px;
            }
            .info-row-double {
              display: flex;
              justify-content: space-between;
              padding: 8px 12px;
              border-bottom: 1px solid #eee;
            }
            .info-row-double:last-child {
              border-bottom: none;
            }
            .info-label-double {
              font-weight: bold;
              font-size: 12px;
            }
            .info-value-double {
              font-size: 12px;
            }
            .patient-box {
              border: 1px solid #ccc;
              margin-bottom: 15px;
            }
            .patient-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 12px;
              border-bottom: 1px solid #eee;
            }
            .patient-row:last-child {
              border-bottom: none;
            }
            .patient-label {
              font-weight: bold;
              font-size: 12px;
            }
            .patient-value {
              font-size: 12px;
            }
            .amount-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 20px;
            }
            .amount-table {
              width: 220px;
              border-collapse: collapse;
            }
            .amount-table td {
              padding: 6px 8px;
              font-size: 13px;
            }
            .amount-table td:first-child {
              font-weight: bold;
            }
            .amount-table td:last-child {
              text-align: right;
            }
            .total-row td {
              font-weight: bold;
              font-size: 15px;
              border-top: 2px solid #333;
              padding-top: 8px;
            }
            .signature {
              margin-top: 25px;
              text-align: center;
              font-size: 12px;
              padding-top: 15px;
              border-top: 1px solid #ccc;
            }
            .footer {
              margin-top: 20px;
              padding: 10px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ccc;
            }
            @media print {
              body { padding: 0; margin: 0; }
              .receipt { box-shadow: none; margin: 0; }
              .receipt-content { padding: 15px 20px; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-content">
              <div class="header">
                <img src="${logoBase64}" alt="REYS CLINIC Logo" class="logo-img" />
                <div class="clinic-address">Wadada Sodonka, NBC, Albarako, Hodan, Mogadishu, Somalia</div>
                <div class="contact-info">Tel: 612674455 | 611477201</div>
              </div>
              
              <div class="top-section">
                <div class="receipt-title">PAYMENT RECEIPT</div>
              </div>
              
              <div class="info-bordered">
                <div class="info-row-double">
                  <span class="info-label-double">SERVICE TYPE:</span>
                  <span class="info-value-double">${registration.referredTo === 'doctor' ? 'DOCTOR CONSULTATION' : 'LABORATORY SERVICES'}</span>
                </div>
                <div class="info-row-double">
                  <span class="info-label-double">PRINT DATE:</span>
                  <span class="info-value-double">${currentDate}</span>
                </div>
                <div class="info-row-double">
                  <span class="info-label-double">RECEIPT NO:</span>
                  <span class="info-value-double">${refNo}</span>
                </div>
              </div>
              
              <div class="patient-box">
                <div class="patient-row">
                  <span class="patient-label">PATIENT ID:</span>
                  <span class="patient-value">${patientId}</span>
                </div>
                <div class="patient-row">
                  <span class="patient-label">PATIENT NAME:</span>
                  <span class="patient-value">${registration.childName}</span>
                </div>
                <div class="patient-row">
                  <span class="patient-label">PARENT/GUARDIAN:</span>
                  <span class="patient-value">${registration.parentName}</span>
                </div>
                <div class="patient-row">
                  <span class="patient-label">${registration.referredTo === 'doctor' ? 'DOCTOR:' : 'LAB TECHNICIAN:'}</span>
                  <span class="patient-value">${registration.referredTo === 'doctor' ? ('Dr. ' + (registration.assignedDoctor || 'N/A')) : (registration.assignedLabTech || 'N/A')}</span>
                </div>
              </div>
              
              <div class="amount-section">
                <table class="amount-table">
                  <tr>
                    <td>AMOUNT:</td>
                    <td>$${paidAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>DISCOUNT:</td>
                    <td>$0.00</td>
                  </tr>
                  <tr class="total-row">
                    <td>TOTAL PAID:</td>
                    <td>$${paidAmount.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
              
              <div class="signature">
                <p>Received by: ${user?.name || 'Receptionist'}</p>
                <p>Payment Method: ${registration.paymentMethod || 'cash'}</p>
                <p style="margin-top: 10px;">___________________________</p>
                <p style="font-size: 10px;">Authorized Signature</p>
              </div>
              
              <div class="footer">
                <p>** THIS IS A COMPUTER GENERATED RECEIPT **</p>
                <p>Thank you for choosing REYS CLINIC</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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

  const getDepartmentBadge = (referredTo) => {
    if (referredTo === 'doctor') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <Stethoscope className="w-3 h-3 mr-1" />
          Doctor
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
        <Microscope className="w-3 h-3 mr-1" />
        Laboratory
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    if (status === 'paid') {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Paid</span>;
    }
    if (status === 'partial') {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Partial</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Pending</span>;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRegistrations = filteredRegistrations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const goToPage = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (!isAuthenticated || (user?.role !== 'reception' && user?.role !== 'superadmin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#D01A2B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  <p className="text-xs text-gray-500">Patient History</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchRegistrations}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <p className="text-xs text-gray-500">
                  {monthlyStats.total} registrations this month
                </p>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <button
              onClick={handleCurrentMonth}
              className="px-4 py-2 text-sm bg-[#D01A2B] text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Current Month
            </button>
          </div>
        </div>

        {/* Monthly Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{monthlyStats.total}</p>
            <p className="text-sm text-gray-500">Total Patients</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center mb-2">
              <Stethoscope className="w-5 h-5 text-blue-700" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{monthlyStats.doctor}</p>
            <p className="text-sm text-blue-600">Doctor Referrals</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center mb-2">
              <Microscope className="w-5 h-5 text-purple-700" />
            </div>
            <p className="text-2xl font-bold text-purple-700">{monthlyStats.lab}</p>
            <p className="text-sm text-purple-600">Lab Referrals</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center mb-2">
              <DollarSign className="w-5 h-5 text-green-700" />
            </div>
            <p className="text-2xl font-bold text-green-700">${monthlyStats.totalRevenue}</p>
            <p className="text-sm text-green-600">Total Revenue</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-700" />
            </div>
            <p className="text-2xl font-bold text-green-700">{monthlyStats.paidCount}</p>
            <p className="text-sm text-green-600">Paid</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-red-700" />
            </div>
            <p className="text-2xl font-bold text-red-700">{monthlyStats.pendingCount}</p>
            <p className="text-sm text-red-600">Pending Payment</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name, parent name, patient ID, or phone..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
              />
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => handleDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
            >
              <option value="all">All Departments</option>
              <option value="doctor">Doctor Consultation</option>
              <option value="lab-tech">Laboratory Services</option>
            </select>
            {(searchTerm || filterDepartment !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterDepartment('all');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Registrations Table */}
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient Info</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned To</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentRegistrations.map((registration) => (
                      <tr key={registration._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-[#D01A2B]">
                            {registration.patientId || `ID-${registration._id?.slice(-6)}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <Baby className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{registration.childName}</p>
                              <p className="text-xs text-gray-500">Age: {registration.childAge} years</p>
                              <p className="text-xs text-gray-400">Parent: {registration.parentName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getDepartmentBadge(registration.referredTo)}
                          {registration.urgency === 'urgent' && (
                            <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              Urgent
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">
                            {registration.referredTo === 'doctor' 
                              ? (registration.assignedDoctor || 'Not Assigned')
                              : (registration.assignedLabTech || 'Not Assigned')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            {getPaymentBadge(registration.paymentStatus)}
                            <p className="text-xs text-gray-500 mt-1">
                              ${registration.paidAmount || registration.ticketFee || 0}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {formatDate(registration.registrationDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(registration)}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrintReferral(registration)}
                              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                              title="Print Referral"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrintReceipt(registration)}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              title="Print Receipt"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRegistrations.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
                  <p className="text-gray-500">
                    No patients registered in {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    {searchTerm && ' matching your search'}
                  </p>
                </div>
              )}

              {filteredRegistrations.length > 0 && (
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRegistrations.length)} of {filteredRegistrations.length} patients
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
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
                          onClick={() => goToPage(pageNum)}
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
                      onClick={() => goToPage(currentPage + 1)}
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

      {/* Details Modal */}
      {showDetailsModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Registration Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {/* Patient Information */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Patient ID</p>
                    <p className="text-xl font-bold text-gray-900">{selectedRegistration.patientId || 'N/A'}</p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">{selectedRegistration.childName}</p>
                    <p className="text-sm text-gray-600">Age: {selectedRegistration.childAge} years | Gender: {selectedRegistration.childGender || 'Not specified'}</p>
                    <p className="text-sm text-gray-600">Parent: {selectedRegistration.parentName}</p>
                    <p className="text-sm text-gray-600">Phone: {selectedRegistration.parentPhone}</p>
                    {selectedRegistration.parentEmail && <p className="text-sm text-gray-600">Email: {selectedRegistration.parentEmail}</p>}
                  </div>
                  <div className="text-right">
                    <div className="mb-2">{getDepartmentBadge(selectedRegistration.referredTo)}</div>
                    <p className="text-sm text-gray-500">Registered on</p>
                    <p className="text-sm font-semibold">{formatDate(selectedRegistration.registrationDate)}</p>
                  </div>
                </div>
              </div>

              {/* Department Details */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  {selectedRegistration.referredTo === 'doctor' ? <Stethoscope className="w-4 h-4 text-blue-600" /> : <Microscope className="w-4 h-4 text-purple-600" />}
                  <span>Department Information</span>
                </h4>
                <div className={`rounded-xl p-4 ${selectedRegistration.referredTo === 'doctor' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Assigned To</p>
                      <p className="font-semibold">
                        {selectedRegistration.referredTo === 'doctor' 
                          ? (selectedRegistration.assignedDoctor || 'Not Assigned')
                          : (selectedRegistration.assignedLabTech || 'Not Assigned')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Urgency</p>
                      <p className={`font-semibold ${selectedRegistration.urgency === 'urgent' ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedRegistration.urgency === 'urgent' ? 'Urgent' : 'Normal'}
                      </p>
                    </div>
                    {selectedRegistration.referredTo === 'doctor' && (
                      <>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Reason for Visit</p>
                          <p className="text-sm">{selectedRegistration.visitReason || 'N/A'}</p>
                        </div>
                        {selectedRegistration.symptoms && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500">Symptoms</p>
                            <p className="text-sm">{selectedRegistration.symptoms}</p>
                          </div>
                        )}
                      </>
                    )}
                    {selectedRegistration.referredTo === 'lab-tech' && selectedRegistration.labTestNames && selectedRegistration.labTestNames.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Selected Tests</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedRegistration.labTestNames.map((test, idx) => (
                            <span key={idx} className="bg-white px-2 py-0.5 rounded-full text-xs">{test}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedRegistration.labTestNotes && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Lab Notes</p>
                        <p className="text-sm">{selectedRegistration.labTestNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Follow-up Information */}
              {selectedRegistration.isFollowUp && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span>Follow-up Information</span>
                  </h4>
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Follow-up Reason</p>
                        <p className="text-sm">{selectedRegistration.followUpReason || 'Not specified'}</p>
                      </div>
                      {selectedRegistration.previousConsultationId && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Previous Consultation ID</p>
                          <p className="text-sm font-mono">{selectedRegistration.previousConsultationId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>Payment Information</span>
                </h4>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Payment Status</p>
                      <p className="font-semibold">{getPaymentBadge(selectedRegistration.paymentStatus)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount Paid</p>
                      <p className="font-semibold text-green-600">${selectedRegistration.paidAmount || selectedRegistration.ticketFee || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payment Method</p>
                      <p className="text-sm">{selectedRegistration.paymentMethod || 'cash'}</p>
                    </div>
                    {selectedRegistration.paymentDate && (
                      <div>
                        <p className="text-xs text-gray-500">Payment Date</p>
                        <p className="text-sm">{formatDate(selectedRegistration.paymentDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handlePrintReferral(selectedRegistration)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Print Referral Slip</span>
                </button>
                <button
                  onClick={() => handlePrintReceipt(selectedRegistration)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistory;
