import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, Menu, User, Building, LogOut, ChevronDown, Link2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const { user, switchChurch } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Visão Geral do Dashboard';
      case '/members': return 'Diretório de Membros';
      case '/groups': return 'Pequenos Grupos';
      case '/events': return 'Calendário';
      case '/giving': return 'Gestão de Contribuições';
      case '/departments': return 'Departamentos';
      case '/discipleship': return 'Rastreio de Discipulado';
      case '/teaching': return 'Gestão de Ensino';
      case '/church-profile': return 'Perfil da Igreja';
      case '/my-churches': return 'Minhas Igrejas';
      case '/profile': return 'Meu Perfil';
      case '/logout': return 'Sair';
      default:
        if (location.pathname.startsWith('/members/')) return 'Detalhes do Membro';
        return 'Dashboard';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu for Mobile */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>

        <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all w-48 lg:w-64 outline-none"
          />
        </div>

        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hidden sm:block">
          <Settings size={20} />
        </button>

        {/* Church Switcher (Multi-Tenant) */}
        {user?.churches && user.churches.length > 1 && (
          <div className="mr-2 relative">
             <select 
                title="Trocar de Igreja ativamente"
                className="appearance-none bg-orange-50 border border-orange-200 rounded-lg py-1.5 pl-3 pr-8 text-xs sm:text-sm font-medium text-orange-800 hover:bg-orange-100 focus:ring-2 focus:ring-orange-500 outline-none transition-colors cursor-pointer max-w-[120px] sm:max-w-[200px] truncate shadow-sm"
                value={user.churchId}
                onChange={async (e) => {
                   const success = await switchChurch(e.target.value);
                   if (success) {
                       if (location.pathname === '/dashboard') {
                           window.location.reload();
                       } else {
                           navigate('/dashboard');
                       }
                   }
                }}
             >
                {user.churches.map(uc => (
                   <option key={uc.church_id} value={uc.church_id}>{uc.church.name}</option>
                ))}
             </select>
             <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-orange-600 pointer-events-none" />
          </div>
        )}

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm">
              {user?.fullName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <ChevronDown size={16} className="text-gray-500 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-slate-800">{user?.fullName || 'Usuário Demo'}</p>
                <p className="text-sm text-slate-500">{user?.email || 'demo@church.com'}</p>
                <p className="text-xs text-orange-600 mt-1">{user?.churchName || 'Igreja Demo'}</p>
              </div>

              <div className="py-2">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-slate-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <User size={18} className="text-orange-500" />
                  <span>Meu Perfil</span>
                </button>

                <button
                  onClick={() => {
                    navigate('/church-profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-slate-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Building size={18} className="text-orange-500" />
                  <span>Perfil da Igreja</span>
                </button>

                {/* Minhas Igrejas - Para administradores e usuários regulares (não superuser) */}
                {(user?.role === 'admin' || user?.role === 'user') && (
                  <div className="border-t border-gray-100 my-1 pt-1">
                    <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alternar Igreja</p>
                    {user?.churches?.map(uc => (
                      <button
                        key={uc.church_id}
                        onClick={async () => {
                          if (uc.church_id === user.churchId) return;
                          const success = await switchChurch(uc.church_id);
                          if (success) {
                            setShowUserMenu(false);
                            if (location.pathname === '/dashboard') {
                              window.location.reload();
                            } else {
                              navigate('/dashboard');
                            }
                          }
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                          uc.church_id === user.churchId 
                            ? 'bg-orange-50 text-orange-700 font-semibold' 
                            : 'text-slate-600 hover:bg-gray-50'
                        }`}
                      >
                        <Building size={16} className={uc.church_id === user.churchId ? 'text-orange-500' : 'text-gray-400'} />
                        <span className="truncate">{uc.church.name}</span>
                        {uc.church_id === user.churchId && (
                           <div className="ml-auto w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-slate-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Settings size={18} className="text-orange-500" />
                  <span>Configurações</span>
                </button>
              </div>

              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={() => {
                    navigate('/logout');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;