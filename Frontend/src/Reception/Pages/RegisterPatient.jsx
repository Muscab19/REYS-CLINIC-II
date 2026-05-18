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
    childDob: '',
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
    symptoms: '',
    previousVisits: 'no',
    urgency: 'normal',
    notes: '',
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
      symptoms: '',
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
      handleSubmit();
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
    
    // Direct patient registration - NO APPOINTMENT CREATION
    const payload = {
      childName: formData.childName,
      childAge: parseInt(formData.childAge),
      childGender: formData.childGender,
      childDob: formData.childDob,
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      parentEmail: formData.parentEmail,
      parentAddress: formData.parentAddress,
      referredTo: formData.referredTo,
      assignedDoctor: formData.assignedDoctor,
      assignedLabTech: formData.assignedLabTech,
      urgency: formData.urgency,
      notes: formData.notes,
      paymentStatus: formData.paymentStatus,
      paidAmount: formData.paidAmount,
      paymentMethod: formData.paymentMethod,
      paymentDate: formData.paymentDate,
      isFollowUp: formData.isFollowUp,
      previousConsultationId: formData.previousConsultationId,
      followUpReason: formData.followUpReason,
      status: formData.referredTo === 'doctor' ? 'pending' : 'pending'
    };
    
    if (formData.referredTo === 'doctor') {
      payload.visitReason = formData.visitReason;
      payload.symptoms = formData.symptoms;
      payload.previousVisits = formData.previousVisits;
      payload.ticketFee = doctorTicketFee;
    }
    
    if (formData.referredTo === 'lab-tech') {
      payload.selectedLabTests = formData.selectedLabTests;
      payload.labTestNotes = formData.labTestNotes;
    }
    
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
      // If payment was collected for doctor consultation, mark it as paid
      if (isPaid && formData.referredTo === 'doctor' && doctorTicketFee > 0) {
        try {
          await fetch(`${API_BASE_URL}/api/patients/${data.data.patient._id}/pay-consultation`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              paymentMethod: formData.paymentMethod,
              paymentAmount: doctorTicketFee
            })
          });
        } catch (payError) {
          console.error('Error marking consultation as paid:', payError);
        }
      }
      
      setRegisteredPatient(data.data.patient);
      setShowConfirmation(true);
      
      if (isPaid) {
        toast.success(`Payment of $${calculateTotalFee()} collected! Patient registered.`);
      } else {
        toast.success('Patient registered successfully!');
      }
      
      // Reset form
      setFormData({
        childName: '',
        childAge: '',
        childGender: '',
        childDob: '',
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
        symptoms: '',
        previousVisits: 'no',
        urgency: 'normal',
        notes: '',
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

  const getSelectedTestsDetails = () => {
    return labTests.filter(test => formData.selectedLabTests.includes(test._id));
  };

  const handlePrintReceipt = () => {
  const printWindow = window.open('', '_blank');
  
  // Get the assigned doctor name properly
  const assignedDoctorName = registeredPatient.assignedDoctor || 
                             (registeredPatient.assignedDoctorId?.name) || 
                             formData.assignedDoctor || 
                             'Not Assigned';
  
  // Get the assigned lab tech name properly
  const assignedLabTechName = registeredPatient.assignedLabTech || 
                              (registeredPatient.assignedLabTechId?.name) || 
                              formData.assignedLabTech || 
                              'Not Assigned';
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>REYS CLINIC - Patient Registration Receipt</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Times New Roman', Arial, sans-serif; background: #fff; padding: 40px; }
          .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; background: #fff; }
          .header { text-align: center; padding: 30px; border-bottom: 2px solid #D01A2B; }
          .logo-img { max-width: 150px; height: auto; margin-bottom: 10px; }
          .clinic-name { font-size: 24px; font-weight: bold; color: #D01A2B; margin-bottom: 5px; }
          .clinic-address { font-size: 12px; color: #666; }
          .content { padding: 30px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; color: #D01A2B; margin-top: 15px; padding-top: 10px; border-top: 2px solid #D01A2B; }
          .footer { text-align: center; padding: 20px; font-size: 11px; color: #999; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="clinic-name">REYS CLINIC</div>
            <div class="clinic-address">Wadad Sodonka, NBC, Albarako, Mogadishu, Somalia</div>
            <div>Pediatric Specialist</div>
          </div>
          <div class="content">
            <div class="info-row"><strong>Ticket ID:</strong> <span>${registeredPatient.ticketId || registeredPatient.patientId}</span></div>
            <div class="info-row"><strong>Date:</strong> <span>${new Date().toLocaleString()}</span></div>
            <div class="info-row"><strong>Patient Name:</strong> <span>${registeredPatient.childName}</span></div>
            <div class="info-row"><strong>Department:</strong> <span>${registeredPatient.referredTo === 'doctor' ? 'Doctor Consultation' : 'Laboratory Services'}</span></div>
            <div class="info-row"><strong>Assigned To:</strong> <span>${registeredPatient.referredTo === 'doctor' ? ('Dr. ' + assignedDoctorName) : assignedLabTechName}</span></div>
            ${registeredPatient.isFollowUp ? `<div class="info-row"><strong>Visit Type:</strong> <span>Follow-up Visit</span></div>` : ''}
            <div class="info-row"><strong>Amount Paid:</strong> <span>$${registeredPatient.paidAmount || 0}</span></div>
            <div class="total">Total Paid: $${registeredPatient.paidAmount || 0}</div>
          </div>
          <div class="footer">
            <p>Thank you for choosing REYS CLINIC</p>
            <p>Registered By: ${user?.name || 'Reception'}</p>
            <p>-----------------------------------END OF RECEIPT------------------------------------------</p>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

  const handlePrintReferral = () => {
  const printWindow = window.open('', '_blank');
  const currentDate = new Date().toLocaleDateString();
  
  // Get the assigned doctor name properly
  const assignedDoctorName = registeredPatient.assignedDoctor || 
                             (registeredPatient.assignedDoctorId?.name) || 
                             formData.assignedDoctor || 
                             'Not Assigned';
  
  // Get the assigned lab tech name properly
  const assignedLabTechName = registeredPatient.assignedLabTech || 
                              (registeredPatient.assignedLabTechId?.name) || 
                              formData.assignedLabTech || 
                              'Not Assigned';
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>REYS CLINIC - Patient Referral</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Times New Roman', Arial, sans-serif; background: #fff; padding: 40px; }
          .referral { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; background: #fff; }
          .header { text-align: center; padding: 30px; border-bottom: 2px solid #D01A2B; }
          .logo-img { max-width: 150px; height: auto; margin-bottom: 10px; }
          .clinic-name { font-size: 24px; font-weight: bold; color: #D01A2B; }
          .clinic-address { font-size: 12px; color: #666; margin: 5px 0; }
          .info-section { padding: 20px 30px; background: #f9f9f9; }
          .info-row { display: flex; margin-bottom: 8px; }
          .info-label { width: 150px; font-weight: bold; }
          .info-value { flex: 1; }
          .divider { border-top: 1px dashed #999; margin: 15px 0; }
          .details-section { padding: 20px 30px; }
          .section-title { font-size: 16px; font-weight: bold; color: #D01A2B; margin-bottom: 15px; border-left: 4px solid #D01A2B; padding-left: 10px; }
          .footer { text-align: center; padding: 20px; font-size: 11px; color: #999; border-top: 1px solid #ddd; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }
          .badge-urgent { background: #fee2e2; color: #dc2626; }
          .badge-normal { background: #dcfce7; color: #16a34a; }
        </style>
      </head>
      <body>
        <div class="referral">
          <div class="header">
            <div class="clinic-name">REYS CLINIC</div>
            <div class="clinic-address">Wadad Sodonka, NBC, Albarako, Mogadishu, Somalia</div>
            <div>Pediatric Specialist</div>
          </div>
          <div class="info-section">
            <div class="info-row"><div class="info-label">Ticket ID:</div><div class="info-value"><strong>${registeredPatient.ticketId || registeredPatient.patientId}</strong></div><div class="info-label">Date:</div><div class="info-value">${currentDate}</div></div>
            <div class="info-row"><div class="info-label">Patient Name:</div><div class="info-value">${registeredPatient.childName}</div><div class="info-label">Age:</div><div class="info-value">${registeredPatient.childAge} years</div></div>
            <div class="info-row"><div class="info-label">Parent/Guardian:</div><div class="info-value">${registeredPatient.parentName}</div><div class="info-label">Phone:</div><div class="info-value">${registeredPatient.parentPhone}</div></div>
          </div>
          <div class="details-section">
            <div class="section-title">${registeredPatient.referredTo === 'doctor' ? 'DOCTOR REFERRAL' : 'LABORATORY REFERRAL'}</div>
            <div class="info-row">
              <div class="info-label">Assigned To:</div>
              <div class="info-value">${registeredPatient.referredTo === 'doctor' ? ('Dr. ' + assignedDoctorName) : assignedLabTechName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Urgency:</div>
              <div class="info-value"><span class="badge ${registeredPatient.urgency === 'urgent' ? 'badge-urgent' : 'badge-normal'}">${registeredPatient.urgency === 'urgent' ? 'URGENT' : 'Normal'}</span></div>
            </div>
            ${registeredPatient.referredTo === 'doctor' ? `
              <div class="info-row"><div class="info-label">Reason for Visit:</div><div class="info-value">${registeredPatient.visitReason || 'N/A'}</div></div>
              <div class="info-row"><div class="info-label">Symptoms:</div><div class="info-value">${registeredPatient.symptoms || 'N/A'}</div></div>
            ` : `
              <div class="info-row"><div class="info-label">Tests Requested:</div><div class="info-value">${registeredPatient.selectedLabTests?.length || 0} test(s)</div></div>
              ${registeredPatient.selectedLabTests && registeredPatient.selectedLabTests.length > 0 ? `
                <div class="info-row"><div class="info-label">Lab Tests:</div><div class="info-value">${registeredPatient.selectedLabTests.join(', ')}</div></div>
              ` : ''}
              <div class="info-row"><div class="info-label">Lab Notes:</div><div class="info-value">${registeredPatient.labTestNotes || 'N/A'}</div></div>
            `}
            ${registeredPatient.isFollowUp ? `<div class="info-row"><div class="info-label">Follow-up Reason:</div><div class="info-value">${registeredPatient.followUpReason || 'N/A'}</div></div>` : ''}
            <div class="divider"></div>
            <div class="info-row"><div class="info-label">Additional Notes:</div><div class="info-value">${registeredPatient.notes || 'No additional notes'}</div></div>
          </div>
          <div class="footer">
            <p>This is a computer generated referral. Please present this at the department.</p>
            <p>Registered By: ${user?.name || 'Reception'}</p>
            <p>-----------------------------------END OF REFERRAL------------------------------------------</p>
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
                  <div className="flex justify-between"><span className="text-gray-500">Patient ID:</span><span className="font-mono font-semibold">{registeredPatient.patientId}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Child Name:</span><span className="font-semibold">{registeredPatient.childName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Age:</span><span>{registeredPatient.childAge} years</span></div>
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
                    </div>
                  </div>
                </div>
              </div>

              {registeredPatient.paymentStatus === 'paid' && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2"><DollarSign className="w-4 h-4 text-green-600" /><span>Payment Summary</span></h3>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex justify-between"><span className="text-gray-600">Amount Paid:</span><span className="font-semibold text-green-600">${registeredPatient.paidAmount || 0}</span></div>
                    <div className="flex justify-between pt-2"><span className="font-semibold">Status:</span><span className="font-semibold text-green-600">✓ Paid</span></div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                <button onClick={handlePrintReferral} className="w-full px-4 py-3 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center space-x-2"><Printer className="w-5 h-5" /><span>Print Referral Slip</span></button>
                {registeredPatient.paymentStatus === 'paid' && (
                  <button onClick={handlePrintReceipt} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center space-x-2"><Printer className="w-5 h-5" /><span>Print Payment Receipt</span></button>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleNewRegistration} className="flex-1 px-4 py-3 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center space-x-2"><UserPlus className="w-5 h-5" /><span>Register New Patient</span></button>
                  <button onClick={() => navigate('/reception-dashboard')} className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center space-x-2"><ArrowLeft className="w-5 h-5" /><span>Back to Dashboard</span></button>
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
                      <div><label className="block text-gray-700 font-semibold mb-2">Date of Birth</label><input type="date" name="childDob" value={formData.childDob} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B]" /></div>
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
                        <div className="md:col-span-2"><label className="block text-gray-700 font-semibold mb-2">Symptoms (Optional)</label><textarea name="symptoms" value={formData.symptoms} onChange={handleInputChange} rows="2" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B]" placeholder="List any symptoms the patient is experiencing" /></div>
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
  <label className="block text-gray-700 font-semibold mb-2">
    Assign Doctor <span className="text-red-500">*</span>
  </label>
  <select 
    name="assignedDoctor" 
    value={formData.assignedDoctor} 
    onChange={handleInputChange} 
    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${errors.assignedDoctor ? 'border-red-500' : 'border-gray-300'}`}
  >
    <option value="">Select a doctor</option>
    {loadingDoctors ? (
      <option disabled>Loading doctors...</option>
    ) : (
      doctors.map(doc => (
        <option key={doc._id} value={doc.name}>
          Dr. {doc.name}
        </option>
      ))
    )}
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
                    <label className="block text-gray-700 font-semibold mb-2">Additional Notes (Optional)</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B]" placeholder="Any additional information or special instructions" />
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

                  <button type="submit" disabled={loading} className="w-full py-4 bg-[#D01A2B] text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center space-x-2">
                    {loading ? <><Loader className="w-5 h-5 animate-spin" /><span>Registering Patient...</span></> : <><CreditCard className="w-5 h-5" /><span>Register Patient</span></>}
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

// Add Printer icon since it was missing
const Printer = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3h12v6"/><rect x="6" y="15" width="12" height="6" rx="2"/></svg>;

const UserPlus = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;

export default RegisterPatient;

// const handleSubmit = async (isPaid = false) => {
