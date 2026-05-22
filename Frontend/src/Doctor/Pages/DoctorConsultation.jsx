import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Clock, User, Phone, Mail, MapPin, Heart, CheckCircle,
  ArrowLeft, Search, Filter, Plus, Edit, Trash2, Eye, X, Loader,
  Baby, Users, Download, Printer, ChevronLeft, ChevronRight,
  AlertCircle, FileText, Activity, Shield, History, FileCheck,
  Stethoscope, Syringe, ClipboardList, Microscope, Send, 
  Package, Pill, FlaskConical, FileSignature, Save, RefreshCw,
  AlertTriangle, MessageCircle, Receipt, BookOpen, Database, DollarSign,
  FolderOpen, Clipboard, TestTube, FileBarChart, Hospital, TrendingUp,
  Thermometer, Weight, Ruler, Droplet as DropletIcon
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const DoctorConsultation = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    waitingPatients: 0,
    inProgress: 0,
    waitingTests: 0,
    completed: 0,
    inpatient: 0
  });
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [pastConsultations, setPastConsultations] = useState([]);
  const [showPastConsultations, setShowPastConsultations] = useState(false);
  const [labResults, setLabResults] = useState([]);
  const [showLabResultsModal, setShowLabResultsModal] = useState(false);
  const [selectedLabResult, setSelectedLabResult] = useState(null);
  const [waitingCount, setWaitingCount] = useState(0);

  // Follow-up states
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [followUpReason, setFollowUpReason] = useState('');
  const [previousConsultationId, setPreviousConsultationId] = useState('');

  // Master Data
  const [diagnosesList, setDiagnosesList] = useState([]);
  const [labTestsList, setLabTestsList] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  
  // Modal states for large popups
  const [showDiagnosesModal, setShowDiagnosesModal] = useState(false);
  const [showLabTestsModal, setShowLabTestsModal] = useState(false);
  const [showMedicationsModal, setShowMedicationsModal] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  
  // Inventory type selection for prescriptions
  const [prescriptionType, setPrescriptionType] = useState('inventory');
  const [labTestType, setLabTestType] = useState('inventory');
  const [customMedication, setCustomMedication] = useState({ name: '', dosage: '', frequency: '', duration: '', route: '', instructions: '' });
  const [customLabTest, setCustomLabTest] = useState({ name: '', notes: '' });
  
  // Selected items
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [selectedLabTests, setSelectedLabTests] = useState([]);
  const [selectedMedications, setSelectedMedications] = useState([]);
  
  // Print refs
  const prescriptionPrintRef = useRef(null);
  const labRequestPrintRef = useRef(null);
  const [showPrescriptionPrint, setShowPrescriptionPrint] = useState(false);
  const [showLabRequestPrint, setShowLabRequestPrint] = useState(false);

  // Consultation Form State
  const [consultationData, setConsultationData] = useState({
    patientId: '',
    childName: '',
    childAge: '',
    parentName: '',
    parentPhone: '',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    medications: '',
    allergies: '',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    bloodPressure: '',
    weight: '',
    height: '',
    muac: '',
    zScore: '',
    vaccinationStatus: '',
    physicalExam: '',
    treatment: '',
    notes: '',
    status: 'draft',
    isInpatient: false
  });

  const vaccinationOptions = ['Complete', 'Incomplete', 'Not Started', 'Unknown'];

  const loadWaitingPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/patients?referredTo=doctor&status=pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWaitingCount(data.data.length);
      }
    } catch (error) {
      console.error('Error loading waiting patients:', error);
    }
  };

  const loadDraft = (patientId) => {
    const savedDraft = localStorage.getItem(`consultation_draft_${patientId}`);
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setConsultationData(draft.consultationData);
      setSelectedDiagnoses(draft.selectedDiagnoses || []);
      setSelectedLabTests(draft.selectedLabTests || []);
      setSelectedMedications(draft.selectedMedications || []);
      setIsDraftSaved(true);
      toast.info('Loaded saved draft');
    }
  };

  const saveDraft = () => {
    if (!selectedPatient) return;
    
    const draftData = {
      consultationData,
      selectedDiagnoses,
      selectedLabTests,
      selectedMedications,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`consultation_draft_${selectedPatient._id}`, JSON.stringify(draftData));
    setIsDraftSaved(true);
    toast.success('Draft saved successfully');
  };

  const loadPastConsultations = (patientId) => {
    const allConsultations = JSON.parse(localStorage.getItem('consultations') || '[]');
    const patientConsultations = allConsultations.filter(c => c.patientId === patientId);
    setPastConsultations(patientConsultations);
    setShowPastConsultations(true);
  };

  const loadLabResults = async (patientId, patientName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/lab-requests?patientId=${patientId}&status=completed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const testsWithRanges = await Promise.all(data.data.map(async (test) => {
          try {
            const labTestResponse = await fetch(`${API_BASE_URL}/api/lab-tests/by-name/${encodeURIComponent(test.testName)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const labTestData = await labTestResponse.json();
            return {
              ...test,
              normalRange: labTestData.success ? labTestData.data.normalRange : null,
              unit: labTestData.success ? labTestData.data.unit : '',
              parameters: labTestData.success ? labTestData.data.parameters : [],
              resultType: labTestData.success ? labTestData.data.resultType : 'text'
            };
          } catch (error) {
            return { ...test, normalRange: null, unit: '', parameters: [], resultType: 'text' };
          }
        }));
        
        setLabResults(testsWithRanges);
        setSelectedPatient(patients.find(p => p._id === patientId));
        setShowLabResultsModal(true);
      } else {
        toast.info('No lab results found for this patient');
      }
    } catch (error) {
      console.error('Error fetching lab results:', error);
      toast.error('Failed to load lab results');
    }
  };

  const isValueInRange = (value, range) => {
    if (!range || !value) return true;
    const valueStr = String(value);
    let numValue = parseFloat(valueStr.replace(/,/g, '').split(' ')[0]);
    
    if (isNaN(numValue)) {
      return valueStr.toLowerCase() === range.toLowerCase();
    }
    
    let cleanRange = range.replace(/,/g, '');
    const rangeSeparator = cleanRange.includes('–') ? '–' : (cleanRange.includes('-') ? '-' : null);
    
    if (rangeSeparator) {
      const parts = cleanRange.split(rangeSeparator);
      const min = parseFloat(parts[0].trim().split(' ')[0]);
      const max = parseFloat(parts[1].trim().split(' ')[0]);
      if (!isNaN(min) && !isNaN(max)) {
        return numValue >= min && numValue <= max;
      }
    }
    if (cleanRange.includes('<')) {
      const max = parseFloat(cleanRange.replace('<', '').trim().split(' ')[0]);
      if (!isNaN(max)) return numValue < max;
    }
    if (cleanRange.includes('>')) {
      const min = parseFloat(cleanRange.replace('>', '').trim().split(' ')[0]);
      if (!isNaN(min)) return numValue > min;
    }
    return true;
  };

  const getResultStatus = (test) => {
    if (!test.results) return 'pending';
    const resultValue = Object.values(test.results)[0];
    if (test.normalRange && resultValue && !isValueInRange(resultValue, test.normalRange)) {
      return 'abnormal';
    }
    return 'normal';
  };

  // Professional result display without colors
  const getResultDisplay = (test) => {
    if (!test.results) return { result: 'N/A', range: 'N/A' };
    const resultValue = Object.values(test.results)[0] || 'N/A';
    const isAbnormal = test.normalRange && resultValue !== 'N/A' && !isValueInRange(resultValue, test.normalRange);
    return {
      result: resultValue,
      range: test.normalRange || 'Not specified',
      isAbnormal,
      unit: test.unit || ''
    };
  };

  useEffect(() => {
    const appointmentData = JSON.parse(localStorage.getItem('consultationAppointment') || '{}');
    if (appointmentData.childName) {
      const existingPatient = patients.find(p => p._id === appointmentData.patientId);
      if (existingPatient) {
        handleStartConsultation(existingPatient);
        loadDraft(existingPatient._id);
      } else if (appointmentData.childName) {
        const tempPatient = {
          _id: appointmentData.patientId || 'temp_' + Date.now(),
          childName: appointmentData.childName,
          childAge: appointmentData.childAge,
          parentName: appointmentData.parentName,
          parentPhone: appointmentData.parentPhone,
          patientId: appointmentData.ticketId || 'N/A',
          status: 'pending',
          urgency: 'normal'
        };
        setSelectedPatient(tempPatient);
        setConsultationData(prev => ({
          ...prev,
          patientId: tempPatient._id,
          childName: tempPatient.childName,
          childAge: tempPatient.childAge,
          parentName: tempPatient.parentName,
          parentPhone: tempPatient.parentPhone
        }));
        setShowConsultationModal(true);
      }
      localStorage.removeItem('consultationAppointment');
    }
  }, [patients]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (user?.role !== 'doctor') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (user?.role === 'doctor') {
      fetchPatients();
      fetchMasterData();
      fetchInventory();
      fetchLabTests();
      loadWaitingPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const doctorPatients = data.data.filter(p => p.referredTo === 'doctor');
        setPatients(doctorPatients);
        calculateStats(doctorPatients);
      }
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchLabTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/lab-tests?isActive=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const testsWithParams = data.data.map(test => ({
          ...test,
          parameters: test.parameters || ['Result'],
          normalRanges: test.normalRanges || {}
        }));
        setLabTestsList(testsWithParams);
      }
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    }
  };

  const fetchMasterData = async () => {
    try {
      const token = localStorage.getItem('token');
      const diagRes = await fetch(`${API_BASE_URL}/api/doctor-master/diagnoses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const diagData = await diagRes.json();
      if (diagData.success) setDiagnosesList(diagData.data);
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  };

  const fetchInventory = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/inventory/doctor-medications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success && data.data) {
      setInventoryList(data.data);
    }
  } catch (error) {
    console.error('Error fetching medications:', error);
  }
};

  const calculateStats = (patientsList) => {
    setStats({
      total: patientsList.length,
      waitingPatients: patientsList.filter(p => p.status === 'pending').length,
      inProgress: patientsList.filter(p => p.status === 'in-progress').length,
      waitingTests: patientsList.filter(p => p.status === 'waiting-tests').length,
      completed: patientsList.filter(p => p.status === 'completed').length,
      inpatient: patientsList.filter(p => p.isInpatient === true).length
    });
  };

  const handleStartConsultation = (patient) => {
    setIsFollowUp(patient.isFollowUp || false);
    setFollowUpReason(patient.followUpReason || '');
    setPreviousConsultationId(patient.previousConsultationId || '');
    
    setConsultationData({
      patientId: patient._id,
      childName: patient.childName,
      childAge: patient.childAge,
      parentName: patient.parentName,
      parentPhone: patient.parentPhone,
      chiefComplaint: '',
      historyOfPresentIllness: '',
      pastMedicalHistory: patient.pastMedicalHistory || '',
      medications: patient.medications || '',
      allergies: patient.allergies || '',
      temperature: '',
      heartRate: '',
      respiratoryRate: '',
      bloodPressure: '',
      weight: '',
      height: '',
      muac: '',
      zScore: '',
      vaccinationStatus: '',
      physicalExam: '',
      treatment: '',
      notes: '',
      status: 'draft',
      isInpatient: patient.isInpatient || false
    });
    setSelectedDiagnoses([]);
    setSelectedLabTests([]);
    setSelectedMedications([]);
    setSelectedPatient(patient);
    setIsDraftSaved(false);
    setShowConsultationModal(true);
    loadDraft(patient._id);
  };

  const markAsInpatient = async () => {
  if (!selectedPatient) return;
  
  try {
    const token = localStorage.getItem('token');
    
    const patientResponse = await fetch(`${API_BASE_URL}/api/patients/${selectedPatient._id}/inpatient`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isInpatient: true })
    });
    
    if (!patientResponse.ok) {
      throw new Error('Failed to update patient status');
    }
    
    const inpatientResponse = await fetch(`${API_BASE_URL}/api/inpatients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patientId: selectedPatient._id,
        admissionNotes: consultationData.notes || 'Marked as inpatient during consultation'
      })
    });
    
    const inpatientData = await inpatientResponse.json();
    
    if (inpatientData.success) {
      setConsultationData(prev => ({ ...prev, isInpatient: true }));
      toast.success('Patient marked as Inpatient');
      fetchPatients();
    } else {
      toast.error(inpatientData.msg || 'Failed to create inpatient record');
    }
  } catch (error) {
    console.error('Error marking as inpatient:', error);
    toast.error('Failed to mark as inpatient');
  }
};

  const handleOpenDiagnosesModal = () => {
    setModalSearchTerm('');
    setShowDiagnosesModal(true);
  };

  const handleToggleDiagnosis = (diagnosis) => {
    const exists = selectedDiagnoses.find(d => d._id === diagnosis._id);
    if (exists) {
      setSelectedDiagnoses(selectedDiagnoses.filter(d => d._id !== diagnosis._id));
      toast.info(`Removed: ${diagnosis.name}`);
    } else {
      setSelectedDiagnoses([...selectedDiagnoses, diagnosis]);
      toast.success(`Added: ${diagnosis.name}`);
    }
  };

  const handleRemoveDiagnosis = (id) => {
    setSelectedDiagnoses(selectedDiagnoses.filter(d => d._id !== id));
  };

  const handleOpenLabTestsModal = () => {
    setModalSearchTerm('');
    setLabTestType('inventory');
    setShowLabTestsModal(true);
  };

  const handleToggleLabTest = (test) => {
    const exists = selectedLabTests.find(t => t._id === test._id);
    if (exists) {
      setSelectedLabTests(selectedLabTests.filter(t => t._id !== test._id));
      toast.info(`Removed: ${test.name}`);
    } else {
      setSelectedLabTests([...selectedLabTests, test]);
      toast.success(`Added: ${test.name}`);
    }
  };

  const handleAddCustomLabTest = () => {
    if (!customLabTest.name.trim()) {
      toast.warning('Please enter a test name');
      return;
    }
    
    const newTest = {
      _id: `custom_${Date.now()}`,
      name: customLabTest.name,
      isCustom: true,
      notes: customLabTest.notes
    };
    
    setSelectedLabTests([...selectedLabTests, newTest]);
    setCustomLabTest({ name: '', notes: '' });
    toast.success(`Added custom test: ${customLabTest.name}`);
  };

  const handleRemoveLabTest = (id) => {
    setSelectedLabTests(selectedLabTests.filter(t => t._id !== id));
  };

  const handleOpenMedicationsModal = () => {
    setModalSearchTerm('');
    setPrescriptionType('inventory');
    setShowMedicationsModal(true);
  };

  const handleToggleMedication = (medication) => {
  const exists = selectedMedications.find(m => m.id === medication.id);
  if (exists) {
    setSelectedMedications(selectedMedications.filter(m => m.id !== medication.id));
    toast.info(`Removed: ${medication.name}`);
  } else {
    setSelectedMedications([...selectedMedications, { 
      id: medication.id,
      name: medication.name,
      unit: medication.unit,
      category: medication.category,
      isCustom: false,
      dosage: '',
      frequency: '',
      duration: '',
      route: '',
      instructions: ''
    }]);
    toast.success(`Added: ${medication.name}`);
  }
};

  const handleAddCustomMedication = () => {
  if (!customMedication.name.trim()) {
    toast.warning('Please enter a medication name');
    return;
  }
  
  const newMed = {
    id: `custom_${Date.now()}`,
    name: customMedication.name,
    isCustom: true,
    dosage: customMedication.dosage,
    frequency: customMedication.frequency,
    duration: customMedication.duration,
    route: customMedication.route,
    instructions: customMedication.instructions
  };
  
  setSelectedMedications([...selectedMedications, newMed]);
  setCustomMedication({ name: '', dosage: '', frequency: '', duration: '', route: '', instructions: '' });
  toast.success(`Added custom medication: ${customMedication.name}`);
};

  const handleRemoveMedication = (id) => {
    setSelectedMedications(selectedMedications.filter(m => m.id !== id));
  };

  const handleUpdateMedication = (id, field, value) => {
    setSelectedMedications(selectedMedications.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleSendToLab = () => {
    if (selectedLabTests.length === 0) {
      toast.warning('Please select lab tests to send');
      return;
    }
    setShowLabRequestPrint(true);
  };

  const handlePrintLabRequest = () => {
    const logoBase64 = logo;
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    const labSerialId = `LAB-${Date.now()}`;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REYS CLINIC - Lab Test Request</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', Arial, sans-serif; background: #fff; padding: 40px; }
            .report { max-width: 1000px; margin: 0 auto; border: 1px solid #ddd; background: #fff; }
            .header { text-align: center; padding: 30px; border-bottom: 2px solid #D01A2B; }
            .logo-img { max-width: 350px; height: auto; margin-bottom: 10px; }
            .clinic-name { font-size: 24px; font-weight: bold; color: #D01A2B; margin-bottom: 5px; }
            .clinic-address { font-size: 12px; color: #666; margin-bottom: 10px; }
            .divider { border-top: 1px dashed #999; margin: 15px 0; }
            .info-section { padding: 20px 30px; background: #f9f9f9; }
            .info-row { display: flex; margin-bottom: 10px; }
            .info-label { width: 150px; font-weight: bold; color: #333; }
            .info-value { flex: 1; color: #555; }
            .test-section { padding: 20px 30px; }
            .test-title { font-size: 18px; font-weight: bold; color: #D01A2B; margin-bottom: 15px; border-left: 4px solid #D01A2B; padding-left: 10px; }
            .test-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .test-table th, .test-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .test-table th { background: #f5f5f5; font-weight: bold; }
            .footer { padding: 20px 30px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #999; }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <img src="${logoBase64}" alt="REYS CLINIC Logo" class="logo-img" />
              <div class="clinic-address">Wadad Sodonka, NBC, Albarako, Mogadishu, Somalia</div>
              <h3 class="text-3xl"> Dr. ${user?.name}</h3>
              <div>Pediatric Specialist</div>
            </div>
            <div class="info-section">
              <div class="info-row"><div class="info-label">Name:</div><div class="info-value">${selectedPatient.childName}</div><div class="info-label" style="margin-left: 30px;">Patient ID:</div><div class="info-value">${selectedPatient.patientId || 'PAT-' + selectedPatient._id?.slice(-6)}</div></div>
              <div class="info-row"><div class="info-label">Age:</div><div class="info-value">${selectedPatient.childAge} years</div><div class="info-label" style="margin-left: 30px;">Gender:</div><div class="info-value">${selectedPatient.childGender || 'Not specified'}</div></div>
              <div class="info-row"><div class="info-label">Parent/Guardian:</div><div class="info-value">${selectedPatient.parentName}</div><div class="info-label" style="margin-left: 30px;">Phone:</div><div class="info-value">${selectedPatient.parentPhone}</div></div>
              <div class="divider"></div>
              <div class="info-row"><div class="info-label">Lab Ref:</div><div class="info-value">${labSerialId}</div><div class="info-label" style="margin-left: 30px;">Examined Date:</div><div class="info-value">${currentDate}</div></div>
              <div class="info-row"><div class="info-label">Report Date:</div><div class="info-value">${currentDate}</div></div>
            </div>
            <div class="test-section">
              <div class="test-title">LABORATORY TEST REQUEST</div>
              <div class="info-row"><div class="info-label">Requested by:</div><div class="info-value">Dr. ${user?.name}</div></div>
              <div class="info-row"><div class="info-label">Clinical Notes:</div><div class="info-value">${consultationData.chiefComplaint || 'N/A'}</div></div>
              <table class="test-table">
                <thead><tr><th>Test Name</th><th>Category</th><th>Notes</th></tr></thead>
                <tbody>
                  ${selectedLabTests.map(test => `
                    <tr>
                      <td>${test.name}</td>
                      <td>${test.category || 'General'}</td>
                      <td>${test.notes || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div class="footer">
              <p>Requested by: Dr. ${user?.name}</p>
              <p>-----------------------------------END OF REPORT------------------------------------------</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setShowLabRequestPrint(false);
  };

  const handleSendPrescriptions = () => {
    if (selectedMedications.length === 0) {
      toast.warning('Please add prescriptions');
      return;
    }
    setShowPrescriptionPrint(true);
  };

  const handlePrintPrescription = () => {
    const logoBase64 = logo;
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REYS CLINIC - Prescription</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', Arial, sans-serif; background: #fff; padding: 40px; }
            .report { max-width: 1000px; margin: 0 auto; border: 1px solid #ddd; background: #fff; }
            .header { text-align: center; padding: 30px; border-bottom: 2px solid #D01A2B; }
            .logo-img { max-width: 350px; height: auto; margin-bottom: 10px; }
            .clinic-name { font-size: 24px; font-weight: bold; color: #D01A2B; margin-bottom: 5px; }
            .clinic-address { font-size: 12px; color: #666; margin-bottom: 10px; }
            .divider { border-top: 1px dashed #999; margin: 15px 0; }
            .info-section { padding: 20px 30px; background: #f9f9f9; }
            .info-row { display: flex; margin-bottom: 10px; }
            .info-label { width: 150px; font-weight: bold; color: #333; }
            .info-value { flex: 1; color: #555; }
            .prescription-section { padding: 20px 30px; }
            .prescription-title { font-size: 18px; font-weight: bold; color: #D01A2B; margin-bottom: 15px; border-left: 4px solid #D01A2B; padding-left: 10px; }
            .med-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .med-table th, .med-table td { padding: 12px; text-align: left; border: 1px solid #ddd; }
            .med-table th { background: #f5f5f5; font-weight: bold; }
            .footer { padding: 20px 30px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #999; }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <img src="${logoBase64}" alt="REYS CLINIC Logo" class="logo-img" />
              <div class="clinic-address">Wadad Sodonka, NBC, Albarako, Mogadishu, Somalia</div>
              <h3 class="text-3xl"> Dr. ${user?.name}</h3>
              <div>Pediatric Specialist</div>
            </div>
            <div class="info-section">
              <div class="info-row"><div class="info-label">Name:</div><div class="info-value">${selectedPatient.childName}</div><div class="info-label" style="margin-left: 30px;">Patient ID:</div><div class="info-value">${selectedPatient.patientId || 'PAT-' + selectedPatient._id?.slice(-6)}</div></div>
              <div class="info-row"><div class="info-label">Age:</div><div class="info-value">${selectedPatient.childAge} years</div><div class="info-label" style="margin-left: 30px;">Gender:</div><div class="info-value">${selectedPatient.childGender || 'Not specified'}</div></div>
              <div class="info-row"><div class="info-label">Parent/Guardian:</div><div class="info-value">${selectedPatient.parentName}</div><div class="info-label" style="margin-left: 30px;">Phone:</div><div class="info-value">${selectedPatient.parentPhone}</div></div>
              <div class="divider"></div>
              <div class="info-row"><div class="info-label">Date:</div><div class="info-value">${currentDate}</div></div>
            </div>
            <div class="prescription-section">
              <div class="prescription-title">MEDICAL PRESCRIPTION</div>
              <table class="med-table">
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Route</th>
                    <th>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedMedications.map(med => `
                    <tr>
                      <td>${med.name}${med.unit ? ` (${med.unit})` : ''}</td>
                      <td>${med.dosage || '—'}</td>
                      <td>${med.frequency || '—'}</td>
                      <td>${med.duration || '—'}</td>
                      <td>${med.route || '—'}</td>
                      <td>${med.instructions || '—'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div style="margin-top: 20px;"><strong>Doctor's Notes:</strong> ${consultationData.notes || 'N/A'}</div>
            </div>
            <div class="footer">
              <p>Prescribed by: Dr. ${user?.name}</p>
              <p>-----------------------------------END OF PRESCRIPTION------------------------------------------</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setShowPrescriptionPrint(false);
  };

const handleCompleteConsultation = async () => {
  if (!isDraftSaved) {
    toast.warning('Please save the draft before completing consultation');
    return;
  }

  const loadingToast = toast.loading('Completing consultation...');

  try {
    // Send prescriptions to pharmacy if any
    if (selectedMedications.length > 0) {
      await sendPrescriptionsToPharmacy();
    }
    
    // Send lab test requests to lab-tech
    if (selectedLabTests.length > 0) {
      await sendLabTestRequests();
    }
    
    const consultationRecord = {
      id: Date.now(),
      consultationId: `CONS-${Date.now()}`,
      patientId: selectedPatient._id,
      patientName: selectedPatient.childName,
      childAge: selectedPatient.childAge,
      parentName: selectedPatient.parentName,
      parentPhone: selectedPatient.parentPhone,
      ticketId: selectedPatient.ticketId || `TKT-${Date.now()}`,
      doctorName: user.name,
      doctorId: user.id,
      date: new Date().toISOString(),
      status: 'completed',
      diagnoses: selectedDiagnoses.map(d => d.name),
      labTestsRequested: selectedLabTests.map(test => ({
        id: test._id,
        name: test.name,
        isCustom: test.isCustom || false,
        notes: test.notes || '',
        price: test.price || 0,
        category: test.category || 'General',
        requestedBy: `Dr. ${user.name}`,
        requestedAt: new Date().toISOString()
      })),
      medications: selectedMedications,
      notes: consultationData.notes,
      treatment: consultationData.treatment,
      chiefComplaint: consultationData.chiefComplaint,
      historyOfPresentIllness: consultationData.historyOfPresentIllness,
      pastMedicalHistory: consultationData.pastMedicalHistory,
      medicationsList: consultationData.medications,
      allergies: consultationData.allergies,
      physicalExam: consultationData.physicalExam,
      muac: consultationData.muac,
      zScore: consultationData.zScore,
      vaccinationStatus: consultationData.vaccinationStatus,
      isInpatient: consultationData.isInpatient,
      isFollowUp: isFollowUp,
      followUpReason: followUpReason,
      previousConsultationId: previousConsultationId,
      vitals: {
        temperature: consultationData.temperature,
        heartRate: consultationData.heartRate,
        respiratoryRate: consultationData.respiratoryRate,
        bloodPressure: consultationData.bloodPressure,
        weight: consultationData.weight,
        height: consultationData.height
      }
    };
    
    // Save consultation record to localStorage
    const existingConsultations = JSON.parse(localStorage.getItem('consultations') || '[]');
    existingConsultations.push(consultationRecord);
    localStorage.setItem('consultations', JSON.stringify(existingConsultations));
    
    // Update patient status to COMPLETED (not pending-payment)
    const statusUpdated = await updatePatientStatus(selectedPatient._id, 'completed');
    
    if (!statusUpdated) {
      toast.warning('Patient status update failed. Please try again.');
      toast.dismiss(loadingToast);
      return;
    }
    
    // Clear saved draft
    localStorage.removeItem(`consultation_draft_${selectedPatient._id}`);
    
    // Update local patient list immediately
    setPatients(prevPatients => 
      prevPatients.map(p => 
        p._id === selectedPatient._id 
          ? { ...p, status: 'completed' }
          : p
      )
    );
    
    toast.dismiss(loadingToast);
    
    if (selectedLabTests.length > 0) {
      toast.success(`Consultation completed! ${selectedLabTests.length} lab test request(s) sent to laboratory.`);
    } else {
      toast.success('Consultation completed successfully!');
    }
    
    setShowConsultationModal(false);
    setSelectedPatient(null);
    
    // Refresh the patient list from server
    await fetchPatients();
    
  } catch (error) {
    console.error('Error completing consultation:', error);
    toast.dismiss(loadingToast);
    toast.error('Failed to complete consultation. Please try again.');
  }
};

  const sendLabTestRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
      
      for (const test of selectedLabTests) {
        if (test.isCustom) {
          const labRequestData = {
            patientId: selectedPatient._id,
            patientName: selectedPatient.childName,
            patientAge: selectedPatient.childAge,
            parentName: selectedPatient.parentName,
            parentPhone: selectedPatient.parentPhone,
            testName: test.name,
            testCategory: 'other',
            parameters: ['Result'],
            normalRanges: {},
            clinicalInfo: test.notes || consultationData.chiefComplaint || '',
            notes: consultationData.notes || '',
            priority: 'normal',
            requestedBy: `Dr. ${user.name}`,
            requestedById: user.id
          };
          
          const response = await fetch(`${API_BASE_URL}/api/lab-requests`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(labRequestData)
          });
          
          const data = await response.json();
          if (data.success) successCount++;
        } else {
          const testDetails = labTestsList.find(t => t._id === test._id);
          const labRequestData = {
            patientId: selectedPatient._id,
            patientName: selectedPatient.childName,
            patientAge: selectedPatient.childAge,
            parentName: selectedPatient.parentName,
            parentPhone: selectedPatient.parentPhone,
            testName: test.name,
            testCategory: test.category || 'other',
            parameters: testDetails?.parameters || test.parameters || ['Result'],
            normalRanges: testDetails?.normalRanges || test.normalRanges || {},
            clinicalInfo: consultationData.chiefComplaint || '',
            notes: consultationData.notes || '',
            priority: 'normal',
            requestedBy: `Dr. ${user.name}`,
            requestedById: user.id
          };
          
          const response = await fetch(`${API_BASE_URL}/api/lab-requests`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(labRequestData)
          });
          
          const data = await response.json();
          if (data.success) successCount++;
        }
      }
      
      if (successCount > 0) {
        console.log(`${successCount} lab test request(s) sent to laboratory`);
      }
    } catch (error) {
      console.error('Error sending lab test requests:', error);
    }
  };

  const sendPrescriptionsToPharmacy = async () => {
  try {
    const token = localStorage.getItem('token');
    const inventoryMedications = selectedMedications.filter(med => !med.isCustom && med.id && !med.id.toString().startsWith('custom_'));
    
    if (inventoryMedications.length === 0) {
      console.log('No inventory medications to send to pharmacy');
      return;
    }
    
    const medicationsData = inventoryMedications.map(med => ({
      name: med.name,
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      duration: med.duration || '',
      route: med.route || '',
      instructions: med.instructions || ''
    }));
    
    await fetch(`${API_BASE_URL}/api/prescriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patientId: selectedPatient._id,
        patientName: selectedPatient.childName,
        patientAge: selectedPatient.childAge,
        parentName: selectedPatient.parentName,
        parentPhone: selectedPatient.parentPhone,
        doctor: user.name,
        medications: medicationsData,
        notes: consultationData.notes,
        isFollowUp: isFollowUp,
        followUpReason: followUpReason
      })
    });
    
    console.log(`Sent ${inventoryMedications.length} medications to pharmacy`);
  } catch (error) {
    console.error('Error sending prescriptions:', error);
  }
};

  const updatePatientStatus = async (patientId, status) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}/status`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Status update successful:', data.msg);
      return true;
    } else {
      console.error('Status update failed:', data.msg);
      return false;
    }
  } catch (error) {
    console.error('Error updating patient status:', error);
    return false;
  }
};

  const getStatusBadge = (status) => {
    const config = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      'waiting-tests': 'bg-purple-100 text-purple-700',
      'completed': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return <span className={`${config[status] || config.pending} px-2 py-1 rounded-full text-xs font-semibold`}>{status?.replace('-', ' ') || 'pending'}</span>;
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.childName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.patientId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredDiagnosesModal = diagnosesList.filter(d => 
    d.name?.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );
  
  const filteredLabTestsModal = labTestsList.filter(t => 
    t.name?.toLowerCase().includes(modalSearchTerm.toLowerCase()) && t.isActive !== false
  );

  const filteredMedicationsModal = inventoryList.filter(med => 
    med.name?.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  if (!isAuthenticated || user?.role !== 'doctor') {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="w-8 h-8 animate-spin text-[#D01A2B]" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/doctor-dashboard')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
              <div><h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1><p className="text-xs text-gray-500">Doctor Consultation</p></div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500"><Stethoscope className="w-4 h-4 text-[#D01A2B]" /><span>Dr. {user?.name}</span></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div><span className="text-2xl font-bold text-gray-900">{stats.total}</span></div><p className="text-sm text-gray-500">Total Patients</p></div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><Clock className="w-5 h-5 text-yellow-600" /></div><span className="text-2xl font-bold text-yellow-600">{stats.waitingPatients}</span></div><p className="text-sm text-yellow-600">Waiting Patients</p></div>
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Activity className="w-5 h-5 text-blue-600" /></div><span className="text-2xl font-bold text-blue-600">{stats.inProgress}</span></div><p className="text-sm text-blue-600">In Progress</p></div>
          <div className="bg-purple-50 rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Microscope className="w-5 h-5 text-purple-600" /></div><span className="text-2xl font-bold text-purple-600">{stats.waitingTests}</span></div><p className="text-sm text-purple-600">Waiting Tests</p></div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm"><div className="flex items-center justify-between"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div><span className="text-2xl font-bold text-green-600">{stats.completed}</span></div><p className="text-sm text-green-600">Completed</p></div>
          <button 
            className="bg-red-50 rounded-xl p-4 shadow-sm hover:bg-red-100 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Hospital className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.inpatient}</span>
            </div>
            <p className="text-sm text-red-600">Inpatients</p>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Search by patient name, parent name, or patient ID..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]" /></div>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="waiting-tests">Waiting Tests</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-[#D01A2B]" /></div> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Child Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Age</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Parent/Guardian</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentPatients.map((patient) => (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4"><span className="font-mono text-sm text-[#D01A2B]">{patient.patientId}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <Baby className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{patient.childName}</span>
                            {patient.isInpatient && <span className="ml-1 bg-red-100 text-red-700 text-xs px-1 py-0.5 rounded">Inpatient</span>}
                            {patient.isFollowUp && <span className="ml-1 bg-yellow-100 text-yellow-700 text-xs px-1 py-0.5 rounded flex items-center gap-0.5"><History className="w-2 h-2" />Follow-up</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">{patient.childAge} years</td>
                        <td className="px-6 py-4">{patient.parentName}</td>
                        <td className="px-6 py-4">{patient.parentPhone}</td>
                        <td className="px-6 py-4">{new Date(patient.registrationDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{getStatusBadge(patient.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleStartConsultation(patient)} 
                              className="p-2 bg-[#D01A2B] text-white rounded-lg hover:bg-red-700 transition-colors" 
                              title="Consult"
                            >
                              <Stethoscope className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => loadPastConsultations(patient._id)} 
                              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors" 
                              title="View History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => loadLabResults(patient._id, patient.childName)} 
                              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center" 
                              title="View Lab Results"
                            >
                              <TestTube className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredPatients.length === 0 && (<div className="text-center py-12"><Users className="w-16 h-16 mx-auto text-gray-300 mb-4" /><h3 className="text-lg font-medium text-gray-900">No patients found</h3></div>)}
              {filteredPatients.length > 0 && (
                <div className="px-6 py-4 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-500">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length} patients</p>
                  <div className="flex space-x-2">
                    <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 border rounded-lg disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-3 py-1 bg-[#D01A2B] text-white rounded-lg">{currentPage}</span>
                    <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border rounded-lg disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Past Consultations Modal - Enhanced to show all fields */}
      {showPastConsultations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Past Consultations</h3>
              <button onClick={() => setShowPastConsultations(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              {pastConsultations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No past consultations found</div>
              ) : (
                <div className="space-y-6">
                  {pastConsultations.map((cons) => (
                    <div key={cons.id} className="border rounded-xl p-5 bg-white shadow-sm">
                      <div className="flex justify-between items-start border-b pb-3 mb-3">
                        <div>
                          <p className="font-bold text-[#D01A2B] text-lg">{cons.consultationId}</p>
                          <p className="text-sm text-gray-500">{new Date(cons.date).toLocaleString()}</p>
                        </div>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Completed</span>
                      </div>
                      
                      {/* Diagnoses */}
                      {cons.diagnoses && cons.diagnoses.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Diagnoses</p>
                          <div className="flex flex-wrap gap-1">
                            {cons.diagnoses.map((d, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">✓ {d}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Chief Complaint */}
                      {cons.chiefComplaint && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Chief Complaint</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{cons.chiefComplaint}</p>
                        </div>
                      )}
                      
                      {/* Vitals */}
                      {cons.vitals && (cons.vitals.temperature || cons.vitals.heartRate || cons.vitals.bloodPressure) && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Vital Signs</p>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                            {cons.vitals.temperature && <div className="bg-gray-50 p-1 rounded text-center"><span className="font-medium">Temp:</span> {cons.vitals.temperature}°C</div>}
                            {cons.vitals.heartRate && <div className="bg-gray-50 p-1 rounded text-center"><span className="font-medium">HR:</span> {cons.vitals.heartRate}</div>}
                            {cons.vitals.respiratoryRate && <div className="bg-gray-50 p-1 rounded text-center"><span className="font-medium">RR:</span> {cons.vitals.respiratoryRate}</div>}
                            {cons.vitals.bloodPressure && <div className="bg-gray-50 p-1 rounded text-center"><span className="font-medium">BP:</span> {cons.vitals.bloodPressure}</div>}
                            {cons.vitals.weight && <div className="bg-gray-50 p-1 rounded text-center"><span className="font-medium">Weight:</span> {cons.vitals.weight}kg</div>}
                            {cons.vitals.height && <div className="bg-gray-50 p-1 rounded text-center"><span className="font-medium">Height:</span> {cons.vitals.height}cm</div>}
                          </div>
                        </div>
                      )}
                      
                      {/* Medications/Prescriptions */}
                      {cons.medications && cons.medications.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Prescriptions ({cons.medications.length})</p>
                          <div className="space-y-1">
                            {cons.medications.map((med, idx) => (
                              <div key={idx} className="text-sm bg-green-50 p-2 rounded">
                                <span className="font-medium">{med.name}</span>
                                {med.dosage && <span className="ml-2 text-gray-600">💊 {med.dosage}</span>}
                                {med.frequency && <span className="ml-2 text-gray-600">⏰ {med.frequency}</span>}
                                {med.duration && <span className="ml-2 text-gray-600">📅 {med.duration}</span>}
                                {med.instructions && <p className="text-xs text-gray-500 mt-1">📝 {med.instructions}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Lab Tests Requested */}
                      {cons.labTestsRequested && cons.labTestsRequested.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Lab Tests Requested ({cons.labTestsRequested.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {cons.labTestsRequested.map((test, idx) => (
                              <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">{test.name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Treatment Plan */}
                      {cons.treatment && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Treatment Plan</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{cons.treatment}</p>
                        </div>
                      )}
                      
                      {/* Notes */}
                      {cons.notes && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Doctor's Notes</p>
                          <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded">{cons.notes}</p>
                        </div>
                      )}
                      
                      {/* Follow-up Info */}
                      {cons.isFollowUp && (
                        <div className="mt-2 pt-2 border-t text-xs text-yellow-600">
                          <span className="font-medium">Follow-up Patient</span>
                          {cons.followUpReason && <span className="ml-2">Reason: {cons.followUpReason}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lab Results Modal - Professional black/white display */}
      {showLabResultsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Lab Results - {selectedPatient.childName}</h3>
              <button onClick={() => setShowLabResultsModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="bg-gray-100 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{selectedPatient.childName}</p>
                    <p className="text-sm text-gray-600">Age: {selectedPatient.childAge} years | Parent: {selectedPatient.parentName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Tests</p>
                    <p className="text-2xl font-bold text-gray-800">{labResults.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-5">
                {labResults.map((test, idx) => {
                  const { result, range, isAbnormal, unit } = getResultDisplay(test);
                  return (
                    <div key={idx} className="border rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b">
                        <p className="font-semibold text-gray-800">{test.testName}</p>
                        <p className="text-xs text-gray-500">Requested: {test.requestedBy} | Completed: {new Date(test.completedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border-r pr-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Result</p>
                            <p className="text-xl font-bold text-gray-900">{result} {unit}</p>
                            {isAbnormal && <p className="text-xs text-gray-600 mt-1">Note: Outside reference range</p>}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Reference Range</p>
                            <p className="text-md text-gray-700">{range}</p>
                          </div>
                        </div>
                        {test.additionalComments && (
                          <div className="mt-3 pt-2 border-t">
                            <p className="text-xs text-gray-500">Comments:</p>
                            <p className="text-sm text-gray-600">{test.additionalComments}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">Performed by: {test.performedBy || 'Lab Technician'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consultation Modal */}
      {showConsultationModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Patient Consultation</h3>
                <p className="text-sm text-gray-500">{selectedPatient.childName} • Age: {selectedPatient.childAge} years</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={markAsInpatient} className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"><Hospital className="w-4 h-4 inline mr-1" />Mark as Inpatient</button>
                <button onClick={saveDraft} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"><Save className="w-4 h-4 inline mr-1" />Save Draft</button>
                <button onClick={() => setShowConsultationModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
            </div>

            {/* Follow-up Alert Banner */}
            {isFollowUp && (
              <div className="mx-6 mt-4 mb-2">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-yellow-800">Follow-up Patient</span>
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Returning Visit</span>
                    </div>
                    {previousConsultationId && (
                      <p className="text-sm text-yellow-700 mt-1">
                        <span className="font-medium">Previous Consultation:</span> {previousConsultationId}
                      </p>
                    )}
                    {followUpReason && (
                      <p className="text-sm text-yellow-700 mt-1">
                        <span className="font-medium">Follow-up Reason:</span> {followUpReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Chief Complaint</h4>
                    <textarea rows="2" value={consultationData.chiefComplaint} onChange={(e) => setConsultationData({...consultationData, chiefComplaint: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Main reason for visit..."></textarea>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">History of Present Illness</label><textarea rows="3" value={consultationData.historyOfPresentIllness} onChange={(e) => setConsultationData({...consultationData, historyOfPresentIllness: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Detailed history..."></textarea></div>
                    <div><label className="block text-sm font-medium mb-1">Past Medical History</label><textarea rows="3" value={consultationData.pastMedicalHistory} onChange={(e) => setConsultationData({...consultationData, pastMedicalHistory: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Previous conditions..."></textarea></div>
                    <div><label className="block text-sm font-medium mb-1">Current Medications</label><textarea rows="2" value={consultationData.medications} onChange={(e) => setConsultationData({...consultationData, medications: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="List current medications..."></textarea></div>
                    <div><label className="block text-sm font-medium mb-1">Allergies</label><textarea rows="2" value={consultationData.allergies} onChange={(e) => setConsultationData({...consultationData, allergies: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Known allergies..."></textarea></div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Vital Signs</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      <div><label className="block text-xs font-medium">Temp (°C)</label><input type="number" step="0.1" value={consultationData.temperature} onChange={(e) => setConsultationData({...consultationData, temperature: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                      <div><label className="block text-xs font-medium">Heart Rate</label><input type="number" value={consultationData.heartRate} onChange={(e) => setConsultationData({...consultationData, heartRate: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                      <div><label className="block text-xs font-medium">Resp Rate</label><input type="number" value={consultationData.respiratoryRate} onChange={(e) => setConsultationData({...consultationData, respiratoryRate: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                      <div><label className="block text-xs font-medium">BP (mmHg)</label><input type="text" value={consultationData.bloodPressure} onChange={(e) => setConsultationData({...consultationData, bloodPressure: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="120/80" /></div>
                      <div><label className="block text-xs font-medium">Weight (kg)</label><input type="number" step="0.1" value={consultationData.weight} onChange={(e) => setConsultationData({...consultationData, weight: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                      <div><label className="block text-xs font-medium">Height (cm)</label><input type="number" step="0.1" value={consultationData.height} onChange={(e) => setConsultationData({...consultationData, height: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Nutrition & Immunization</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-1">MUAC (cm)</label><input type="number" step="0.1" value={consultationData.muac} onChange={(e) => setConsultationData({...consultationData, muac: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                      <div><label className="block text-sm font-medium mb-1">Z-score</label><input type="number" step="0.1" value={consultationData.zScore} onChange={(e) => setConsultationData({...consultationData, zScore: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                      <div className="col-span-2"><label className="block text-sm font-medium mb-1">Vaccination Status</label><select value={consultationData.vaccinationStatus} onChange={(e) => setConsultationData({...consultationData, vaccinationStatus: e.target.value})} className="w-full p-2 border rounded-lg"><option value="">Select status</option>{vaccinationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    </div>
                  </div>
                  
                  <div><label className="block font-semibold mb-2">Physical Examination</label><textarea rows="3" value={consultationData.physicalExam} onChange={(e) => setConsultationData({...consultationData, physicalExam: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Physical examination findings..."></textarea></div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  {/* Diagnoses Section */}
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2 flex items-center space-x-1">
                      <ClipboardList className="w-4 h-4 text-[#D01A2B]" />
                      <span>Diagnoses</span>
                      {selectedDiagnoses.length > 0 && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{selectedDiagnoses.length}</span>
                      )}
                    </h4>
                    <button onClick={handleOpenDiagnosesModal} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
                      <Search className="w-4 h-4" />
                      <span>{selectedDiagnoses.length > 0 ? 'Edit Diagnoses' : 'Select Diagnoses'}</span>
                    </button>
                    {selectedDiagnoses.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {selectedDiagnoses.map(d => (
                          <div key={d._id} className="flex justify-between items-center p-2 bg-blue-50 rounded text-sm">
                            <span>{d.name}</span>
                            <button onClick={() => handleRemoveDiagnosis(d._id)} className="text-red-500"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lab Tests Section */}
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2 flex items-center space-x-1"><Microscope className="w-4 h-4 text-[#D01A2B]" /><span>Lab Tests</span></h4>
                    <button onClick={handleOpenLabTestsModal} className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"><Search className="w-4 h-4" /><span>Select Lab Tests</span></button>
                    {selectedLabTests.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {selectedLabTests.map(t => (<div key={t._id} className="flex justify-between items-center p-2 bg-purple-50 rounded text-sm"><span>{t.name}{t.isCustom && <span className="ml-1 text-xs text-purple-600">(Custom)</span>}</span><button onClick={() => handleRemoveLabTest(t._id)} className="text-red-500"><X className="w-3 h-3" /></button></div>))}
                      </div>
                    )}
                    {selectedLabTests.length > 0 && (<button onClick={handleSendToLab} className="mt-2 w-full py-1 bg-purple-600 text-white rounded text-sm">Send to Lab ({selectedLabTests.length})</button>)}
                  </div>
                  
                  {/* Prescriptions Section */}
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2 flex items-center space-x-1"><Pill className="w-4 h-4 text-[#D01A2B]" /><span>Prescriptions</span>{selectedMedications.length > 0 && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{selectedMedications.length}</span>}</h4>
                    <button onClick={handleOpenMedicationsModal} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"><Search className="w-4 h-4" /><span>{selectedMedications.length > 0 ? 'Edit Medications' : 'Select Medications'}</span></button>
                    {selectedMedications.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {selectedMedications.map(med => (<div key={med.id} className="flex justify-between items-center p-2 bg-green-50 rounded text-sm"><div className="flex-1"><span className="font-medium">{med.name}</span>{med.dosage && <span className="ml-1 text-xs text-gray-600">• {med.dosage}</span>}{med.frequency && <span className="ml-1 text-xs text-gray-600">• {med.frequency}</span>}</div><button onClick={() => handleRemoveMedication(med.id)} className="text-red-500"><X className="w-3 h-3" /></button></div>))}
                      </div>
                    )}
                    {selectedMedications.length > 0 && (<button onClick={handleSendPrescriptions} className="mt-2 w-full py-1.5 bg-green-100 text-green-700 rounded-lg text-sm">Print Prescription</button>)}
                  </div>

                  <div><label className="block font-semibold mb-2">Treatment Plan</label><textarea rows="2" value={consultationData.treatment} onChange={(e) => setConsultationData({...consultationData, treatment: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Recommended treatment..."></textarea></div>
                  <div><label className="block font-semibold mb-2">Additional Notes</label><textarea rows="2" value={consultationData.notes} onChange={(e) => setConsultationData({...consultationData, notes: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Any additional notes..."></textarea></div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button onClick={handleSendPrescriptions} className="px-4 py-2 bg-green-600 text-white rounded-lg">Print Prescription</button>
                {selectedLabTests.length > 0 && <button onClick={handlePrintLabRequest} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Print Lab Request</button>}
                <button onClick={handleCompleteConsultation} disabled={!isDraftSaved} className="px-4 py-2 bg-[#D01A2B] text-white rounded-lg disabled:opacity-50">Complete Consultation</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Print Modal */}
      {showPrescriptionPrint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center"><Printer className="w-16 h-16 text-green-600 mx-auto mb-4" /><h3 className="text-xl font-bold mb-2">Print Prescription</h3><p className="text-gray-500 mb-4">Print prescription for {selectedPatient?.childName}?</p><div className="flex space-x-3"><button onClick={() => setShowPrescriptionPrint(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button><button onClick={handlePrintPrescription} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg">Print</button></div></div>
        </div>
      )}

      {/* Lab Request Print Modal */}
      {showLabRequestPrint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center"><Printer className="w-16 h-16 text-purple-600 mx-auto mb-4" /><h3 className="text-xl font-bold mb-2">Print Lab Request</h3><p className="text-gray-500 mb-4">Print lab request for {selectedPatient?.childName}?</p><div className="flex space-x-3"><button onClick={() => setShowLabRequestPrint(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button><button onClick={handlePrintLabRequest} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg">Print</button></div></div>
        </div>
      )}

      {/* Diagnoses Selection Modal */}
      {showDiagnosesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <div><h3 className="text-xl font-bold text-gray-900">Select Diagnoses</h3><p className="text-xs text-gray-500 mt-0.5">Choose diagnoses for this consultation</p></div>
              <button onClick={() => setShowDiagnosesModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b bg-gray-50">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search diagnoses..." value={modalSearchTerm} onChange={(e) => setModalSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B] focus:border-transparent text-sm" autoFocus /></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const groupedDiagnoses = filteredDiagnosesModal.reduce((groups, diagnosis) => {
                  const category = diagnosis.category || 'General';
                  if (!groups[category]) groups[category] = [];
                  groups[category].push(diagnosis);
                  return groups;
                }, {});
                return Object.entries(groupedDiagnoses).map(([category, diagnoses]) => (
                  <div key={category} className="mb-5">
                    <h4 className="text-sm font-semibold text-blue-700 mb-2 sticky top-0 bg-white py-1 border-b border-blue-200">{category}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                      {diagnoses.map(diagnosis => (
                        <label key={diagnosis._id} className={`flex items-center p-2 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${selectedDiagnoses.find(d => d._id === diagnosis._id) ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="checkbox" checked={!!selectedDiagnoses.find(d => d._id === diagnosis._id)} onChange={() => handleToggleDiagnosis(diagnosis)} className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 flex-shrink-0" />
                          <span className="ml-1.5 text-xs text-gray-700 truncate" title={diagnosis.name}>{diagnosis.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ));
              })()}
              {filteredDiagnosesModal.length === 0 && (<div className="text-center py-8 text-gray-500"><AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p className="text-sm">No diagnoses found</p></div>)}
            </div>
            <div className="p-3 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-500">{selectedDiagnoses.length} diagnosis(es) selected</div>
              <button onClick={() => setShowDiagnosesModal(false)} className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Tests Selection Modal */}
      {showLabTestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <div><h3 className="text-xl font-bold text-gray-900">Select Lab Tests</h3><p className="text-xs text-gray-500 mt-0.5">Choose tests to send to laboratory</p></div>
              <button onClick={() => setShowLabTestsModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b bg-gray-50">
              <div className="flex gap-2 mb-3">
                <button onClick={() => setLabTestType('inventory')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${labTestType === 'inventory' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>From Inventory</button>
                <button onClick={() => setLabTestType('custom')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${labTestType === 'custom' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Custom Test</button>
              </div>
              {labTestType === 'inventory' ? (
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search lab tests..." value={modalSearchTerm} onChange={(e) => setModalSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" autoFocus /></div>
              ) : (
                <div className="space-y-3 bg-white p-4 rounded-lg border">
                  <input type="text" placeholder="Test name" value={customLabTest.name} onChange={(e) => setCustomLabTest({ ...customLabTest, name: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
                  <textarea placeholder="Additional notes" value={customLabTest.notes} onChange={(e) => setCustomLabTest({ ...customLabTest, notes: e.target.value })} className="w-full p-2 border rounded-lg text-sm" rows="2" />
                  <button onClick={handleAddCustomLabTest} className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm">+ Add Custom Test</button>
                </div>
              )}
            </div>
            {labTestType === 'inventory' && (
              <div className="flex-1 overflow-y-auto p-4">
                {(() => {
                  const groupedTests = filteredLabTestsModal.reduce((groups, test) => {
                    const category = test.category || 'Uncategorized';
                    if (!groups[category]) groups[category] = [];
                    groups[category].push(test);
                    return groups;
                  }, {});
                  return Object.entries(groupedTests).map(([category, tests]) => (
                    <div key={category} className="mb-5">
                      <h4 className="text-sm font-semibold text-purple-700 mb-2 border-b border-purple-200">{category}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                        {tests.map(test => (
                          <label key={test._id} className={`flex items-center p-2 border rounded-lg cursor-pointer ${selectedLabTests.find(t => t._id === test._id) ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                            <input type="checkbox" checked={!!selectedLabTests.find(t => t._id === test._id)} onChange={() => handleToggleLabTest(test)} className="w-3.5 h-3.5 text-purple-600 rounded" />
                            <span className="ml-1.5 text-xs text-gray-700 truncate">{test.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
            <div className="p-3 border-t bg-gray-50 flex justify-between">
              <div className="text-xs text-gray-500">{selectedLabTests.length} test(s) selected</div>
              <button onClick={() => setShowLabTestsModal(false)} className="px-4 py-1.5 border rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Medications Selection Modal */}
      {showMedicationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-2xl flex-shrink-0">
              <div><h3 className="text-xl font-bold text-gray-900">Select Medications</h3><p className="text-xs text-gray-500">Choose medications and add prescription details</p></div>
              <button onClick={() => setShowMedicationsModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b bg-gray-50 flex-shrink-0">
              <div className="flex gap-2 mb-3">
                <button onClick={() => setPrescriptionType('inventory')} className={`px-4 py-1.5 rounded-lg text-sm ${prescriptionType === 'inventory' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>From Inventory</button>
                <button onClick={() => setPrescriptionType('custom')} className={`px-4 py-1.5 rounded-lg text-sm ${prescriptionType === 'custom' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Custom Medication</button>
              </div>
              {prescriptionType === 'inventory' ? (
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search medications..." value={modalSearchTerm} onChange={(e) => setModalSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" autoFocus /></div>
              ) : (
                <div className="space-y-3 bg-white p-4 rounded-lg border">
                  <input type="text" placeholder="Medication name" value={customMedication.name} onChange={(e) => setCustomMedication({ ...customMedication, name: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Dosage" value={customMedication.dosage} onChange={(e) => setCustomMedication({ ...customMedication, dosage: e.target.value })} className="p-2 border rounded-lg text-sm" />
                    <input type="text" placeholder="Frequency" value={customMedication.frequency} onChange={(e) => setCustomMedication({ ...customMedication, frequency: e.target.value })} className="p-2 border rounded-lg text-sm" />
                    <input type="text" placeholder="Duration" value={customMedication.duration} onChange={(e) => setCustomMedication({ ...customMedication, duration: e.target.value })} className="p-2 border rounded-lg text-sm" />
                    <select value={customMedication.route} onChange={(e) => setCustomMedication({ ...customMedication, route: e.target.value })} className="p-2 border rounded-lg text-sm"><option value="">Route</option><option value="Oral">Oral</option><option value="IV">IV</option><option value="IM">IM</option><option value="Topical">Topical</option></select>
                  </div>
                  <textarea placeholder="Instructions" value={customMedication.instructions} onChange={(e) => setCustomMedication({ ...customMedication, instructions: e.target.value })} className="w-full p-2 border rounded-lg text-sm" rows="2" />
                  <button onClick={handleAddCustomMedication} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm">+ Add Custom Medication</button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 p-4">
              {prescriptionType === 'inventory' && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Available Medications</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {filteredMedicationsModal.map(med => (
                        <label key={med._id} className={`flex items-center p-2 border rounded-lg cursor-pointer ${selectedMedications.find(m => m.id === med._id) ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                          <input type="checkbox" checked={!!selectedMedications.find(m => m.id === med._id)} onChange={() => handleToggleMedication({...med, id: med._id})} className="w-3.5 h-3.5 text-green-600 rounded" />
                          <div className="ml-2 flex-1">
                            <span className="text-xs font-medium text-gray-800">{med.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({med.category})</span>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>
              )}
              {selectedMedications.length > 0 && (
                <div className="mt-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left font-semibold">Medication</th>
                          <th className="p-2 text-left font-semibold">Dosage</th>
                          <th className="p-2 text-left font-semibold">Frequency</th>
                          <th className="p-2 text-left font-semibold">Duration</th>
                          <th className="p-2 text-left font-semibold">Route</th>
                          <th className="p-2 text-left font-semibold">Instructions</th>
                          <th className="p-2 text-center font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMedications.map((med, idx) => (
                          <tr key={med.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="p-2"><span className="font-medium text-gray-800">{med.name}</span>{med.isCustom && <span className="ml-1 text-xs bg-yellow-200 text-yellow-800 px-1 rounded">Custom</span>}</td>
                            <td className="p-2"><input type="text" placeholder="Dosage" value={med.dosage || ''} onChange={(e) => handleUpdateMedication(med.id, 'dosage', e.target.value)} className="w-full p-1.5 border rounded text-sm focus:ring-2 focus:ring-[#D01A2B] focus:outline-none" /></td>
                            <td className="p-2"><input type="text" placeholder="e.g., 2x3" value={med.frequency || ''} onChange={(e) => handleUpdateMedication(med.id, 'frequency', e.target.value)} className="w-full p-1.5 border rounded text-sm focus:ring-2 focus:ring-[#D01A2B] focus:outline-none" /></td>
                            <td className="p-2"><input type="text" placeholder="e.g., 7 days" value={med.duration || ''} onChange={(e) => handleUpdateMedication(med.id, 'duration', e.target.value)} className="w-full p-1.5 border rounded text-sm focus:ring-2 focus:ring-[#D01A2B] focus:outline-none" /></td>
                            <td className="p-2"><select value={med.route || ''} onChange={(e) => handleUpdateMedication(med.id, 'route', e.target.value)} className="w-full p-1.5 border rounded text-sm focus:ring-2 focus:ring-[#D01A2B] focus:outline-none"><option value="">Select</option><option value="Oral">Oral</option><option value="IV">IV</option><option value="IM">IM</option><option value="Subcutaneous">Subcutaneous</option><option value="Topical">Topical</option><option value="Inhalation">Inhalation</option><option value="Rectal">Rectal</option></select></td>
                            <td className="p-2"><input type="text" placeholder="Instructions" value={med.instructions || ''} onChange={(e) => handleUpdateMedication(med.id, 'instructions', e.target.value)} className="w-full p-1.5 border rounded text-sm focus:ring-2 focus:ring-[#D01A2B] focus:outline-none" /></td>
                            <td className="p-2 text-center"><button onClick={() => handleRemoveMedication(med.id)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center rounded-b-2xl flex-shrink-0">
              <div className="text-sm">{selectedMedications.length} medication(s) selected</div>
              <button onClick={() => { setShowMedicationsModal(false); if (selectedMedications.length > 0) toast.success(`${selectedMedications.length} medication(s) added`); }} className="px-5 py-2 bg-green-600 text-white rounded-lg">Done ({selectedMedications.length})</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorConsultation;

// /in-pati