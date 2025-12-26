import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, Filter, Edit3, Trash2, Plus, Users, MapPin, Clock } from 'lucide-react';
import { useGroups, Group } from '../hooks/useGroups';
import { useMembers } from '../hooks/useMembers';
import GroupModal from '../components/modals/GroupModal';

import { useAuth } from '../contexts/AuthContext';

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { groups, loading, error, addGroup, updateGroup, deleteGroup } = useGroups();
  const { members } = useMembers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddGroup = () => {
    setSelectedGroup(undefined);
    setIsModalOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleDeleteGroup = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este grupo?')) {
      await deleteGroup(id);
    }
  };

  const handleSaveGroup = async (groupData: any) => {
    try {
      if (groupData.id) {
        await updateGroup(groupData.id, groupData);
      } else {
        await addGroup(groupData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving group:', err);
      alert('Erro ao salvar grupo');
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.leader_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-bold">Erro ao carregar grupos</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Grupos Pequenos</h1>
          <p className="text-slate-600 mt-1">Gerencie células, grupos de estudo e comunhão</p>
        </div>
        {hasPermission('groups_create') && (
          <button
            onClick={handleAddGroup}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm hover:shadow"
          >
            <Plus size={18} />
            Novo Grupo
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-500">Total de Grupos</p>
              <p className="text-xl md:text-2xl font-bold text-slate-800">{groups.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-green-50 text-green-600 rounded-lg">
              <Users size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-500">Membros em Grupos</p>
              <p className="text-xl md:text-2xl font-bold text-slate-800">
                {groups.reduce((acc, curr) => acc + (curr.member_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-orange-50 text-orange-600 rounded-lg">
              <MapPin size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-500">Grupos Ativos</p>
              <p className="text-xl md:text-2xl font-bold text-slate-800">
                {groups.filter(g => g.status === 'Ativo').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome ou líder..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
        </div>
        <button className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
          <Filter size={18} />
          Filtros
        </button>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase">
                <th className="px-6 py-4">Nome do Grupo</th>
                <th className="px-6 py-4">Líderes</th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    Membros
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-4">Horário</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhum grupo encontrado.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => (
                  <tr
                    key={group.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{group.name}</p>
                        <p className="text-xs text-slate-500">{group.type}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{group.leader_name || 'Sem líder'}</span>
                        {group.co_leader_name && (
                          <span className="text-xs text-slate-500">{group.co_leader_name} (Co-líder)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        {group.member_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-slate-400" />
                        <span className="text-sm">
                          {group.meeting_day} {group.meeting_time ? `- ${group.meeting_time.slice(0, 5)}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${group.status === 'Ativo' ? 'bg-green-100 text-green-700' :
                        group.status === 'Cheio' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {group.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {hasPermission('groups_edit') && (
                          <button
                            onClick={() => handleEditGroup(group)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                        {hasPermission('groups_delete') && (
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination (Simple visual) */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-slate-500">Mostrando {filteredGroups.length} grupos</span>
          {/* Pagination logic can be added later */}
        </div>
      </div>

      <GroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGroup}
        group={selectedGroup}
        members={members}
      />
    </div>
  );
};

export default Groups;
