import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, Users, Calendar, Clock, Filter, X } from 'lucide-react';
import { TeachingClass, ChristianStage, TeachingCategory } from '../types';
import { MOCK_MEMBERS } from '../mocks/members';
import { DEFAULT_CHRISTIAN_STAGES, DEFAULT_TEACHING_CATEGORIES } from '../data/teachingDefaults';
import TeachingClassModal from '../components/modals/TeachingClassModal';

// Mock data
const INITIAL_CLASSES: TeachingClass[] = [
  {
    id: '1',
    name: 'Escola Bíblica Dominical',
    teacherId: '1',
    teacher: MOCK_MEMBERS[0],
    stage: 'Firmar',
    dayOfWeek: 'Domingo',
    time: '09:00',
    room: 'Sala 1',
    startDate: '2024-01-07',
    category: 'Adultos',
    status: 'Em Andamento',
    students: [MOCK_MEMBERS[1], MOCK_MEMBERS[2], MOCK_MEMBERS[3]],
    lessons: []
  },
  {
    id: '2',
    name: 'Discipulado de Novos Convertidos',
    teacherId: '2',
    teacher: MOCK_MEMBERS[1],
    stage: 'Acolher',
    dayOfWeek: 'Quarta',
    time: '19:30',
    room: 'Sala 2',
    startDate: '2024-02-01',
    endDate: '2024-05-31',
    category: 'Homogenia',
    status: 'Em Andamento',
    students: [MOCK_MEMBERS[4], MOCK_MEMBERS[5]],
    lessons: []
  },
  {
    id: '3',
    name: 'Formação de Líderes',
    teacherId: '3',
    teacher: MOCK_MEMBERS[2],
    stage: 'Capacitar',
    dayOfWeek: 'Sábado',
    time: '14:00',
    room: 'Auditório',
    startDate: '2024-03-01',
    category: 'Líderes',
    status: 'Agendado',
    students: [],
    lessons: []
  }
];

const Teaching: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TeachingClass[]>(INITIAL_CLASSES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<TeachingClass | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | TeachingClass['status']>('All');
  const [filterStage, setFilterStage] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const handleSaveClass = (classData: Omit<TeachingClass, 'id'> | TeachingClass) => {
    if ('id' in classData && classes.some(c => c.id === classData.id)) {
      setClasses(prev => prev.map(c => c.id === classData.id ? classData as TeachingClass : c));
    } else {
      setClasses(prev => [...prev, classData as TeachingClass]);
    }
    setEditingClass(null);
    setIsModalOpen(false);
  };

  const handleEditClass = (teachingClass: TeachingClass) => {
    setEditingClass(teachingClass);
    setIsModalOpen(true);
  };

  const handleViewDetails = (classId: string) => {
    navigate(`/teaching/${classId}`);
  };

  const clearFilters = () => {
    setFilterStatus('All');
    setFilterStage('All');
    setFilterCategory('All');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStatus !== 'All' || filterStage !== 'All' || filterCategory !== 'All' || searchTerm !== '';

  const filteredClasses = classes.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.room.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchesStage = filterStage === 'All' || c.stage === filterStage;
    const matchesCategory = filterCategory === 'All' || c.category === filterCategory;
    return matchesSearch && matchesStatus && matchesStage && matchesCategory;
  });

  const getStatusColor = (status: TeachingClass['status']) => {
    switch (status) {
      case 'Agendado': return 'bg-blue-100 text-blue-700';
      case 'Em Andamento': return 'bg-green-100 text-green-700';
      case 'Concluído': return 'bg-gray-100 text-gray-700';
      case 'Cancelado': return 'bg-red-100 text-red-700';
    }
  };

  // Stats
  const totalStudents = classes.reduce((acc, c) => acc + c.students.length, 0);
  const activeClasses = classes.filter(c => c.status === 'Em Andamento').length;
  const totalLessons = classes.reduce((acc, c) => acc + (c.lessons?.length || 0), 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Ensino</h1>
          <p className="text-slate-600 mt-1">Gestão de turmas, alunos e aulas</p>
        </div>
        <button
          onClick={() => { setEditingClass(null); setIsModalOpen(true); }}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm hover:shadow"
        >
          <Plus size={18} />
          Nova Turma
        </button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-500">Total de Turmas</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{classes.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-500">Total de Alunos</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalStudents}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-500">Turmas Ativas</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{activeClasses}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-slate-500">Aulas Ministradas</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalLessons}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar turma, professor ou sala..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${showFilters || hasActiveFilters
                ? 'bg-orange-50 border-orange-200 text-orange-600'
                : 'bg-gray-50 border-gray-200 text-slate-600 hover:bg-gray-100'
              }`}
          >
            <Filter size={18} />
            Filtros
            {hasActiveFilters && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                >
                  <option value="All">Todos</option>
                  <option value="Agendado">Agendado</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Estágio</label>
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                >
                  <option value="All">Todos</option>
                  {DEFAULT_CHRISTIAN_STAGES.map(stage => (
                    <option key={stage.id} value={stage.name}>{stage.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Categoria</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                >
                  <option value="All">Todas</option>
                  {DEFAULT_TEACHING_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1 transition-colors"
                >
                  <X size={14} />
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map(teachingClass => (
          <div
            key={teachingClass.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors mb-1">
                  {teachingClass.name}
                </h3>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(teachingClass.status)}`}>
                  {teachingClass.status}
                </span>
              </div>
            </div>

            {/* Teacher */}
            {teachingClass.teacher && (
              <div className="flex items-center gap-2 mb-4 p-2 bg-orange-50 rounded-lg">
                <img src={teachingClass.teacher.avatar} alt="" className="w-8 h-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-orange-600 font-medium">Professor</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{teachingClass.teacher.name}</p>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={14} />
                <span>{teachingClass.dayOfWeek} às {teachingClass.time}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <BookOpen size={14} />
                <span>{teachingClass.stage} • {teachingClass.category}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Users size={14} />
                <span>{teachingClass.students.length} alunos • {teachingClass.room}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleViewDetails(teachingClass.id)}
                className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Ver Detalhes
              </button>
              <button
                onClick={() => handleEditClass(teachingClass)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {searchTerm || hasActiveFilters ? 'Nenhuma turma encontrada' : 'Nenhuma turma cadastrada'}
          </h3>
          <p className="text-slate-600 mb-4">
            {searchTerm || hasActiveFilters
              ? 'Tente ajustar os filtros de pesquisa.'
              : 'Comece criando turmas de ensino.'}
          </p>
          {!searchTerm && !hasActiveFilters && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors mx-auto"
            >
              <Plus size={18} />
              Criar Primeira Turma
            </button>
          )}
        </div>
      )}

      <TeachingClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClass}
        teachingClass={editingClass}
        members={MOCK_MEMBERS}
        stages={DEFAULT_CHRISTIAN_STAGES}
        categories={DEFAULT_TEACHING_CATEGORIES}
      />
    </div>
  );
};

export default Teaching;