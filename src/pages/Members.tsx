import React, { useState } from 'react';
import { Search, Filter, Plus, Pencil, Trash2, Users, TrendingUp, UserCheck, UserX, Calendar, Download, Upload, Loader2, Link, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Member } from '../types';
import MemberModal from '../components/modals/MemberModal';
import ImportMembersModal from '../components/modals/ImportMembersModal';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMembers } from '../hooks/useMembers';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const Members: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { members, loading, error, deleteMember, importMembers, addMember, updateMember } = useMembers();
  const [searchParams] = useSearchParams();
  const isBirthdayFilter = searchParams.get('filter') === 'aniversariantes';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterBaptized, setFilterBaptized] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterMaritalStatus, setFilterMaritalStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined);
  const [birthdayMonth, setBirthdayMonth] = useState<string>(new Date().getMonth().toString());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Inactive': return 'bg-red-100 text-red-700';
      case 'Visitor': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAddMember = () => {
    setSelectedMember(undefined);
    setIsModalOpen(true);
  };

  const handleEditMember = (member: Member, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleDeleteMember = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este membro?')) {
      await deleteMember(id);
      toast.success('Membro excluído com sucesso');
    }
  };

  const handleSaveMember = async (memberData: any) => {
    try {
      if (memberData.id) {
        await updateMember(memberData.id, memberData);
      } else {
        await addMember(memberData);
      }
      toast.success('Membro salvo com sucesso!');
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving member:", err);
      toast.error("Erro ao salvar membro");
    }
  };

  const handleImport = async (importedData: any[]) => {
    const success = await importMembers(importedData);
    if (success) {
      toast.success(`${importedData.length} membros importados com sucesso!`);
      setIsImportModalOpen(false);
    }
  };

  const handleCopyLink = () => {
    if (!user?.churchSlug) {
      toast.error('Erro ao gerar link: Slug da igreja não encontrado.');
      return;
    }
    const link = `${window.location.origin}/#/join/${user.churchSlug}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleExport = async () => {
    try {
      const XLSX = await import('xlsx');
      const exportData = filteredMembers.map(m => ({
        'Nome': m.name,
        'Email': m.email,
        'Telefone': m.phone,
        'BI': m.biNumber || '',
        'Gênero': m.gender === 'Male' ? 'Masculino' : m.gender === 'Female' ? 'Feminino' : m.gender,
        'Status': m.status === 'Active' ? 'Ativo' : m.status === 'Inactive' ? 'Inativo' : 'Visitante',
        'Função': m.churchRole,
        'Data de Nascimento': m.birthDate ? new Date(m.birthDate).toLocaleDateString('pt-BR') : '',
        'Estado Civil': m.maritalStatus === 'Single' ? 'Solteiro(a)' :
          m.maritalStatus === 'Married' ? 'Casado(a)' :
            m.maritalStatus === 'Divorced' ? 'Divorciado(a)' :
              m.maritalStatus === 'Widowed' ? 'Viúvo(a)' : m.maritalStatus,
        'Batizado': m.isBaptized ? 'Sim' : 'Não',
        'Data de Batismo': m.baptismDate ? new Date(m.baptismDate).toLocaleDateString('pt-BR') : '',
        'Endereço': m.address,
        'Bairro': m.neighborhood,
        'Município': m.municipality,
        'Província': m.province
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "Membros");
      XLSX.writeFile(wb, "membros_exportados.xlsx");
    } catch (error) {
      console.error('Error exporting members:', error);
      toast.error('Erro ao exportar membros. Tente novamente.');
    }
  };

  // Filtros
  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const name = member.name ? member.name.toLowerCase() : '';
    const email = member.email ? member.email.toLowerCase() : '';

    const matchesSearch = name.includes(searchLower) || email.includes(searchLower);
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    const matchesGender = filterGender === 'all' || member.gender === filterGender;
    const matchesBaptized = filterBaptized === 'all' ||
      (filterBaptized === 'yes' && member.isBaptized) ||
      (filterBaptized === 'no' && !member.isBaptized);
    const matchesRole = filterRole === 'all' || member.churchRole === filterRole;
    const matchesMaritalStatus = filterMaritalStatus === 'all' || member.maritalStatus === filterMaritalStatus;

    const matchesBirthday = !isBirthdayFilter || (() => {
      if (!member.birthDate) return false;
      const bDate = new Date(member.birthDate);
      return bDate.getMonth() === parseInt(birthdayMonth);
    })();

    return matchesSearch && matchesStatus && matchesGender && matchesBaptized && matchesRole && matchesMaritalStatus && matchesBirthday;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterGender, filterBaptized, filterRole]);

  // Estatísticas
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const inactiveMembers = members.filter(m => m.status === 'Inactive').length;
  const visitors = members.filter(m => m.status === 'Visitor').length;
  const baptizedMembers = members.filter(m => m.isBaptized).length;
  const maleMembers = members.filter(m => m.gender === 'Male').length;
  const femaleMembers = members.filter(m => m.gender === 'Female').length;

  const statusData = [
    { name: 'Ativos', value: activeMembers, color: '#10b981' },
    { name: 'Inativos', value: inactiveMembers, color: '#ef4444' },
    { name: 'Visitantes', value: visitors, color: '#f59e0b' }
  ];

  const genderData = [
    { name: 'Masculino', value: maleMembers, color: '#3b82f6' },
    { name: 'Feminino', value: femaleMembers, color: '#ec4899' }
  ];

  const roleData = members.reduce((acc, member) => {
    const role = member.churchRole || 'Não definido';
    const existing = acc.find(item => item.name === role);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: role, count: 1 });
    }
    return acc;
  }, [] as { name: string; count: number }[]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto text-orange-500 animate-spin mb-4" size={48} />
          <p className="text-slate-600">Carregando membros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Users className="mx-auto text-red-300 mb-4" size={48} />
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-slate-500 mt-2">Tente recarregar a página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Membros</h1>
          <p className="text-slate-600 mt-1">Gerencie os membros da igreja</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <Download size={18} />
            Exportar
          </button>

          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-white border border-gray-200 text-slate-700 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-2 transition-colors"
            title="Copiar Link de Cadastro Público"
          >
            <Link size={18} />
            Link de Cadastro
          </button>

          {hasPermission('members_create') && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Upload size={18} />
                Importar
              </button>
              <button
                onClick={handleAddMember}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Novo Membro
              </button>
            </>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <TrendingUp className="text-blue-600 w-4 h-4 md:w-5 md:h-5" />
          </div>
          <p className="text-blue-600 text-xs md:text-sm font-medium">Total de Membros</p>
          <p className="text-xl md:text-3xl font-bold text-blue-900 mt-1">{totalMembers}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <UserCheck className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <TrendingUp className="text-green-600 w-4 h-4 md:w-5 md:h-5" />
          </div>
          <p className="text-green-600 text-xs md:text-sm font-medium">Membros Ativos</p>
          <p className="text-xl md:text-3xl font-bold text-green-900 mt-1">{activeMembers}</p>
          <p className="text-[10px] md:text-xs text-green-700 mt-1">{totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(0) : 0}% do total</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Calendar className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <TrendingUp className="text-purple-600 w-4 h-4 md:w-5 md:h-5" />
          </div>
          <p className="text-purple-600 text-xs md:text-sm font-medium">Batizados</p>
          <p className="text-xl md:text-3xl font-bold text-purple-900 mt-1">{baptizedMembers}</p>
          <p className="text-[10px] md:text-xs text-purple-700 mt-1">{totalMembers > 0 ? ((baptizedMembers / totalMembers) * 100).toFixed(0) : 0}% do total</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 md:p-6 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <UserX className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <TrendingUp className="text-orange-600 w-4 h-4 md:w-5 md:h-5" />
          </div>
          <p className="text-orange-600 text-xs md:text-sm font-medium">Visitantes</p>
          <p className="text-xl md:text-3xl font-bold text-orange-900 mt-1">{visitors}</p>
          <p className="text-[10px] md:text-xs text-orange-700 mt-1">Novos interessados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-600" />
          <h3 className="font-semibold text-slate-800">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500">
            <option value="all">Todos Status</option>
            <option value="Active">Ativos</option>
            <option value="Inactive">Inativos</option>
            <option value="Visitor">Visitantes</option>
          </select>
          <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500">
            <option value="all">Todos Gêneros</option>
            <option value="Male">Masculino</option>
            <option value="Female">Feminino</option>
          </select>
          {!isBirthdayFilter && (
            <select value={filterBaptized} onChange={(e) => setFilterBaptized(e.target.value)} className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500">
              <option value="all">Batismo</option>
              <option value="yes">Batizados</option>
              <option value="no">Não Batizados</option>
            </select>
          )}
          <select value={filterMaritalStatus} onChange={(e) => setFilterMaritalStatus(e.target.value)} className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500">
            <option value="all">Estado Civil</option>
            <option value="Single">Solteiro(a)</option>
            <option value="Married">Casado(a)</option>
            <option value="Divorced">Divorciado(a)</option>
            <option value="Widowed">Viúvo(a)</option>
          </select>
          {!isBirthdayFilter && (
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500">
              <option value="all">Todas Funções</option>
              <option value="Membro">Membro</option>
              <option value="Líder">Líder</option>
              <option value="Diácono">Diácono</option>
              <option value="Visitante">Visitante</option>
            </select>
          )}

          {isBirthdayFilter && (
            <select
              value={birthdayMonth}
              onChange={(e) => setBirthdayMonth(e.target.value)}
              className="px-3 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            >
              <option value="0">Janeiro</option>
              <option value="1">Fevereiro</option>
              <option value="2">Março</option>
              <option value="3">Abril</option>
              <option value="4">Maio</option>
              <option value="5">Junho</option>
              <option value="6">Julho</option>
              <option value="7">Agosto</option>
              <option value="8">Setembro</option>
              <option value="9">Outubro</option>
              <option value="10">Novembro</option>
              <option value="11">Dezembro</option>
            </select>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">BI</th>
                <th className="px-6 py-4">Gênero</th>
                <th className="px-6 py-4">Função</th>
                <th className="px-6 py-4 text-center">Batizado</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/members/${member.id}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} alt="" className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="font-medium text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{member.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{member.biNumber || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{member.gender === 'Male' ? 'Masc' : member.gender === 'Female' ? 'Fem' : '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{member.churchRole || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.isBaptized ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{member.isBaptized ? 'Sim' : 'Não'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                      {member.status === 'Active' ? 'Ativo' : member.status === 'Inactive' ? 'Inativo' : 'Visitante'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={(e) => handleEditMember(member, e)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Editar"><Pencil size={16} /></button>
                      <button onClick={(e) => handleDeleteMember(member.id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-slate-600">Nenhum membro encontrado</p>
            <p className="text-sm text-slate-500 mt-1">Tente ajustar os filtros de pesquisa</p>
          </div>
        )}

        {/* Pagination Info & Controls */}
        {filteredMembers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredMembers.length)}</span> de <span className="font-medium">{filteredMembers.length}</span> membros
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página Anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-sm font-medium text-slate-700">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(curr => Math.min(curr + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Próxima Página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <MemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMember}
        member={selectedMember}
      />

      <ImportMembersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
};

export default Members;
