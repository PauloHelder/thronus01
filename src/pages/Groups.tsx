import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, Filter, Edit3, Trash2, Plus } from 'lucide-react';
import { Group, Member } from '../types';
import GroupModal from '../components/modals/GroupModal';
import { MOCK_MEMBERS } from '../mocks/members';

const INITIAL_GROUPS: Group[] = [
  {
    id: '1',
    name: "Estudo Bíblico dos Homens",
    leaderId: '2', // Jacob Jones
    leaders: [MOCK_MEMBERS.find(m => m.id === '2')!],
    members: [],
    memberCount: 12,
    meetingTime: "Quartas, 19:00",
    status: "Active"
  },
  {
    id: '2',
    name: "Comunhão de Jovens Adultos",
    leaderId: '6', // Maria Santos
    leaders: [MOCK_MEMBERS.find(m => m.id === '6')!],
    members: [],
    memberCount: 8,
    meetingTime: "Sextas, 20:00",
    status: "Full"
  },
  {
    id: '3',
    name: "Conexão de Casais",
    leaderId: '5', // Cody Fisher
    leaders: [MOCK_MEMBERS.find(m => m.id === '5')!],
    members: [],
    memberCount: 6,
    meetingTime: "Sábados, 18:00",
    status: "Inactive"
  },
];

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(undefined);

  const handleAddGroup = () => {
    setSelectedGroup(undefined);
    setIsModalOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleDeleteGroup = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este grupo?')) {
      setGroups(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleSaveGroup = (groupData: Group | Omit<Group, 'id'>) => {
    if ('id' in groupData) {
      setGroups(prev => prev.map(g => g.id === groupData.id ? groupData as Group : g));
    } else {
      setGroups(prev => [...prev, groupData as Group]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Grupos Pequenos</h1>
          <p className="text-slate-600 mt-1">Gerencie células, grupos de estudo e comunhão</p>
        </div>
        <button
          onClick={handleAddGroup}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm hover:shadow"
        >
          <Plus size={18} />
          Novo Grupo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total de Grupos</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{groups.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Membros em Grupos</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {groups.reduce((acc, curr) => acc + curr.memberCount, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Grupos Ativos</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {groups.filter(g => g.status === 'Active').length}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar grupos..."
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
            {groups.map((group) => (
              <tr
                key={group.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                <td className="px-6 py-4 font-medium text-slate-800">{group.name}</td>
                <td className="px-6 py-4">
                  <div className="flex -space-x-2">
                    {group.leaders.map((leader, index) => (
                      <img
                        key={index}
                        src={leader.avatar}
                        alt={leader.name}
                        className="w-8 h-8 rounded-full border-2 border-white"
                        title={leader.name}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{group.memberCount}</td>
                <td className="px-6 py-4 text-slate-600">{group.meetingTime}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${group.status === 'Active' ? 'bg-green-100 text-green-700' :
                      group.status === 'Full' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                    {group.status === 'Active' ? 'Ativo' : group.status === 'Full' ? 'Cheio' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Footer Pagination (Simple visual) */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-slate-500">Mostrando {groups.length} grupos</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-sm text-slate-600">Anterior</button>
            <button className="px-3 py-1 border border-gray-200 rounded bg-orange-500 text-white text-sm">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-sm text-slate-600">2</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-sm text-slate-600">3</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-sm text-slate-600">Próximo</button>
          </div>
        </div>
      </div>

      <GroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGroup}
        group={selectedGroup}
        members={MOCK_MEMBERS}
      />
    </div>
  );
};

export default Groups;
