import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './Components/ProtectedRoute';
import Home from './Components/Home';
import SignIn from './Components/SignIn';
import SignUp from './Components/SignUp';
import BookAppointment from './Components/BookAppointment';

// Dashboards
import SuperadminDashboard from './Superadmin/SuperadminDashboard';
import DoctorDashboard from './Doctor/DoctorDashboard';
import ReceptionDashboard from './Reception/ReceptionDashboard';
import PharmacyDashboard from './Pharmacy/PharmacyDashboard';
import LabTechDashboard from './Lab-Tech/LabTechDashboard';

// Superadmin Pages
import UserManagement from './Superadmin/Pages/UserManagement';
import Revenue from './Superadmin/Pages/Revenue';

// Doctor Pages
import Appointments from './Doctor/Pages/Appointments';
import DoctorConsultation from './Doctor/Pages/DoctorConsultation';
import DoctorMasterData from './Doctor/Pages/DoctorMasterData';
import InpatientPage from './Reception/Pages/InpatientPage';

// Reception Pages
import RegisterPatient from './Reception/Pages/RegisterPatient';
import PatientCheckout from './Reception/Pages/PatientCheckout';
import CompletedCheckouts from './Reception/Pages/CompletedCheckouts';

// Pharmacy Pages
import PharmacyPrescriptions from './Pharmacy/Pages/PharmacyPrescriptions';
import Inventory from './Pharmacy/Pages/Inventory';
import WalkInSales from './Pharmacy/Pages/WalkInSales';
import SalesHistory from './Pharmacy/Pages/SalesHistory ';

// Lab-Tech Dashboard
import LabTechTests from './Lab-Tech/Pages/LabTechTests';
import LabTechResults from './Lab-Tech/Pages/LabTechResults';
import LabTests from './Lab-Tech/Pages/LabTests';

// 404 Component
const NotFound = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-2">Page Not Found</p>
      <p className="text-gray-500 mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" className="px-6 py-2 bg-[#D01A2B] text-white rounded-lg hover:bg-red-700 transition-colors">
        Go Home
      </a>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/book-appointment" element={<BookAppointment />} />

        {/* Superadmin Routes */}
        <Route path="/superadmin/*" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperadminDashboard />
          </ProtectedRoute>
        } /> 

        <Route path="/user-management" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <UserManagement />
          </ProtectedRoute>
        } />

        <Route path="/revenue" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <Revenue />
          </ProtectedRoute>
        } />

        {/* Doctor Routes */}
        <Route path="/doctor-dashboard" element={
          <ProtectedRoute>
            <DoctorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/consultations" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorConsultation />
          </ProtectedRoute>
        } />

        <Route path="/doctor-master-data" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorMasterData />
          </ProtectedRoute>
        } />

        {/* Reception Routes */}
        <Route path="/reception-dashboard" element={
          <ProtectedRoute allowedRoles={['reception']}>
            <ReceptionDashboard />
          </ProtectedRoute>
        } />

        <Route path="/appointments" element={
          <ProtectedRoute allowedRoles={['reception']}>
            <Appointments />
          </ProtectedRoute>
        } />

        <Route path="/inpatients" element={
          <ProtectedRoute allowedRoles={['reception']}>
            <InpatientPage />
          </ProtectedRoute>
        } />

        <Route path="/register-patient" element={
            <ProtectedRoute allowedRoles={['reception']}>
              <RegisterPatient />
            </ProtectedRoute>
          } />

          <Route path="/checkout" element={
            <ProtectedRoute allowedRoles={['reception']}>
              <PatientCheckout />
            </ProtectedRoute>
          } />

          <Route path="/checkouts" element={
            <ProtectedRoute allowedRoles={['reception']}>
              <CompletedCheckouts />
            </ProtectedRoute>
          } />

          {/* Pharmacy Routes */}
          <Route path="/pharmacy-dashboard/*" element={
              <ProtectedRoute allowedRoles={['pharmacy']}>
                <PharmacyDashboard />
              </ProtectedRoute>
            } />

            <Route path="/pharmacy-prescriptions" element={
              <ProtectedRoute allowedRoles={['pharmacy']}>
                <PharmacyPrescriptions />
              </ProtectedRoute>
            } />

            <Route path="/pharmacy-inventory" element={
              <ProtectedRoute allowedRoles={['pharmacy']}>
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/sales" element={
              <ProtectedRoute allowedRoles={['pharmacy']}>
                <WalkInSales />
              </ProtectedRoute>
            } />

            <Route path="/sales-history" element={
              <ProtectedRoute allowedRoles={['pharmacy']}>
                <SalesHistory />
              </ProtectedRoute>
            } />

            {/* Lab-Tech Routes */}
            <Route path="/labtech-dashboard/*" element={
              <ProtectedRoute allowedRoles={['lab-tech']}>
                <LabTechDashboard />
              </ProtectedRoute>
            } /> 

            <Route path="/labtech-tests" element={
              <ProtectedRoute allowedRoles={['lab-tech']}>
                <LabTechTests />
              </ProtectedRoute>
            } />

            <Route path="/labtech-results" element={
              <ProtectedRoute allowedRoles={['lab-tech']}>
                <LabTechResults />
              </ProtectedRoute>
            } />

            <Route path="/lab-tests" element={
              <ProtectedRoute allowedRoles={['lab-tech']}>
                <LabTests />
              </ProtectedRoute>
            } />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;