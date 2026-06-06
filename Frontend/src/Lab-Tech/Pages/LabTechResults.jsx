import React, { useState, useEffect } from 'react';
import { 
  Heart, CheckCircle, LogOut, Search, Eye, Package, 
  ClipboardList, AlertTriangle, RefreshCw, ChevronLeft, 
  ChevronRight, X, Loader, FileText, User, Clock, 
  Menu, ArrowLeft, Pill, Truck, Plus, Microscope,
  TestTube, FileCheck, AlertCircle, Download, Printer,
  Calendar, Activity, TrendingUp, TrendingDown, Users,
  Home, Settings, Bell, Edit, Trash2, BarChart3, Shield,
  Stethoscope, Syringe, Droplet, Brain, Bone,
  FlaskConical, Scissors, Thermometer, HeartPulse,
  Filter, Send, MessageCircle, Phone, Mail, MapPin,
  Award, Star, Building2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const LabTechResults = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [testRequests, setTestRequests] = useState([]);
  const [groupedByPatient, setGroupedByPatient] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('completed');
  const [filterDate, setFilterDate] = useState('');
  const [selectedPatientGroup, setSelectedPatientGroup] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalPending: 0,
    abnormalResults: 0,
    thisWeek: 0,
    thisMonth: 0,
    uniquePatients: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (user?.role !== 'lab-tech') {
      navigate('/');
      return;
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    fetchCompletedTests();
  }, []);

  const convertMapToObject = (map) => {
    if (!map) return {};
    if (typeof map === 'object' && !Array.isArray(map)) {
      return map;
    }
    return {};
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

  const fetchCompletedTests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/lab-requests?status=completed`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const testsWithRanges = await Promise.all(data.data.map(async (test) => {
          try {
            const labTestResponse = await fetch(`${API_BASE_URL}/api/lab-tests/by-name/${encodeURIComponent(test.testName)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!labTestResponse.ok) {
              console.warn(`Lab test "${test.testName}" not found in database`);
              return {
                id: test._id,
                requestId: test.requestId,
                testName: test.testName,
                patientName: test.patientName,
                patientAge: test.patientAge,
                parentName: test.parentName,
                parentPhone: test.parentPhone,
                requestedBy: test.requestedBy,
                requestDate: test.requestDate,
                completedAt: test.completedAt,
                performedBy: test.performedBy,
                results: convertMapToObject(test.results),
                notes: test.notes || test.additionalComments,
                status: test.status,
                resultType: 'text',
                parameters: [],
                normalRange: null,
                unit: ''
              };
            }
            
            const labTestData = await labTestResponse.json();
            const testDef = labTestData.data;
            
            return {
              id: test._id,
              requestId: test.requestId,
              testName: test.testName,
              patientName: test.patientName,
              patientAge: test.patientAge,
              parentName: test.parentName,
              parentPhone: test.parentPhone,
              requestedBy: test.requestedBy,
              requestDate: test.requestDate,
              completedAt: test.completedAt,
              performedBy: test.performedBy,
              results: convertMapToObject(test.results),
              notes: test.notes || test.additionalComments,
              status: test.status,
              resultType: testDef?.resultType || 'text',
              parameters: testDef?.parameters || [],
              normalRange: testDef?.normalRange || null,
              unit: testDef?.unit || ''
            };
          } catch (error) {
            console.error(`Error fetching lab test for ${test.testName}:`, error);
            return {
              id: test._id,
              requestId: test.requestId,
              testName: test.testName,
              patientName: test.patientName,
              patientAge: test.patientAge,
              parentName: test.parentName,
              parentPhone: test.parentPhone,
              requestedBy: test.requestedBy,
              requestDate: test.requestDate,
              completedAt: test.completedAt,
              performedBy: test.performedBy,
              results: convertMapToObject(test.results),
              notes: test.notes || test.additionalComments,
              status: test.status,
              resultType: 'text',
              parameters: [],
              normalRange: null,
              unit: ''
            };
          }
        }));
        
        setTestRequests(testsWithRanges);
        groupByPatient(testsWithRanges);
        calculateStats(testsWithRanges);
      } else {
        toast.error(data.msg || 'Failed to load test results');
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
      toast.error('Failed to load test results. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const groupByPatient = (tests) => {
    const grouped = {};
    tests.forEach(test => {
      const patientKey = test.patientName;
      if (!grouped[patientKey]) {
        grouped[patientKey] = {
          patientId: patientKey,
          patientName: test.patientName,
          patientAge: test.patientAge,
          parentName: test.parentName,
          parentPhone: test.parentPhone,
          tests: [],
          completedDates: []
        };
      }
      grouped[patientKey].tests.push(test);
      if (test.completedAt) {
        grouped[patientKey].completedDates.push(new Date(test.completedAt));
      }
    });
    setGroupedByPatient(Object.values(grouped));
  };

  const calculateStats = (tests) => {
    const completedTests = tests.filter(t => t.status === 'completed');
    const pendingTests = tests.filter(t => t.status === 'pending' || t.status === 'in-progress');
    
    let abnormalCount = 0;
    completedTests.forEach(test => {
      if (test.resultType === 'multi' && test.parameters) {
        test.parameters.forEach(param => {
          const resultValue = test.results?.[param.name];
          if (param.normalRangeMin !== undefined && resultValue) {
            const numValue = parseFloat(resultValue);
            if (numValue < param.normalRangeMin || numValue > param.normalRangeMax) {
              abnormalCount++;
            }
          }
        });
      } else {
        const resultValue = Object.values(test.results || {})[0];
        if (test.normalRange && resultValue && !isValueInRange(resultValue, test.normalRange)) {
          abnormalCount++;
        }
      }
    });
    
    const now = new Date();
    const thisWeek = completedTests.filter(t => {
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      const diffTime = Math.abs(now - completedDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;
    
    const thisMonth = completedTests.filter(t => {
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate.getMonth() === now.getMonth() && 
             completedDate.getFullYear() === now.getFullYear();
    }).length;
    
    const uniquePatients = new Set(completedTests.map(t => t.patientName)).size;
    
    setStats({
      totalCompleted: completedTests.length,
      totalPending: pendingTests.length,
      abnormalResults: abnormalCount,
      thisWeek: thisWeek,
      thisMonth: thisMonth,
      uniquePatients: uniquePatients
    });
  };

  const getResultStatusForTest = (test) => {
    if (!test.results || test.status !== 'completed') return 'pending';
    
    if (test.resultType === 'multi' && test.parameters) {
      let hasAbnormal = false;
      test.parameters.forEach(param => {
        const resultValue = test.results?.[param.name];
        if (param.normalRangeMin !== undefined && resultValue) {
          const numValue = parseFloat(resultValue);
          if (numValue < param.normalRangeMin || numValue > param.normalRangeMax) {
            hasAbnormal = true;
          }
        } else if (param.resultType === 'qualitative' && param.qualitativeOptions) {
          if (resultValue && (resultValue === 'Positive' || resultValue === 'Reactive' || resultValue === 'Detected')) {
            // Mark as abnormal for educational purposes - can be adjusted
          }
        }
      });
      return hasAbnormal ? 'abnormal' : 'normal';
    }
    
    const resultValue = Object.values(test.results)[0];
    if (test.normalRange && resultValue && !isValueInRange(resultValue, test.normalRange)) {
      return 'abnormal';
    }
    return 'normal';
  };

  const getResultStatusBadge = (status) => {
    switch(status) {
      case 'normal':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><CheckCircle className="w-3 h-3" /><span>Normal</span></span>;
      case 'abnormal':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1"><AlertCircle className="w-3 h-3" /><span>Abnormal</span></span>;
      default:
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>;
    }
  };

  const handleViewPatientDetails = (patientGroup) => {
    setSelectedPatientGroup(patientGroup);
    setShowDetailsModal(true);
  };

  const generateLabRef = () => {
    return `RL${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  };

  const formatDateForReport = (date) => {
    if (!date) return new Date().toLocaleDateString('en-GB');
    const d = new Date(date);
    return d.toLocaleDateString('en-GB');
  };

  // Print function for a single test (used in expanded view and modal)
  const printSingleTest = (test) => {
    const printWindow = window.open('', '_blank');
    const labRef = generateLabRef();
    const reportDate = formatDateForReport(new Date());
    const examinedDate = test.completedAt ? formatDateForReport(test.completedAt) : reportDate;
    
    // Get the appropriate requester name based on source
    const isFromReception = test.requestedBy?.includes('Reception') || !test.requestedBy?.startsWith('Dr.');
    const requesterDisplay = isFromReception ? '' : test.requestedBy;
    
    let resultValue = 'N/A';
    let isAbnormal = false;
    let flag = '';
    
    if (test.resultType === 'multi' && test.parameters && test.parameters.length > 0) {
      // For multi-parameter tests, we'll show all parameters
      resultValue = 'See detailed results below';
    } else {
      resultValue = Object.values(test.results || {})[0] || 'N/A';
      isAbnormal = test.normalRange && resultValue !== 'N/A' && !isValueInRange(resultValue, test.normalRange);
      if (isAbnormal) {
        const numValue = parseFloat(resultValue);
        const rangeParts = test.normalRange?.split('-');
        if (rangeParts && rangeParts.length === 2) {
          flag = numValue < parseFloat(rangeParts[0]) ? 'L' : 'H';
        } else {
          flag = 'Abnormal';
        }
      }
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REYS CLINIC - Lab Report - ${test.testName} - ${test.patientName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Times New Roman', 'Georgia', 'Arial', sans-serif;
              background: #e6e9ef;
              padding: 0;
              margin: 0;
              font-size: 14px;
              line-height: 1.5;
            }
            .report {
              max-width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              background: white;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            .report-content {
              padding: 15mm 12mm;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #c0392b;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .logo-slogan-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 5px;
            }
            .logo-img {
              max-width: 100px;
              height: auto;
              margin-bottom: 5px;
            }
            .clinic-slogan {
              font-size: 13px;
              font-style: italic;
              color: #555;
              letter-spacing: 1px;
            }
            .doctor-name {
              font-size: 14px;
              font-weight: bold;
              color: #333;
              margin-top: 8px;
              margin-bottom: 5px;
            }
            .clinic-address {
              font-size: 11px;
              color: #555;
              margin-top: 8px;
            }
            .contact-info {
              font-size: 11px;
              color: #555;
              margin-top: 3px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              margin: 15px 0;
              padding: 12px;
              background: #f8f9fa;
              border: 1px solid #dee2e6;
            }
            .info-row {
              display: flex;
              align-items: baseline;
              font-size: 12px;
            }
            .info-label {
              font-weight: bold;
              width: 110px;
              min-width: 110px;
              color: #333;
            }
            .info-value {
              color: #212529;
              font-weight: normal;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              padding: 8px 12px;
              background: #f1f3f5;
              border-bottom: 1px solid #dee2e6;
              color: #c0392b;
              margin-top: 15px;
              margin-bottom: 8px;
            }
            .test-table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
            }
            .test-table th {
              background: #e9ecef;
              padding: 8px 10px;
              text-align: left;
              font-weight: bold;
              font-size: 11px;
              border-bottom: 1px solid #dee2e6;
              text-transform: uppercase;
            }
            .test-table td {
              padding: 6px 10px;
              border-bottom: 1px solid #f1f3f5;
              font-size: 12px;
            }
            .test-table tr:last-child td {
              border-bottom: none;
            }
            .parameter-name {
              font-weight: 500;
              width: 35%;
            }
            .result-value {
              width: 30%;
              font-weight: bold;
              color: #000;
            }
            .reference-range {
              width: 35%;
              color: #333;
            }
            .footer {
              margin-top: 20px;
              padding: 12px;
              border-top: 1px solid #dee2e6;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            .signature-area {
              margin-top: 20px;
              padding: 12px;
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #dee2e6;
            }
            .signature {
              font-size: 11px;
              text-align: center;
            }
            .signature-line {
              margin-top: 25px;
              width: 180px;
              border-top: 1px solid #000;
            }
            @media print {
              body {
                background: white;
                padding: 0;
                margin: 0;
              }
              .report {
                box-shadow: none;
                margin: 0;
                max-width: 100%;
              }
              .report-content {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
            @page {
              size: A4;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="report-content">
              <div class="header">
                <div class="logo-slogan-container">
                  <img src="${logo}" alt="REYS CLINIC Logo" class="logo-img" style="max-width: 250px; height: auto;" />
                  <div class="clinic-slogan">Quality Care, Trusted Service</div>
                </div>
                ${requesterDisplay ? `<div class="doctor-name">${requesterDisplay}</div>` : ''}
                <div class="clinic-address">NBC, Albarako, Hodan, Mogadishu, Somalia</div>
                <div class="contact-info">Tel: 612674455 | 611477201</div>
              </div>
              
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Patient Name:</span>
                  <span class="info-value">${test.patientName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Patient ID:</span>
                  <span class="info-value">${test.requestId?.slice(-6) || Math.floor(Math.random() * 10000)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Age:</span>
                  <span class="info-value">${test.patientAge || 'N/A'} Years</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Gender:</span>
                  <span class="info-value">${test.gender || 'Not specified'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Referred by:</span>
                  <span class="info-value">${test.requestedBy || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Lab Ref:</span>
                  <span class="info-value">${labRef}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Examined Date:</span>
                  <span class="info-value">${examinedDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Report Date:</span>
                  <span class="info-value">${reportDate}</span>
                </div>
              </div>
              
              <div class="section-title">${test.testName}</div>
              
              ${test.resultType === 'multi' && test.parameters && test.parameters.length > 0 ? `
                <table class="test-table">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Result</th>
                      <th>Reference Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${test.parameters.map(param => {
                      const paramResult = test.results?.[param.name] || 'N/A';
                      let paramIsAbnormal = false;
                      let paramFlag = '';
                      
                      if (param.resultType === 'quantitative') {
                        const numValue = parseFloat(paramResult);
                        if (param.normalRangeMin !== undefined && param.normalRangeMax !== undefined && !isNaN(numValue)) {
                          if (numValue < param.normalRangeMin) {
                            paramIsAbnormal = true;
                            paramFlag = 'L';
                          } else if (numValue > param.normalRangeMax) {
                            paramIsAbnormal = true;
                            paramFlag = 'H';
                          }
                        }
                      } else if (param.resultType === 'qualitative' && param.qualitativeOptions) {
                        if (paramResult === 'Positive' || paramResult === 'Reactive' || paramResult === 'Detected') {
                          paramIsAbnormal = true;
                          paramFlag = 'Abnormal';
                        }
                      }
                      
                      const rangeText = param.resultType === 'quantitative' 
                        ? `${param.normalRangeMin || '?'} - ${param.normalRangeMax || '?'} ${param.unit || ''}`
                        : param.resultType === 'qualitative' 
                          ? param.qualitativeOptions?.join('/') || 'N/A'
                          : param.categoricalOptions?.join('/') || 'N/A';
                      
                      return `
                        <tr>
                          <td class="parameter-name">${param.name}</td>
                          <td class="result-value" style="${paramIsAbnormal ? 'color: #c0392b;' : ''}">
                            <strong>${paramResult} ${param.unit || ''}</strong>
                            ${paramFlag ? `<span style="margin-left: 8px; font-weight: bold; color: #c0392b;">[${paramFlag}]</span>` : ''}
                          </td>
                          <td class="reference-range">${rangeText}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              ` : `
                <table class="test-table">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Result</th>
                      <th>Reference Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="parameter-name">${test.testName}</td>
                      <td class="result-value" style="${isAbnormal ? 'color: #c0392b;' : ''}">
                        <strong>${resultValue} ${test.unit || ''}</strong>
                        ${flag ? `<span style="margin-left: 8px; font-weight: bold; color: #c0392b;">[${flag}]</span>` : ''}
                      </td>
                      <td class="reference-range">${test.normalRange || 'Not specified'}</td>
                    </tr>
                  </tbody>
                </table>
              `}
              
              ${test.notes ? `
                <div class="section-title">COMMENTS / NOTES</div>
                <div style="padding: 10px 12px;">
                  <p style="font-size: 12px; color: #555;">${test.notes}</p>
                </div>
              ` : ''}
              
              <div class="signature-area">
                <div class="signature">
                  <div class="signature-line"></div>
                  <div>Lab Technician Signature</div>
                </div>
                <div class="signature">
                  <div class="signature-line"></div>
                  <div>Verified By</div>
                </div>
              </div>
              
              <div class="footer">
                <p>** END OF REPORT **</p>
                <p>Thank you for choosing REYS CLINIC</p>
              </div>
            </div>
          </div>
          <div style="text-align: center; margin: 15px 0; padding: 10px;" class="no-print">
            <button onclick="window.print()" style="padding: 10px 30px; background: #D01A2B; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; margin-right: 10px;">🖨️ Print Report</button>
            <button onclick="window.close()" style="padding: 10px 30px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">Close</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printProfessionalReport = (patientGroup) => {
    const printWindow = window.open('', '_blank');
    const labRef = generateLabRef();
    const reportDate = formatDateForReport(new Date());
    const examinedDate = patientGroup.tests[0]?.completedAt ? formatDateForReport(patientGroup.tests[0].completedAt) : reportDate;
    
    // Get the appropriate requester name - if from reception, don't display name, only if from Dr
    const firstTest = patientGroup.tests[0];
    const isFromReception = firstTest.requestedBy?.includes('Reception') || !firstTest.requestedBy?.startsWith('Dr.');
    const requesterDisplay = isFromReception ? '' : firstTest.requestedBy;
    
    // Group tests by category
    const categorizedTests = {};
    patientGroup.tests.forEach(test => {
      let category = 'LABORATORY TESTS';
      if (test.testName.toLowerCase().includes('cbc') || test.testName.toLowerCase().includes('blood count')) {
        category = 'HAEMATOLOGY REPORT';
      } else if (test.testName.toLowerCase().includes('stool') || test.testName.toLowerCase().includes('stool exam')) {
        category = 'STOOL LETTER REPORT';
      } else if (test.testName.toLowerCase().includes('crea') || test.testName.toLowerCase().includes('urea') || 
                 test.testName.toLowerCase().includes('hba1c') || test.testName.toLowerCase().includes('lipid') ||
                 test.testName.toLowerCase().includes('calcium') || test.testName.toLowerCase().includes('hdl') ||
                 test.testName.toLowerCase().includes('ldl') || test.testName.toLowerCase().includes('iron')) {
        category = 'BIOCHEMISTRY REPORT';
      } else {
        category = test.testName;
      }
      
      if (!categorizedTests[category]) {
        categorizedTests[category] = [];
      }
      categorizedTests[category].push(test);
    });
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REYS CLINIC - Lab Report - ${patientGroup.patientName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Times New Roman', 'Georgia', 'Arial', sans-serif;
              background: #e6e9ef;
              padding: 0;
              margin: 0;
              font-size: 14px;
              line-height: 1.5;
            }
            .report {
              max-width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              background: white;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            .report-content {
              padding: 15mm 12mm;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #c0392b;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .logo-slogan-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 5px;
            }
            .logo-img {
              max-width: 100px;
              height: auto;
              margin-bottom: 5px;
            }
            .clinic-slogan {
              font-size: 13px;
              font-style: italic;
              color: #555;
              letter-spacing: 1px;
            }
            .doctor-name {
              font-size: 14px;
              font-weight: bold;
              color: #333;
              margin-top: 8px;
              margin-bottom: 5px;
            }
            .clinic-address {
              font-size: 11px;
              color: #555;
              margin-top: 8px;
            }
            .contact-info {
              font-size: 11px;
              color: #555;
              margin-top: 3px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              margin: 15px 0;
              padding: 12px;
              background: #f8f9fa;
              border: 1px solid #dee2e6;
            }
            .info-row {
              display: flex;
              align-items: baseline;
              font-size: 12px;
            }
            .info-label {
              font-weight: bold;
              width: 110px;
              min-width: 110px;
              color: #333;
            }
            .info-value {
              color: #212529;
              font-weight: normal;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              padding: 8px 12px;
              background: #f1f3f5;
              border-bottom: 1px solid #dee2e6;
              color: #c0392b;
              margin-top: 15px;
              margin-bottom: 8px;
            }
            .test-table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
            }
            .test-table th {
              background: #e9ecef;
              padding: 8px 10px;
              text-align: left;
              font-weight: bold;
              font-size: 11px;
              border-bottom: 1px solid #dee2e6;
              text-transform: uppercase;
            }
            .test-table td {
              padding: 6px 10px;
              border-bottom: 1px solid #f1f3f5;
              font-size: 12px;
            }
            .test-table tr:last-child td {
              border-bottom: none;
            }
            .parameter-name {
              font-weight: 500;
              width: 35%;
            }
            .result-value {
              width: 30%;
              font-weight: bold;
              color: #000;
            }
            .reference-range {
              width: 35%;
              color: #333;
            }
            .footer {
              margin-top: 20px;
              padding: 12px;
              border-top: 1px solid #dee2e6;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            .signature-area {
              margin-top: 20px;
              padding: 12px;
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #dee2e6;
            }
            .signature {
              font-size: 11px;
              text-align: center;
            }
            .signature-line {
              margin-top: 25px;
              width: 180px;
              border-top: 1px solid #000;
            }
            @media print {
              body {
                background: white;
                padding: 0;
                margin: 0;
              }
              .report {
                box-shadow: none;
                margin: 0;
                max-width: 100%;
              }
              .report-content {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
            @page {
              size: A4;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="report-content">
              <div class="header">
                <div class="logo-slogan-container">
                  <img src="${logo}" alt="REYS CLINIC Logo" class="logo-img" style="max-width: 250px; height: auto;" />
                  <div class="clinic-slogan">Quality Care, Trusted Service</div>
                </div>
                ${requesterDisplay ? `<div class="doctor-name">${requesterDisplay}</div>` : ''}
                <div class="clinic-address">NBC, Albarako, Hodan, Mogadishu, Somalia</div>
                <div class="contact-info">Tel: 612674455 | 611477201</div>
              </div>
              
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Patient Name:</span>
                  <span class="info-value">${patientGroup.patientName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Patient ID:</span>
                  <span class="info-value">P${patientGroup.patientId?.slice(-6) || Math.floor(Math.random() * 10000)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Age:</span>
                  <span class="info-value">${patientGroup.patientAge || 'N/A'} Years</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Gender:</span>
                  <span class="info-value">${patientGroup.gender || 'Not specified'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Referred by:</span>
                  <span class="info-value">${patientGroup.tests[0]?.requestedBy || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Lab Ref:</span>
                  <span class="info-value">${labRef}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Examined Date:</span>
                  <span class="info-value">${examinedDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Report Date:</span>
                  <span class="info-value">${reportDate}</span>
                </div>
              </div>
              
              ${Object.entries(categorizedTests).map(([category, tests]) => `
                <div class="section-title">${category}</div>
                <table class="test-table">
                  <thead>
                    <tr>
                      <th>Test / Parameter</th>
                      <th>Result</th>
                      <th>Reference Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tests.map(test => {
                      if (test.resultType === 'multi' && test.parameters && test.parameters.length > 0) {
                        return test.parameters.map(param => {
                          const resultValue = test.results?.[param.name] || 'N/A';
                          let isAbnormal = false;
                          let flag = '';
                          
                          if (param.resultType === 'quantitative') {
                            const numValue = parseFloat(resultValue);
                            if (param.normalRangeMin !== undefined && param.normalRangeMax !== undefined && !isNaN(numValue)) {
                              if (numValue < param.normalRangeMin) {
                                isAbnormal = true;
                                flag = 'L';
                              } else if (numValue > param.normalRangeMax) {
                                isAbnormal = true;
                                flag = 'H';
                              }
                            }
                          } else if (param.resultType === 'qualitative' && param.qualitativeOptions) {
                            if (resultValue === 'Positive' || resultValue === 'Reactive' || resultValue === 'Detected') {
                              isAbnormal = true;
                              flag = 'Abnormal';
                            }
                          }
                          
                          const rangeText = param.resultType === 'quantitative' 
                            ? `${param.normalRangeMin || '?'} - ${param.normalRangeMax || '?'} ${param.unit || ''}`
                            : param.resultType === 'qualitative' 
                              ? param.qualitativeOptions?.join('/') || 'N/A'
                              : param.categoricalOptions?.join('/') || 'N/A';
                          
                          return `
                            <tr>
                              <td class="parameter-name">${param.name}</td>
                              <td class="result-value" style="${isAbnormal ? 'color: #c0392b;' : ''}">
                                <strong>${resultValue} ${param.unit || ''}</strong>
                                ${flag ? `<span style="margin-left: 8px;">[${flag}]</span>` : ''}
                              </td>
                              <td class="reference-range">${rangeText}</td>
                            </tr>
                          `;
                        }).join('');
                      } else {
                        const resultValue = Object.values(test.results || {})[0] || 'N/A';
                        const isAbnormal = test.normalRange && resultValue !== 'N/A' && !isValueInRange(resultValue, test.normalRange);
                        const flag = isAbnormal ? (parseFloat(resultValue) < parseFloat(test.normalRange?.split('-')[0]) ? 'L' : 'H') : '';
                        
                        return `
                          <tr>
                            <td class="parameter-name">${test.testName}</td>
                            <td class="result-value" style="${isAbnormal ? 'color: #c0392b;' : ''}">
                              <strong>${resultValue} ${test.unit || ''}</strong>
                              ${flag ? `<span style="margin-left: 8px;">[${flag}]</span>` : ''}
                            </td>
                            <td class="reference-range">${test.normalRange || 'N/A'}</td>
                          </tr>
                        `;
                      }
                    }).join('')}
                  </tbody>
                </table>
              `).join('')}
              
              ${patientGroup.tests.some(t => t.notes) ? `
                <div class="section-title">COMMENTS / NOTES</div>
                <div style="padding: 10px 12px;">
                  <p style="font-size: 12px; color: #555;">${patientGroup.tests.map(t => t.notes).filter(n => n).join('; ')}</p>
                </div>
              ` : ''}
              
              <div class="signature-area">
                <div class="signature">
                  <div class="signature-line"></div>
                  <div>Lab Technician Signature</div>
                </div>
                <div class="signature">
                  <div class="signature-line"></div>
                  <div>Verified By</div>
                </div>
              </div>
              
              <div class="footer">
                <p>** END OF REPORT **</p>
                <p>Thank you for choosing REYS CLINIC</p>
              </div>
            </div>
          </div>
          <div style="text-align: center; margin: 15px 0; padding: 10px;" class="no-print">
            <button onclick="window.print()" style="padding: 10px 30px; background: #D01A2B; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; margin-right: 10px;">🖨️ Print Report</button>
            <button onclick="window.close()" style="padding: 10px 30px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">Close</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAllResults = (patientGroup) => {
    printProfessionalReport(patientGroup);
  };

  const handleSendToRequester = async (patientGroup) => {
    const firstTest = patientGroup.tests[0];
    const isFromDoctor = firstTest.requestedBy?.startsWith('Dr.') || !firstTest.requestedBy?.includes('Reception');
    const recipient = isFromDoctor ? 'Doctor' : 'Reception';
    
    try {
      toast.success(`All test results sent to ${recipient} (${firstTest.requestedBy}) successfully`);
    } catch (error) {
      console.error('Error sending results:', error);
      toast.error('Failed to send results');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatShortId = (requestId) => {
    if (!requestId) return 'N/A';
    return requestId.slice(-8);
  };

  const filteredPatients = groupedByPatient.filter(patient => {
    const matchesSearch = 
      patient.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.tests.some(t => t.testName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesDate = true;
    if (filterDate) {
      const hasTestOnDate = patient.tests.some(test => {
        if (!test.completedAt) return false;
        const testDate = new Date(test.completedAt).toDateString();
        const selectedDate = new Date(filterDate).toDateString();
        return testDate === selectedDate;
      });
      matchesDate = hasTestOnDate;
    }
    
    return matchesSearch && matchesDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const goToPage = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleExport = () => {
    const completedTests = testRequests.filter(t => t.status === 'completed');
    if (completedTests.length === 0) {
      toast.warning('No completed tests to export');
      return;
    }
    
    const data = completedTests.map(test => ({
      'Patient Name': test.patientName,
      'Patient Age': test.patientAge,
      'Parent/Guardian': test.parentName,
      'Phone': test.parentPhone,
      'Test Name': test.testName,
      'Result': Object.values(test.results || {})[0] || 'N/A',
      'Normal Range': test.normalRange || 'N/A',
      'Requested By': test.requestedBy,
      'Completed Date': formatDate(test.completedAt),
      'Performed By': test.performedBy
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
    link.setAttribute('download', `lab_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Results exported successfully');
  };

  if (!isAuthenticated || user?.role !== 'lab-tech') {
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
                onClick={() => navigate('/labtech-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <img src={logo} alt="REYS CLINIC Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                  <p className="text-xs text-gray-500">Laboratory - Test Results</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={fetchCompletedTests}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FileCheck className="w-4 h-4 text-green-600" />
                <span>Test Results</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCompleted}</p>
            <p className="text-sm text-gray-500">Completed Tests</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.totalPending}</p>
            <p className="text-sm text-yellow-600">Pending Tests</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.abnormalResults}</p>
            <p className="text-sm text-red-600">Abnormal Results</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.thisWeek}</p>
            <p className="text-sm text-blue-600">This Week</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.thisMonth}</p>
            <p className="text-sm text-purple-600">This Month</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{stats.uniquePatients}</p>
            <p className="text-sm text-indigo-600">Patients</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name, parent name, or test name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
              />
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
            />
          </div>
        </div>

        {/* Grouped Patients Table */}
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tests</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Completed Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Requested By</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentPatients.map((patient) => {
                      const firstTest = patient.tests[0];
                      const isFromDoctor = firstTest.requestedBy?.startsWith('Dr.') || !firstTest.requestedBy?.includes('Reception');
                      const latestDate = patient.completedDates.length > 0 
                        ? new Date(Math.max(...patient.completedDates))
                        : null;
                      return (
                        <React.Fragment key={patient.patientId}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{patient.patientName}</p>
                                  <p className="text-xs text-gray-500">Age: {patient.patientAge} years</p>
                                  <p className="text-xs text-gray-400">Parent: {patient.parentName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-2">
                                {patient.tests.map((test, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                    <TestTube className="w-3 h-3 mr-1" />
                                    {test.testName}
                                  </span>
                                ))}
                              </div>
                              <button
                                onClick={() => setExpandedPatient(expandedPatient === patient.patientId ? null : patient.patientId)}
                                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                              >
                                {expandedPatient === patient.patientId ? 'Hide Details' : 'View Details'}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {latestDate ? formatDate(latestDate) : '-'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                {isFromDoctor ? (
                                  <>
                                    <Stethoscope className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-gray-700">{firstTest.requestedBy}</span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">Doctor</span>
                                  </>
                                ) : (
                                  <>
                                    <Users className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm text-gray-700">{firstTest.requestedBy}</span>
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">Reception</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewPatientDetails(patient)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => printProfessionalReport(patient)}
                                  className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                                >
                                  <Printer className="w-4 h-4 inline mr-1" />
                                  Print
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedPatient === patient.patientId && (
                            <tr className="bg-gray-50">
                              <td colSpan="5" className="px-6 py-4">
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900 mb-3">All Test Results for {patient.patientName}</h4>
                                  {patient.tests.map((test, idx) => {
                                    const resultStatus = getResultStatusForTest(test);
                                    const resultValue = Object.values(test.results || {})[0] || 'N/A';
                                    return (
                                      <div key={idx} className="border rounded-lg p-4 bg-white">
                                        <div className="flex justify-between items-start mb-3">
                                          <div>
                                            <div className="flex items-center space-x-2">
                                              <p className="font-semibold text-[#D01A2B]">{test.testName}</p>
                                              <span className="text-xs text-gray-500">ID: {formatShortId(test.requestId)}</span>
                                              {getResultStatusBadge(resultStatus)}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Requested By: {test.requestedBy}</p>
                                            <p className="text-xs text-gray-500">Completed: {formatDate(test.completedAt)}</p>
                                          </div>
                                          {/* Print button for each test */}
                                          <button
                                            onClick={() => printSingleTest(test)}
                                            className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center space-x-1"
                                          >
                                            <Printer className="w-3 h-3" />
                                            <span>Print Test</span>
                                          </button>
                                        </div>
                                        
                                        <div className="mt-3 pt-3 border-t">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className={`p-3 rounded ${resultStatus === 'abnormal' ? 'bg-red-50' : 'bg-green-50'}`}>
                                              <p className="text-xs text-gray-500">Result</p>
                                              <p className={`text-lg font-bold ${resultStatus === 'abnormal' ? 'text-red-700' : 'text-green-700'}`}>
                                                {resultValue} {test.unit}
                                              </p>
                                            </div>
                                            <div className="p-3 rounded bg-gray-50">
                                              <p className="text-xs text-gray-500">Normal Range</p>
                                              <p className="text-md font-semibold text-gray-700">{test.normalRange || 'Not specified'}</p>
                                            </div>
                                          </div>
                                          {test.notes && (
                                            <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                                              <p className="text-xs font-medium">Notes:</p>
                                              <p className="text-xs text-gray-600">{test.notes}</p>
                                            </div>
                                          )}
                                          <p className="text-xs text-gray-500 mt-2">
                                            Performed By: {test.performedBy || 'Lab Technician'} on {formatDate(test.completedAt)}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  
                                  <div className="flex space-x-3 mt-4">
                                    <button
                                      onClick={() => printProfessionalReport(patient)}
                                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center space-x-2"
                                    >
                                      <Printer className="w-4 h-4" />
                                      <span>Print All Reports</span>
                                    </button>
                                    <button
                                      onClick={() => handleSendToRequester(patient)}
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center space-x-2"
                                    >
                                      <Send className="w-4 h-4" />
                                      <span>Send to {isFromDoctor ? 'Doctor' : 'Reception'}</span>
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredPatients.length === 0 && (
                <div className="text-center py-12">
                  <FileCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No test results found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              )}

              {filteredPatients.length > 0 && (
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length} patients
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

      {/* Patient Details Modal */}
      {showDetailsModal && selectedPatientGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Test Results - {selectedPatientGroup.patientName}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Patient Name</p>
                    <p className="text-xl font-bold text-gray-900">{selectedPatientGroup.patientName}</p>
                    <p className="text-sm text-gray-600">Age: {selectedPatientGroup.patientAge} years</p>
                    <p className="text-sm text-gray-600">Parent: {selectedPatientGroup.parentName}</p>
                    <p className="text-sm text-gray-600">Phone: {selectedPatientGroup.parentPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Tests</p>
                    <p className="text-2xl font-bold text-[#D01A2B]">{selectedPatientGroup.tests.length}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {selectedPatientGroup.tests.map((test, idx) => {
                  const resultStatus = getResultStatusForTest(test);
                  const resultValue = Object.values(test.results || {})[0] || 'N/A';
                  return (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-lg text-gray-900">{test.testName}</p>
                            <span className="text-xs text-gray-500">ID: {formatShortId(test.requestId)}</span>
                            {getResultStatusBadge(resultStatus)}
                          </div>
                          <p className="text-sm text-gray-500">Requested By: {test.requestedBy}</p>
                          <p className="text-sm text-gray-500">Completed: {formatDate(test.completedAt)}</p>
                        </div>
                        {/* Print button for each test in modal */}
                        <button
                          onClick={() => printSingleTest(test)}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center space-x-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print Test</span>
                        </button>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className={`p-3 rounded ${resultStatus === 'abnormal' ? 'bg-red-50' : 'bg-green-50'}`}>
                            <p className="text-xs text-gray-500">Result</p>
                            <p className={`text-xl font-bold ${resultStatus === 'abnormal' ? 'text-red-700' : 'text-green-700'}`}>
                              {resultValue} {test.unit}
                            </p>
                          </div>
                          <div className="p-3 rounded bg-gray-50">
                            <p className="text-xs text-gray-500">Normal Range</p>
                            <p className="text-md font-semibold text-gray-700">{test.normalRange || 'Not specified'}</p>
                          </div>
                        </div>
                        {test.notes && (
                          <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                            <p className="text-xs font-medium">Notes:</p>
                            <p className="text-sm text-gray-600">{test.notes}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Performed By: {test.performedBy || 'Lab Technician'} on {formatDate(test.completedAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => printProfessionalReport(selectedPatientGroup)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print All Reports</span>
                </button>
                <button
                  onClick={() => handleSendToRequester(selectedPatientGroup)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to {selectedPatientGroup.tests[0]?.requestedBy?.startsWith('Dr.') ? 'Doctor' : 'Reception'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabTechResults;
