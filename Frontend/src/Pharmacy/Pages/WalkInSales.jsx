import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Heart, 
  CheckCircle,
  ArrowLeft,
  X,
  Loader,
  Baby,
  Users,
  Stethoscope,
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  FileText,
  Package,
  Pill,
  Syringe,
  ClipboardList,
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckSquare,
  XCircle,
  RefreshCw,
  DollarSign,
  Receipt,
  CreditCard,
  History,
  TrendingUp,
  Wallet,
  Plus,
  Trash2,
  ShoppingCart,
  Minus,
  Store,
  Smartphone,
  Building
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const WalkInSales = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mobileNumber, setMobileNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [saleComplete, setSaleComplete] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [categories, setCategories] = useState([]);

  // Fetch inventory from API
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

  useEffect(() => {
    fetchInventory();
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
        // Filter only items with stock > 0
        const availableItems = data.data.filter(item => item.currentStock > 0);
        setInventory(availableItems);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(availableItems.map(item => item.category))];
        setCategories(uniqueCategories);
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

  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      if (existingItem.quantity + 1 > product.currentStock) {
        toast.warning(`Only ${product.currentStock} units available in stock`);
        return;
      }
      setCart(cart.map(item => 
        item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.currentStock < 1) {
        toast.warning('Product out of stock');
        return;
      }
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = cart.find(item => item._id === productId);
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    if (newQuantity > product.currentStock) {
      toast.warning(`Only ${product.currentStock} units available`);
      return;
    }
    setCart(cart.map(item => 
      item._id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Clear entire cart?')) {
      setCart([]);
      toast.info('Cart cleared');
    }
  };

  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const processPayment = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setPaymentAmount('');
    setMobileNumber('');
    setBankName('');
    setTransactionId('');
    setPaymentNote('');
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    const totalAmount = calculateCartTotal();
    const paidAmount = parseFloat(paymentAmount);
    
    if (!paidAmount || paidAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    
    if (paidAmount < totalAmount) {
      toast.error(`Insufficient payment. Total is $${totalAmount.toFixed(2)}`);
      return;
    }
    
    // Validate payment method specific fields
    if (paymentMethod === 'mobile' && !mobileNumber) {
      toast.error('Please enter mobile number');
      return;
    }
    if (paymentMethod === 'bank' && (!bankName || !transactionId)) {
      toast.error('Please enter bank name and transaction ID');
      return;
    }
    
    const change = paidAmount - totalAmount;
    
    // Create sale record
    const saleRecord = {
      id: Date.now(),
      saleId: `WALK-${Date.now()}`,
      date: new Date().toISOString(),
      items: cart.map(item => ({
        productId: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      subtotal: totalAmount,
      paidAmount: paidAmount,
      change: change,
      paymentMethod: paymentMethod,
      paymentDetails: {
        mobileNumber: paymentMethod === 'mobile' ? mobileNumber : null,
        bankName: paymentMethod === 'bank' ? bankName : null,
        transactionId: paymentMethod === 'bank' ? transactionId : null
      },
      paymentNote: paymentNote,
      soldBy: user?.name,
      status: 'completed'
    };
    
    try {
      const token = localStorage.getItem('token');
      
      // Update inventory stock for each item
      for (const item of cart) {
        const newStock = item.currentStock - item.quantity;
        await fetch(`${API_BASE_URL}/api/inventory/${item._id}/stock`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ quantity: newStock })
        });
      }
      
      // Save sale to API (if you have a sales endpoint)
      // await fetch(`${API_BASE_URL}/api/sales`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(saleRecord)
      // });
      
      // Save to localStorage for now
      const existingSales = JSON.parse(localStorage.getItem('walkinSales') || '[]');
      existingSales.push(saleRecord);
      localStorage.setItem('walkinSales', JSON.stringify(existingSales));
      
      // Refresh inventory
      await fetchInventory();
      
      setLastSale(saleRecord);
      setSaleComplete(true);
      setShowPaymentModal(false);
      setCart([]);
      
      toast.success(`Sale completed! Change: $${change.toFixed(2)}`);
      
      // Reset sale complete after 5 seconds
      setTimeout(() => setSaleComplete(false), 5000);
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error('Failed to complete sale');
    }
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REYS CLINIC - Sales Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; background: #fff; }
            .receipt { max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 18px; color: #D01A2B; }
            .header p { margin: 5px 0; font-size: 12px; }
            .items { margin-bottom: 20px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
            .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
            .total-line { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; }
            .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px dashed #000; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>REYS CLINIC</h1>
              <p>Al-Baraka, Hodan, Mogadishu</p>
              <p>Tel: +252 61 1477201</p>
              <p>--------------------------------</p>
              <p>WALK-IN SALE RECEIPT</p>
              <p>${new Date().toLocaleString()}</p>
              <p>ID: ${lastSale.saleId}</p>
              <p>--------------------------------</p>
            </div>
            <div class="items">
              ${lastSale.items.map(item => `
                <div class="item">
                  <span>${item.name} x ${item.quantity}</span>
                  <span>$${item.subtotal.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="total">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>$${lastSale.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-line">
                <span>Paid:</span>
                <span>$${lastSale.paidAmount.toFixed(2)}</span>
              </div>
              <div class="total-line">
                <span>Change:</span>
                <span>$${lastSale.change.toFixed(2)}</span>
              </div>
              <div class="total-line">
                <span>Payment:</span>
                <span>${lastSale.paymentMethod.toUpperCase()}</span>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for shopping at REYS CLINIC!</p>
              <p>Sold by: ${lastSale.soldBy}</p>
              <p>--------------------------------</p>
              <p>For medical advice, consult a doctor</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredProducts = inventory.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const cartTotal = calculateCartTotal();
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
              <button
                onClick={() => navigate('/pharmacy-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <img src={logo} alt="REYS CLINIC Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-[#D01A2B]">REYS CLINIC</h1>
                  <p className="text-xs text-gray-500">Walk-in Sales - No Prescription Required</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Store className="w-4 h-4 text-[#D01A2B]" />
              <span>Walk-in Counter</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {saleComplete && lastSale && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Sale Completed Successfully!</p>
                <p className="text-sm text-green-600">Total: ${lastSale.subtotal.toFixed(2)} | Change: ${lastSale.change.toFixed(2)}</p>
              </div>
            </div>
            <button
              onClick={printReceipt}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Products Section */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D01A2B]"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#D01A2B] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>All Products</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#D01A2B] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-[#D01A2B]" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {currentProducts.map((product) => (
                    <div key={product._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                      <div className="p-4 flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{product.name}</h3>
                            <p className="text-xs text-gray-500 capitalize mt-1">{product.category}</p>
                          </div>
                          {product.minStock && product.currentStock <= product.minStock && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Low Stock</span>
                          )}
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-gray-500">Stock: {product.currentStock} {product.unit}s</p>
                          <p className="text-lg font-bold text-[#D01A2B] mt-2">${product.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="p-4 pt-0">
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.currentStock === 0}
                          className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2 ${
                            product.currentStock > 0
                              ? 'bg-[#D01A2B] text-white hover:bg-red-700'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
                    <p className="text-gray-500">Try adjusting your search or category filter</p>
                  </div>
                )}

                {/* Pagination */}
                {filteredProducts.length > 0 && totalPages > 1 && (
                  <div className="mt-4 flex justify-center space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Shopping Cart Section */}
          <div className="lg:w-96">
            <div className="bg-white rounded-xl shadow-sm sticky top-24">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <ShoppingCart className="w-5 h-5 text-[#D01A2B]" />
                    <span>Shopping Cart</span>
                  </h2>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">Cart is empty</p>
                    <p className="text-xs text-gray-400">Add products to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item._id} className="flex justify-between items-start pb-3 border-b">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="p-1 border rounded hover:bg-gray-50"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="p-1 border rounded hover:bg-gray-50"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="text-red-500 hover:text-red-700 mt-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-semibold">{cartItemsCount}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-4 pt-2 border-t">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-[#D01A2B]">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={processPayment}
                    className="w-full py-3 bg-[#D01A2B] text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Checkout & Pay</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Payment</h3>
              <p className="text-gray-500">Please collect payment from customer</p>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-xl text-[#D01A2B]">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-1 ${
                    paymentMethod === 'cash' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="text-xs">Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mobile')}
                  className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-1 ${
                    paymentMethod === 'mobile' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs">Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-1 ${
                    paymentMethod === 'bank' ? 'border-[#D01A2B] bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <Building className="w-5 h-5" />
                  <span className="text-xs">Bank</span>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Amount Received *</label>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount received"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                autoFocus
              />
              {paymentAmount && parseFloat(paymentAmount) > cartTotal && (
                <p className="text-sm text-green-600 mt-1">
                  Change: ${(parseFloat(paymentAmount) - cartTotal).toFixed(2)}
                </p>
              )}
              {paymentAmount && parseFloat(paymentAmount) < cartTotal && (
                <p className="text-sm text-red-600 mt-1">
                  Insufficient: ${(cartTotal - parseFloat(paymentAmount)).toFixed(2)} remaining
                </p>
              )}
            </div>

            {/* Mobile Payment Fields */}
            {paymentMethod === 'mobile' && (
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Mobile Number *</label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter mobile number"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                />
              </div>
            )}

            {/* Bank Payment Fields */}
            {paymentMethod === 'bank' && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Bank Name *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Enter bank name"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Transaction ID *</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
                  />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Note (Optional)</label>
              <textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Any notes about this sale"
                rows="2"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D01A2B]"
              />
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-semibold">Cancel</button>
              <button onClick={confirmPayment} className="flex-1 px-4 py-2 bg-[#D01A2B] text-white rounded-lg font-semibold">Complete Sale</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalkInSales;
