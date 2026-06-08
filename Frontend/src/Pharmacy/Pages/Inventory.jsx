import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Loader, 
  Pill, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Filter, 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Heart,
  LogOut,
  Menu,
  Home,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Truck,
  Box,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Bell,
  FileText,
  XCircle,
  Save,
  Upload
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const Inventory = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    totalCost: 0,
    totalProfit: 0
  });
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    currentStock: '',
    minStock: '',
    unit: '',
    cost: '',
    price: '',
    expiryDate: '',
    manufacturer: '',
    description: '',
    location: ''
  });
  const [editItem, setEditItem] = useState(null);
  const [bulkItems, setBulkItems] = useState([{ 
    id: Date.now(), 
    name: '', 
    category: '', 
    currentStock: '', 
    minStock: '', 
    unit: '', 
    cost: '',
    price: '', 
    expiryDate: '', 
    manufacturer: '', 
    description: '',
    location: ''
  }]);

  const categories = [
    'all',
    'antibiotics',
    'painkillers',
    'vaccines',
    'vitamins',
    'syrups',
    'inhalers',
    'injections',
    'topical',
    'other'
  ];

  const units = ['tablet', 'capsule', 'ml', 'mg', 'bottle', 'vial', 'inhaler', 'tube', 'box'];

  // Check if user is pharmacist
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (user?.role !== 'pharmacy') {
      navigate('/');
      return;
    }
  }, [user, isAuthenticated, navigate]);

  // Load inventory from API
  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setInventory(data.data);
        calculateStats(data.data);
      } else {
        toast.error(data.msg || 'Failed to load inventory');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory/stats/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const calculateStats = (inventoryList) => {
    const lowStock = inventoryList.filter(item => item.currentStock > 0 && item.currentStock < item.minStock).length;
    const outOfStock = inventoryList.filter(item => item.currentStock === 0).length;
    const totalValue = inventoryList.reduce((sum, item) => sum + (item.currentStock * item.price), 0);
    const totalCost = inventoryList.reduce((sum, item) => sum + (item.currentStock * (item.cost || 0)), 0);
    const totalProfit = totalValue - totalCost;
    
    setStats({
      totalItems: inventoryList.length,
      lowStock,
      outOfStock,
      totalValue: totalValue.toFixed(2),
      totalCost: totalCost.toFixed(2),
      totalProfit: totalProfit.toFixed(2)
    });
  };

  // Single Item Operations
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || newItem.currentStock === undefined || newItem.minStock === undefined || !newItem.unit || !newItem.cost || !newItem.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(newItem.cost) > parseFloat(newItem.price)) {
      toast.error('Cost cannot be greater than price');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newItem.name,
          category: newItem.category,
          currentStock: parseInt(newItem.currentStock),
          minStock: parseInt(newItem.minStock),
          unit: newItem.unit,
          cost: parseFloat(newItem.cost),
          price: parseFloat(newItem.price),
          expiryDate: newItem.expiryDate,
          manufacturer: newItem.manufacturer,
          description: newItem.description,
          location: newItem.location
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Item added successfully');
        fetchInventory();
        fetchStats();
        setShowAddModal(false);
        setNewItem({
          name: '',
          category: '',
          currentStock: '',
          minStock: '',
          unit: '',
          cost: '',
          price: '',
          expiryDate: '',
          manufacturer: '',
          description: '',
          location: ''
        });
      } else {
        toast.error(data.msg || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    }
  };

  const handleEditItem = async () => {
    if (!editItem) return;
    
    if (editItem.cost && editItem.price && parseFloat(editItem.cost) > parseFloat(editItem.price)) {
      toast.error('Cost cannot be greater than price');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory/${editItem._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editItem.name,
          category: editItem.category,
          currentStock: editItem.currentStock,
          minStock: editItem.minStock,
          unit: editItem.unit,
          cost: parseFloat(editItem.cost),
          price: parseFloat(editItem.price),
          expiryDate: editItem.expiryDate,
          manufacturer: editItem.manufacturer,
          description: editItem.description,
          location: editItem.location
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Item updated successfully');
        fetchInventory();
        fetchStats();
        setShowEditModal(false);
        setEditItem(null);
      } else {
        toast.error(data.msg || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory/${selectedItem._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Item deleted successfully');
        fetchInventory();
        fetchStats();
        setShowDeleteModal(false);
        setSelectedItem(null);
      } else {
        toast.error(data.msg || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleUpdateStock = async (itemId, newStock) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory/${itemId}/stock`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newStock })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Stock updated successfully');
        fetchInventory();
        fetchStats();
      } else {
        toast.error(data.msg || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  // Bulk Operations
  const handleAddBulkRow = () => {
    setBulkItems([...bulkItems, { 
      id: Date.now(), 
      name: '', 
      category: '', 
      currentStock: '', 
      minStock: '', 
      unit: '', 
      cost: '',
      price: '', 
      expiryDate: '', 
      manufacturer: '', 
      description: '',
      location: ''
    }]);
  };

  const handleRemoveBulkRow = (id) => {
    if (bulkItems.length === 1) {
      toast.warning('At least one item is required');
      return;
    }
    setBulkItems(bulkItems.filter(item => item.id !== id));
  };

  const handleBulkItemChange = (id, field, value) => {
    setBulkItems(bulkItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSaveAllBulk = async () => {
    // Prepare items with proper parsing
    const validItems = [];
    const invalidItems = [];

    for (const item of bulkItems) {
      // Skip empty rows
      if (!item.name.trim()) {
        continue;
      }

      const currentStockNum = parseInt(item.currentStock);
      const minStockNum = parseInt(item.minStock);
      const costNum = parseFloat(item.cost);
      const priceNum = parseFloat(item.price);

      // Validate each field
      if (isNaN(currentStockNum) || currentStockNum < 0) {
        invalidItems.push({ name: item.name, reason: 'Invalid current stock' });
        continue;
      }

      if (isNaN(minStockNum) || minStockNum < 0) {
        invalidItems.push({ name: item.name, reason: 'Invalid minimum stock' });
        continue;
      }

      if (isNaN(costNum) || costNum < 0) {
        invalidItems.push({ name: item.name, reason: 'Invalid cost' });
        continue;
      }

      if (isNaN(priceNum) || priceNum < 0) {
        invalidItems.push({ name: item.name, reason: 'Invalid price' });
        continue;
      }

      if (costNum > priceNum) {
        invalidItems.push({ name: item.name, reason: 'Cost cannot be greater than price' });
        continue;
      }

      validItems.push({
        name: item.name.trim(),
        category: item.category || 'other',
        currentStock: currentStockNum,
        minStock: minStockNum,
        unit: item.unit || 'tablet',
        cost: costNum,
        price: priceNum,
        expiryDate: item.expiryDate || null,
        manufacturer: item.manufacturer || '',
        description: item.description || '',
        location: item.location || ''
      });
    }

    if (validItems.length === 0) {
      toast.error('Please enter at least one valid item');
      if (invalidItems.length > 0) {
        console.error('Invalid items:', invalidItems);
      }
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: validItems })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.msg);
        fetchInventory();
        fetchStats();
        setShowBulkModal(false);
        // Reset bulk items
        setBulkItems([{ 
          id: Date.now(), 
          name: '', 
          category: '', 
          currentStock: '', 
          minStock: '', 
          unit: '', 
          cost: '',
          price: '', 
          expiryDate: '', 
          manufacturer: '', 
          description: '',
          location: ''
        }]);
      } else {
        toast.error(data.msg || 'Failed to save items');
      }
    } catch (error) {
      console.error('Error saving bulk items:', error);
      toast.error('Failed to save items');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleEditClick = (item) => {
    setEditItem({ ...item });
    setShowEditModal(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const filteredItems = inventory.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    const matchesStock = filterStock === 'all' || 
      (filterStock === 'low' && item.currentStock > 0 && item.currentStock < item.minStock) ||
      (filterStock === 'out' && item.currentStock === 0) ||
      (filterStock === 'good' && item.currentStock >= item.minStock);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getStockStatus = (current, min) => {
    if (current === 0) {
      return { text: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" /> };
    }
    if (current < min) {
      return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle className="w-4 h-4" /> };
    }
    return { text: 'In Stock', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> };
  };

  const handleExport = () => {
    const data = filteredItems.map(item => ({
      'Name': item.name,
      'Category': item.category,
      'Current Stock': item.currentStock,
      'Min Stock': item.minStock,
      'Unit': item.unit,
      'Cost': item.cost,
      'Price': item.price,
      'Margin %': item.price > 0 ? ((item.price - item.cost) / item.price * 100).toFixed(1) : 0,
      'Total Value': (item.currentStock * item.price).toFixed(2),
      'Total Cost': (item.currentStock * (item.cost || 0)).toFixed(2),
      'Total Profit': (item.currentStock * (item.price - (item.cost || 0))).toFixed(2),
      'Expiry Date': item.expiryDate,
      'Manufacturer': item.manufacturer,
      'Location': item.location
    }));
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventory exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated || user?.role !== 'pharmacy') {
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
              <button onClick={() => navigate('/pharmacy-dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <img src={logo} alt="REYS CLINIC Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                  <p className="text-xs text-gray-500">Inventory Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={handleExport} className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
              </button>
              <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Printer className="w-4 h-4" /><span className="hidden sm:inline">Print</span>
              </button>
              <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Plus className="w-4 h-4" /><span>Add Item</span>
              </button>
              <button onClick={() => setShowBulkModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Upload className="w-4 h-4" /><span>Bulk Add</span>
              </button>
              <button onClick={handleLogout} className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-blue-600" /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            <p className="text-sm text-gray-500">Total Items</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-yellow-600" /></div>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            <p className="text-sm text-yellow-600">Low Stock</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            <p className="text-sm text-red-600">Out of Stock</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div>
            </div>
            <p className="text-2xl font-bold text-green-600">${stats.totalValue}</p>
            <p className="text-sm text-green-600">Total Value</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><TrendingDown className="w-5 h-5 text-purple-600" /></div>
            </div>
            <p className="text-2xl font-bold text-purple-600">${stats.totalCost}</p>
            <p className="text-sm text-purple-600">Total Cost</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-indigo-600" /></div>
            </div>
            <p className="text-2xl font-bold text-indigo-600">${stats.totalProfit}</p>
            <p className="text-sm text-indigo-600">Total Profit</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by name, category, or manufacturer..." 
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]" 
              />
            </div>
            <select 
              value={filterCategory} 
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }} 
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              {categories.map(cat => (<option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>))}
            </select>
            <select 
              value={filterStock} 
              onChange={(e) => { setFilterStock(e.target.value); setCurrentPage(1); }} 
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Stock</option>
              <option value="good">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Inventory Table */}
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                      {/* <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Min</th> */}
                      {/* <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unit</th> */}
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Margin</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Expiry</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentItems.map((item) => {
                      const stockStatus = getStockStatus(item.currentStock, item.minStock);
                      const isExpiringSoon = item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                      const margin = item.price > 0 ? ((item.price - (item.cost || 0)) / item.price * 100).toFixed(1) : 0;
                      return (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Pill className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className="capitalize">{item.category}</span></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">{item.currentStock}</span>
                              <button 
                                onClick={() => { 
                                  const newStock = prompt('Enter new stock quantity:', item.currentStock); 
                                  if (newStock && !isNaN(parseInt(newStock))) handleUpdateStock(item._id, newStock); 
                                }} 
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          {/* <td className="px-6 py-4">{item.minStock}</td> */}
                          {/* <td className="px-6 py-4">{item.unit}</td> */}
                          <td className="px-6 py-4">${(item.cost || 0).toFixed(2)}</td>
                          <td className="px-6 py-4">${(item.price || 0).toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-semibold ${margin > 30 ? 'text-green-600' : margin > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {margin}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                              {stockStatus.icon}
                              <span>{stockStatus.text}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs ${isExpiringSoon ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                              {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button onClick={() => handleViewDetails(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEditClick(item)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteClick(item)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No inventory items found</h3>
                  <button onClick={() => setShowAddModal(true)} className="mt-4 px-4 py-2 bg-[#D01A2B] text-white rounded-lg">
                    Add New Item
                  </button>
                </div>
              )}
              {filteredItems.length > 0 && (
                <div className="px-6 py-4 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} items
                  </p>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => paginate(currentPage - 1)} 
                      disabled={currentPage === 1} 
                      className="p-2 border rounded-lg disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 bg-[#D01A2B] text-white rounded-lg">{currentPage}</span>
                    <button 
                      onClick={() => paginate(currentPage + 1)} 
                      disabled={currentPage === totalPages} 
                      className="p-2 border rounded-lg disabled:opacity-50"
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

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add New Item</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                  <input 
                    type="text" 
                    value={newItem.name} 
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                    placeholder="Medication name" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Category *</label>
                  <select 
                    value={newItem.category} 
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})} 
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select</option>
                    {categories.filter(c=>c!=='all').map(cat=><option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Current Stock *</label>
                  <input 
                    type="number" 
                    value={newItem.currentStock} 
                    onChange={(e) => setNewItem({...newItem, currentStock: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Min Stock *</label>
                  <input 
                    type="number" 
                    value={newItem.minStock} 
                    onChange={(e) => setNewItem({...newItem, minStock: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                    placeholder="10" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Unit *</label>
                  <select 
                    value={newItem.unit} 
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})} 
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select</option>
                    {units.map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Cost ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={newItem.cost} 
                    onChange={(e) => setNewItem({...newItem, cost: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                    placeholder="0.00" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={newItem.price} 
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                    placeholder="0.00" 
                  />
                </div>
                <div className="col-span-2">
                  {newItem.cost && newItem.price && parseFloat(newItem.cost) > parseFloat(newItem.price) && (
                    <p className="text-red-500 text-sm">Cost cannot be greater than price</p>
                  )}
                  {newItem.cost && newItem.price && parseFloat(newItem.cost) <= parseFloat(newItem.price) && parseFloat(newItem.price) > 0 && (
                    <p className="text-green-600 text-sm">
                      Margin: {((newItem.price - newItem.cost) / newItem.price * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Expiry Date</label>
                  <input 
                    type="date" 
                    value={newItem.expiryDate} 
                    onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Manufacturer</label>
                  <input 
                    type="text" 
                    value={newItem.manufacturer} 
                    onChange={(e) => setNewItem({...newItem, manufacturer: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Description</label>
                  <textarea 
                    rows="2" 
                    value={newItem.description} 
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">
                  Cancel
                </button>
                <button onClick={handleAddItem} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold">
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Edit Item</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                  <input 
                    type="text" 
                    value={editItem.name} 
                    onChange={(e) => setEditItem({...editItem, name: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Category *</label>
                  <select 
                    value={editItem.category} 
                    onChange={(e) => setEditItem({...editItem, category: e.target.value})} 
                    className="w-full p-2 border rounded-lg"
                  >
                    {categories.filter(c=>c!=='all').map(cat=><option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Current Stock *</label>
                  <input 
                    type="number" 
                    value={editItem.currentStock} 
                    onChange={(e) => setEditItem({...editItem, currentStock: parseInt(e.target.value)})} 
                    className="w-full p-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Min Stock *</label>
                  <input 
                    type="number" 
                    value={editItem.minStock} 
                    onChange={(e) => setEditItem({...editItem, minStock: parseInt(e.target.value)})} 
                    className="w-full p-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Unit *</label>
                  <select 
                    value={editItem.unit} 
                    onChange={(e) => setEditItem({...editItem, unit: e.target.value})} 
                    className="w-full p-2 border rounded-lg"
                  >
                    {units.map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Cost ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={editItem.cost || ''} 
                    onChange={(e) => setEditItem({...editItem, cost: parseFloat(e.target.value)})} 
                    className="w-full p-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={editItem.price || ''} 
                    onChange={(e) => setEditItem({...editItem, price: parseFloat(e.target.value)})} 
                    className="w-full p-2 border rounded-lg" 
                  />
                </div>
                <div className="col-span-2">
                  {editItem.cost && editItem.price && parseFloat(editItem.cost) > parseFloat(editItem.price) && (
                    <p className="text-red-500 text-sm">Cost cannot be greater than price</p>
                  )}
                  {editItem.cost && editItem.price && parseFloat(editItem.cost) <= parseFloat(editItem.price) && parseFloat(editItem.price) > 0 && (
                    <p className="text-green-600 text-sm">
                      Margin: {((editItem.price - editItem.cost) / editItem.price * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Expiry Date</label>
                  <input 
                    type="date" 
                    value={editItem.expiryDate?.split('T')[0] || ''} 
                    onChange={(e) => setEditItem({...editItem, expiryDate: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Manufacturer</label>
                  <input 
                    type="text" 
                    value={editItem.manufacturer || ''} 
                    onChange={(e) => setEditItem({...editItem, manufacturer: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Description</label>
                  <textarea 
                    rows="2" 
                    value={editItem.description || ''} 
                    onChange={(e) => setEditItem({...editItem, description: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">
                  Cancel
                </button>
                <button onClick={handleEditItem} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Bulk Add Items</h3>
                <p className="text-sm text-gray-500">Add multiple inventory items at once</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-2 border text-left text-sm font-semibold">Name *</th>
                      <th className="p-2 border text-left text-sm font-semibold">Category</th>
                      <th className="p-2 border text-left text-sm font-semibold">Stock *</th>
                      <th className="p-2 border text-left text-sm font-semibold">Min *</th>
                      <th className="p-2 border text-left text-sm font-semibold">Unit</th>
                      <th className="p-2 border text-left text-sm font-semibold">Cost *</th>
                      <th className="p-2 border text-left text-sm font-semibold">Price *</th>
                      <th className="p-2 border text-left text-sm font-semibold">Expiry</th>
                      <th className="p-2 border text-center text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkItems.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2 border">
                          <input 
                            type="text" 
                            value={item.name} 
                            onChange={(e) => handleBulkItemChange(item.id, 'name', e.target.value)} 
                            className="w-full px-2 py-1 border rounded" 
                            placeholder="Name" 
                          />
                        </td>
                        <td className="p-2 border">
                          <select 
                            value={item.category} 
                            onChange={(e) => handleBulkItemChange(item.id, 'category', e.target.value)} 
                            className="w-full px-2 py-1 border rounded"
                          >
                            <option value="">Select</option>
                            {categories.filter(c=>c!=='all').map(cat=><option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </td>
                        <td className="p-2 border">
                          <input 
                            type="number" 
                            value={item.currentStock} 
                            onChange={(e) => handleBulkItemChange(item.id, 'currentStock', e.target.value)} 
                            className="w-24 px-2 py-1 border rounded" 
                            placeholder="0" 
                          />
                        </td>
                        <td className="p-2 border">
                          <input 
                            type="number" 
                            value={item.minStock} 
                            onChange={(e) => handleBulkItemChange(item.id, 'minStock', e.target.value)} 
                            className="w-24 px-2 py-1 border rounded" 
                            placeholder="10" 
                          />
                        </td>
                        <td className="p-2 border">
                          <select 
                            value={item.unit} 
                            onChange={(e) => handleBulkItemChange(item.id, 'unit', e.target.value)} 
                            className="w-24 px-2 py-1 border rounded"
                          >
                            <option value="">Select</option>
                            {units.map(u=><option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="p-2 border">
                          <input 
                            type="number" 
                            step="0.01" 
                            value={item.cost} 
                            onChange={(e) => handleBulkItemChange(item.id, 'cost', e.target.value)} 
                            className="w-24 px-2 py-1 border rounded" 
                            placeholder="0.00" 
                          />
                        </td>
                        <td className="p-2 border">
                          <input 
                            type="number" 
                            step="0.01" 
                            value={item.price} 
                            onChange={(e) => handleBulkItemChange(item.id, 'price', e.target.value)} 
                            className="w-24 px-2 py-1 border rounded" 
                            placeholder="0.00" 
                          />
                        </td>
                        <td className="p-2 border">
                          <input 
                            type="date" 
                            value={item.expiryDate} 
                            onChange={(e) => handleBulkItemChange(item.id, 'expiryDate', e.target.value)} 
                            className="w-32 px-2 py-1 border rounded" 
                          />
                        </td>
                        <td className="p-2 border text-center">
                          <button onClick={() => handleRemoveBulkRow(item.id)} className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleAddBulkRow} className="mt-4 flex items-center space-x-2 text-blue-600">
                <Plus className="w-4 h-4" />
                <span>Add Another</span>
              </button>
              <div className="flex space-x-3 mt-6">
                <button onClick={() => setShowBulkModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">
                  Cancel
                </button>
                <button 
                  onClick={handleSaveAllBulk} 
                  disabled={loading} 
                  className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save All ({bulkItems.filter(i => i.name.trim()).length} items)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Item</h3>
              <p className="text-gray-500">Delete "{selectedItem.name}"? This cannot be undone.</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">
                Cancel
              </button>
              <button onClick={handleDeleteItem} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Item Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Pill className="w-8 h-8 text-[#D01A2B]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                  <p className="text-gray-500 capitalize">{selectedItem.category}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Stock</p>
                  <p className="text-xl font-bold">{selectedItem.currentStock} {selectedItem.unit}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Min Stock</p>
                  <p className="text-xl font-bold">{selectedItem.minStock} {selectedItem.unit}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Cost</p>
                  <p className="text-xl font-bold">${(selectedItem.cost || 0).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-xl font-bold">${(selectedItem.price || 0).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Profit Margin</p>
                  <p className="text-xl font-bold text-green-600">
                    {selectedItem.price > 0 ? ((selectedItem.price - (selectedItem.cost || 0)) / selectedItem.price * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Profit per Unit</p>
                  <p className="text-xl font-bold text-green-600">
                    ${((selectedItem.price || 0) - (selectedItem.cost || 0)).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-xl font-bold">${(selectedItem.currentStock * (selectedItem.price || 0)).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-xl font-bold">${(selectedItem.currentStock * (selectedItem.cost || 0)).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Manufacturer</p>
                  <p className="font-semibold">{selectedItem.manufacturer || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Expiry</p>
                  <p className="font-semibold">{selectedItem.expiryDate ? new Date(selectedItem.expiryDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-semibold">{selectedItem.location || 'N/A'}</p>
                </div>
                <div className="col-span-2 bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{selectedItem.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => { 
                    setShowDetailsModal(false); 
                    handleEditClick(selectedItem); 
                  }} 
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold"
                >
                  Edit
                </button>
                <button onClick={() => setShowDetailsModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
