import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Users2,
  CalendarDays,
  Settings,
  HelpCircle,
  Network,
  BookOpenCheck,
  GraduationCap,
  X,
  CreditCard,
  Building,
  Calendar,
  Wallet,
  Shield,
  BarChart3,
  ArrowLeft,
  ChevronRight,
  Gift,
  ListChecks,
  Activity,
  ClipboardList,
  Package,
  Wrench,
  Tag
} from 'lucide-react';

interface NavBaseItem {
  to?: string;
  icon: any;
  label: string;
  module?: string;
  permission?: string;
  end?: boolean;
}

const Sidebar: React.FC = () => {
  const { isOpen, closeSidebar } = useSidebar();
  const { user, hasPermission, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<string | null>(null);

  // Auto-detect module from URL
  useEffect(() => {
    if (location.pathname.startsWith('/members')) setActiveModule('members');
    else if (location.pathname.startsWith('/departments')) setActiveModule('departments');
    else if (location.pathname.startsWith('/discipleship')) setActiveModule('discipleship');
    else if (location.pathname.startsWith('/teaching')) setActiveModule('teaching');
    else if (location.pathname.startsWith('/finance')) setActiveModule('finance');
    else if (location.pathname.startsWith('/groups')) setActiveModule('groups');
    else if (location.pathname.startsWith('/network')) setActiveModule('network');
    else if (location.pathname.startsWith('/assets')) setActiveModule('assets');
  }, [location.pathname]);

  // Helper function to check navigation permissions
  const checkNavPermission = (permissionKey: string): boolean => {
    return hasPermission(permissionKey);
  };

  // Sub-menu definitions
  const subMenus: Record<string, { title: string, items: NavBaseItem[] }> = {
    members: {
      title: "Gestão de Membros",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
        { to: "/members", icon: Users, label: "Lista de membros", permission: 'members_view', end: true },
        { to: "/members?filter=aniversariantes", icon: Gift, label: "Aniversariantes", permission: 'members_view' },
        { to: "/reports", icon: BarChart3, label: "Relatórios", permission: 'reports_view' },
      ]
    },
    departments: {
      title: "Departamentos",
      items: [
        { to: "/departments", icon: Network, label: "Lista de Departamentos", permission: 'departments_view' },
        { to: "/events", icon: Activity, label: "Atividades/Eventos", permission: 'events_view' },
      ]
    },
    finance: {
      title: "Gestão Financeira",
      items: [
        { to: "/finance/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
        { to: "/finance", icon: Wallet, label: "Finanças", permission: 'finances_view', end: true },
        { to: "/finance?view=requests", icon: ClipboardList, label: "Requisições", permission: 'finances_view' },
      ]
    },
    discipleship: {
      title: "Discipulado",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
        { to: "/discipleship", icon: BookOpenCheck, label: "Discipuladores", permission: 'discipleship_view', end: true },
      ]
    },
    teaching: {
      title: "Ensino e EBD",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
        { to: "/teaching", icon: GraduationCap, label: "Turmas e Classes", permission: 'teaching_view', end: true },
      ]
    },
    assets: {
      title: "Patrimônio",
      items: [
        { to: "/assets", icon: Package, label: "Inventário", permission: 'assets_view', end: true },
        { to: "/assets?tab=categories", icon: Tag, label: "Categorias", permission: 'assets_view' },
        { to: "/assets?tab=maintenance", icon: Wrench, label: "Manutenções", permission: 'assets_view' },
        { to: "/assets?tab=reports", icon: BarChart3, label: "Relatórios", permission: 'assets_view' },
      ]
    }
  };

  const getMainNavItems = (): NavBaseItem[] => {
    let items: NavBaseItem[] = [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ];

    if (hasRole('superuser')) {
      items.push(
        { to: "/users", icon: Users, label: "Usuários" },
        { to: "/admin", icon: Shield, label: "Super Admin" }
      );
    } else {
      items.push(
        { to: "/members", icon: Users, label: "Membros", module: 'members', permission: 'members_view' },
        { to: "/services", icon: Calendar, label: "Cultos", permission: 'services_view' },
        { to: "/groups", icon: Users2, label: "Grupos", permission: 'groups_view' },
        { to: "/network", icon: Network, label: "Minhas Igrejas", permission: 'branches_view' },
        { to: "/finance", icon: Wallet, label: "Finanças", module: 'finance', permission: 'finances_view' },
        { to: "/discipleship", icon: BookOpenCheck, label: "Discipulado", module: 'discipleship', permission: 'discipleship_view' },
        { to: "/departments", icon: Network, label: "Departamentos", module: 'departments', permission: 'departments_view' },
        { to: "/teaching", icon: GraduationCap, label: "Ensino", module: 'teaching', permission: 'teaching_view' },
        { to: "/assets", icon: Package, label: "Patrimônio", module: 'assets', permission: 'assets_view' },
        { to: "/events", icon: CalendarDays, label: "Eventos", permission: 'events_view' },
        { to: "/reports", icon: BarChart3, label: "Relatórios" }
      );

      if (hasRole('admin')) {
        items.push(
          { to: "/users", icon: Users, label: "Usuários" },
          { to: "/settings", icon: Settings, label: "Configurações" }
        );
      }

      if (user?.roles?.some(r => ['admin', 'pastor'].includes(r))) {
        items.push({ to: "/subscription", icon: CreditCard, label: "Assinatura" });
      }
    }

    return items.filter(item => !item.permission || checkNavPermission(item.permission));
  };

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
              Tr
            </div>
            <div>
              <h1 className="font-bold text-lg">Tronus</h1>
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
          {activeModule && subMenus[activeModule] ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <button
                onClick={() => {
                  setActiveModule(null);
                  navigate('/dashboard');
                }}
                className="w-full flex items-center gap-3 px-4 py-2 mb-4 text-orange-400 hover:text-orange-300 hover:bg-slate-700/50 rounded-lg text-sm font-bold transition-all border border-orange-500/20"
              >
                <ArrowLeft size={18} />
                Menu Principal
              </button>

              <div className="px-4 py-2 mb-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                {subMenus[activeModule].title}
              </div>

              {subMenus[activeModule].items
                .filter(item => !item.permission || checkNavPermission(item.permission))
                .map((item) => (
                  <NavLink
                    key={item.to + item.label}
                    to={item.to}
                    end={item.end}
                    onClick={() => window.innerWidth < 1024 && closeSidebar()}
                    className={({ isActive }) => {
                      // Custom active logic for query params
                      const hasQuery = item.to?.includes('?');
                      const isExactlyActive = isActive && (
                        hasQuery
                          ? location.search === item.to!.substring(item.to!.indexOf('?'))
                          : location.search === ''
                      );

                      return `flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${isExactlyActive
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                        }`;
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      {item.label}
                    </div>
                    <ChevronRight size={14} className="opacity-50" />
                  </NavLink>
                ))}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {getMainNavItems().map((item) => (
                <NavLink
                  key={item.to || item.label}
                  to={item.to || '#'}
                  onClick={(e) => {
                    if (item.module) {
                      e.preventDefault();
                      setActiveModule(item.module);
                    }
                    if (window.innerWidth < 1024 && !item.module) closeSidebar();
                  }}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive && !item.module
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} />
                    {item.label}
                  </div>
                  {item.module && <ChevronRight size={14} className="opacity-50" />}
                </NavLink>
              ))}
            </div>
          )}
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