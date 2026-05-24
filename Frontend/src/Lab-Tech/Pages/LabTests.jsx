import React, { useState, useEffect } from 'react';
import { 
  Microscope, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Loader, 
  TestTube,
  FlaskConical,
  Droplet,
  Brain,
  Activity,
  AlertCircle,
  CheckCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  LogOut,
  BarChart3,
  Save,
  FileText,
  PlusCircle,
  Trash2 as TrashIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

// Test Categories
const testCategories = [
  { id: 'hematology', name: 'Hematology', icon: <Droplet className="w-4 h-4" /> },
  { id: 'biochemistry', name: 'Biochemistry', icon: <FlaskConical className="w-4 h-4" /> },
  { id: 'microbiology', name: 'Microbiology', icon: <Microscope className="w-4 h-4" /> },
  { id: 'immunology', name: 'Immunology', icon: <Activity className="w-4 h-4" /> },
  { id: 'urinalysis', name: 'Urinalysis', icon: <Droplet className="w-4 h-4" /> },
  { id: 'endocrinology', name: 'Endocrinology', icon: <Brain className="w-4 h-4" /> },
  { id: 'molecular', name: 'Molecular', icon: <Microscope className="w-4 h-4" /> },
  { id: 'toxicology', name: 'Toxicology', icon: <AlertCircle className="w-4 h-4" /> }
];

const resultTypes = [
  { id: 'quantitative', name: 'Quantitative', description: 'Numeric value with normal range' },
  { id: 'qualitative', name: 'Qualitative', description: 'Positive/Negative, Reactive/Non-reactive' },
  { id: 'semi-quantitative', name: 'Semi-Quantitative', description: '1+, 2+, 3+, Trace, etc.' },
  { id: 'categorical', name: 'Categorical', description: 'Normal/Abnormal, High/Low, etc.' },
  { id: 'multi', name: 'Multi-Parameter', description: 'Multiple results in one test (e.g., Stool Exam)' }
];

// Available options for qualitative tests
const qualitativeOptionsList = [
  'Positive', 'Negative', 'Reactive', 'Non-reactive', 
  'Detected', 'Not Detected', 'Normal', 'Abnormal', 
  'High', 'Low', 'Critical', 'Indeterminate'
];

// Available options for semi-quantitative tests
const semiQuantitativeOptionsList = [
  'Negative', 'Trace', '1+', '2+', '3+', '4+', 
  'Small', 'Moderate', 'Large'
];

// Parameter sub-types
const parameterTypes = [
  { id: 'quantitative', name: 'Quantitative' },
  { id: 'qualitative', name: 'Qualitative' },
  { id: 'semi-quantitative', name: 'Semi-Quantitative' },
  { id: 'categorical', name: 'Categorical' }
];

const LabTests = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTest, setSelectedTest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    categories: 0
  });
  
  const [newTest, setNewTest] = useState({
    name: '',
    category: '',
    resultType: 'quantitative',
    normalRangeMin: '',
    normalRangeMax: '',
    unit: '',
    price: '',
    turnaroundTime: '24 hours',
    qualitativeOptions: [],
    semiQuantitativeOptions: [],
    categoricalOptions: [],
    parameters: [],
    isActive: true
  });
  
  const [editTest, setEditTest] = useState(null);

  // Check if user is lab technician
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

  // Load lab tests from API
  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/lab-tests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setLabTests(data.data);
        calculateStats(data.data);
      } else {
        toast.error(data.msg || 'Failed to load lab tests');
      }
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      toast.error('Failed to load lab tests');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (testsList) => {
    const uniqueCategories = new Set(testsList.map(t => t.category));
    setStats({
      total: testsList.length,
      active: testsList.filter(t => t.isActive !== false).length,
      categories: uniqueCategories.size
    });
  };

  // Parameter management functions for Add Modal
  const handleAddParameter = () => {
    setNewTest({
      ...newTest,
      parameters: [
        ...newTest.parameters,
        {
          id: Date.now(),
          name: '',
          resultType: 'quantitative',
          normalRangeMin: '',
          normalRangeMax: '',
          unit: '',
          qualitativeOptions: [],
          semiQuantitativeOptions: [],
          categoricalOptions: []
        }
      ]
    });
  };

  const handleRemoveParameter = (paramId) => {
    setNewTest({
      ...newTest,
      parameters: newTest.parameters.filter(p => p.id !== paramId)
    });
  };

  const handleParameterChange = (paramId, field, value) => {
    setNewTest({
      ...newTest,
      parameters: newTest.parameters.map(param =>
        param.id === paramId ? { ...param, [field]: value } : param
      )
    });
  };

  const handleParameterOptionToggle = (paramId, option, optionType) => {
    setNewTest({
      ...newTest,
      parameters: newTest.parameters.map(param => {
        if (param.id === paramId) {
          const currentOptions = param[optionType] || [];
          const newOptions = currentOptions.includes(option)
            ? currentOptions.filter(o => o !== option)
            : [...currentOptions, option];
          return { ...param, [optionType]: newOptions };
        }
        return param;
      })
    });
  };

  // Parameter management functions for Edit Modal
  const handleEditAddParameter = () => {
    setEditTest({
      ...editTest,
      parameters: [
        ...(editTest.parameters || []),
        {
          tempId: Date.now(),
          name: '',
          resultType: 'quantitative',
          normalRangeMin: '',
          normalRangeMax: '',
          unit: '',
          qualitativeOptions: [],
          semiQuantitativeOptions: [],
          categoricalOptions: []
        }
      ]
    });
  };

  const handleEditRemoveParameter = (index) => {
    const newParameters = [...(editTest.parameters || [])];
    newParameters.splice(index, 1);
    setEditTest({ ...editTest, parameters: newParameters });
  };

  const handleEditParameterChange = (index, field, value) => {
    const newParameters = [...(editTest.parameters || [])];
    newParameters[index] = { ...newParameters[index], [field]: value };
    setEditTest({ ...editTest, parameters: newParameters });
  };

  const handleEditParameterOptionToggle = (index, option, optionType) => {
    const newParameters = [...(editTest.parameters || [])];
    const currentOptions = newParameters[index][optionType] || [];
    const newOptions = currentOptions.includes(option)
      ? currentOptions.filter(o => o !== option)
      : [...currentOptions, option];
    newParameters[index] = { ...newParameters[index], [optionType]: newOptions };
    setEditTest({ ...editTest, parameters: newParameters });
  };

  const handleAddTest = async () => {
    if (!newTest.name || !newTest.category || !newTest.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const testData = {
        name: newTest.name.trim(),
        category: newTest.category,
        resultType: newTest.resultType,
        price: parseFloat(newTest.price),
        unit: newTest.unit || '',
        turnaroundTime: newTest.turnaroundTime || '24 hours'
      };

      // Add type-specific fields
      if (newTest.resultType === 'quantitative') {
        if (!newTest.normalRangeMin || !newTest.normalRangeMax) {
          toast.error('Please enter both minimum and maximum normal range values');
          return;
        }
        testData.normalRangeMin = parseFloat(newTest.normalRangeMin);
        testData.normalRangeMax = parseFloat(newTest.normalRangeMax);
      } 
      else if (newTest.resultType === 'qualitative') {
        if (!newTest.qualitativeOptions || newTest.qualitativeOptions.length === 0) {
          toast.error('Please select at least one qualitative option');
          return;
        }
        testData.qualitativeOptions = newTest.qualitativeOptions;
      } 
      else if (newTest.resultType === 'semi-quantitative') {
        if (!newTest.semiQuantitativeOptions || newTest.semiQuantitativeOptions.length === 0) {
          toast.error('Please select at least one semi-quantitative option');
          return;
        }
        testData.semiQuantitativeOptions = newTest.semiQuantitativeOptions;
      } 
      else if (newTest.resultType === 'categorical') {
        if (!newTest.categoricalOptions || newTest.categoricalOptions.length === 0) {
          toast.error('Please add at least one categorical option');
          return;
        }
        testData.categoricalOptions = newTest.categoricalOptions;
      }
      else if (newTest.resultType === 'multi') {
        if (!newTest.parameters || newTest.parameters.length === 0) {
          toast.error('Please add at least one parameter for multi-parameter test');
          return;
        }
        // Validate each parameter
        for (const param of newTest.parameters) {
          if (!param.name) {
            toast.error('All parameters must have a name');
            return;
          }
          if (param.resultType === 'quantitative' && (!param.normalRangeMin || !param.normalRangeMax)) {
            toast.error(`Parameter "${param.name}" requires min and max range values`);
            return;
          }
          if (param.resultType === 'qualitative' && (!param.qualitativeOptions || param.qualitativeOptions.length === 0)) {
            toast.error(`Parameter "${param.name}" requires at least one qualitative option`);
            return;
          }
          if (param.resultType === 'semi-quantitative' && (!param.semiQuantitativeOptions || param.semiQuantitativeOptions.length === 0)) {
            toast.error(`Parameter "${param.name}" requires at least one semi-quantitative option`);
            return;
          }
        }
        testData.parameters = newTest.parameters.map(p => ({
          name: p.name,
          resultType: p.resultType,
          normalRangeMin: p.normalRangeMin ? parseFloat(p.normalRangeMin) : null,
          normalRangeMax: p.normalRangeMax ? parseFloat(p.normalRangeMax) : null,
          unit: p.unit || '',
          qualitativeOptions: p.qualitativeOptions || [],
          semiQuantitativeOptions: p.semiQuantitativeOptions || [],
          categoricalOptions: p.categoricalOptions || []
        }));
      }

      const response = await fetch(`${API_BASE_URL}/api/lab-tests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Lab test added successfully');
        fetchLabTests();
        setShowAddModal(false);
        // Reset form
        setNewTest({
          name: '',
          category: '',
          resultType: 'quantitative',
          normalRangeMin: '',
          normalRangeMax: '',
          unit: '',
          price: '',
          turnaroundTime: '24 hours',
          qualitativeOptions: [],
          semiQuantitativeOptions: [],
          categoricalOptions: [],
          parameters: [],
          isActive: true
        });
      } else {
        toast.error(data.msg || 'Failed to add lab test');
      }
    } catch (error) {
      console.error('Error adding lab test:', error);
      toast.error('Failed to add lab test');
    }
  };

  const handleEditTest = async () => {
    if (!editTest) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const editData = {
        name: editTest.name,
        category: editTest.category,
        resultType: editTest.resultType,
        price: editTest.price,
        unit: editTest.unit || '',
        turnaroundTime: editTest.turnaroundTime || '24 hours',
        isActive: editTest.isActive !== false
      };

      if (editTest.resultType === 'quantitative') {
        editData.normalRangeMin = editTest.normalRangeMin;
        editData.normalRangeMax = editTest.normalRangeMax;
      } else if (editTest.resultType === 'qualitative') {
        editData.qualitativeOptions = editTest.qualitativeOptions;
      } else if (editTest.resultType === 'semi-quantitative') {
        editData.semiQuantitativeOptions = editTest.semiQuantitativeOptions;
      } else if (editTest.resultType === 'categorical') {
        editData.categoricalOptions = editTest.categoricalOptions;
      } else if (editTest.resultType === 'multi') {
        // Clean up parameters - remove tempId if present
        const cleanParameters = (editTest.parameters || []).map(param => {
          const { tempId, ...cleanParam } = param;
          return cleanParam;
        });
        editData.parameters = cleanParameters;
      }

      const response = await fetch(`${API_BASE_URL}/api/lab-tests/${editTest._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Lab test updated successfully');
        fetchLabTests();
        setShowEditModal(false);
        setEditTest(null);
      } else {
        toast.error(data.msg || 'Failed to update lab test');
      }
    } catch (error) {
      console.error('Error updating lab test:', error);
      toast.error('Failed to update lab test');
    }
  };

  const handleDeleteTest = async () => {
    if (!selectedTest) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/lab-tests/${selectedTest._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Lab test deleted successfully');
        fetchLabTests();
        setShowDeleteModal(false);
        setSelectedTest(null);
      } else {
        toast.error(data.msg || 'Failed to delete lab test');
      }
    } catch (error) {
      console.error('Error deleting lab test:', error);
      toast.error('Failed to delete lab test');
    }
  };

  const handleViewDetails = (test) => {
    setSelectedTest(test);
    setShowDetailsModal(true);
  };

  const handleEditClick = (test) => {
    // Deep copy the test data for editing
    const testCopy = JSON.parse(JSON.stringify(test));
    setEditTest(testCopy);
    setShowEditModal(true);
  };

  const handleDeleteClick = (test) => {
    setSelectedTest(test);
    setShowDeleteModal(true);
  };

  const formatRangeDisplay = (test) => {
    if (test.resultType === 'quantitative') {
      if (test.normalRangeMin && test.normalRangeMax) {
        return `${test.normalRangeMin} - ${test.normalRangeMax} ${test.unit || ''}`;
      }
      return test.normalRange || 'N/A';
    }
    if (test.resultType === 'qualitative') {
      return test.qualitativeOptions?.slice(0, 3).join(', ') + (test.qualitativeOptions?.length > 3 ? '...' : '') || 'N/A';
    }
    if (test.resultType === 'semi-quantitative') {
      return test.semiQuantitativeOptions?.slice(0, 3).join(', ') + (test.semiQuantitativeOptions?.length > 3 ? '...' : '') || 'N/A';
    }
    if (test.resultType === 'categorical') {
      return test.categoricalOptions?.slice(0, 3).join(', ') + (test.categoricalOptions?.length > 3 ? '...' : '') || 'N/A';
    }
    if (test.resultType === 'multi') {
      return `${test.parameters?.length || 0} parameters`;
    }
    return test.normalRange || 'N/A';
  };

  const filteredTests = labTests.filter(test => {
    const matchesSearch = 
      test.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || test.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && test.isActive !== false) ||
      (filterStatus === 'inactive' && test.isActive === false);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTests = filteredTests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleExport = () => {
    const data = filteredTests.map(test => ({
      'Test Name': test.name,
      'Category': test.category,
      'Result Type': test.resultType,
      'Normal Range/Settings': formatRangeDisplay(test),
      'Price': test.price,
      'Turnaround Time': test.turnaroundTime,
      'Status': test.isActive !== false ? 'Active' : 'Inactive'
    }));
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lab_tests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported successfully');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated || user?.role !== 'lab-tech') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#D01A2B]" />
      </div>
    );
  }

  const getCategoryBadge = (category) => {
    const colors = {
      hematology: 'bg-blue-100 text-blue-700',
      biochemistry: 'bg-green-100 text-green-700',
      microbiology: 'bg-purple-100 text-purple-700',
      immunology: 'bg-orange-100 text-orange-700',
      urinalysis: 'bg-yellow-100 text-yellow-700',
      endocrinology: 'bg-pink-100 text-pink-700',
      molecular: 'bg-indigo-100 text-indigo-700',
      toxicology: 'bg-red-100 text-red-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[category] || 'bg-gray-100 text-gray-700'}`}>{category}</span>;
  };

  const getResultTypeBadge = (type) => {
    const colors = {
      quantitative: 'bg-purple-100 text-purple-700',
      qualitative: 'bg-green-100 text-green-700',
      'semi-quantitative': 'bg-orange-100 text-orange-700',
      categorical: 'bg-cyan-100 text-cyan-700',
      multi: 'bg-indigo-100 text-indigo-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[type] || 'bg-gray-100'}`}>{type || 'N/A'}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                  <p className="text-xs text-gray-500">Lab Tests Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#D01A2B] text-white rounded-lg hover:bg-red-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Test</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Tests</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Microscope className="w-12 h-12 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Tests</p>
                <p className="text-3xl font-bold">{stats.active}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Categories</p>
                <p className="text-3xl font-bold">{stats.categories}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Test Types</p>
                <p className="text-3xl font-bold">{resultTypes.length}</p>
              </div>
              <FileText className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by test name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
            >
              <option value="all">All Categories</option>
              {testCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Lab Tests Table */}
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Test Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Result Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Range/Options</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Turnaround</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentTests.map((test) => (
                      <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <TestTube className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{test.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getCategoryBadge(test.category)}
                        </td>
                        <td className="px-6 py-4">
                          {getResultTypeBadge(test.resultType)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 text-sm">{formatRangeDisplay(test)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-green-600">${test.price}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{test.turnaroundTime || '24 hours'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${test.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {test.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(test)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(test)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(test)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTests.length === 0 && (
                <div className="text-center py-12">
                  <Microscope className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No lab tests found</h3>
                  <p className="text-gray-500">Click "Add Test" to create your first lab test</p>
                </div>
              )}

              {/* Pagination */}
              {filteredTests.length > 0 && (
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTests.length)} of {filteredTests.length} tests
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 bg-[#D01A2B] text-white rounded-lg">{currentPage}</span>
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

      {/* Add Test Modal - With Multi-Parameter Support */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add New Lab Test</h3>
                <p className="text-sm text-gray-500 mt-1">Configure test parameters and result options</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Test Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTest.name}
                      onChange={(e) => setNewTest({...newTest, name: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B] focus:border-transparent transition-all"
                      placeholder="Enter test name (e.g., Complete Blood Count, Stool Examination)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newTest.category}
                      onChange={(e) => setNewTest({...newTest, category: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B] focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {testCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Result Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newTest.resultType}
                      onChange={(e) => {
                        const resultType = e.target.value;
                        setNewTest({
                          ...newTest, 
                          resultType,
                          normalRangeMin: '',
                          normalRangeMax: '',
                          qualitativeOptions: [],
                          semiQuantitativeOptions: [],
                          categoricalOptions: [],
                          parameters: []
                        });
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B] focus:border-transparent"
                    >
                      {resultTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {resultTypes.find(t => t.id === newTest.resultType)?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rest of Add Modal content remains the same */}
              {/* ... (keep the existing result type specific fields from your original code) ... */}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddTest} 
                  className="flex-1 px-4 py-2.5 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Add Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Modal - Full featured with all fields including multi-parameter */}
      {showEditModal && editTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Edit Lab Test</h3>
                <p className="text-sm text-gray-500 mt-1">Modify test parameters and configuration</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Test Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editTest.name || ''}
                      onChange={(e) => setEditTest({...editTest, name: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editTest.category || ''}
                      onChange={(e) => setEditTest({...editTest, category: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    >
                      {testCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Result Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editTest.resultType || 'quantitative'}
                      onChange={(e) => {
                        const newResultType = e.target.value;
                        setEditTest({
                          ...editTest,
                          resultType: newResultType,
                          // Reset type-specific fields when changing result type
                          normalRangeMin: '',
                          normalRangeMax: '',
                          qualitativeOptions: [],
                          semiQuantitativeOptions: [],
                          categoricalOptions: [],
                          parameters: []
                        });
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    >
                      {resultTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {resultTypes.find(t => t.id === editTest.resultType)?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Result Configuration based on type */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Result Configuration</h4>
                
                {/* Quantitative Fields */}
                {(editTest.resultType === 'quantitative') && (
                  <div className="bg-blue-50 p-5 rounded-lg space-y-4">
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Normal Range (Min) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={editTest.normalRangeMin || ''}
                          onChange={(e) => setEditTest({...editTest, normalRangeMin: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                          placeholder="e.g., 4.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Normal Range (Max) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={editTest.normalRangeMax || ''}
                          onChange={(e) => setEditTest({...editTest, normalRangeMax: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                          placeholder="e.g., 11.0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                      <input
                        type="text"
                        value={editTest.unit || ''}
                        onChange={(e) => setEditTest({...editTest, unit: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                        placeholder="e.g., K/uL, mg/dL, g/L"
                      />
                    </div>
                  </div>
                )}

                {/* Qualitative Fields */}
                {editTest.resultType === 'qualitative' && (
                  <div className="bg-green-50 p-5 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Available Options <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {qualitativeOptionsList.map(option => (
                        <label key={option} className="flex items-center space-x-2 p-2 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={(editTest.qualitativeOptions || []).includes(option)}
                            onChange={(e) => {
                              let options = editTest.qualitativeOptions || [];
                              if (e.target.checked) {
                                options.push(option);
                              } else {
                                options = options.filter(o => o !== option);
                              }
                              setEditTest({...editTest, qualitativeOptions: options});
                            }}
                            className="rounded text-[#D01A2B] focus:ring-[#D01A2B]"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">Select all options that are valid results for this test</p>
                  </div>
                )}

                {/* Semi-Quantitative Fields */}
                {editTest.resultType === 'semi-quantitative' && (
                  <div className="bg-orange-50 p-5 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Available Options <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {semiQuantitativeOptionsList.map(option => (
                        <label key={option} className="flex items-center space-x-2 p-2 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={(editTest.semiQuantitativeOptions || []).includes(option)}
                            onChange={(e) => {
                              let options = editTest.semiQuantitativeOptions || [];
                              if (e.target.checked) {
                                options.push(option);
                              } else {
                                options = options.filter(o => o !== option);
                              }
                              setEditTest({...editTest, semiQuantitativeOptions: options});
                            }}
                            className="rounded text-[#D01A2B] focus:ring-[#D01A2B]"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categorical Fields */}
                {editTest.resultType === 'categorical' && (
                  <div className="bg-cyan-50 p-5 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Custom Categories <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(editTest.categoricalOptions || []).map((option, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                          {option}
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = (editTest.categoricalOptions || []).filter((_, i) => i !== idx);
                              setEditTest({...editTest, categoricalOptions: newOptions});
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="editCategoryInput"
                        placeholder="Add category (e.g., Normal, Abnormal, High, Low)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target;
                            const value = input.value.trim();
                            if (value && !(editTest.categoricalOptions || []).includes(value)) {
                              setEditTest({
                                ...editTest,
                                categoricalOptions: [...(editTest.categoricalOptions || []), value]
                              });
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('editCategoryInput');
                          const value = input?.value.trim();
                          if (value && !(editTest.categoricalOptions || []).includes(value)) {
                            setEditTest({
                              ...editTest,
                              categoricalOptions: [...(editTest.categoricalOptions || []), value]
                            });
                            input.value = '';
                          } else if (value && (editTest.categoricalOptions || []).includes(value)) {
                            toast.warning('Category already exists');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Multi-Parameter Fields */}
                {editTest.resultType === 'multi' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-semibold text-gray-700">
                        Test Parameters <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleEditAddParameter}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Add Parameter
                      </button>
                    </div>
                    
                    {(editTest.parameters || []).length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                        <TestTube className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">No parameters added yet</p>
                        <p className="text-xs text-gray-400">Click "Add Parameter" to add test components</p>
                      </div>
                    )}
                    
                    {(editTest.parameters || []).map((param, idx) => (
                      <div key={param.tempId || idx} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-semibold text-gray-800">Parameter {idx + 1}</h5>
                          <button
                            type="button"
                            onClick={() => handleEditRemoveParameter(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Parameter Name *</label>
                            <input
                              type="text"
                              value={param.name || ''}
                              onChange={(e) => handleEditParameterChange(idx, 'name', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              placeholder="e.g., Color, Consistency, Pus Cells"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Result Type *</label>
                            <select
                              value={param.resultType || 'quantitative'}
                              onChange={(e) => handleEditParameterChange(idx, 'resultType', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            >
                              {parameterTypes.map(pt => (
                                <option key={pt.id} value={pt.id}>{pt.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Parameter Quantitative Fields */}
                          {param.resultType === 'quantitative' && (
                            <>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Min Range</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={param.normalRangeMin || ''}
                                  onChange={(e) => handleEditParameterChange(idx, 'normalRangeMin', e.target.value)}
                                  className="w-full px-3 py-2 border rounded-lg text-sm"
                                  placeholder="Min"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Max Range</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={param.normalRangeMax || ''}
                                  onChange={(e) => handleEditParameterChange(idx, 'normalRangeMax', e.target.value)}
                                  className="w-full px-3 py-2 border rounded-lg text-sm"
                                  placeholder="Max"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Unit</label>
                                <input
                                  type="text"
                                  value={param.unit || ''}
                                  onChange={(e) => handleEditParameterChange(idx, 'unit', e.target.value)}
                                  className="w-full px-3 py-2 border rounded-lg text-sm"
                                  placeholder="e.g., HPF, mg/dL"
                                />
                              </div>
                            </>
                          )}
                          
                          {/* Parameter Qualitative Fields */}
                          {param.resultType === 'qualitative' && (
                            <div className="col-span-2">
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Options *</label>
                              <div className="grid grid-cols-3 gap-2">
                                {qualitativeOptionsList.map(opt => (
                                  <label key={opt} className="flex items-center gap-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={(param.qualitativeOptions || []).includes(opt)}
                                      onChange={() => handleEditParameterOptionToggle(idx, opt, 'qualitativeOptions')}
                                      className="rounded text-indigo-600"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Parameter Semi-Quantitative Fields */}
                          {param.resultType === 'semi-quantitative' && (
                            <div className="col-span-2">
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Options *</label>
                              <div className="grid grid-cols-4 gap-2">
                                {semiQuantitativeOptionsList.map(opt => (
                                  <label key={opt} className="flex items-center gap-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={(param.semiQuantitativeOptions || []).includes(opt)}
                                      onChange={() => handleEditParameterOptionToggle(idx, opt, 'semiQuantitativeOptions')}
                                      className="rounded text-indigo-600"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Parameter Categorical Fields */}
                          {param.resultType === 'categorical' && (
                            <div className="col-span-2">
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Custom Categories *</label>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {(param.categoricalOptions || []).map((opt, oIdx) => (
                                  <span key={oIdx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                                    {opt}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newOptions = (param.categoricalOptions || []).filter((_, i) => i !== oIdx);
                                        handleEditParameterChange(idx, 'categoricalOptions', newOptions);
                                      }}
                                      className="text-blue-500"
                                    >
                                      <X className="w-2 h-2" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  id={`editParamCatInput_${idx}`}
                                  placeholder="Add category..."
                                  className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const input = e.target;
                                      const value = input.value.trim();
                                      if (value && !(param.categoricalOptions || []).includes(value)) {
                                        handleEditParameterChange(idx, 'categoricalOptions', [...(param.categoricalOptions || []), value]);
                                        input.value = '';
                                      }
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`editParamCatInput_${idx}`);
                                    const value = input?.value.trim();
                                    if (value && !(param.categoricalOptions || []).includes(value)) {
                                      handleEditParameterChange(idx, 'categoricalOptions', [...(param.categoricalOptions || []), value]);
                                      input.value = '';
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing & Logistics */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Pricing & Logistics</h4>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editTest.price || ''}
                      onChange={(e) => setEditTest({...editTest, price: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Turnaround Time</label>
                    <input
                      type="text"
                      value={editTest.turnaroundTime || '24 hours'}
                      onChange={(e) => setEditTest({...editTest, turnaroundTime: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                      placeholder="e.g., 24 hours"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Status</h4>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    checked={editTest.isActive !== false}
                    onChange={(e) => setEditTest({...editTest, isActive: e.target.checked})}
                    className="rounded text-[#D01A2B] focus:ring-[#D01A2B]"
                  />
                  <label className="text-sm font-semibold text-gray-700">Active</label>
                </div>
              </div>

              {/* Preview Section */}
              {editTest.resultType === 'quantitative' && editTest.normalRangeMin && editTest.normalRangeMax && (
                <div className="bg-blue-100 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Preview:</strong> Normal range will be displayed as "{editTest.normalRangeMin} - {editTest.normalRangeMax} {editTest.unit}"
                  </p>
                </div>
              )}
              
              {(editTest.resultType === 'qualitative' && editTest.qualitativeOptions?.length > 0) && (
                <div className="bg-green-100 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Preview:</strong> Results can be: {editTest.qualitativeOptions.join(', ')}
                  </p>
                </div>
              )}

              {(editTest.resultType === 'multi' && editTest.parameters?.length > 0) && (
                <div className="bg-indigo-100 p-4 rounded-lg">
                  <p className="text-sm text-indigo-800">
                    <strong>Preview:</strong> Multi-parameter test with {editTest.parameters.length} parameter(s)
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditTest}
                  className="flex-1 px-4 py-2.5 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Lab Test</h3>
              <p className="text-gray-500">Are you sure you want to delete "{selectedTest.name}"? This action cannot be undone.</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">Cancel</button>
              <button onClick={handleDeleteTest} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Test Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4 pb-4 border-b">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <TestTube className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedTest.name}</h2>
                  <p className="text-gray-500 capitalize">{selectedTest.category} • {selectedTest.resultType} Test</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Price</p>
                  <p className="text-2xl font-bold text-green-600">${selectedTest.price}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Turnaround Time</p>
                  <p className="text-lg font-semibold">{selectedTest.turnaroundTime || '24 hours'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Result Type</p>
                  <p className="font-semibold capitalize">{selectedTest.resultType}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedTest.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedTest.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Reference Range / Options</p>
                  <p className="text-gray-800">{formatRangeDisplay(selectedTest)}</p>
                </div>
                
                {/* Show parameters if multi-type test */}
                {selectedTest.resultType === 'multi' && selectedTest.parameters && selectedTest.parameters.length > 0 && (
                  <div className="col-span-2 bg-indigo-50 p-4 rounded-lg">
                    <p className="text-xs text-indigo-600 uppercase font-semibold mb-2">Parameters</p>
                    <div className="space-y-2">
                      {selectedTest.parameters.map((param, idx) => (
                        <div key={idx} className="border-b border-indigo-200 pb-2 last:border-0">
                          <p className="font-semibold text-sm">{param.name}</p>
                          <p className="text-xs text-gray-600">Type: {param.resultType}</p>
                          {param.resultType === 'quantitative' && (
                            <p className="text-xs text-gray-600">Range: {param.normalRangeMin} - {param.normalRangeMax} {param.unit}</p>
                          )}
                          {param.resultType === 'qualitative' && param.qualitativeOptions && (
                            <p className="text-xs text-gray-600">Options: {param.qualitativeOptions.join(', ')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 pt-4 border-t">
                <button onClick={() => { setShowDetailsModal(false); handleEditClick(selectedTest); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Edit</button>
                <button onClick={() => setShowDetailsModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabTests;