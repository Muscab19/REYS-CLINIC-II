import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Heart, Loader, Plus, Edit, Trash2, X, 
  Stethoscope, DollarSign, FileText, CheckCircle, 
  AlertCircle, Search, Save, User, Calendar, Clock,
  Copy, List, Archive, Download, Upload, TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const DoctorMasterData = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('diagnosis');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Diagnosis State
  const [diagnoses, setDiagnoses] = useState([]);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [diagnosisItems, setDiagnosisItems] = useState([{ id: Date.now(), name: '', code: '', description: '', category: 'general' }]);
  
  // Stats
  const [stats, setStats] = useState({
    totalDiagnoses: 0,
    activeDiagnoses: 0
  });

  // Category options
  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'pediatric', label: 'Pediatric' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'chronic', label: 'Chronic' },
    { value: 'infectious', label: 'Infectious' }
  ];

  // Check authentication
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

  // Load data from API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Build query params
      let url = `${API_BASE_URL}/api/doctor-master/diagnoses?`;
      if (categoryFilter !== 'all') {
        url += `category=${categoryFilter}&`;
      }
      if (searchTerm) {
        url += `search=${searchTerm}&`;
      }
      
      // Fetch diagnoses
      const diagnosesResponse = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const diagnosesData = await diagnosesResponse.json();
      
      if (diagnosesData.success) {
        setDiagnoses(diagnosesData.data);
      } else {
        toast.error(diagnosesData.msg || 'Failed to load diagnoses');
      }
      
      // Fetch stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/doctor-master/stats`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Handle search and filter changes
  useEffect(() => {
    fetchData();
  }, [searchTerm, categoryFilter]);

  // Diagnosis Bulk Operations
  const handleAddDiagnosisRow = () => {
    setDiagnosisItems([...diagnosisItems, { id: Date.now(), name: '', code: '', description: '', category: 'general' }]);
  };

  const handleRemoveDiagnosisRow = (id) => {
    if (diagnosisItems.length === 1) {
      toast.warning('At least one item is required');
      return;
    }
    setDiagnosisItems(diagnosisItems.filter(item => item.id !== id));
  };

  const handleDiagnosisChange = (id, field, value) => {
    setDiagnosisItems(diagnosisItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSaveAllDiagnoses = async () => {
    // Validate all items
    const validItems = diagnosisItems.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      toast.error('Please enter at least one diagnosis name');
      return;
    }
    
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/doctor-master/diagnoses/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          diagnoses: validItems.map(item => ({
            name: item.name,
            code: item.code || '',
            description: item.description || '',
            category: item.category || 'general'
          }))
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.msg);
        await fetchData();
        setShowDiagnosisModal(false);
        setDiagnosisItems([{ id: Date.now(), name: '', code: '', description: '', category: 'general' }]);
      } else {
        toast.error(data.msg || 'Failed to save diagnoses');
      }
    } catch (error) {
      console.error('Error saving diagnoses:', error);
      toast.error('Failed to save diagnoses');
    } finally {
      setLoading(false);
    }
  };

  // Single Edit/Delete operations
  const handleEditDiagnosis = async (diagnosis) => {
    const newName = prompt('Edit diagnosis name:', diagnosis.name);
    if (newName && newName.trim() !== '') {
      const token = localStorage.getItem('token');
      setLoading(true);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/doctor-master/diagnoses/${diagnosis._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: newName.trim() })
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success('Diagnosis updated successfully');
          await fetchData();
        } else {
          toast.error(data.msg || 'Failed to update diagnosis');
        }
      } catch (error) {
        console.error('Error updating diagnosis:', error);
        toast.error('Failed to update diagnosis');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteDiagnosis = async (id) => {
    if (window.confirm('Are you sure you want to delete this diagnosis?')) {
      const token = localStorage.getItem('token');
      setLoading(true);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/doctor-master/diagnoses/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success('Diagnosis deleted successfully');
          await fetchData();
        } else {
          toast.error(data.msg || 'Failed to delete diagnosis');
        }
      } catch (error) {
        console.error('Error deleting diagnosis:', error);
        toast.error('Failed to delete diagnosis');
      } finally {
        setLoading(false);
      }
    }
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      general: 'bg-gray-100 text-gray-700',
      pediatric: 'bg-blue-100 text-blue-700',
      emergency: 'bg-red-100 text-red-700',
      chronic: 'bg-yellow-100 text-yellow-700',
      infectious: 'bg-purple-100 text-purple-700'
    };
    return colors[category] || colors.general;
  };

  const getCategoryLabel = (category) => {
    const found = categoryOptions.find(opt => opt.value === category);
    return found ? found.label : category;
  };

  if (!isAuthenticated || user?.role !== 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#D01A2B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/doctor-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <img src={logo} alt="REYS CLINIC Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                  <p className="text-xs text-gray-500">Doctor - Master Data Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchData}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Stethoscope className="w-4 h-4 text-[#D01A2B]" />
                <span>Dr. {user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Diagnoses</p>
                <p className="text-3xl font-bold">{stats.totalDiagnoses || diagnoses.length}</p>
              </div>
              <FileText className="w-12 h-12 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Diagnoses</p>
                <p className="text-3xl font-bold">{stats.activeDiagnoses || 0}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search diagnoses by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
              />
            </div>
            <div className="sm:w-64">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setDiagnosisItems([{ id: Date.now(), name: '', code: '', description: '', category: 'general' }]);
                setShowDiagnosisModal(true);
              }}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#D01A2B] text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Diagnoses (Bulk)</span>
            </button>
          </div>
        </div>

        {/* Diagnoses Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-[#D01A2B]" /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Diagnosis Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {diagnoses.map((diagnosis, index) => (
                      <tr key={diagnosis._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{diagnosis.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {diagnosis.code ? (
                            <span className="text-sm font-mono text-gray-600">{diagnosis.code}</span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(diagnosis.category)}`}>
                            {getCategoryLabel(diagnosis.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {diagnosis.description ? (
                            <p className="text-sm text-gray-600 max-w-xs truncate">{diagnosis.description}</p>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditDiagnosis(diagnosis)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDiagnosis(diagnosis._id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
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
              {diagnoses.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No diagnoses found</h3>
                  <p className="text-gray-500">Click "Add Diagnoses (Bulk)" to create multiple diagnoses at once</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bulk Diagnoses Modal */}
      {showDiagnosisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add Multiple Diagnoses</h3>
                <p className="text-sm text-gray-500">Add multiple diagnoses with categories at once</p>
              </div>
              <button onClick={() => setShowDiagnosisModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Diagnoses List</label>
                <div className="space-y-3">
                  {diagnosisItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleDiagnosisChange(item.id, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                          placeholder="Diagnosis name *"
                          autoFocus={item === diagnosisItems[diagnosisItems.length - 1]}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDiagnosisRow(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleDiagnosisChange(item.id, 'code', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                          placeholder="Code (optional)"
                        />
                        <select
                          value={item.category}
                          onChange={(e) => handleDiagnosisChange(item.id, 'category', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                        >
                          {categoryOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleDiagnosisChange(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                          placeholder="Description (optional)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleAddDiagnosisRow}
                className="mt-3 flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Diagnosis</span>
              </button>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowDiagnosisModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAllDiagnoses}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save All ({diagnosisItems.filter(i => i.name.trim()).length} items)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorMasterData;