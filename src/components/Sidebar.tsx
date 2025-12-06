import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Users2,
  CalendarDays,
  HeartHandshake,
  Settings,
  HelpCircle,
  Network,
  BookOpenCheck,
  GraduationCap,
  X,
  LogOut,
  Building,
  Calendar,
  CreditCard,
  Wallet
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { isOpen, closeSidebar } = useSidebar();
  const { user } = useAuth();

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/members", icon: Users, label: "Membros" },
    { to: "/services", icon: Calendar, label: "Cultos" },
    { to: "/groups", icon: Users2, label: "Grupos" },
    { to: "/finance", icon: Wallet, label: "Finanças" },
    { to: "/discipleship", icon: BookOpenCheck, label: "Discipulado" },
    { to: "/departments", icon: Network, label: "Departamentos" },
    { to: "/teaching", icon: GraduationCap, label: "Ensino" },
    { to: "/events", icon: CalendarDays, label: "Eventos" },
    { to: "/settings", icon: Settings, label: "Configurações" },
  ];

  // Add user management for admins
  if (user?.role === 'admin' || user?.role === 'superuser') {
    navItems.splice(navItems.length - 1, 0, { to: "/users", icon: Users, label: "Usuários" });
  }

  // Add subscription for regular users
  if (user?.role !== 'superuser') {
    navItems.push({ to: "/subscription", icon: CreditCard, label: "Assinatura" });
  }

  // Add churches and plans for superusers
  if (user?.role === 'superuser') {
    navItems.splice(1, 0, { to: "/churches", icon: Building, label: "Igrejas" });
    navItems.push({ to: "/plans", icon: CreditCard, label: "Planos" });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold">
              T
            </div>
            <div>
              <h1 className="font-bold text-lg">Thronus</h1>
              <p className="text-xs text-slate-400">Gestão de Igrejas</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth < 1024 && closeSidebar()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <NavLink
            to="/help"
            className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            <HelpCircle size={20} />
            Ajuda e Suporte
          </NavLink>

          <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold text-white shrink-0">
              {user?.fullName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.fullName || 'Visitante'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.churchName || 'Sem Igreja Vinculada'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;