import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Hospital, Bed, DollarSign, CreditCard, Phone, 
  Banknote, Calendar, Clock, User, Baby, MapPin, CheckCircle,
  X, Loader, Search, Download, AlertCircle, 
  TrendingUp, Users, Activity, Eye, Edit, Save, Trash2,
  Send, Receipt, FileText, Printer, Wallet, Smartphone, Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const Inpatient = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inpatients, setInpatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Assignment form state
  const [assignmentData, setAssignmentData] = useState({
    roomNumber: '',
    bedNumber: '',
    nightlyRate: 50,
    admissionNotes: ''
  });
  
  // Discharge form state
  const [dischargeData, setDischargeData] = useState({
    dischargeDate: new Date().toISOString().slice(0, 16),
    nightsCount: 0,
    totalAmount: 0,
    adjustedAmount: 0,
    discount: 0,
    dischargeNotes: ''
  });
  
  // Payment form state
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'mobile',
    mobileNumber: '',
    bankLast4: '',
    paidAmount: 0,
    paymentDate: new Date().toISOString().slice(0, 16),
    paymentReference: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (user?.role !== 'reception' && user?.role !== 'superadmin') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'reception' || user?.role === 'superadmin')) {
      fetchInpatients();
    }
  }, [isAuthenticated, user]);

  const fetchInpatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inpatients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setInpatients(data.data);
      } else {
        toast.error(data.msg || 'Failed to load inpatients');
      }
    } catch (error) {
      console.error('Error fetching inpatients:', error);
      toast.error('Failed to load inpatients');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get patient ID safely
  const getPatientId = (patient) => {
    if (!patient) return 'N/A';
    if (typeof patient.patientId === 'string') return patient.patientId;
    if (patient.patientIdNumber) return patient.patientIdNumber;
    if (patient.patientId && patient.patientId.patientId) return patient.patientId.patientId;
    if (patient.patientId && typeof patient.patientId === 'object') {
      return patient.patientId.patientId || patient.patientId._id?.slice(-6) || 'N/A';
    }
    return patient._id?.slice(-6) || 'N/A';
  };

  // Helper function to get child name safely
  const getChildName = (patient) => {
    if (!patient) return 'Unknown';
    if (typeof patient.childName === 'string') return patient.childName;
    if (patient.childName && typeof patient.childName === 'object') {
      return patient.childName.childName || 'Unknown';
    }
    return 'Unknown';
  };

  const handleAssignRoom = async () => {
    if (!assignmentData.roomNumber) {
      toast.error('Please enter room number');
      return;
    }
    if (!assignmentData.bedNumber) {
      toast.error('Please enter bed number');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inpatients/${selectedPatient._id}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignmentData)
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Room assigned successfully');
        setShowAssignModal(false);
        fetchInpatients();
        setAssignmentData({
          roomNumber: '',
          bedNumber: '',
          nightlyRate: 50,
          admissionNotes: ''
        });
      } else {
        toast.error(data.msg || 'Failed to assign room');
      }
    } catch (error) {
      console.error('Error assigning room:', error);
      toast.error('Failed to assign room');
    }
  };

  const calculateNightsAndTotal = (admissionDate, dischargeDate, nightlyRate) => {
    const admission = new Date(admissionDate);
    const discharge = new Date(dischargeDate);
    const diffTime = Math.abs(discharge - admission);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nights = diffDays === 0 ? 1 : diffDays;
    const total = nights * (nightlyRate || 50);
    return { nights, total };
  };

  const handleCalculateDischarge = () => {
    if (!selectedPatient) return;
    
    const { nights, total } = calculateNightsAndTotal(
      selectedPatient.admissionDate,
      dischargeData.dischargeDate,
      selectedPatient.nightlyRate
    );
    
    setDischargeData(prev => ({
      ...prev,
      nightsCount: nights,
      totalAmount: total,
      adjustedAmount: total
    }));
  };

  const handleDischarge = () => {
    if (!dischargeData.dischargeDate) {
      toast.error('Please select discharge date');
      return;
    }
    setShowDischargeModal(true);
    handleCalculateDischarge();
  };

  const confirmDischarge = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inpatients/${selectedPatient._id}/discharge`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dischargeDate: dischargeData.dischargeDate,
          nightsCount: dischargeData.nightsCount,
          totalAmount: dischargeData.adjustedAmount,
          discount: dischargeData.discount,
          dischargeNotes: dischargeData.dischargeNotes
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Patient discharged successfully');
        setShowDischargeModal(false);
        fetchInpatients();
        setDischargeData({
          dischargeDate: new Date().toISOString().slice(0, 16),
          nightsCount: 0,
          totalAmount: 0,
          adjustedAmount: 0,
          discount: 0,
          dischargeNotes: ''
        });
      } else {
        toast.error(data.msg || 'Failed to discharge patient');
      }
    } catch (error) {
      console.error('Error discharging patient:', error);
      toast.error('Failed to discharge patient');
    }
  };

  const handleProcessPayment = async () => {
    if (!paymentData.paidAmount || paymentData.paidAmount <= 0) {
      toast.error('Please enter payment amount');
      return;
    }
    
    if (paymentData.paidAmount < selectedPatient.totalAmount) {
      toast.error(`Insufficient payment. Total is $${selectedPatient.totalAmount}`);
      return;
    }
    
    if (paymentData.paymentMethod === 'mobile' && !paymentData.mobileNumber) {
      toast.error('Please enter mobile number');
      return;
    }
    
    if (paymentData.paymentMethod === 'bank' && !paymentData.bankLast4) {
      toast.error('Please enter last 4 digits of bank card');
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inpatients/${selectedPatient._id}/payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...paymentData,
          paidAmount: parseFloat(paymentData.paidAmount)
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Payment processed successfully');
        setShowPaymentModal(false);
        fetchInpatients();
        setPaymentData({
          paymentMethod: 'mobile',
          mobileNumber: '',
          bankLast4: '',
          paidAmount: 0,
          paymentDate: new Date().toISOString().slice(0, 16),
          paymentReference: ''
        });
      } else {
        toast.error(data.msg || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePrintInvoice = (patient) => {
    const printWindow = window.open('', '_blank');
    const patientName = getChildName(patient);
    const patientIdDisplay = getPatientId(patient);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REYS CLINIC - Inpatient Invoice</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', Arial, sans-serif; background: #fff; padding: 40px; }
            .invoice { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; background: #fff; }
            .header { text-align: center; padding: 30px; border-bottom: 2px solid #D01A2B; }
            .logo-img { max-width: 150px; height: auto; margin-bottom: 10px; }
            .clinic-name { font-size: 24px; font-weight: bold; color: #D01A2B; margin-bottom: 5px; }
            .clinic-address { font-size: 12px; color: #666; }
            .content { padding: 30px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
            .section-title { font-size: 16px; font-weight: bold; color: #D01A2B; margin: 20px 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #D01A2B; }
            .total { font-size: 18px; font-weight: bold; color: #D01A2B; margin-top: 15px; padding-top: 10px; border-top: 2px solid #D01A2B; }
            .footer { text-align: center; padding: 20px; font-size: 11px; color: #999; border-top: 1px solid #ddd; }
            .status-paid { color: #16a34a; font-weight: bold; }
            .status-pending { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <div class="clinic-name">REYS CLINIC</div>
              <div class="clinic-address">Wadad Sodonka, NBC, Albarako, Mogadishu, Somalia</div>
              <div>Pediatric Specialist</div>
              <h3 style="margin-top: 10px;">INPATIENT INVOICE</h3>
            </div>
            <div class="content">
              <div class="info-row"><strong>Invoice No:</strong> <span>${patient.inpatientId || patient._id}</span></div>
              <div class="info-row"><strong>Patient Name:</strong> <span>${patientName}</span></div>
              <div class="info-row"><strong>Patient ID:</strong> <span>${patientIdDisplay}</span></div>
              <div class="info-row"><strong>Room:</strong> <span>${patient.roomNumber || 'N/A'}</span></div>
              <div class="info-row"><strong>Bed:</strong> <span>${patient.bedNumber || 'N/A'}</span></div>
              <div class="info-row"><strong>Admission Date:</strong> <span>${patient.admissionDate ? new Date(patient.admissionDate).toLocaleString() : 'N/A'}</span></div>
              ${patient.dischargeDate ? `<div class="info-row"><strong>Discharge Date:</strong> <span>${new Date(patient.dischargeDate).toLocaleString()}</span></div>` : ''}
              <div class="info-row"><strong>Nights Stayed:</strong> <span>${patient.nightsCount || 0} nights</span></div>
              <div class="info-row"><strong>Nightly Rate:</strong> <span>$${patient.nightlyRate || 0}</span></div>
              <div class="section-title">Payment Details</div>
              <div class="info-row"><strong>Total Amount:</strong> <span>$${patient.totalAmount || 0}</span></div>
              <div class="info-row"><strong>Amount Paid:</strong> <span>$${patient.paidAmount || 0}</span></div>
              <div class="info-row"><strong>Balance:</strong> <span>$${(patient.totalAmount || 0) - (patient.paidAmount || 0)}</span></div>
              <div class="info-row"><strong>Payment Status:</strong> <span class="${patient.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">${patient.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}</span></div>
              ${patient.paymentMethod ? `<div class="info-row"><strong>Payment Method:</strong> <span>${patient.paymentMethod === 'mobile' ? 'Mobile Money' : 'Bank Transfer'}</span></div>` : ''}
              ${patient.mobileNumber ? `<div class="info-row"><strong>Mobile Number:</strong> <span>${patient.mobileNumber}</span></div>` : ''}
              ${patient.bankLast4 ? `<div class="info-row"><strong>Bank Card:</strong> <span>**** **** **** ${patient.bankLast4}</span></div>` : ''}
              <div class="total">Total Paid: $${patient.paidAmount || 0}</div>
            </div>
            <div class="footer">
              <p>Thank you for choosing REYS CLINIC</p>
              <p>Processed By: ${user?.name || 'Reception'}</p>
              <p>-----------------------------------END OF INVOICE------------------------------------------</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusBadge = (status) => {
    const config = {
      'admitted': 'bg-blue-100 text-blue-700',
      'discharged': 'bg-green-100 text-green-700',
      'pending_payment': 'bg-yellow-100 text-yellow-700',
      'paid': 'bg-green-100 text-green-700'
    };
    return <span className={`${config[status] || config.admitted} px-2 py-1 rounded-full text-xs font-semibold`}>{status?.replace('_', ' ') || 'admitted'}</span>;
  };

  const filteredInpatients = inpatients.filter(patient => {
    const patientName = getChildName(patient).toLowerCase();
    const patientId = getPatientId(patient).toLowerCase();
    const roomNumber = (patient.roomNumber || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return patientName.includes(search) || patientId.includes(search) || roomNumber.includes(search);
  });

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
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                <p className="text-xs text-gray-500">Inpatient Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Hospital className="w-4 h-4 text-[#D01A2B]" />
              <span>{user?.name} - Reception</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Hospital className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {inpatients.filter(p => p.status === 'admitted').length}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Currently Admitted</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {inpatients.filter(p => p.status === 'discharged' && p.paymentStatus === 'paid').length}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Discharged & Paid</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {inpatients.filter(p => p.paymentStatus === 'pending_payment').length}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Pending Payment</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Bed className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{inpatients.length}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Total Inpatients</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, ID, or room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
            />
          </div>
        </div>

        {/* Inpatients Table */}
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Room/Bed</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Admission Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nights</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredInpatients.map((patient) => (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-[#D01A2B]">{getPatientId(patient)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Baby className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{getChildName(patient)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {patient.roomNumber && patient.bedNumber ? (
                            <span>Room {patient.roomNumber}, Bed {patient.bedNumber}</span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowAssignModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Assign Room
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {patient.admissionDate ? new Date(patient.admissionDate).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4">{patient.nightsCount || 0} nights</td>
                        <td className="px-6 py-4">${patient.totalAmount || 0}</td>
                        <td className="px-6 py-4">{getStatusBadge(patient.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {patient.status === 'admitted' && patient.roomNumber && (
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  handleDischarge();
                                }}
                                className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                title="Discharge"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                            {patient.status === 'discharged' && patient.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setShowPaymentModal(true);
                                }}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                title="Process Payment"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handlePrintInvoice(patient)}
                              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                              title="Print Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredInpatients.length === 0 && (
                <div className="text-center py-12">
                  <Hospital className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No inpatients found</h3>
                  <p className="text-gray-500 mt-1">Patients marked as inpatient by doctors will appear here</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Assign Room Modal */}
      {showAssignModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Assign Room & Bed</h3>
              <button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Patient</label>
                <p className="text-gray-900">{getChildName(selectedPatient)} (ID: {getPatientId(selectedPatient)})</p>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Room Number *</label>
                <input
                  type="text"
                  value={assignmentData.roomNumber}
                  onChange={(e) => setAssignmentData({...assignmentData, roomNumber: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                  placeholder="e.g., 101, 102, ICU-1"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Bed Number *</label>
                <input
                  type="text"
                  value={assignmentData.bedNumber}
                  onChange={(e) => setAssignmentData({...assignmentData, bedNumber: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                  placeholder="e.g., A, B, 1, 2"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Nightly Rate ($)</label>
                <input
                  type="number"
                  step="10"
                  value={assignmentData.nightlyRate}
                  onChange={(e) => setAssignmentData({...assignmentData, nightlyRate: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                />
                <p className="text-xs text-gray-500 mt-1">Amount charged per night of stay</p>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Admission Notes (Optional)</label>
                <textarea
                  rows="2"
                  value={assignmentData.admissionNotes}
                  onChange={(e) => setAssignmentData({...assignmentData, admissionNotes: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                  placeholder="Any special notes about admission..."
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleAssignRoom} className="px-4 py-2 bg-[#D01A2B] text-white rounded-lg">Assign Room</button>
            </div>
          </div>
        </div>
      )}

      {/* Discharge Modal */}
      {showDischargeModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">Discharge Patient</h3>
              <button onClick={() => setShowDischargeModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">{getChildName(selectedPatient)}</p>
                <p className="text-sm text-gray-600">Room {selectedPatient.roomNumber}, Bed {selectedPatient.bedNumber}</p>
                <p className="text-sm text-gray-600">Admission: {selectedPatient.admissionDate ? new Date(selectedPatient.admissionDate).toLocaleString() : 'N/A'}</p>
                <p className="text-sm font-semibold text-[#D01A2B]">Nightly Rate: ${selectedPatient.nightlyRate || 50}</p>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Discharge Date & Time *</label>
                <input
                  type="datetime-local"
                  value={dischargeData.dischargeDate}
                  onChange={(e) => {
                    setDischargeData({...dischargeData, dischargeDate: e.target.value});
                    setTimeout(handleCalculateDischarge, 100);
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Nights Stayed:</span>
                  <span className="font-semibold">{dischargeData.nightsCount} nights</span>
                </div>
                <div className="flex justify-between">
                  <span>Nightly Rate:</span>
                  <span>${selectedPatient.nightlyRate || 50}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span>Subtotal:</span>
                  <span>${dischargeData.totalAmount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount:</span>
                  <input
                    type="number"
                    step="10"
                    value={dischargeData.discount}
                    onChange={(e) => {
                      const discount = parseFloat(e.target.value) || 0;
                      setDischargeData(prev => ({
                        ...prev,
                        discount: discount,
                        adjustedAmount: prev.totalAmount - discount
                      }));
                    }}
                    className="w-24 px-2 py-1 border rounded text-right"
                  />
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span className="text-[#D01A2B]">${dischargeData.adjustedAmount}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Discharge Notes (Optional)</label>
                <textarea
                  rows="2"
                  value={dischargeData.dischargeNotes}
                  onChange={(e) => setDischargeData({...dischargeData, dischargeNotes: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                  placeholder="Discharge instructions or notes..."
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <button onClick={() => setShowDischargeModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={confirmDischarge} className="px-4 py-2 bg-yellow-600 text-white rounded-lg">Confirm Discharge</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Process Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span>Patient:</span>
                  <span className="font-semibold">{getChildName(selectedPatient)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-bold text-[#D01A2B]">${selectedPatient.totalAmount}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Payment Method *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentData({...paymentData, paymentMethod: 'mobile', mobileNumber: '', bankLast4: ''})}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${paymentData.paymentMethod === 'mobile' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'}`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentData({...paymentData, paymentMethod: 'bank', mobileNumber: '', bankLast4: ''})}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${paymentData.paymentMethod === 'bank' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'}`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Bank Transfer</span>
                  </button>
                </div>
              </div>
              
              {paymentData.paymentMethod === 'mobile' && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Mobile Number *</label>
                  <input
                    type="tel"
                    value={paymentData.mobileNumber}
                    onChange={(e) => setPaymentData({...paymentData, mobileNumber: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                    placeholder="e.g., 612345678"
                  />
                </div>
              )}
              
              {paymentData.paymentMethod === 'bank' && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Last 4 Digits of Card *</label>
                  <input
                    type="text"
                    maxLength="4"
                    value={paymentData.bankLast4}
                    onChange={(e) => setPaymentData({...paymentData, bankLast4: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                    placeholder="****"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Amount to Pay *</label>
                <input
                  type="number"
                  step="10"
                  value={paymentData.paidAmount}
                  onChange={(e) => setPaymentData({...paymentData, paidAmount: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                  placeholder={`Enter amount (Total: $${selectedPatient.totalAmount})`}
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Payment Date</label>
                <input
                  type="datetime-local"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Reference/Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={paymentData.paymentReference}
                  onChange={(e) => setPaymentData({...paymentData, paymentReference: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                  placeholder="Transaction reference number"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleProcessPayment} disabled={processingPayment} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center space-x-2">
                {processingPayment ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Process Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inpatient;