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
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  History,
  TestTube,
  Smartphone,
  Building2,
  FlaskConical,
  Percent,
  Tag
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const PatientCheckout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [labTests, setLabTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [paymentType, setPaymentType] = useState('cash');
  const [mobileNumber, setMobileNumber] = useState('');
  const [bankLast4, setBankLast4] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Discount states
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const storedConsultations = JSON.parse(localStorage.getItem('consultations') || '[]');
      
      console.log('All stored consultations:', storedConsultations);
      
      // Only get consultations with unpaid lab tests - use Set to track unique
      const processedPatientIds = new Set();
      const patientsList = [];
      
      for (const cons of storedConsultations) {
        // Only process if has lab tests and not paid and status is pending_payment
        if (cons.labTestsRequested && 
            cons.labTestsRequested.length > 0 && 
            cons.labPaymentStatus !== 'paid' && 
            cons.status === 'pending_payment') {
          
          const patientId = cons.patientId;
          
          // Skip if already processed this patient to avoid duplicates
          if (processedPatientIds.has(patientId)) {
            continue;
          }
          processedPatientIds.add(patientId);
          
          // Get unpaid lab tests
          const unpaidLabTests = cons.labTestsRequested.filter(test => !test.paid);
          
          if (unpaidLabTests.length > 0) {
            const labTotal = unpaidLabTests.reduce((sum, lab) => sum + (lab.price || 0), 0);
            
            patientsList.push({
              _id: patientId,
              childName: cons.patientName,
              childAge: cons.childAge,
              parentName: cons.parentName,
              parentPhone: cons.parentPhone,
              ticketId: cons.ticketId || `CONS-${patientId?.slice(-6) || Date.now()}`,
              consultations: [cons],
              labTestsRequested: unpaidLabTests,
              totalLabAmount: labTotal
            });
          }
        }
      }
      
      console.log('Final patient list:', patientsList);
      
      setPatients(patientsList);
      setConsultations(storedConsultations);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    
    if (patient.parentPhone) {
      setMobileNumber(patient.parentPhone);
    }
    
    // Set lab tests that need payment
    setLabTests(patient.labTestsRequested || []);
    
    // Reset discount when selecting new patient
    resetDiscount();
  };

  // Calculate total lab tests amount
  const calculateSubtotal = () => {
    return labTests.reduce((sum, test) => sum + (test.price || 0), 0);
  };

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === 'none' || !discountValue) return 0;
    
    const value = parseFloat(discountValue);
    if (isNaN(value)) return 0;
    
    if (discountType === 'percentage') {
      return (subtotal * value) / 100;
    } else if (discountType === 'fixed') {
      return Math.min(value, subtotal);
    }
    return 0;
  };

  // Calculate final total after discount
  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const resetDiscount = () => {
    setDiscountType('none');
    setDiscountValue('');
    setDiscountReason('');
    setShowDiscountInput(false);
  };

  const applyDiscount = () => {
    if (discountType === 'none') {
      resetDiscount();
      return;
    }
    
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid discount amount');
      return;
    }
    
    if (discountType === 'percentage' && value > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }
    
    if (discountType === 'fixed' && value > calculateSubtotal()) {
      toast.error('Fixed discount cannot exceed subtotal');
      return;
    }
    
    toast.success(`Discount applied: ${discountType === 'percentage' ? `${value}%` : `$${value.toFixed(2)}`}`);
    setShowDiscountInput(false);
  };

  const handleProcessPayment = () => {
    setPaymentType('cash');
    setMobileNumber(selectedPatient?.parentPhone || '');
    setBankLast4('');
    setShowPaymentModal(true);
  };

  const validatePaymentDetails = () => {
    if (paymentType === 'mobile') {
      if (!mobileNumber || mobileNumber.trim() === '') {
        toast.error('Please enter mobile number');
        return false;
      }
      if (!/^[0-9]{7,15}$/.test(mobileNumber.replace(/[^0-9]/g, ''))) {
        toast.error('Please enter a valid mobile number');
        return false;
      }
    } else if (paymentType === 'bank') {
      if (!bankLast4 || bankLast4.trim() === '') {
        toast.error('Please enter bank card last 4 digits');
        return false;
      }
      if (!/^[0-9]{4}$/.test(bankLast4)) {
        toast.error('Please enter exactly 4 digits');
        return false;
      }
    }
    return true;
  };

  const confirmPayment = async () => {
    if (!validatePaymentDetails()) {
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        setProcessingPayment(false);
        return;
      }
      
      const allLabTests = selectedPatient.labTestsRequested || [];
      const subtotal = calculateSubtotal();
      const discountAmount = calculateDiscountAmount();
      const totalAmount = calculateTotal();
      
      // SAVE TO DATABASE
      const saveResponse = await fetch(`${API_BASE_URL}/api/lab-payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          consultationId: selectedPatient.consultations[0]?.id,
          patientId: selectedPatient._id,
          patientName: selectedPatient.childName,
          patientAge: selectedPatient.childAge,
          parentName: selectedPatient.parentName,
          parentPhone: selectedPatient.parentPhone,
          doctorName: selectedPatient.doctorName,
          labTests: allLabTests,
          subtotal: subtotal,
          discountType: discountType,
          discountValue: discountType !== 'none' ? parseFloat(discountValue) : 0,
          discountAmount: discountAmount,
          discountReason: discountReason,
          totalAmount: totalAmount,
          paidAmount: totalAmount,
          paymentMethod: paymentType === 'mobile' ? 'Mobile Money' : (paymentType === 'bank' ? 'Bank Transfer' : 'Cash'),
          mobileNumber: paymentType === 'mobile' ? mobileNumber : undefined,
          bankLast4: paymentType === 'bank' ? bankLast4 : undefined,
          paymentDate: new Date().toISOString()
        })
      });
      
      const saveData = await saveResponse.json();
      
      if (!saveData.success) {
        toast.error('Failed to save payment to database');
      }
      
      // Update localStorage consultations
      const updatedConsultations = consultations.map(cons => {
        if (cons.patientId === selectedPatient._id && cons.labTestsRequested) {
          const updatedLabTests = cons.labTestsRequested.map(test => {
            const isInSelected = allLabTests.some(lt => lt.id === test.id || lt.name === test.name);
            if (isInSelected) {
              return { ...test, paid: true, paidAt: new Date().toISOString() };
            }
            return test;
          });
          
          return { 
            ...cons, 
            labTestsRequested: updatedLabTests,
            labPaymentStatus: 'paid',
            labPaidAt: new Date().toISOString(),
            labPaidAmount: totalAmount,
            labDiscountAmount: discountAmount,
            labDiscountType: discountType,
            labDiscountReason: discountReason,
            labPaymentMethod: paymentType === 'mobile' ? 'Mobile Money' : (paymentType === 'bank' ? 'Bank Transfer' : 'Cash'),
            status: 'completed'
          };
        }
        return cons;
      });
      
      localStorage.setItem('consultations', JSON.stringify(updatedConsultations));
      
      // Create invoice
      const invoice = {
        invoiceId: `LAB-INV-${Date.now()}`,
        type: 'lab',
        patientId: selectedPatient._id,
        patientName: selectedPatient.childName,
        childAge: selectedPatient.childAge,
        parentName: selectedPatient.parentName,
        phone: selectedPatient.parentPhone,
        ticketId: selectedPatient.ticketId,
        labTests: allLabTests,
        subtotal: subtotal,
        discountType: discountType,
        discountValue: discountType !== 'none' ? parseFloat(discountValue) : 0,
        discountAmount: discountAmount,
        discountReason: discountReason,
        total: totalAmount,
        paymentMethod: paymentType === 'mobile' ? 'Mobile Money' : (paymentType === 'bank' ? 'Bank Transfer' : 'Cash'),
        paymentDetails: paymentType === 'mobile' ? { mobileNumber } : (paymentType === 'bank' ? { bankLast4 } : {}),
        paymentDate: new Date().toISOString(),
        receivedBy: user?.name,
        status: 'paid'
      };
      
      const invoices = JSON.parse(localStorage.getItem('lab_invoices') || '[]');
      invoices.push(invoice);
      localStorage.setItem('lab_invoices', JSON.stringify(invoices));
      
      setCurrentInvoice(invoice);
      setShowPaymentModal(false);
      setShowInvoiceModal(true);
      
      toast.success(`Payment of $${totalAmount.toFixed(2)} processed successfully!${discountAmount > 0 ? ` (Saved $${discountAmount.toFixed(2)})` : ''}`);
      
      fetchData();
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment: ' + error.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    const logoBase64 = logo;
    const currentDate = new Date().toLocaleDateString('en-GB');
    const refNo = `#${Math.floor(Math.random() * 100000)}`;
    
    const hasDiscount = currentInvoice.discountAmount > 0;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REYS CLINIC - Lab Test Payment Receipt</title>
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
              color: #7c3aed;
            }
            .qr-placeholder {
              width: 50px;
              height: 50px;
              background: linear-gradient(45deg, #333 25%, transparent 25%), 
                          linear-gradient(-45deg, #333 25%, transparent 25%);
              background-size: 8px 8px;
              background-color: #f0f0f0;
              border: 1px solid #999;
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
            
            .tests-list {
              margin-top: 10px;
              padding: 8px;
              background: #f9f9f9;
              border-radius: 4px;
            }
            .test-item {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              padding: 4px 0;
              border-bottom: 1px dotted #ddd;
            }
            .test-item:last-child {
              border-bottom: none;
            }
            .test-name {
              font-weight: normal;
            }
            .test-price {
              font-weight: bold;
              color: #2e7d32;
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
            .discount-row td {
              color: #059669;
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
            
            .lab-note {
              background: #f3e8ff;
              padding: 12px;
              border-radius: 8px;
              margin-top: 15px;
              text-align: center;
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
                <div class="receipt-title">LABORATORY RECEIPT</div>
                <div class="qr-placeholder"></div>
              </div>
              
              <div class="info-bordered">
                <div class="info-row-double">
                  <span class="info-label-double">RECEIPT NO:</span>
                  <span class="info-value-double">${currentInvoice.invoiceId}</span>
                </div>
                <div class="info-row-double">
                  <span class="info-label-double">PRINT DATE:</span>
                  <span class="info-value-double">${currentDate}</span>
                </div>
                <div class="info-row-double">
                  <span class="info-label-double">PAYMENT DATE:</span>
                  <span class="info-value-double">${new Date(currentInvoice.paymentDate).toLocaleDateString('en-GB')}</span>
                </div>
              </div>
              
              <div class="patient-box">
                <div class="patient-row">
                  <span class="patient-label">PATIENT ID:</span>
                  <span class="patient-value">${currentInvoice.ticketId || `PAT-${currentInvoice.patientId?.slice(-6) || Date.now()}`}</span>
                </div>
                <div class="patient-row">
                  <span class="patient-label">PATIENT NAME:</span>
                  <span class="patient-value">${currentInvoice.patientName}</span>
                </div>
                <div class="patient-row">
                  <span class="patient-label">AGE:</span>
                  <span class="patient-value">${currentInvoice.childAge || 'N/A'} years</span>
                </div>
                <div class="patient-row">
                  <span class="patient-label">PARENT/GUARDIAN:</span>
                  <span class="patient-value">${currentInvoice.parentName}</span>
                </div>
                <div class="patient-row">
                  <span class="patient-label">PHONE:</span>
                  <span class="patient-value">${currentInvoice.phone}</span>
                </div>
              </div>
              
              <div class="tests-list">
                <div style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">LAB TESTS PAID:</div>
                ${currentInvoice.labTests.map(test => `
                  <div class="test-item">
                    <span class="test-name">🧪 ${test.name}</span>
                    <span class="test-price">$${test.price || 0}</span>
                  </div>
                `).join('')}
              </div>
              
              <div class="amount-section">
                <table class="amount-table">
                  <tr>
                    <td>SUBTOTAL:</td>
                    <td>$${currentInvoice.subtotal.toFixed(2)}</td>
                  </tr>
                  ${currentInvoice.discountAmount > 0 ? `
                    <tr class="discount-row">
                      <td>DISCOUNT (${currentInvoice.discountType === 'percentage' ? `${currentInvoice.discountValue}%` : 'Fixed'}):</td>
                      <td>-$${currentInvoice.discountAmount.toFixed(2)}</td>
                    </tr>
                    ${currentInvoice.discountReason ? `
                      <tr class="discount-row">
                        <td colspan="2" style="font-size: 10px; color: #666;">Reason: ${currentInvoice.discountReason}</td>
                      </tr>
                    ` : ''}
                  ` : ''}
                  <tr class="total-row">
                    <td>TOTAL PAID:</td>
                    <td>$${currentInvoice.total.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
             
              
              <div class="signature">
                <p style="margin-top: 10px;">___________________________</p>
                <p style="font-size: 10px;">Authorized Signature</p>
              </div>
              
              <div class="footer">
                <p>** THIS IS A COMPUTER GENERATED RECEIPT **</p>
                <p>Thank you for choosing REYS CLINIC Laboratory Services</p>
                <p>-----------------------------------END OF RECEIPT------------------------------------------</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadInvoice = () => {
    const invoiceData = currentInvoice;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Receipt #,Patient Name,Parent Name,Phone,Subtotal,Discount,Total,Payment Method,Date\n"
      + `${invoiceData.invoiceId},${invoiceData.patientName},${invoiceData.parentName},${invoiceData.phone},$${invoiceData.subtotal.toFixed(2)},$${invoiceData.discountAmount.toFixed(2)},$${invoiceData.total.toFixed(2)},${invoiceData.paymentMethod},${new Date(invoiceData.paymentDate).toLocaleDateString()}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lab_receipt_${invoiceData.ticketId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Receipt downloaded');
  };

  const filteredPatients = patients.filter(patient =>
    patient.childName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.ticketId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
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
              <button onClick={() => navigate('/reception-dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <img src={logo} alt="REYS CLINIC Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                  <p className="text-xs text-gray-500">Lab Test Payment</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FlaskConical className="w-4 h-4 text-purple-600" />
              <span>Pay for Lab Tests</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedPatient ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Lab Test Payments</h1>
              <p className="text-white/90">Select a patient to pay for lab tests requested by the doctor</p>
            </div>
            
            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, parent name, or ticket ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12">
                  <FlaskConical className="w-16 h-16 mx-auto text-purple-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No pending lab test payments</h3>
                  <p className="text-gray-500">All lab test payments have been processed</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredPatients.map((patient) => (
                    <div key={patient._id} className="border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectPatient(patient)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <Baby className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{patient.childName}</h3>
                            <p className="text-sm text-gray-500">Age: {patient.childAge} years</p>
                            <p className="text-sm text-gray-500">Parent: {patient.parentName}</p>
                            <p className="text-xs text-gray-400">Ticket: {patient.ticketId}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                {patient.labTestsRequested.length} Lab Test(s)
                              </span>
                            </div>
                            <p className="text-xs text-purple-600 font-semibold mt-1">Amount Due: ${patient.totalLabAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
                            Pay Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Lab Test Payment</h2>
                      <p className="text-white/90">Complete payment for lab tests requested by the doctor</p>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} className="text-white hover:bg-white/20 rounded-lg p-2">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-sm text-gray-500">Patient Name</p><p className="font-semibold">{selectedPatient.childName}</p></div>
                      <div><p className="text-sm text-gray-500">Age</p><p>{selectedPatient.childAge} years</p></div>
                      <div><p className="text-sm text-gray-500">Parent/Guardian</p><p>{selectedPatient.parentName}</p></div>
                      <div><p className="text-sm text-gray-500">Phone</p><p>{selectedPatient.parentPhone}</p></div>
                      <div><p className="text-sm text-gray-500">Ticket ID</p><p className="font-mono text-sm">{selectedPatient.ticketId}</p></div>
                    </div>
                  </div>
                  
                  {/* Lab Tests to be paid */}
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <FlaskConical className="w-4 h-4 text-purple-600" />
                      <span>Lab Tests Requested by Doctor</span>
                    </h3>
                    
                    {labTests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-xl">
                        <FlaskConical className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No lab tests found for this patient</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {labTests.map((test, idx) => (
                          <div key={idx} className="border rounded-xl p-4 hover:bg-purple-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <FlaskConical className="w-4 h-4 text-purple-600" />
                                  <h4 className="font-semibold text-gray-900">{test.name}</h4>
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{test.category || 'General'}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Requested by: {test.requestedBy || 'Doctor'}</p>
                                {test.notes && <p className="text-xs text-gray-500 mt-1">Notes: {test.notes}</p>}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-purple-600">${test.price || 0}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Info about lab process */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-800">Important Information</p>
                        <p className="text-xs text-blue-600 mt-1">
                          After payment, lab test requests will be sent to the laboratory for processing.
                          The patient will receive a receipt and can proceed to the lab for sample collection.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24">
                <div className="bg-gray-800 p-6 text-white">
                  <h3 className="text-lg font-bold flex items-center space-x-2">
                    <Receipt className="w-5 h-5" />
                    <span>Payment Summary</span>
                  </h3>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Number of Lab Tests</span>
                      <span className="font-semibold">{labTests.length}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    
                    {/* Discount Section */}
                    <div className="py-2 border-b">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Discount</span>
                        {!showDiscountInput ? (
                          <button 
                            onClick={() => setShowDiscountInput(true)}
                            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3" />
                            Add Discount
                          </button>
                        ) : (
                          <button 
                            onClick={() => resetDiscount()}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      {showDiscountInput && (
                        <div className="mt-2 space-y-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDiscountType('percentage')}
                              className={`flex-1 px-3 py-1.5 text-sm rounded-lg border ${discountType === 'percentage' ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 hover:bg-gray-50'}`}
                            >
                              <Percent className="w-3 h-3 inline mr-1" />
                              %
                            </button>
                            <button
                              onClick={() => setDiscountType('fixed')}
                              className={`flex-1 px-3 py-1.5 text-sm rounded-lg border ${discountType === 'fixed' ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 hover:bg-gray-50'}`}
                            >
                              <DollarSign className="w-3 h-3 inline mr-1" />
                              Fixed
                            </button>
                          </div>
                          
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step={discountType === 'percentage' ? "1" : "0.01"}
                              min="0"
                              max={discountType === 'percentage' ? "100" : calculateSubtotal()}
                              value={discountValue}
                              onChange={(e) => setDiscountValue(e.target.value)}
                              placeholder={discountType === 'percentage' ? "Enter %" : "Enter amount"}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                            />
                            <button
                              onClick={applyDiscount}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                            >
                              Apply
                            </button>
                          </div>
                          
                          <input
                            type="text"
                            value={discountReason}
                            onChange={(e) => setDiscountReason(e.target.value)}
                            placeholder="Reason for discount (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                      )}
                      
                      {calculateDiscountAmount() > 0 && (
                        <div className="mt-2 text-right text-green-600 text-sm font-semibold">
                          -${calculateDiscountAmount().toFixed(2)} ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'})
                          {discountReason && <span className="text-gray-500 text-xs ml-1">- {discountReason}</span>}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between py-3">
                      <span className="text-lg font-bold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-purple-600">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <button onClick={handleProcessPayment} disabled={labTests.length === 0} className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Pay for Lab Tests</span>
                  </button>
                  
                  <button onClick={() => setSelectedPatient(null)} className="w-full mt-3 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Lab Test Payment</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600">Total Amount for Lab Tests</p>
                <p className="text-3xl font-bold text-purple-600">${calculateTotal().toFixed(2)}</p>
                {calculateDiscountAmount() > 0 && (
                  <p className="text-sm text-green-600 mt-1">Discount applied: -${calculateDiscountAmount().toFixed(2)}</p>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Payment Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => { setPaymentType('cash'); setMobileNumber(''); setBankLast4(''); }} className={`p-3 border rounded-xl flex flex-col items-center justify-center space-y-1 ${paymentType === 'cash' ? 'border-purple-600 bg-purple-50' : 'border-gray-300'}`}>
                    <DollarSign className="w-5 h-5" /><span className="text-sm">Cash</span>
                  </button>
                  <button onClick={() => { setPaymentType('mobile'); setBankLast4(''); if (selectedPatient?.parentPhone) setMobileNumber(selectedPatient.parentPhone); }} className={`p-3 border rounded-xl flex flex-col items-center justify-center space-y-1 ${paymentType === 'mobile' ? 'border-purple-600 bg-purple-50' : 'border-gray-300'}`}>
                    <Smartphone className="w-5 h-5" /><span className="text-sm">Mobile</span>
                  </button>
                  <button onClick={() => { setPaymentType('bank'); setMobileNumber(''); }} className={`p-3 border rounded-xl flex flex-col items-center justify-center space-y-1 ${paymentType === 'bank' ? 'border-purple-600 bg-purple-50' : 'border-gray-300'}`}>
                    <Building2 className="w-5 h-5" /><span className="text-sm">Bank</span>
                  </button>
                </div>
              </div>
              
              {paymentType === 'mobile' && (
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="Enter mobile number" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600" />
                  </div>
                </div>
              )}
              
              {paymentType === 'bank' && (
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Bank Card Last 4 Digits</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" value={bankLast4} onChange={(e) => setBankLast4(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="Enter last 4 digits" maxLength="4" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600" />
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={confirmPayment} disabled={processingPayment || (paymentType === 'mobile' && !mobileNumber) || (paymentType === 'bank' && !bankLast4)} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2">
                  {processingPayment ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  <span>Pay Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && currentInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Lab Test Payment Receipt</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <img src={logo} alt="REYS CLINIC" className="h-16 w-auto object-contain" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">REYS CLINIC</h2>
                <p className="text-gray-500">Wadada Sodonka, NBC, Albarako, Mogadishu, Somalia</p>
                <p className="text-gray-500">Tel: 612674455 | 611477201</p>
                <h3 className="text-xl font-bold mt-4 text-purple-600">LABORATORY PAYMENT RECEIPT</h3>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Receipt #:</span> <strong>{currentInvoice.invoiceId}</strong></div>
                  <div><span className="text-gray-500">Date:</span> {new Date(currentInvoice.paymentDate).toLocaleDateString()}</div>
                  <div><span className="text-gray-500">Patient Name:</span> {currentInvoice.patientName}</div>
                  <div><span className="text-gray-500">Age:</span> {currentInvoice.childAge || 'N/A'} years</div>
                  <div><span className="text-gray-500">Parent/Guardian:</span> {currentInvoice.parentName}</div>
                  <div><span className="text-gray-500">Phone:</span> {currentInvoice.phone}</div>
                  <div><span className="text-gray-500">Ticket ID:</span> {currentInvoice.ticketId}</div>
                </div>
              </div>
              
              <h4 className="font-semibold mb-2 flex items-center space-x-2"><FlaskConical className="w-4 h-4 text-purple-600" /><span>Lab Tests Paid</span></h4>
              <table className="w-full mb-6">
                <thead className="bg-gray-50">
                  <tr><th className="px-4 py-2 text-left text-sm font-semibold">Test Name</th><th className="px-4 py-2 text-left text-sm font-semibold">Category</th><th className="px-4 py-2 text-right text-sm font-semibold">Price</th></tr>
                </thead>
                <tbody>
                  {currentInvoice.labTests.map((test, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2 text-sm">🧪 {test.name}</td>
                      <td className="px-4 py-2 text-sm">{test.category || 'General'}</td>
                      <td className="px-4 py-2 text-right text-sm">${test.price || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="border-t pt-4 text-right">
                <p className="text-sm">Subtotal: ${currentInvoice.subtotal?.toFixed(2) || currentInvoice.total.toFixed(2)}</p>
                {currentInvoice.discountAmount > 0 && (
                  <>
                    <p className="text-sm text-green-600">
                      Discount ({currentInvoice.discountType === 'percentage' ? `${currentInvoice.discountValue}%` : 'Fixed'}): 
                      -${currentInvoice.discountAmount.toFixed(2)}
                    </p>
                    {currentInvoice.discountReason && (
                      <p className="text-xs text-gray-500">Reason: {currentInvoice.discountReason}</p>
                    )}
                  </>
                )}
                <p className="text-lg font-bold text-purple-600 mt-2">Total Paid: ${currentInvoice.total.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> {currentInvoice.paymentMethod}</p>
                {currentInvoice.paymentMethod === 'Mobile Money' && <p><strong>Mobile Number:</strong> {currentInvoice.paymentDetails?.mobileNumber}</p>}
                {currentInvoice.paymentMethod === 'Bank Transfer' && <p><strong>Card Last 4:</strong> **** {currentInvoice.paymentDetails?.bankLast4}</p>}
                <p><strong>Received By:</strong> {currentInvoice.receivedBy || 'Receptionist'}</p>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-4 mt-4">
                <p className="text-sm text-purple-800 text-center">
                  ✅ Lab test requests have been sent to the laboratory.<br/>
                  Patient may proceed to the lab for sample collection.
                </p>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button onClick={handlePrintInvoice} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-gray-50">
                  <Printer className="w-4 h-4" /><span>Print Receipt</span>
                </button>
                <button onClick={handleDownloadInvoice} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-gray-50">
                  <Download className="w-4 h-4" /><span>Download</span>
                </button>
                <button onClick={() => { setShowInvoiceModal(false); setSelectedPatient(null); setLabTests([]); resetDiscount(); }} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientCheckout;