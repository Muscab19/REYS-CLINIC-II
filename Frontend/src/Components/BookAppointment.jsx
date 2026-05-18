import React, { useState, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Heart, 
  CheckCircle,
  ArrowLeft,
  Download,
  Printer,
  Share2,
  X,
  Loader,
  Baby,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://reysclinic.com');

const BookAppointment = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [appointmentData, setAppointmentData] = useState(null);
  const [error, setError] = useState(null);
  const ticketRef = useRef(null);
  
  const [formData, setFormData] = useState({
    // Who is the patient?
    patientType: 'child',
    // Child Information
    childName: '',
    childAge: '',
    // Parent/Guardian Information
    parentName: '',
    parentPhone: '',
    // Appointment Details
    preferredDate: '',
    preferredTime: '',
    // Medical History
    previousVisits: 'no',
    reason: '',
  });

  const [errors, setErrors] = useState({});
  const [availableTimes, setAvailableTimes] = useState([]);

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM'
  ];

  const somaliMonths = [
    'Janaayo', 'Febraayo', 'Maarso', 'Abriil', 'Maajo', 'Juun',
    'Luuliyo', 'Agosto', 'Sebtembar', 'Oktoobar', 'Nofembar', 'Disembar'
  ];

  const somaliDays = [
    'Axad', 'Isniin', 'Talaado', 'Arbacaa', 'Khamiis', 'Jimco', 'Sabti'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setFormData(prev => ({ ...prev, preferredDate: date }));
    
    if (date) {
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.getDay();
      
      // Friday (day 5) is closed
      if (dayOfWeek === 5) {
        setAvailableTimes(['Xafiisku ma shaqeeyo Jimcaha. Fadlan dooro taariikh kale.']);
      } else {
        // Generate available time slots (randomly mark some as booked)
        const available = timeSlots.filter(() => Math.random() > 0.3);
        setAvailableTimes(available);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.childName) newErrors.childName = 'Magaca cunugga waa loo baahan yahay';
    if (!formData.childAge) newErrors.childAge = "Da'da cunugga waa loo baahan yahay";
    else if (isNaN(formData.childAge) || formData.childAge < 0 || formData.childAge > 18) 
      newErrors.childAge = "Fadlan gali da' sax ah (0-18 sano)";
    
    if (!formData.parentName) newErrors.parentName = 'Magaca waalidka/Masuulka waa loo baahan yahay';
    if (!formData.parentPhone) newErrors.parentPhone = 'Lambarka taleefanka waa loo baahan yahay';
    else if (!/^[0-9+\-\s]{8,15}$/.test(formData.parentPhone)) 
      newErrors.parentPhone = 'Fadlan gali lambar taleefan sax ah';
    
    if (!formData.preferredDate) newErrors.preferredDate = 'Fadlan dooro taariikh';
    if (!formData.preferredTime) newErrors.preferredTime = 'Fadlan dooro waqti';
    if (!formData.reason) newErrors.reason = 'Fadlan sheeg sababta booqashada';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const dayName = somaliDays[date.getDay()];
    return `${dayName}, ${date.getDate()} ${somaliMonths[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Fadlan gal si aad ballan u qabsato');
        navigate('/signin');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          childName: formData.childName,
          childAge: parseInt(formData.childAge),
          parentName: formData.parentName,
          parentPhone: formData.parentPhone,
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          reason: formData.reason,
          previousVisits: formData.previousVisits,
          notes: ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Ballan qabasho way ku dhacday');
      }

      if (data.success) {
        const formattedAppointment = {
          ...data.data,
          formattedDate: formatDate(data.data.preferredDate)
        };
        setAppointmentData(formattedAppointment);
        setIsSuccess(true);
        toast.success('Ballanka si guul leh ayaa loo qabtay!');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTicket = () => {
    const ticketElement = ticketRef.current;
    if (!ticketElement) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REYS CLINIC - Ticketka Ballanka</title>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f0f0f0;
              padding: 20px;
            }
            .ticket {
              max-width: 500px;
              width: 100%;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            .ticket-header {
              background: #D01A2B;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .ticket-header h2 {
              font-size: 24px;
              margin-bottom: 5px;
            }
            .ticket-body {
              padding: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .info-value {
              color: #333;
            }
            .ticket-footer {
              background: #f8f8f8;
              padding: 15px;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
            .status {
              background: #4CAF50;
              color: white;
              padding: 5px 15px;
              border-radius: 20px;
              display: inline-block;
              font-size: 12px;
              margin-bottom: 15px;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="ticket-header">
              <h2>🎫 REYS CLINIC</h2>
              <p>Ticketka Ballanka</p>
            </div>
            <div class="ticket-body">
              <div style="text-align: center;">
                <div class="status">✓ La xaqiijiyay</div>
              </div>
              <div class="info-row">
                <span class="info-label">Ticket ID:</span>
                <span class="info-value">${appointmentData.ticketId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Magaca Cunugga:</span>
                <span class="info-value">${appointmentData.childName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Da'da Cunugga:</span>
                <span class="info-value">${appointmentData.childAge} sano</span>
              </div>
              <div class="info-row">
                <span class="info-label">Magaca Waalidka:</span>
                <span class="info-value">${appointmentData.parentName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Telefoon:</span>
                <span class="info-value">${appointmentData.parentPhone}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Taariikhda:</span>
                <span class="info-value">${appointmentData.formattedDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Waqtiga:</span>
                <span class="info-value">${appointmentData.preferredTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Sababta:</span>
                <span class="info-value">${appointmentData.reason}</span>
              </div>
            </div>
            <div class="ticket-footer">
              <p>Fadlan ka hor timid 15 daqiiqadood ballankaaga ka hor.</p>
              <p>✆ +252 61 1477201 | 📍 Al-Baraka, Hodan, Muqdisho</p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; background: #D01A2B; color: white; border: none; border-radius: 8px; cursor: pointer;">🖨️ Daabac</button>
            <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer;">✖ Xidh</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleNewAppointment = () => {
    setIsSuccess(false);
    setAppointmentData(null);
    setError(null);
    setFormData({
      patientType: 'child',
      childName: '',
      childAge: '',
      parentName: '',
      parentPhone: '',
      preferredDate: '',
      preferredTime: '',
      previousVisits: 'no',
      reason: '',
    });
    setAvailableTimes([]);
    setErrors({});
  };

  if (isSuccess && appointmentData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Ticket Card */}
          <div ref={ticketRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#D01A2B] to-red-700 p-6 text-white text-center">
              <div className="flex justify-center items-center space-x-3 mb-3">
                <div className="bg-white rounded-full p-2">
                  <Heart className="w-8 h-8 text-[#D01A2B]" />
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold">REYS CLINIC</h2>
                  <p className="text-white/80 text-sm">Daryeel tayo leh, adeeg lagu kalsoon yahay</p>
                </div>
              </div>
              <h3 className="text-xl font-semibold mt-2">Ticketka Ballanka</h3>
              <p className="text-white/90 text-sm">Xaqiijinta Ballanka</p>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-5">
                <span className="inline-flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>La xaqiijiyay</span>
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500 font-medium">Ticket ID:</span>
                  <span className="font-mono font-semibold text-[#D01A2B]">{appointmentData.ticketId}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500 font-medium">Magaca Cunugga:</span>
                  <span className="font-semibold">{appointmentData.childName}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500 font-medium">Da'da Cunugga:</span>
                  <span>{appointmentData.childAge} sano</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500 font-medium">Magaca Waalidka:</span>
                  <span className="font-semibold">{appointmentData.parentName}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500 font-medium">Lambarka Telefoonka:</span>
                  <span>{appointmentData.parentPhone}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500 font-medium">Taariikhda:</span>
                  <span className="font-semibold text-[#D01A2B]">{appointmentData.formattedDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500 font-medium">Waqtiga:</span>
                  <span className="font-semibold text-[#D01A2B]">{appointmentData.preferredTime}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500 font-medium">Sababta:</span>
                  <span className="text-right max-w-[200px] text-gray-700">{appointmentData.reason}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 text-center text-sm text-gray-500 border-t">
              <p className="font-medium">✦ Fadlan ka hor timid 15 daqiiqadood ballankaaga ka hor ✦</p>
              <div className="flex justify-center space-x-4 mt-3 text-xs">
                <span>✆ +252 61 1477201</span>
                <span>📍 Al-Baraka, Hodan, Muqdisho</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <button 
              onClick={handleDownloadTicket}
              className="flex items-center space-x-2 px-6 py-3 bg-[#D01A2B] text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-md"
            >
              <Download className="w-5 h-5" />
              <span>Soo Degso Ticketka</span>
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Ku noqo Dashboard-ka</span>
            </button>
            <button 
              onClick={handleNewAppointment}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span>Ballan Cusub</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <img src={logo} alt="REYS CLINIC Logo" className="h-12 w-auto object-contain" />
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Heart className="w-4 h-4 text-[#D01A2B]" />
              <span>Daryeel tayo leh, adeeg lagu kalsoon yahay</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#D01A2B] to-red-700 p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Ballan Qabso</h1>
            <p className="text-white/90">Fadlan buuxi foomka hoose si aad ballan u qabsato</p>
          </div>
          
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Child Information */}
              <div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Magaca Cunugga <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="childName"
                      value={formData.childName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${
                        errors.childName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Gali magaca cunugga"
                    />
                    {errors.childName && <p className="text-red-500 text-sm mt-1">{errors.childName}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Da'da Cunugga (Sano) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="childAge"
                      value={formData.childAge}
                      onChange={handleInputChange}
                      min="0"
                      max="18"
                      step="1"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${
                        errors.childAge ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Tusaale: 5"
                    />
                    {errors.childAge && <p className="text-red-500 text-sm mt-1">{errors.childAge}</p>}
                  </div>
                </div>
              </div>

              {/* Section 2: Parent/Guardian Information */}
              <div className="border-t pt-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Magaca Waalidka/Masuulka <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${
                        errors.parentName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Gali magaca waalidka/Masuulka"
                    />
                    {errors.parentName && <p className="text-red-500 text-sm mt-1">{errors.parentName}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Lambarka Telefoonka <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="parentPhone"
                        value={formData.parentPhone}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${
                          errors.parentPhone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="+252 61 1477201"
                      />
                    </div>
                    {errors.parentPhone && <p className="text-red-500 text-sm mt-1">{errors.parentPhone}</p>}
                  </div>
                </div>
              </div>

              {/* Section 3: Appointment Details */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="w-5 h-5 text-[#D01A2B]" />
                  <h3 className="text-lg font-bold text-gray-900">Dooro Goorta aad rabto la kulan-ka Dhakhtarka</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Taariikhda Aad Rabto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleDateChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${
                        errors.preferredDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.preferredDate && <p className="text-red-500 text-sm mt-1">{errors.preferredDate}</p>}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Waqtiga Aad Rabto <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${
                        errors.preferredTime ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Dooro waqti</option>
                      {availableTimes.length > 0 && availableTimes[0] !== 'Xafiisku ma shaqeeyo Jimcaha. Fadlan dooro taariikh kale.' ? (
                        availableTimes.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))
                      ) : (
                        <option disabled>{availableTimes[0] || 'Fadlan dooro taariikh marka hore'}</option>
                      )}
                    </select>
                    {errors.preferredTime && <p className="text-red-500 text-sm mt-1">{errors.preferredTime}</p>}
                  </div>
                </div>
              </div>

              {/* Section 4: Medical History */}
              <div className="border-t pt-6">
                <div className="mb-5">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Horay ma usoo booqatay REYS CLINIC?
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="previousVisits"
                        value="yes"
                        checked={formData.previousVisits === 'yes'}
                        onChange={handleInputChange}
                        className="text-[#D01A2B] focus:ring-[#D01A2B]"
                      />
                      <span>Haa</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="previousVisits"
                        value="no"
                        checked={formData.previousVisits === 'no'}
                        onChange={handleInputChange}
                        className="text-[#D01A2B] focus:ring-[#D01A2B]"
                      />
                      <span>Maya</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Sababta Booqashada <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows="3"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D01A2B] ${
                      errors.reason ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Sheeg sababta booqashada (tusaale: qandho, tallaal, baaritaan guud, iwm.)"
                  />
                  {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-yellow-50 rounded-xl p-4 flex items-start space-x-3">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Ogeysiis Muhiim ah:</p>
                  <p>Fadlan ka hor timid 15 daqiiqadood ballankaaga ka hor si aad isu diiwaan geliso.</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#D01A2B] text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Waa la habaynayaa...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    <span>Ballan Qabso</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;

// Dooro Taariikhda & Waqtiga