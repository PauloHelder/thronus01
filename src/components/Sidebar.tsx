import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../contexts/AuthContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
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
  ChevronDown,
  Heart,
  Gift,
  ListChecks,
  Activity,
  ClipboardList,
  Clock,
  Package,
  Wrench,
  Tag,
  MessageSquare,
  Award
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
  const { user, hasPermission, hasRole, switchChurch } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<string | null>(null);

  // PWA Install Logic
  const { showInstallBtn, handleInstallClick } = usePWAInstall();

  // Auto-detect module from URL
  useEffect(() => {
    if (
      location.pathname.startsWith('/members') ||
      location.pathname.startsWith('/families') ||
      location.pathname.startsWith('/consagracoes') ||
      location.pathname.startsWith('/services') ||
      location.pathname.startsWith('/events') ||
      location.pathname.startsWith('/calendar')
    ) {
      setActiveModule('secretaria');
    } else if (location.pathname.startsWith('/finance') || location.pathname.startsWith('/assets')) {
      setActiveModule('finance');
    } else if (location.pathname.startsWith('/discipleship') || location.pathname.startsWith('/teaching')) {
      setActiveModule('discipleship');
    } else if (location.pathname.startsWith('/groups') || location.pathname.startsWith('/departments')) {
      setActiveModule('departamentos');
    } else if (location.pathname.startsWith('/users') || location.pathname.startsWith('/network') || location.pathname.startsWith('/settings')) {
      setActiveModule('configuracao');
    } else {
      setActiveModule(null);
    }
  }, [location.pathname]);

  // Helper function to check navigation permissions
  const checkNavPermission = (permissionKey: string): boolean => {
    return hasPermission(permissionKey);
  };

  // Sub-menu definitions
  const subMenus: Record<string, { title: string, items: NavBaseItem[] }> = {
    secretaria: {
      title: "Secretaria",
      items: [
        { to: "/members", icon: Users, label: "Membros", permission: 'members_view', end: true },
        { to: "/families", icon: Users, label: "Famílias", permission: 'members_view' },
        { to: "/consagracoes", icon: Award, label: "Consagrações", permission: 'members_view' },
        { to: "/members/reports", icon: BarChart3, label: "Relatórios", permission: 'members_view' },
        { to: "/services", icon: Calendar, label: "Cultos", permission: 'services_view', end: true },
        { to: "/events", icon: CalendarDays, label: "Agenda", permission: 'events_view' },
        { to: "#", icon: ClipboardList, label: "Documentação" },
        { to: "#", icon: MessageSquare, label: "Aconselhamento" },
        { to: "#", icon: Clock, label: "Escala" }
      ]
    },
    finance: {
      title: "Finanças e Tesouraria",
      items: [
        { to: "/finance", icon: Wallet, label: "Tesouraria", permission: 'finances_view', end: true },
        { to: "/finance/tithers", icon: Heart, label: "Dízimos", permission: 'finances_view' },
        { to: "/finance?view=payables", icon: Clock, label: "Contas a Pagar", permission: 'finances_view' },
        { to: "/finance?view=budget", icon: ListChecks, label: "Orçamento", permission: 'finances_view' },
        { to: "/finance?view=requests", icon: ClipboardList, label: "Requisição", permission: 'finances_view' },
        { to: "/assets", icon: Package, label: "Património", permission: 'assets_view', end: true },
        { to: "/assets?tab=maintenance", icon: Wrench, label: "Manutenção", permission: 'assets_view' }
      ]
    },
    discipleship: {
      title: "Discipulado e Ensino",
      items: [
        { to: "/discipleship", icon: BookOpenCheck, label: "Discipulado", permission: 'discipleship_view', end: true },
        { to: "/teaching", icon: GraduationCap, label: "Turmas (Ensino)", permission: 'teaching_view', end: true },
        { to: "#", icon: Award, label: "Certificados (Ensino)" }
      ]
    },
    departamentos: {
      title: "Departamentos e Grupos",
      items: [
        { to: "/groups", icon: Users2, label: "Grupos", permission: 'groups_view', end: true },
        { to: "/departments", icon: Network, label: "Departamentos", permission: 'departments_view', end: true }
      ]
    },
    configuracao: {
      title: "Configurações do Sistema",
      items: [
        { to: "/settings", icon: Settings, label: "Configurações Gerais", permission: 'settings_view' },
        { to: "/users", icon: Users, label: "Usuários", permission: 'users_view' },
        { to: "/network", icon: Network, label: "Rede de Igrejas", permission: 'branches_view' },
        { to: "/assets?tab=categories", icon: Tag, label: "Categoria de Património", permission: 'assets_view' }
      ]
    }
  };

  const getMainNavItems = (): NavBaseItem[] => {
    let items: NavBaseItem[] = [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ];

    if (hasRole('superuser')) {
      items.push(
        { to: "/admin?tab=dashboard", icon: LayoutDashboard, label: "Painel Super Admin" },
        { to: "/admin?tab=churches", icon: Building, label: "Igrejas Cadastradas" },
        { to: "/admin?tab=plans", icon: CreditCard, label: "Gerenciar Planos" },
        { to: "/admin?tab=denominations", icon: BookOpenCheck, label: "Denominações" },
        { to: "/users", icon: Users, label: "Usuários" }
      );
    }

    // Modular groups as main menu items
    items.push(
      { icon: Building, label: "Secretaria", module: 'secretaria' },
      { icon: Wallet, label: "Finanças", module: 'finance' },
      { icon: BookOpenCheck, label: "Discipulado", module: 'discipleship' },
      { icon: Network, label: "Departamentos", module: 'departamentos' },
      { icon: Settings, label: "Configuração", module: 'configuracao' }
    );

    // Subscription & Store - ONLY FOR SUPERUSER
    if (hasRole('superuser')) {
      items.push(
        { to: "/subscription", icon: CreditCard, label: "Assinatura", permission: 'subscription_view' }
      );
    }

    return items;
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

        {/* Church Selector (Mobile Friendly) */}
        {user?.churches && user.churches.length > 1 && (
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/30">
            <div className="relative">
              <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" />
              <select
                title="Trocar de Igreja"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 pl-10 pr-8 text-sm font-medium text-white focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer transition-all"
                value={user.churchId}
                onChange={async (e) => {
                  const success = await switchChurch(e.target.value);
                  if (success) {
                    if (window.innerWidth < 1024) closeSidebar();
                    if (location.pathname === '/dashboard') {
                      window.location.reload();
                    } else {
                      navigate('/dashboard');
                    }
                  }
                }}
              >
                {user.churches.map(uc => (
                  <option key={uc.church_id} value={uc.church_id}>
                    {uc.church.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

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
                .filter(item => hasRole('superuser') || hasRole('admin') || !item.permission || checkNavPermission(item.permission))
                .map((item) => (
                  <NavLink
                    key={item.to + item.label}
                    to={item.to || '#'}
                    end={item.end}
                    onClick={(e) => {
                      if (item.to === '#') e.preventDefault();
                      if (window.innerWidth < 1024) closeSidebar();
                    }}
                    className={({ isActive }) => {
                      const hasQuery = item.to?.includes('?');
                      const isExactlyActive = isActive && item.to !== '#' && (
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
                    {item.to !== '#' && <ChevronRight size={14} className="opacity-50" />}
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
                    } else if (window.innerWidth < 1024) {
                      closeSidebar();
                    }
                  }}
                  className={({ isActive }) => {
                    const hasQuery = item.to?.includes('?');
                    const isExactlyActive = isActive && item.to !== '#' && (
                      hasQuery
                        ? location.search === item.to!.substring(item.to!.indexOf('?'))
                        : location.search === ''
                    );

                    return `flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${isExactlyActive && !item.module
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`;
                  }}
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
            Ajuda & Tutoriais
          </NavLink>

          {showInstallBtn && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center gap-3 px-4 py-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 rounded-lg text-sm transition-all border border-orange-500/30 animate-pulse-slow"
            >
              <Package size={20} />
              Instalar Aplicativo
            </button>
          )}

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