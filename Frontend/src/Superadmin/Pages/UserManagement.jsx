import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  X, 
  Loader, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Heart,
  LogOut,
  Menu,
  Home,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Key,
  Lock,
  Unlock,
  Filter
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const UserManagement = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [resetPassword, setResetPassword] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    superadmin: 0,
    doctor: 0,
    reception: 0,
    pharmacy: 0,
    labTech: 0,
    active: 0,
    inactive: 0
  });

  const roles = [
    { value: 'superadmin', label: 'Super Admin', color: 'bg-red-100 text-red-700' },
    { value: 'doctor', label: 'Doctor', color: 'bg-blue-100 text-blue-700' },
    { value: 'reception', label: 'Receptionist', color: 'bg-green-100 text-green-700' },
    { value: 'pharmacy', label: 'Pharmacist', color: 'bg-purple-100 text-purple-700' },
    { value: 'lab-tech', label: 'Lab Technician', color: 'bg-yellow-100 text-yellow-700' }
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (user?.role !== 'superadmin') {
      navigate('/');
      return;
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
        calculateStats(data.data);
      } else {
        toast.error(data.msg || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersList) => {
    setStats({
      total: usersList.length,
      superadmin: usersList.filter(u => u.role === 'superadmin').length,
      doctor: usersList.filter(u => u.role === 'doctor').length,
      reception: usersList.filter(u => u.role === 'reception').length,
      pharmacy: usersList.filter(u => u.role === 'pharmacy').length,
      labTech: usersList.filter(u => u.role === 'lab-tech').length,
      active: usersList.filter(u => u.isActive).length,
      inactive: usersList.filter(u => !u.isActive).length
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username) errors.username = 'Username is required';
    else if (formData.username.length < 3) errors.username = 'Username must be at least 3 characters';
    
    if (!formData.name) errors.name = 'Name is required';
    
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.role) errors.role = 'Role is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          name: formData.name,
          password: formData.password,
          role: formData.role,
          phone: formData.phone
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.msg);
        fetchUsers();
        setShowAddModal(false);
        resetForm();
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      console.error('Create user error:', error);
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedUser.name,
          phone: selectedUser.phone,
          role: selectedUser.role,
          isActive: selectedUser.isActive
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.msg);
        fetchUsers();
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Failed to update user');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (!resetPassword || resetPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${selectedUser.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword: resetPassword })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Password reset successfully');
        setShowResetModal(false);
        setSelectedUser(null);
        setResetPassword('');
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Failed to reset password');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.msg);
        fetchUsers();
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !user.isActive
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('Failed to update user status');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: 'user',
      phone: ''
    });
    setFormErrors({});
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      superadmin: { bg: 'bg-red-100', text: 'text-red-700', label: 'Super Admin' },
      doctor: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Doctor' },
      reception: { bg: 'bg-green-100', text: 'text-green-700', label: 'Receptionist' },
      pharmacy: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Pharmacist' },
      'lab-tech': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Lab Technician' }
    };
    const config = roleConfig[role] || { bg: 'bg-gray-100', text: 'text-gray-700', label: role };
    return <span className={`${config.bg} ${config.text} px-2 py-1 rounded-full text-xs font-semibold`}>{config.label}</span>;
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.staffId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && u.isActive) ||
      (filterStatus === 'inactive' && !u.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated || user?.role !== 'superadmin') {
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
                onClick={() => navigate('/superadmin')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <img src={logo} alt="REYS CLINIC Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                  <p className="text-xs text-gray-500">User Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#D01A2B] text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Users</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-red-600">{stats.superadmin}</p>
            <p className="text-sm text-red-600">Super Admins</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{stats.doctor}</p>
            <p className="text-sm text-blue-600">Doctors</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-green-600">{stats.reception}</p>
            <p className="text-sm text-green-600">Receptionists</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-purple-600">{stats.pharmacy}</p>
            <p className="text-sm text-purple-600">Pharmacists</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-yellow-600">{stats.labTech}</p>
            <p className="text-sm text-yellow-600">Lab Techs</p>
          </div>
          <div className="bg-green-100 rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            <p className="text-sm text-green-700">Active</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, username, or staff ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
            >
              <option value="all">All Roles</option>
              <option value="superadmin">Super Admin</option>
              <option value="doctor">Doctor</option>
              <option value="reception">Receptionist</option>
              <option value="pharmacy">Pharmacist</option>
              <option value="lab-tech">Lab Technician</option>
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

        {/* Users Table */}
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Staff ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentUsers.map((u) => (
                      <tr key={u.id || u._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-gray-600">{u.staffId || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-[#D01A2B]">{u.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="font-medium text-gray-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{u.username}</td>
                        <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                        <td className="px-6 py-4 text-gray-600">{u.phone || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowEditModal(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="p-1 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                              title={u.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowResetModal(true);
                              }}
                              className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            {u.role !== 'superadmin' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              )}

              {/* Pagination */}
              {filteredUsers.length > 0 && (
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B] ${formErrors.username ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter username"
                />
                {formErrors.username && <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>}
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B] ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter full name"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B] ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter password"
                />
                {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B] ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Confirm password"
                />
                {formErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>}
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B] ${formErrors.role ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Role</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="reception">Receptionist</option>
                  <option value="pharmacy">Pharmacist</option>
                  <option value="lab-tech">Lab Technician</option>
                </select>
                {formErrors.role && <p className="text-red-500 text-sm mt-1">{formErrors.role}</p>}
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-gray-700 font-semibold mb-2">Staff ID</label><input type="text" value={selectedUser.staffId || '-'} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" /></div>
              <div><label className="block text-gray-700 font-semibold mb-2">Full Name</label><input type="text" value={selectedUser.name} onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]" /></div>
              <div><label className="block text-gray-700 font-semibold mb-2">Username</label><input type="text" value={selectedUser.username} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" /></div>
              <div><label className="block text-gray-700 font-semibold mb-2">Role</label><select value={selectedUser.role} onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]"><option value="superadmin">Super Admin</option><option value="doctor">Doctor</option><option value="reception">Receptionist</option><option value="pharmacy">Pharmacist</option><option value="lab-tech">Lab Technician</option></select></div>
              <div><label className="block text-gray-700 font-semibold mb-2">Phone</label><input type="tel" value={selectedUser.phone || ''} onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]" /></div>
              <div className="flex space-x-3"><button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">Cancel</button><button onClick={handleUpdateUser} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700">Save Changes</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4"><div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"><Key className="w-8 h-8 text-yellow-600" /></div><h3 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h3><p className="text-gray-500">Reset password for <strong>{selectedUser.name}</strong></p></div>
            <div className="mb-4"><label className="block text-gray-700 font-semibold mb-2">New Password</label><input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="Enter new password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D01A2B]" /><p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p></div>
            <div className="flex space-x-3"><button onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">Cancel</button><button onClick={handleResetPassword} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700">Reset Password</button></div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4"><div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-600" /></div><h3 className="text-xl font-bold text-gray-900 mb-2">Delete User</h3><p className="text-gray-500">Are you sure you want to delete <strong>{selectedUser.name}</strong>? This action cannot be undone.</p></div>
            <div className="flex space-x-3"><button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">Cancel</button><button onClick={handleDeleteUser} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

// superadmin-dashboar