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
            <Route path="/finances" element={<Finances />} /> {/* Manter compatibilidade se links antigos existirem */}
            <Route path="/finances/:id" element={<TransactionDetail />} />

            <Route path="/departments" element={<Departments />} />
            <Route path="/departments/:id" element={<DepartmentDetail />} />
            <Route path="/discipleship" element={<Discipleship />} />
            <Route path="/discipleship/:id" element={<DiscipleshipDetail />} />
            <Route path="/teaching" element={<Teaching />} />
            <Route path="/teaching/:id" element={<TeachingDetail />} />
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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

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