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
  FlaskConical
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
  };

  // Calculate total lab tests amount
  const calculateTotal = () => {
    return labTests.reduce((sum, test) => sum + (test.price || 0), 0);
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
    const totalAmount = calculateTotal();
    
    // SAVE TO DATABASE - This is the key fix
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
      parentName: selectedPatient.parentName,
      phone: selectedPatient.parentPhone,
      ticketId: selectedPatient.ticketId,
      labTests: allLabTests,
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
    
    toast.success(`Payment of $${totalAmount} processed successfully!`);
    
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
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REYS CLINIC - Lab Test Invoice</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', Arial, sans-serif; background: #fff; padding: 40px; }
            .invoice { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; background: #fff; }
            .header { text-align: center; padding: 30px; border-bottom: 2px solid #7c3aed; }
            .logo-img { max-width: 150px; height: auto; margin-bottom: 10px; }
            .clinic-name { font-size: 24px; font-weight: bold; color: #7c3aed; margin-bottom: 5px; }
            .clinic-address { font-size: 12px; color: #666; }
            .info-section { padding: 20px 30px; background: #f9f9f9; }
            .info-row { display: flex; margin-bottom: 8px; }
            .info-label { width: 150px; font-weight: bold; }
            .info-value { flex: 1; }
            .divider { border-top: 1px dashed #999; margin: 15px 0; }
            .test-section { padding: 20px 30px; }
            .test-title { font-size: 16px; font-weight: bold; color: #7c3aed; margin-bottom: 15px; border-left: 4px solid #7c3aed; padding-left: 10px; }
            .test-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .test-table th, .test-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .test-table th { background: #f5f5f5; font-weight: bold; }
            .footer { text-align: center; padding: 20px; font-size: 11px; color: #999; border-top: 1px solid #ddd; }
            .total { font-size: 18px; font-weight: bold; color: #7c3aed; margin-top: 15px; padding-top: 10px; border-top: 2px solid #7c3aed; text-align: right; }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <div class="clinic-name">REYS CLINIC</div>
              <div class="clinic-address">Wadad Sodonka, NBC, Albarako, Mogadishu, Somalia</div>
              <div>Laboratory Services Payment Receipt</div>
            </div>
            <div class="info-section">
              <div class="info-row"><div class="info-label">Invoice No:</div><div class="info-value">${currentInvoice.invoiceId}</div><div class="info-label" style="margin-left: 30px;">Date:</div><div class="info-value">${new Date().toLocaleDateString()}</div></div>
              <div class="info-row"><div class="info-label">Patient Name:</div><div class="info-value">${currentInvoice.patientName}</div><div class="info-label" style="margin-left: 30px;">Age:</div><div class="info-value">${currentInvoice.patientAge || selectedPatient?.childAge || 'N/A'} years</div></div>
              <div class="info-row"><div class="info-label">Parent/Guardian:</div><div class="info-value">${currentInvoice.parentName}</div><div class="info-label" style="margin-left: 30px;">Phone:</div><div class="info-value">${currentInvoice.phone}</div></div>
              <div class="info-row"><div class="info-label">Ticket ID:</div><div class="info-value">${currentInvoice.ticketId}</div></div>
            </div>
            <div class="test-section">
              <div class="test-title">LAB TESTS PAID</div>
              <table class="test-table">
                <thead>
                  <tr><th>Test Name</th><th>Category</th><th>Price</th></tr>
                </thead>
                <tbody>
                  ${currentInvoice.labTests.map(test => `
                    <tr>
                      <td>🧪 ${test.name}</td>
                      <td>${test.category || 'General'}</td>
                      <td>$${test.price || 0}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="total">Total Paid: $${currentInvoice.total}</div>
              <div class="info-row" style="margin-top: 20px;"><div class="info-label">Payment Method:</div><div class="info-value">${currentInvoice.paymentMethod}</div></div>
              ${currentInvoice.paymentMethod === 'Mobile Money' ? `<div class="info-row"><div class="info-label">Mobile Number:</div><div class="info-value">${currentInvoice.paymentDetails?.mobileNumber}</div></div>` : ''}
              ${currentInvoice.paymentMethod === 'Bank Transfer' ? `<div class="info-row"><div class="info-label">Card Last 4:</div><div class="info-value">**** ${currentInvoice.paymentDetails?.bankLast4}</div></div>` : ''}
              <div class="info-row"><div class="info-label">Received By:</div><div class="info-value">${currentInvoice.receivedBy}</div></div>
            </div>
            <div class="footer">
              <p>Thank you for choosing REYS CLINIC Laboratory Services</p>
              <p>Lab tests have been sent to the laboratory for processing</p>
              <p>-----------------------------------END OF RECEIPT------------------------------------------</p>
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
      + "Invoice #,Patient Name,Parent Name,Phone,Total,Payment Method,Date\n"
      + `${invoiceData.invoiceId},${invoiceData.patientName},${invoiceData.parentName},${invoiceData.phone},$${invoiceData.total.toFixed(2)},${invoiceData.paymentMethod},${new Date().toLocaleDateString()}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lab_invoice_${invoiceData.ticketId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Invoice downloaded');
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
                      <span className="text-gray-600">Lab Tests Total</span>
                      <span className="font-semibold">${labTests.reduce((sum, t) => sum + (t.price || 0), 0).toFixed(2)}</span>
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
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                    <FlaskConical className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">REYS CLINIC</h2>
                <p className="text-gray-500">Wadad Sodonka, NBC, Albarako, Mogadishu, Somalia</p>
                <p className="text-gray-500">Laboratory Services</p>
                <h3 className="text-xl font-bold mt-4">PAYMENT RECEIPT</h3>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Receipt #:</span> <strong>{currentInvoice.invoiceId}</strong></div>
                  <div><span className="text-gray-500">Date:</span> {new Date().toLocaleDateString()}</div>
                  <div><span className="text-gray-500">Patient:</span> {currentInvoice.patientName}</div>
                  <div><span className="text-gray-500">Parent:</span> {currentInvoice.parentName}</div>
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
                      <td className="px-4 py-2 text-sm">{test.name}</td>
                      <td className="px-4 py-2 text-sm">{test.category || 'General'}</td>
                      <td className="px-4 py-2 text-right text-sm">${test.price || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="border-t pt-4 text-right">
                <p className="text-lg font-bold text-purple-600">Total Paid: ${currentInvoice.total.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> {currentInvoice.paymentMethod}</p>
                {currentInvoice.paymentMethod === 'Mobile Money' && <p><strong>Mobile Number:</strong> {currentInvoice.paymentDetails?.mobileNumber}</p>}
                {currentInvoice.paymentMethod === 'Bank Transfer' && <p><strong>Card Last 4:</strong> **** {currentInvoice.paymentDetails?.bankLast4}</p>}
                <p><strong>Received By:</strong> {currentInvoice.receivedBy}</p>
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
                <button onClick={() => { setShowInvoiceModal(false); setSelectedPatient(null); setLabTests([]); }} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">
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

// const confirmPayment = async () => {
