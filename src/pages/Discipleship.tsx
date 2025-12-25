import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Users, Calendar, TrendingUp } from 'lucide-react';
import { useDiscipleship } from '../hooks/useDiscipleship';
import { useMembers } from '../hooks/useMembers';
import AddDiscipleshipLeaderModal from '../components/modals/AddDiscipleshipLeaderModal';

import { useAuth } from '../contexts/AuthContext';

const Discipleship: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { leaders, loading, addLeader } = useDiscipleship();
  const { members } = useMembers();

  const [isAddLeaderModalOpen, setIsAddLeaderModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddLeader = async (memberId: string, startDate: string) => {
    await addLeader(memberId, startDate);
    setIsAddLeaderModalOpen(false);
  };

  const handleViewDetails = (leaderId: string) => {
    navigate(`/discipleship/${leaderId}`);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredLeaders = leaders.filter(leader =>
    leader.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leader.member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Membros disponíveis para se tornarem líderes (que ainda não são líderes)
  const availableMembers = members.filter(
    member => !leaders.some(leader => leader.member_id === member.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Discipulado</h1>
          <p className="text-slate-600 mt-1">Gestão de líderes, discípulos e encontros</p>
        </div>
        {hasPermission('discipleship_create') && (
          <button
            onClick={() => setIsAddLeaderModalOpen(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm hover:shadow"
          >
            <Plus size={18} />
            Novo Líder
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-500">Total de Líderes</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{leaders.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-500">Total de Discípulos</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {leaders.reduce((acc, leader) => acc + leader.disciples.length, 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-500">Encontros Registrados</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {leaders.reduce((acc, leader) => acc + (leader.meetings_count || 0), 0)}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar líder por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>

      {/* Leaders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeaders.map(leader => (
          <div
            key={leader.id}
            onClick={() => handleViewDetails(leader.id)}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-4 mb-4">
              <img
                src={leader.member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.member.name)}&background=random`}
                alt={leader.member.name}
                className="w-16 h-16 rounded-full border-2 border-orange-100 object-cover"
              />
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors line-clamp-1">
                  {leader.member.name}
                </h3>
                <p className="text-sm text-slate-600 line-clamp-1">{leader.member.email}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Líder desde {formatDate(leader.start_date)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Discípulos</span>
                </div>
                <span className="text-lg font-bold text-blue-700">{leader.disciples.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Encontros</span>
                </div>
                <span className="text-lg font-bold text-purple-700">{leader.meetings_count || 0}</span>
              </div>
            </div>

            {leader.disciples.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Discípulos</p>
                <div className="flex -space-x-2 overflow-hidden">
                  {leader.disciples.slice(0, 5).map(disciple => (
                    <img
                      key={disciple.id}
                      src={disciple.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(disciple.name)}&background=random`}
                      alt={disciple.name}
                      title={disciple.name}
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                  {leader.disciples.length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                      +{leader.disciples.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredLeaders.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {searchTerm ? 'Nenhum líder encontrado' : 'Nenhum líder cadastrado'}
          </h3>
          <p className="text-slate-600 mb-4">
            {searchTerm
              ? 'Tente ajustar sua pesquisa.'
              : 'Comece adicionando líderes de discipulado.'}
          </p>
          {!searchTerm && (
            hasPermission('discipleship_create') && (
              <button
                onClick={() => setIsAddLeaderModalOpen(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors mx-auto"
              >
                <Plus size={18} />
                Adicionar Primeiro Líder
              </button>
            )
          )}
        </div>
      )}

      <AddDiscipleshipLeaderModal
        isOpen={isAddLeaderModalOpen}
        onClose={() => setIsAddLeaderModalOpen(false)}
        onSave={handleAddLeader}
        members={availableMembers}
      />
    </div>
  );
};

export default Discipleship;