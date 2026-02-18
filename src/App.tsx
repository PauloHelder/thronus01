import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Finance from './pages/Finance'; // Novo módulo
import FinanceDashboard from './pages/FinanceDashboard';
import Finances from './pages/Finances'; // Antigo (manter por enquanto se necessário, ou remover)
import TransactionDetail from './pages/TransactionDetail';
import Departments from './pages/Departments';
import DepartmentDetail from './pages/DepartmentDetail';
import Discipleship from './pages/Discipleship';
import DiscipleshipDetail from './pages/DiscipleshipDetail';
import Teaching from './pages/Teaching';
import TeachingDetail from './pages/TeachingDetail';
import ChurchProfile from './pages/ChurchProfile';
import ChurchSubscription from './pages/ChurchSubscription';
import MyChurches from './pages/MyChurches';
import Churches from './pages/Churches';
import Plans from './pages/Plans';
import UserProfile from './pages/UserProfile';
import Logout from './pages/Logout';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import InviteLanding from './pages/InviteLanding';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import Reports from './pages/Reports';
import Network from './pages/Network';
import BranchDetails from './pages/BranchDetails';
import MemberRegistration from './pages/MemberRegistration';
import Assets from './pages/Assets';


const AppContent: React.FC = () => {
  const { isOpen } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-slate-800 overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        <Header />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberDetail />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:id" element={<GroupDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />

            {/* Finance Module */}
            <Route path="/finance" element={<Finance />} />
            <Route path="/finance/dashboard" element={<FinanceDashboard />} />
            <Route path="/finances" element={<Finances />} /> {/* Manter compatibilidade se links antigos existirem */}
            <Route path="/finances/:id" element={<TransactionDetail />} />

            <Route path="/departments" element={<Departments />} />
            <Route path="/departments/:id" element={<DepartmentDetail />} />
            <Route path="/discipleship" element={<Discipleship />} />
            <Route path="/discipleship/:id" element={<DiscipleshipDetail />} />
            <Route path="/teaching" element={<Teaching />} />
            <Route path="/teaching/:id" element={<TeachingDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/church-profile" element={<ChurchProfile />} />
            <Route path="/subscription" element={<ChurchSubscription />} />
            <Route path="/my-churches" element={<MyChurches />} />
            <Route path="/churches" element={<Churches />} />
            <Route path="/churches/:id" element={<ChurchProfile />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/network" element={<Network />} />
            <Route path="/network/:id" element={<BranchDetails />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

import { Toaster } from 'sonner';

const App: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuração Necessária</h1>
          <p className="text-gray-600 mb-6">
            As variáveis de ambiente do Supabase não foram encontradas.
            Por favor, configure o arquivo <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>.
          </p>
          <div className="text-left bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            <pre>VITE_SUPABASE_URL=seudatabase.supabase.co</pre>
            <pre>VITE_SUPABASE_ANON_KEY=suachaveanonima</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" richColors />
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/join/:slug" element={<MemberRegistration />} />
          <Route path="/accept-invite" element={<InviteLanding />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <SidebarProvider>
                <AppContent />
              </SidebarProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;