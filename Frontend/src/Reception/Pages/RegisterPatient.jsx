import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Baby, User, Phone, Mail, MapPin, Heart, 
  CheckCircle, X, Loader, Send, Stethoscope, Microscope, 
  Search, Edit, DollarSign, CreditCard, AlertCircle, 
  Users, ClipboardList, TestTube, Package, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

// Helper function to generate sequential patient ID - SAME FOR BOTH DOCTOR AND LAB
const generatePatientId = () => {
  // Get the last patient ID from localStorage
  const lastPatientId = localStorage.getItem('lastPatientId') || '0';
  const nextNumber = parseInt(lastPatientId) + 1;
  localStorage.setItem('lastPatientId', nextNumber.toString());
  // Format as P-XXXXX (P followed by 5 digits)
  return `P-${nextNumber.toString().padStart(5, '0')}`;
};

const RegisterPatient = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [labTechs, setLabTechs] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingLabTechs, setLoadingLabTechs] = useState(false);
  const [loadingLabTests, setLoadingLabTests] = useState(false);
  const [labTestSearchTerm, setLabTestSearchTerm] = useState('');
  const [showEditFeeModal, setShowEditFeeModal] = useState(false);
  const [tempFee, setTempFee] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [doctorTicketFee, setDoctorTicketFee] = useState(5);
  
  const [formData, setFormData] = useState({
    childName: '',
    childAge: '',
    childGender: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentAddress: '',
    referredTo: '',
    assignedDoctor: '',
    assignedLabTech: '',
    selectedLabTests: [],
    labTestNotes: '',
    visitReason: '',
    previousVisits: 'no',
    urgency: 'normal',
    paymentStatus: 'pending',
    paidAmount: 0,
    paymentMethod: 'cash',
    paymentDate: null,
    isFollowUp: false,
    previousConsultationId: '',
    followUpReason: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (user?.role !== 'reception' && user?.role !== 'superadmin') {
      navigate('/');
      return;
    }
    if (localStorage.getItem('lastPatientId')) {
      console.log('Removing legacy patient ID counter from localStorage');
      localStorage.removeItem('lastPatientId');
    }
        if (localStorage.getItem('patientIdCounter')) {
      localStorage.removeItem('patientIdCounter');
    }
    if (localStorage.getItem('nextPatientNumber')) {
      localStorage.removeItem('nextPatientNumber');
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'reception' || user?.role === 'superadmin')) {
      fetchDoctors();
      fetchLabTechs();
      fetchLabTests();
    }
  }, [isAuthenticated, user]);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/doctors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setDoctors(data.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchLabTechs = async () => {
    setLoadingLabTechs(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/lab-techs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setLabTechs(data.data);
    } catch (error) {
      console.error('Error fetching lab technicians:', error);
    } finally {
      setLoadingLabTechs(false);
    }
  };

  const fetchLabTests = async () => {
    setLoadingLabTests(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/lab-tests?isActive=true`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setLabTests(data.data);
      } else {
        console.error('Failed to load lab tests:', data.msg);
        toast.error(data.msg || 'Failed to load lab tests');
        setLabTests([]);
      }
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      toast.error('Failed to load lab tests');
      setLabTests([]);
    } finally {
      setLoadingLabTests(false);
    }
  };

  const departments = [
    { 
      id: 'doctor', 
      name: 'Doctor Consultation', 
      icon: <Stethoscope className="w-8 h-8" />, 
      description: 'General medical consultation, diagnosis, and treatment',
      color: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600'
    },
    { 
      id: 'lab-tech', 
      name: 'Laboratory Services', 
      icon: <Microscope className="w-8 h-8" />, 
      description: 'Blood tests, urine tests, lab analysis, and diagnostics',
      color: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleLabTestToggle = (testId) => {
    setFormData(prev => {
      const selected = prev.selectedLabTests.includes(testId)
        ? prev.selectedLabTests.filter(id => id !== testId)
        : [...prev.selectedLabTests, testId];
      return { ...prev, selectedLabTests: selected };
    });
  };

  const getSelectedTestsDetails = () => {
    return labTests.filter(test => formData.selectedLabTests.includes(test._id));
  };

  const calculateTotalFee = () => {
    if (selectedDepartment === 'doctor') {
      return doctorTicketFee;
    }
    if (selectedDepartment === 'lab-tech') {
      return getSelectedTestsDetails().reduce((sum, t) => sum + (t.price || 0), 0);
    }
    return 0;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.childName) newErrors.childName = 'Child name is required';
    if (!formData.childAge) newErrors.childAge = 'Child age is required';
    else if (isNaN(formData.childAge) || formData.childAge < 0 || formData.childAge > 18) 
      newErrors.childAge = 'Please enter a valid age (0-18 years)';
    
    if (!formData.parentName) newErrors.parentName = 'Parent/Guardian name is required';
    if (!formData.parentPhone) newErrors.parentPhone = 'Phone number is required';
    else if (!/^[0-9+\-\s]{8,15}$/.test(formData.parentPhone)) 
      newErrors.parentPhone = 'Please enter a valid phone number';
    
    if (!formData.referredTo) newErrors.referredTo = 'Please select a department';
    
    if (formData.referredTo === 'doctor') {
      if (!formData.assignedDoctor) newErrors.assignedDoctor = 'Please assign a doctor';
      if (!formData.visitReason) newErrors.visitReason = 'Reason for visit is required';
    }
    
    if (formData.referredTo === 'lab-tech') {
      if (!formData.assignedLabTech) newErrors.assignedLabTech = 'Please assign a lab technician';
      if (formData.selectedLabTests.length === 0) newErrors.selectedLabTests = 'Please select at least one lab test';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDepartmentSelect = (deptId) => {
    setFormData(prev => ({ 
      ...prev, 
      referredTo: deptId, 
      assignedDoctor: '',
      assignedLabTech: '',
      selectedLabTests: [],
      visitReason: '',
      labTestNotes: '',
      paymentStatus: 'pending',
      paidAmount: 0,
      isFollowUp: false,
      previousConsultationId: '',
      followUpReason: ''
    }));
    setSelectedDepartment(deptId);
  };

  const handleEditFee = () => {
    setTempFee(doctorTicketFee.toString());
    setShowEditFeeModal(true);
  };

  const confirmEditFee = () => {
    const newFee = parseFloat(tempFee);
    if (isNaN(newFee) || newFee < 0) {
      toast.error('Please enter a valid fee amount');
      return;
    }
    setDoctorTicketFee(newFee);
    setShowEditFeeModal(false);
    toast.success(`Doctor consultation fee updated to $${newFee}`);
  };

  const handleProcessPayment = () => {
    const total = calculateTotalFee();
    if (total > 0) {
      setPaymentAmount(total.toString());
      setShowPaymentModal(true);
    } else {
      toast.error('Please select tests or check fee amount');
    }
  };

  const confirmPayment = async () => {
    const totalAmount = calculateTotalFee();
    const paidAmount = parseFloat(paymentAmount);
    
    if (!paidAmount || paidAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    
    if (paidAmount < totalAmount) {
      toast.error(`Insufficient payment. Total is $${totalAmount.toFixed(2)}`);
      return;
    }
    
    setProcessingPayment(true);
    setFormData(prev => ({
      ...prev,
      paymentStatus: 'paid',
      paidAmount: totalAmount,
      paymentMethod: paymentMethod,
      paymentDate: new Date().toISOString()
    }));
    
    setShowPaymentModal(false);
    await handleSubmit(true);
    setProcessingPayment(false);
  };

  const handleSubmit = async (isPaid = false) => {
  if (!validateForm()) return;
  
  setLoading(true);
  
  try {
    const token = localStorage.getItem('token');
    // REMOVED: patientIdNumber generation - let backend handle it
    
    // Calculate total fee based on department
    let totalFee = 0;
    let labTestDetails = [];
    let labTestNames = [];
    
    if (selectedDepartment === 'doctor') {
      totalFee = doctorTicketFee;
    } else if (selectedDepartment === 'lab-tech') {
      labTestDetails = labTests.filter(test => formData.selectedLabTests.includes(test._id));
      totalFee = labTestDetails.reduce((sum, test) => sum + (test.price || 0), 0);
      labTestNames = labTestDetails.map(test => test.name);
    }
    
    // Create payload WITHOUT patientId - backend will generate it
    const payload = {
      childName: formData.childName,
      childAge: parseInt(formData.childAge),
      childGender: formData.childGender,
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      parentEmail: formData.parentEmail,
      parentAddress: formData.parentAddress,
      referredTo: formData.referredTo,
      assignedDoctor: formData.assignedDoctor,
      assignedLabTech: formData.assignedLabTech,
      urgency: formData.urgency,
      paymentStatus: isPaid ? 'paid' : formData.paymentStatus,
      paidAmount: isPaid ? totalFee : formData.paidAmount,
      paymentMethod: isPaid ? paymentMethod : formData.paymentMethod,
      paymentDate: isPaid ? new Date().toISOString() : null,
      isFollowUp: formData.isFollowUp,
      previousConsultationId: formData.previousConsultationId,
      followUpReason: formData.followUpReason,
      status: formData.referredTo === 'doctor' ? 'pending' : 'pending',
      // DO NOT include patientId - let backend generate it
      ticketFee: totalFee // Store total fee
    };
    
    // Add doctor-specific fields
    if (formData.referredTo === 'doctor') {
      payload.visitReason = formData.visitReason;
      payload.previousVisits = formData.previousVisits;
    }
    
    // Add lab-specific fields
    if (formData.referredTo === 'lab-tech') {
      payload.selectedLabTests = formData.selectedLabTests;
      payload.labTestNotes = formData.labTestNotes;
      payload.labTestNames = labTestNames;
    }
    
    console.log('Sending payload:', payload);
    
    const response = await fetch(`${API_BASE_URL}/api/patients/register-direct`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }); 
    
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.msg || 'Failed to register patient');
    
    if (data.success) {
      // The backend will have generated the patientId (format: P-00001, P-00002, etc.)
      const patientData = { 
        ...data.data.patient, 
        // Remove any reference to generatedPatientId - use the one from backend
        calculatedTotalFee: totalFee,
        labTestDetails: labTestDetails,
        labTestNames: labTestNames
      };
      setRegisteredPatient(patientData);
      setShowConfirmation(true);
      
      if (isPaid) {
        toast.success(`Payment of $${totalFee.toFixed(2)} collected! Patient registered.`);
      } else {
        toast.success('Patient registered successfully!');
      }
      
      // Reset form
      setFormData({
        childName: '',
        childAge: '',
        childGender: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        parentAddress: '',
        referredTo: '',
        assignedDoctor: '',
        assignedLabTech: '',
        selectedLabTests: [],
        labTestNotes: '',
        visitReason: '',
        previousVisits: 'no',
        urgency: 'normal',
        paymentStatus: 'pending',
        paidAmount: 0,
        paymentMethod: 'cash',
        paymentDate: null,
        isFollowUp: false,
        previousConsultationId: '',
        followUpReason: ''
      });
      setSelectedDepartment(null);
    }
  } catch (error) {
    console.error('Registration error:', error);
    toast.error(error.message || 'Failed to register patient');
  } finally {
    setLoading(false);
  }
};

  const handleNewRegistration = () => {
    setShowConfirmation(false);
    setRegisteredPatient(null);
    setSelectedDepartment(null);
  };

  const handlePrintReferral = () => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString('en-GB');
    const logoBase64 = logo;
    
    const assignedDoctorName = registeredPatient.assignedDoctor || 'Not Assigned';
    const assignedLabTechName = registeredPatient.assignedLabTech || 'Not Assigned';
    const shortTicketId = registeredPatient.generatedPatientId || registeredPatient.patientId || `P-${Math.floor(Math.random() * 100000)}`;
    const followUpStatus = registeredPatient.isFollowUp ? 'Yes' : 'No';
    const labTestsList = registeredPatient.labTestNames || [];
    
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
                <div class="info-row"><span class="info-label">Patient ID:</span><span class="info-value">${shortTicketId}</span></div>
                <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${currentDate}</span></div>
                <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${registeredPatient.childName}</span></div>
                <div class="info-row"><span class="info-label">Age:</span><span class="info-value">${registeredPatient.childAge} years</span></div>
                <div class="info-row"><span class="info-label">Sex:</span><span class="info-value">${registeredPatient.childGender || 'Not specified'}</span></div>
                <div class="info-row"><span class="info-label">Parent:</span><span class="info-value">${registeredPatient.parentName}</span></div>
                <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${registeredPatient.parentPhone}</span></div>
              </div>
              
              <div class="section-title">${registeredPatient.referredTo === 'doctor' ? 'DOCTOR REFERRAL' : 'LABORATORY REFERRAL'}</div>
              
              <div class="info-grid" style="margin-top: 0;">
                <div class="info-row"><span class="info-label">Assigned To:</span><span class="info-value">${registeredPatient.referredTo === 'doctor' ? ('Dr. ' + assignedDoctorName) : assignedLabTechName}</span></div>
                <div class="info-row"><span class="info-label">Urgency:</span><span class="info-value"><span class="badge ${registeredPatient.urgency === 'urgent' ? 'badge-urgent' : 'badge-normal'}">${registeredPatient.urgency === 'urgent' ? 'URGENT' : 'NORMAL'}</span></span></div>
                ${registeredPatient.referredTo === 'doctor' ? `
                  <div class="info-row"><span class="info-label">Reason:</span><span class="info-value">${registeredPatient.visitReason || 'N/A'}</span></div>
                  <div class="info-row"><span class="info-label">Follow-up:</span><span class="info-value">${followUpStatus}</span></div>
                ` : `
                  <div class="info-row"><span class="info-label">Tests:</span><span class="info-value">${labTestsList.length} test(s)</span></div>
                  <div class="info-row"><span class="info-label">Follow-up:</span><span class="info-value">${followUpStatus}</span></div>
                `}
                ${registeredPatient.referredTo === 'lab-tech' && labTestsList.length > 0 ? `
                  <div class="tests-list" style="grid-column: span 2;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Selected Tests:</div>
                    ${labTestsList.map(test => `<div class="test-item">• ${test}</div>`).join('')}
                  </div>
                ` : ''}
                ${registeredPatient.referredTo === 'lab-tech' && registeredPatient.labTestNotes ? `
                  <div class="info-row" style="grid-column: span 2;"><span class="info-label">Notes:</span><span class="info-value">${registeredPatient.labTestNotes}</span></div>
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

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString('en-GB');
    const logoBase64 = logo;
    const shortTicketId = registeredPatient.generatedPatientId || registeredPatient.patientId || `P-${Math.floor(Math.random() * 100000)}`;
    const refNo = `#${Math.floor(Math.random() * 100000)}`;
    
    // Get the paid amount - prioritize calculatedTotalFee for lab tests
    let paidAmount = registeredPatient.paidAmount || 0;
    
    // If paidAmount is 0 but this is a lab patient, try to get the total from ticketFee or calculatedTotalFee
    if (paidAmount === 0 && registeredPatient.referredTo === 'lab-tech') {
      paidAmount = registeredPatient.ticketFee || registeredPatient.calculatedTotalFee || 0;
    }
    
    // If still 0, calculate from lab test details if available
    if (paidAmount === 0 && registeredPatient.labTestDetails && registeredPatient.labTestDetails.length > 0) {
      paidAmount = registeredPatient.labTestDetails.reduce((sum, test) => sum + (test.price || 0), 0);
    }
    
    const labTestsList = registeredPatient.labTestNames || [];
    const labTestsDetails = registeredPatient.labTestDetails || [];
    
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
                <div class="qr-placeholder"></div>
              </div>
              
              <div class="info-bordered">
                <div class="info-row-double">
                  <span class="info-label-double">SERVICE TYPE:</span>
                  <span class="info-value-double">${registeredPatient.referredTo === 'doctor' ? 'DOCTOR CONSULTATION' : 'LABORATORY SERVICES'}</span>
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
                  <span class="patient-value">${shortTicketId}</span>
                </div>
                <div class="patient-row">
                  <span class="patient-label">PATIENT NAME:</span>
                  <span class="patient-value">${registeredPatient.childName}</span>
                </div>
                <div class="patient-row">
                  <span class="patient-label">PARENT/GUARDIAN:</span>
                  <span class="patient-value">${registeredPatient.parentName}</span>
                </div>
                <div class="patient-row">
                  <span class="patient-label">${registeredPatient.referredTo === 'doctor' ? 'DOCTOR:' : 'LAB TECHNICIAN:'}</span>
                  <span class="patient-value">${registeredPatient.referredTo === 'doctor' ? ('Dr. ' + (registeredPatient.assignedDoctor || 'N/A')) : (registeredPatient.assignedLabTech || 'N/A')}</span>
                </div>
              </div>
              
              ${registeredPatient.referredTo === 'lab-tech' && labTestsList.length > 0 ? `
              <div class="tests-list">
                <div style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">TESTS PERFORMED:</div>
                ${(labTestsDetails.length > 0 ? labTestsDetails : labTestsList.map((name, idx) => ({ name, price: 0 }))).map(test => `
                  <div class="test-item">
                    <span class="test-name">${typeof test === 'string' ? test : test.name}</span>
                    <span class="test-price">$${typeof test === 'string' ? '0' : (test.price || 0)}</span>
                  </div>
                `).join('')}
              </div>
              ` : ''}
              
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
                <p>Payment Method: ${registeredPatient.paymentMethod || paymentMethod || 'cash'}</p>
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

  if (!isAuthenticated || (user?.role !== 'reception' && user?.role !== 'superadmin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#D01A2B]" />
      </div>
    );
  }

  if (showConfirmation && registeredPatient) {
    const totalPaid = registeredPatient.paidAmount || registeredPatient.calculatedTotalFee || registeredPatient.ticketFee || 0;
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold">Patient Registered Successfully!</h2>
              <p className="text-white/90 mt-2">The patient has been sent to the {registeredPatient.referredTo === 'doctor' ? 'Doctor' : 'Laboratory'} department</p>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <User className="w-4 h-4 text-[#D01A2B]" />
                  <span>Patient Information</span>
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Patient ID:</span>
                    <span className="font-mono font-semibold">{registeredPatient.patientId}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-gray-500">Child Name:</span><span className="font-semibold">{registeredPatient.childName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Age:</span><span>{registeredPatient.childAge} years</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Sex:</span><span>{registeredPatient.childGender || 'Not specified'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Parent/Guardian:</span><span>{registeredPatient.parentName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phone:</span><span>{registeredPatient.parentPhone}</span></div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <Send className="w-4 h-4 text-[#D01A2B]" />
                  <span>Department Information</span>
                </h3>
                <div className={`rounded-xl p-4 ${registeredPatient.referredTo === 'doctor' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${registeredPatient.referredTo === 'doctor' ? 'bg-blue-200' : 'bg-purple-200'}`}>
                      {registeredPatient.referredTo === 'doctor' ? <Stethoscope className="w-6 h-6 text-blue-600" /> : <Microscope className="w-6 h-6 text-purple-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{registeredPatient.referredTo === 'doctor' ? 'Doctor Consultation' : 'Laboratory Services'}</p>
                      <p className="text-sm text-gray-500">Assigned: {registeredPatient.referredTo === 'doctor' ? ('Dr. ' + (registeredPatient.assignedDoctor || 'Pending')) : (registeredPatient.assignedLabTech || 'Pending')}</p>
                      <p className="text-sm text-gray-500 mt-1">Urgency: {registeredPatient.urgency === 'urgent' ? '⚠️ Urgent' : 'Normal'}</p>
                      <p className="text-sm text-gray-500">Follow-up: {registeredPatient.isFollowUp ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary - Always show since payment is taken before registration */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>Payment Summary</span>
                </h3>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold text-green-600">${totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-semibold">Status:</span>
                    <span className="font-semibold text-green-600">✓ Paid</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-semibold">Payment Method:</span>
                    <span className="font-semibold">{registeredPatient.paymentMethod || paymentMethod || 'cash'}</span>
                  </div>
                  {registeredPatient.referredTo === 'lab-tech' && registeredPatient.labTestNames && registeredPatient.labTestNames.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-green-200">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Tests Included:</p>
                      <div className="space-y-1">
                        {registeredPatient.labTestNames.map((test, idx) => (
                          <p key={idx} className="text-xs text-gray-600">• {test}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handlePrintReferral} 
                    className="flex-1 px-4 py-3 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <Printer className="w-5 h-5" />
                    <span>Print Referral Slip</span>
                  </button>
                  
                  <button 
                    onClick={handlePrintReceipt} 
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <Printer className="w-5 h-5" />
                    <span>Print Payment Receipt</span>
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleNewRegistration} 
                    className="flex-1 px-4 py-3 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Register New Patient</span>
                  </button>
                  <button 
                    onClick={() => navigate('/reception-dashboard')} 
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalFee = calculateTotalFee();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/reception-dashboard')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
              <div>
                <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                <p className="text-xs text-gray-500">Patient Registration</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500"><Heart className="w-4 h-4 text-[#D01A2B]" /><span>{user?.name} - Reception</span></div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#D01A2B] to-red-700 p-6 text-white text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Patient Registration</h1>
            <p className="text-white/90">Register a new patient and assign to department</p>
          </div>
          
          <div className="p-6 md:p-8">
            <form onSubmit={(e) => { e.preventDefault(); handleProcessPayment(); }} className="space-y-8">
              {/* Section 1: Select Department */}
              <div>
                <div className="flex items-center space-x-2 mb-4"><Send className="w-5 h-5 text-[#D01A2B]" /><h3 className="text-lg font-bold text-gray-900">Step 1: Send Patient To</h3></div>
                <div className="grid md:grid-cols-2 gap-6">
                  {departments.map((dept) => (
                    <button key={dept.id} type="button" onClick={() => handleDepartmentSelect(dept.id)} className={`p-6 rounded-xl border-2 transition-all text-left ${selectedDepartment === dept.id ? `${dept.borderColor} ${dept.color} ring-2 ring-[#D01A2B]/20` : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-start space-x-4">
                        <div className={`w-14 h-14 ${dept.color} rounded-xl flex items-center justify-center ${dept.textColor}`}>{dept.icon}</div>
                        <div className="flex-1"><h4 className="font-bold text-gray-900">{dept.name}</h4><p className="text-sm text-gray-500 mt-1">{dept.description}</p>{selectedDepartment === dept.id && <div className="mt-2 flex items-center text-green-600 text-sm"><CheckCircle className="w-4 h-4 mr-1" />Selected</div>}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.referredTo && <p className="text-red-500 text-sm mt-2">{errors.referredTo}</p>}
              </div>

              {selectedDepartment && (
                <>
                  <div className="border-t pt-6">
                    <div className="flex items-center space-x-2 mb-4"><Baby className="w-5 h-5 text-[#D01A2B]" /><h3 className="text-lg font-bold text-gray-900">Step 2: Child Information</h3></div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div><label className="block text-gray-700 font-semibold mb-2">Child's Full Name <span className="text-red-500">*</span></label><input type="text" name="childName" value={formData.childName} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${errors.childName ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter child's full name" />{errors.childName && <p className="text-red-500 text-sm mt-1">{errors.childName}</p>}</div>
                      <div><label className="block text-gray-700 font-semibold mb-2">Age (Years) <span className="text-red-500">*</span></label><input type="number" name="childAge" value={formData.childAge} onChange={handleInputChange} min="0" max="18" step="1" className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${errors.childAge ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., 5" />{errors.childAge && <p className="text-red-500 text-sm mt-1">{errors.childAge}</p>}</div>
                      <div><label className="block text-gray-700 font-semibold mb-2">Gender</label><select name="childGender" value={formData.childGender} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"><option value="">Select Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center space-x-2 mb-4"><Users className="w-5 h-5 text-[#D01A2B]" /><h3 className="text-lg font-bold text-gray-900">Step 3: Parent/Guardian Information</h3></div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div><label className="block text-gray-700 font-semibold mb-2">Parent/Guardian Name <span className="text-red-500">*</span></label><input type="text" name="parentName" value={formData.parentName} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${errors.parentName ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter parent/guardian name" />{errors.parentName && <p className="text-red-500 text-sm mt-1">{errors.parentName}</p>}</div>
                      <div><label className="block text-gray-700 font-semibold mb-2">Phone Number <span className="text-red-500">*</span></label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleInputChange} className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${errors.parentPhone ? 'border-red-500' : 'border-gray-300'}`} placeholder="+252 61 1477201" /></div>{errors.parentPhone && <p className="text-red-500 text-sm mt-1">{errors.parentPhone}</p>}</div>
                      <div><label className="block text-gray-700 font-semibold mb-2">Email Address (Optional)</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B]" placeholder="example@email.com" /></div></div>
                      <div><label className="block text-gray-700 font-semibold mb-2">Address (Optional)</label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name="parentAddress" value={formData.parentAddress} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B]" placeholder="Enter address" /></div></div>
                    </div>
                  </div>

                  {selectedDepartment === 'doctor' && (
                    <div className="border-t pt-6">
                      <div className="flex items-center space-x-2 mb-4"><ClipboardList className="w-5 h-5 text-[#D01A2B]" /><h3 className="text-lg font-bold text-gray-900">Step 4: Medical Information</h3></div>
                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="md:col-span-2"><label className="block text-gray-700 font-semibold mb-2">Reason for Visit <span className="text-red-500">*</span></label><textarea name="visitReason" value={formData.visitReason} onChange={handleInputChange} rows="2" className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${errors.visitReason ? 'border-red-500' : 'border-gray-300'}`} placeholder="Describe the main reason for the visit" />{errors.visitReason && <p className="text-red-500 text-sm mt-1">{errors.visitReason}</p>}</div>
                        <div><label className="block text-gray-700 font-semibold mb-2">Previous Visits</label><div className="flex space-x-4"><label className="flex items-center space-x-2"><input type="radio" name="previousVisits" value="yes" checked={formData.previousVisits === 'yes'} onChange={handleInputChange} className="text-[#D01A2B] focus:ring-[#D01A2B]" /><span>Yes</span></label><label className="flex items-center space-x-2"><input type="radio" name="previousVisits" value="no" checked={formData.previousVisits === 'no'} onChange={handleInputChange} className="text-[#D01A2B] focus:ring-[#D01A2B]" /><span>No</span></label></div></div>
                      </div>
                    </div>
                  )}

                  {selectedDepartment === 'lab-tech' && (
                    <div className="border-t pt-6">
                      <div className="flex items-center space-x-2 mb-4"><TestTube className="w-5 h-5 text-[#D01A2B]" /><h3 className="text-lg font-bold text-gray-900">Step 4: Lab Test Selection</h3></div>
                      
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">Select Lab Tests <span className="text-red-500">*</span></label>
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type="text" placeholder="Search lab tests by name..." value={labTestSearchTerm} onChange={(e) => setLabTestSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B] text-sm" />
                          {labTestSearchTerm && <button type="button" onClick={() => setLabTestSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>}
                        </div>
                        
                        {loadingLabTests ? (
                          <div className="flex justify-center py-8"><Loader className="w-8 h-8 animate-spin text-[#D01A2B]" /></div>
                        ) : (
                          <div className="max-h-96 overflow-y-auto border rounded-xl p-3 bg-gray-50">
                            {labTests.filter(test => test.name.toLowerCase().includes(labTestSearchTerm.toLowerCase())).map((test) => (
                              <label key={test._id} className={`flex items-center p-2 mb-1 rounded-lg border cursor-pointer transition-all ${formData.selectedLabTests.includes(test._id) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-300'}`}>
                                <input type="checkbox" checked={formData.selectedLabTests.includes(test._id)} onChange={() => handleLabTestToggle(test._id)} className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
                                <div className="ml-2 flex-1"><p className="text-sm font-medium text-gray-800">{test.name}</p><p className="text-xs text-gray-500">{test.category}</p></div>
                                <p className="text-sm font-semibold text-green-600">${test.price}</p>
                              </label>
                            ))}
                            {labTests.filter(test => test.name.toLowerCase().includes(labTestSearchTerm.toLowerCase())).length === 0 && (
                              <div className="text-center py-8 text-gray-500"><TestTube className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p className="text-sm">No lab tests found</p></div>
                            )}
                          </div>
                        )}
                        {errors.selectedLabTests && <p className="text-red-500 text-sm mt-1">{errors.selectedLabTests}</p>}
                      </div>
                      
                      {formData.selectedLabTests.length > 0 && (
                        <div className="mt-4 p-4 bg-purple-50 rounded-xl">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Package className="w-4 h-4 text-purple-600" />Selected Tests ({formData.selectedLabTests.length})</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {getSelectedTestsDetails().map(test => (
                              <div key={test._id} className="flex justify-between items-center p-2 bg-white rounded-lg"><span className="text-sm">{test.name}</span><span className="text-sm font-semibold text-green-600">${test.price}</span></div>
                            ))}
                            <div className="border-t pt-2 mt-2"><div className="flex justify-between items-center font-bold"><span>Total</span><span className="text-[#D01A2B]">${getSelectedTestsDetails().reduce((sum, t) => sum + (t.price || 0), 0)}</span></div></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4"><label className="block text-gray-700 font-semibold mb-2">Lab Test Notes (Optional)</label><textarea name="labTestNotes" value={formData.labTestNotes} onChange={handleInputChange} rows="2" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B]" placeholder="Any specific instructions or notes for the lab technician" /></div>
                    </div>
                  )}

                  <div className="border-t pt-6">
                    <div className="flex items-center space-x-2 mb-4"><User className="w-5 h-5 text-[#D01A2B]" /><h3 className="text-lg font-bold text-gray-900">Step 5: Assignment & Urgency</h3></div>
                    <div className="grid md:grid-cols-2 gap-5">
                      {selectedDepartment === 'doctor' && (
                        <div>
                          <label className="block text-gray-700 font-semibold mb-2">Assign Doctor <span className="text-red-500">*</span></label>
                          <select name="assignedDoctor" value={formData.assignedDoctor} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${errors.assignedDoctor ? 'border-red-500' : 'border-gray-300'}`}>
                            <option value="">Select a doctor</option>
                            {loadingDoctors ? <option disabled>Loading doctors...</option> : doctors.map(doc => <option key={doc._id} value={doc.name}>Dr. {doc.name}</option>)}
                          </select>
                          {errors.assignedDoctor && <p className="text-red-500 text-sm mt-1">{errors.assignedDoctor}</p>}
                        </div>
                      )}
                      {selectedDepartment === 'lab-tech' && (
                        <div><label className="block text-gray-700 font-semibold mb-2">Assign Lab Technician <span className="text-red-500">*</span></label><select name="assignedLabTech" value={formData.assignedLabTech} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${errors.assignedLabTech ? 'border-red-500' : 'border-gray-300'}`}><option value="">Select a lab technician</option>{loadingLabTechs ? <option disabled>Loading lab technicians...</option> : labTechs.map(lab => <option key={lab._id} value={lab.name}>{lab.name}</option>)}</select>{errors.assignedLabTech && <p className="text-red-500 text-sm mt-1">{errors.assignedLabTech}</p>}</div>
                      )}
                      <div><label className="block text-gray-700 font-semibold mb-2">Urgency Level</label><select name="urgency" value={formData.urgency} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"><option value="normal">Normal</option><option value="urgent">Urgent</option></select></div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center space-x-2 mb-4"><History className="w-5 h-5 text-[#D01A2B]" /><h3 className="text-lg font-bold text-gray-900">Step 6: Follow-up Information</h3></div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="col-span-2">
                        <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <input type="checkbox" name="isFollowUp" checked={formData.isFollowUp} onChange={(e) => setFormData({...formData, isFollowUp: e.target.checked, previousConsultationId: '', followUpReason: ''})} className="w-5 h-5 text-[#D01A2B] rounded focus:ring-[#D01A2B]" />
                          <div><span className="font-semibold text-gray-700">This is a Follow-up Patient</span><p className="text-sm text-gray-500">Check this box if the patient is returning for a follow-up consultation</p></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2"><DollarSign className="w-5 h-5 text-[#D01A2B]" /><h3 className="text-lg font-bold text-gray-900">Payment Summary</h3></div>
                      {selectedDepartment === 'doctor' && (<button type="button" onClick={handleEditFee} className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"><Edit className="w-4 h-4" /><span>Edit Fee</span></button>)}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between mb-2"><span className="text-gray-600">{selectedDepartment === 'doctor' ? 'Doctor Consultation Fee:' : 'Total Lab Test Fees:'}</span><span className="text-xl font-bold text-[#D01A2B]">${totalFee.toFixed(2)}</span></div>
                      <p className="text-xs text-gray-500 mt-2">{selectedDepartment === 'doctor' ? 'Doctor consultation fee includes initial assessment.' : 'Lab test fees are for the selected tests.'}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-xl p-4 flex items-start space-x-3"><AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" /><div className="text-sm text-yellow-800"><p className="font-semibold mb-1">Important Notice:</p><p>The patient will be immediately registered and sent to the selected department.</p></div></div>

                  <button type="submit" disabled={loading || totalFee === 0} className="w-full py-4 bg-[#D01A2B] text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    {loading ? <><Loader className="w-5 h-5 animate-spin" /><span>Registering Patient...</span></> : <><CreditCard className="w-5 h-5" /><span>Register Patient & Pay ${totalFee.toFixed(2)}</span></>}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Edit Fee Modal */}
      {showEditFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><DollarSign className="w-8 h-8 text-blue-600" /></div><h3 className="text-xl font-bold text-gray-900 mb-2">Edit Consultation Fee</h3><p className="text-gray-500">Set the consultation fee for this patient</p></div>
            <div className="mb-4"><label className="block text-gray-700 font-semibold mb-2">Consultation Fee ($)</label><input type="number" step="0.01" value={tempFee} onChange={(e) => setTempFee(e.target.value)} placeholder="Enter fee amount" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]" autoFocus /></div>
            <div className="flex space-x-3"><button onClick={() => setShowEditFeeModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">Cancel</button><button onClick={confirmEditFee} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700">Update Fee</button></div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4"><div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"><DollarSign className="w-8 h-8 text-purple-600" /></div><h3 className="text-xl font-bold text-gray-900 mb-2">Complete Payment</h3><p className="text-gray-500">Please collect payment from patient</p></div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg"><div className="flex justify-between mb-2"><span className="text-gray-600">Total Amount:</span><span className="font-bold text-xl text-[#D01A2B]">${totalFee.toFixed(2)}</span></div></div>
            <div className="mb-4"><label className="block text-gray-700 font-semibold mb-2">Amount Received *</label><input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount received" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]" autoFocus />{paymentAmount && parseFloat(paymentAmount) > totalFee && <p className="text-sm text-green-600 mt-1">Change: ${(parseFloat(paymentAmount) - totalFee).toFixed(2)}</p>}{paymentAmount && parseFloat(paymentAmount) < totalFee && <p className="text-sm text-red-600 mt-1">Insufficient: ${(totalFee - parseFloat(paymentAmount)).toFixed(2)} remaining</p>}</div>
            <div className="mb-4"><label className="block text-gray-700 font-semibold mb-2">Payment Method</label><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setPaymentMethod('cash')} className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${paymentMethod === 'cash' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'}`}><DollarSign className="w-4 h-4" /><span>Cash</span></button><button type="button" onClick={() => setPaymentMethod('card')} className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${paymentMethod === 'card' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'}`}><CreditCard className="w-4 h-4" /><span>Card</span></button></div></div>
            <div className="flex space-x-3"><button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">Cancel</button><button onClick={confirmPayment} disabled={processingPayment} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2">{processingPayment ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}<span>Pay Now</span></button></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Icons
const Printer = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3h12v6"/><rect x="6" y="15" width="12" height="6" rx="2"/></svg>;

const UserPlus = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;

export default RegisterPatient;