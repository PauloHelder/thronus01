import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Groups from './pages/Groups';
import Events from './pages/Events';
import Finances from './pages/Finances';
import Departments from './pages/Departments';
import Discipleship from './pages/Discipleship';
import Teaching from './pages/Teaching';
import ChurchProfile from './pages/ChurchProfile';
import Churches from './pages/Churches';
import Logout from './pages/Logout';
import MemberDetail from './pages/MemberDetail';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import GroupDetail from './pages/GroupDetail';
import DepartmentDetail from './pages/DepartmentDetail';
import Plans from './pages/Plans';
import ChurchSubscription from './pages/ChurchSubscription';
import MyChurches from './pages/MyChurches';
import TeachingDetail from './pages/TeachingDetail';
import EventDetail from './pages/EventDetail';
import DiscipleshipDetail from './pages/DiscipleshipDetail';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import TransactionDetail from './pages/TransactionDetail';
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
            <Route path="/finances" element={<Finances />} />
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
  // Create demo user on first load
  // Create demo user on first load or update if missing
  React.useEffect(() => {
    const storedUsers = localStorage.getItem('thronus_users');
    let users = storedUsers ? JSON.parse(storedUsers) : [];
    let hasChanges = false;

    if (!users.some((u: any) => u.email === 'demo@church.com')) {
      users.push({
        id: 'demo-user-1',
        churchName: 'Demo Church',
        fullName: 'Demo User',
        email: 'demo@church.com',
        phone: '+1234567890',
        password: 'demo123',
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      hasChanges = true;
    }

    if (!users.some((u: any) => u.email === 'admin@thronus.com')) {
      users.push({
        id: 'super-user-1',
        churchName: 'Thronus Admin',
        fullName: 'Super Admin',
        email: 'admin@thronus.com',
        phone: '+0000000000',
        password: 'admin123',
        role: 'superuser',
        createdAt: new Date().toISOString()
      });
      hasChanges = true;
    }

    if (hasChanges) {
      localStorage.setItem('thronus_users', JSON.stringify(users));
    }
  }, []);

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
            <SidebarProvider>
              <AppContent />
            </SidebarProvider>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;