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
  Upload
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
  const [showBulkModal, setShowBulkModal] = useState(false);
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
    code: '',
    description: '',
    normalRange: '',
    unit: '',
    price: '',
    preparation: '',
    turnaroundTime: '',
    isActive: true
  });
  
  const [editTest, setEditTest] = useState(null);
  
  const [bulkTests, setBulkTests] = useState([{ 
    id: Date.now(), 
    name: '', 
    category: '', 
    code: '', 
    normalRange: '', 
    unit: '', 
    price: '', 
    turnaroundTime: '' 
  }]);

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

  const handleAddTest = async () => {
    if (!newTest.name || !newTest.category || !newTest.normalRange || !newTest.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/lab-tests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTest)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Lab test added successfully');
        fetchLabTests();
        setShowAddModal(false);
        setNewTest({
          name: '',
          category: '',
          code: '',
          description: '',
          normalRange: '',
          unit: '',
          price: '',
          preparation: '',
          turnaroundTime: '',
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
      const response = await fetch(`${API_BASE_URL}/api/lab-tests/${editTest._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editTest)
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

  // Bulk Operations
  const handleAddBulkRow = () => {
    setBulkTests([...bulkTests, { 
      id: Date.now(), 
      name: '', 
      category: '', 
      code: '', 
      normalRange: '', 
      unit: '', 
      price: '', 
      turnaroundTime: '' 
    }]);
  };

  const handleRemoveBulkRow = (id) => {
    if (bulkTests.length === 1) {
      toast.warning('At least one item is required');
      return;
    }
    setBulkTests(bulkTests.filter(item => item.id !== id));
  };

  const handleBulkItemChange = (id, field, value) => {
    setBulkTests(bulkTests.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSaveAllBulk = async () => {
    const validItems = bulkTests.filter(item => 
      item.name.trim() !== '' && 
      item.category && 
      item.normalRange && 
      item.price && !isNaN(item.price) && parseFloat(item.price) >= 0
    );

    if (validItems.length === 0) {
      toast.error('Please enter at least one valid test');
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/lab-tests/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tests: validItems })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.msg);
        fetchLabTests();
        setShowBulkModal(false);
        setBulkTests([{ 
          id: Date.now(), 
          name: '', 
          category: '', 
          code: '', 
          normalRange: '', 
          unit: '', 
          price: '', 
          turnaroundTime: '' 
        }]);
      } else {
        toast.error(data.msg || 'Failed to save tests');
      }
    } catch (error) {
      console.error('Error saving bulk tests:', error);
      toast.error('Failed to save tests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (test) => {
    setSelectedTest(test);
    setShowDetailsModal(true);
  };

  const handleEditClick = (test) => {
    setEditTest({ ...test });
    setShowEditModal(true);
  };

  const handleDeleteClick = (test) => {
    setSelectedTest(test);
    setShowDeleteModal(true);
  };

  const filteredTests = labTests.filter(test => {
    const matchesSearch = 
      test.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      'Code': test.code,
      'Category': test.category,
      'Normal Range': test.normalRange,
      'Unit': test.unit,
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
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Test</span>
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Add</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by test name, code, or description..."
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
              className="px-4 py-2 border border-gray-300 rounded-lg"
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
              className="px-4 py-2 border border-gray-300 rounded-lg"
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Normal Range</th>
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
                          <span className="text-gray-600">{test.normalRange}</span>
                          {test.unit && <span className="text-xs text-gray-400 ml-1">{test.unit}</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-green-600">${test.price}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{test.turnaroundTime || '24 hours'}</td>
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
                          onClick={() => paginate(pageNum)}
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

      {/* Add Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add Lab Test</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Test Name *</label>
                  <input
                    type="text"
                    value={newTest.name}
                    onChange={(e) => setNewTest({...newTest, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                    placeholder="e.g., Complete Blood Count"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Category *</label>
                  <select
                    value={newTest.category}
                    onChange={(e) => setNewTest({...newTest, category: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                  >
                    <option value="">Select Category</option>
                    {testCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Description</label>
                  <textarea
                    rows="2"
                    value={newTest.description}
                    onChange={(e) => setNewTest({...newTest, description: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                    placeholder="Test description..."
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Normal Range *</label>
                  <input
                    type="text"
                    value={newTest.normalRange}
                    onChange={(e) => setNewTest({...newTest, normalRange: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                    placeholder="e.g., 4.5-11.0 K/uL"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Unit</label>
                  <input
                    type="text"
                    value={newTest.unit}
                    onChange={(e) => setNewTest({...newTest, unit: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                    placeholder="e.g., K/uL, mg/dL"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTest.price}
                    onChange={(e) => setNewTest({...newTest, price: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Turnaround Time</label>
                  <input
                    type="text"
                    value={newTest.turnaroundTime}
                    onChange={(e) => setNewTest({...newTest, turnaroundTime: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                    placeholder="e.g., 24 hours"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Patient Preparation</label>
                  <textarea
                    rows="2"
                    value={newTest.preparation}
                    onChange={(e) => setNewTest({...newTest, preparation: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                    placeholder="e.g., Fasting for 8 hours"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">Cancel</button>
                <button onClick={handleAddTest} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold">Add Test</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div><h3 className="text-xl font-bold text-gray-900">Bulk Add Lab Tests</h3><p className="text-sm text-gray-500">Add multiple lab tests at once</p></div>
              <button onClick={() => setShowBulkModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-2 border text-left text-sm font-semibold">Test Name *</th>
                      <th className="p-2 border text-left text-sm font-semibold">Category *</th>
                      <th className="p-2 border text-left text-sm font-semibold">Normal Range *</th>
                      <th className="p-2 border text-left text-sm font-semibold">Price *</th>
                      <th className="p-2 border text-left text-sm font-semibold">Unit</th>
                      <th className="p-2 border text-left text-sm font-semibold">Turnaround</th>
                      <th className="p-2 border text-center text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkTests.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2 border"><input type="text" value={item.name} onChange={(e) => handleBulkItemChange(item.id, 'name', e.target.value)} className="w-48 px-2 py-1 border rounded" placeholder="Test name" /></td>
                        <td className="p-2 border"><select value={item.category} onChange={(e) => handleBulkItemChange(item.id, 'category', e.target.value)} className="w-36 px-2 py-1 border rounded"><option value="">Select</option>{testCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select></td>
                        <td className="p-2 border"><input type="text" value={item.normalRange} onChange={(e) => handleBulkItemChange(item.id, 'normalRange', e.target.value)} className="w-36 px-2 py-1 border rounded" placeholder="Normal range" /></td>
                        <td className="p-2 border"><input type="number" step="0.01" value={item.price} onChange={(e) => handleBulkItemChange(item.id, 'price', e.target.value)} className="w-24 px-2 py-1 border rounded" placeholder="Price" /></td>
                        <td className="p-2 border"><input type="text" value={item.unit} onChange={(e) => handleBulkItemChange(item.id, 'unit', e.target.value)} className="w-20 px-2 py-1 border rounded" placeholder="Unit" /></td>
                        <td className="p-2 border"><input type="text" value={item.turnaroundTime} onChange={(e) => handleBulkItemChange(item.id, 'turnaroundTime', e.target.value)} className="w-24 px-2 py-1 border rounded" placeholder="Turnaround" /></td>
                        <td className="p-2 border text-center"><button onClick={() => handleRemoveBulkRow(item.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleAddBulkRow} className="mt-4 flex items-center space-x-2 text-blue-600"><Plus className="w-4 h-4" /><span>Add Another</span></button>
              <div className="flex space-x-3 mt-6"><button onClick={() => setShowBulkModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">Cancel</button><button onClick={handleSaveAllBulk} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold">Save All ({bulkTests.filter(i => i.name.trim() && i.category && i.normalRange && i.price).length} items)</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Modal */}
      {showEditModal && editTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Edit Lab Test</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-gray-700 font-semibold mb-2">Test Name *</label><input type="text" value={editTest.name} onChange={(e) => setEditTest({...editTest, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-gray-700 font-semibold mb-2">Test Code</label><input type="text" value={editTest.code || ''} onChange={(e) => setEditTest({...editTest, code: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-gray-700 font-semibold mb-2">Category *</label><select value={editTest.category} onChange={(e) => setEditTest({...editTest, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg">{testCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select></div>
                <div className="col-span-2"><label className="block text-gray-700 font-semibold mb-2">Description</label><textarea rows="2" value={editTest.description || ''} onChange={(e) => setEditTest({...editTest, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-gray-700 font-semibold mb-2">Normal Range *</label><input type="text" value={editTest.normalRange} onChange={(e) => setEditTest({...editTest, normalRange: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-gray-700 font-semibold mb-2">Unit</label><input type="text" value={editTest.unit || ''} onChange={(e) => setEditTest({...editTest, unit: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-gray-700 font-semibold mb-2">Price ($) *</label><input type="number" step="0.01" value={editTest.price} onChange={(e) => setEditTest({...editTest, price: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-gray-700 font-semibold mb-2">Turnaround Time</label><input type="text" value={editTest.turnaroundTime || ''} onChange={(e) => setEditTest({...editTest, turnaroundTime: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-gray-700 font-semibold mb-2">Patient Preparation</label><textarea rows="2" value={editTest.preparation || ''} onChange={(e) => setEditTest({...editTest, preparation: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div className="col-span-2"><label className="flex items-center space-x-2"><input type="checkbox" checked={editTest.isActive !== false} onChange={(e) => setEditTest({...editTest, isActive: e.target.checked})} className="rounded text-[#D01A2B]" /><span>Active</span></label></div>
              </div>
              <div className="flex space-x-3 mt-6"><button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">Cancel</button><button onClick={handleEditTest} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold">Save Changes</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4"><div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-600" /></div><h3 className="text-xl font-bold text-gray-900 mb-2">Delete Lab Test</h3><p className="text-gray-500">Delete "{selectedTest.name}"? This action cannot be undone.</p></div>
            <div className="flex space-x-3"><button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">Cancel</button><button onClick={handleDeleteTest} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold">Delete</button></div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center"><h3 className="text-xl font-bold text-gray-900">Test Details</h3><button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button></div>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center"><TestTube className="w-8 h-8 text-blue-600" /></div><div><h2 className="text-2xl font-bold">{selectedTest.name}</h2><p className="text-gray-500">{selectedTest.code && `Code: ${selectedTest.code}`}</p></div></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded"><p className="text-sm text-gray-500">Category</p><p className="font-semibold capitalize">{selectedTest.category}</p></div>
                <div className="bg-gray-50 p-3 rounded"><p className="text-sm text-gray-500">Price</p><p className="font-semibold text-green-600">${selectedTest.price}</p></div>
                <div className="bg-gray-50 p-3 rounded"><p className="text-sm text-gray-500">Normal Range</p><p className="font-semibold">{selectedTest.normalRange} {selectedTest.unit && <span className="text-sm text-gray-500">({selectedTest.unit})</span>}</p></div>
                <div className="bg-gray-50 p-3 rounded"><p className="text-sm text-gray-500">Turnaround Time</p><p className="font-semibold">{selectedTest.turnaroundTime || '24 hours'}</p></div>
                <div className="col-span-2 bg-gray-50 p-3 rounded"><p className="text-sm text-gray-500">Description</p><p className="text-gray-700">{selectedTest.description || 'No description provided'}</p></div>
                {selectedTest.preparation && (<div className="col-span-2 bg-yellow-50 p-3 rounded"><p className="text-sm font-semibold text-yellow-800">Patient Preparation</p><p className="text-yellow-700">{selectedTest.preparation}</p></div>)}
              </div>
              <div className="flex space-x-3 mt-6"><button onClick={() => { setShowDetailsModal(false); handleEditClick(selectedTest); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold">Edit</button><button onClick={() => setShowDetailsModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">Close</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabTests;

// Code