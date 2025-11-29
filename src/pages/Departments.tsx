import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Calendar } from 'lucide-react';
import { Department } from '../types';
import { MOCK_MEMBERS } from '../mocks/members';
import { getDefaultDepartments } from '../data/defaultDepartments';
import { getIconEmoji } from '../data/departmentIcons';
import DepartmentModal from '../components/modals/DepartmentModal';

// Inicializar com departamentos padrão
const DEFAULT_DEPTS = getDefaultDepartments();
const INITIAL_DEPARTMENTS: Department[] = DEFAULT_DEPTS.map((dept, index) => ({
    ...dept,
    id: `default-${index + 1}`,
    leaderId: MOCK_MEMBERS[index]?.id,
    leader: MOCK_MEMBERS[index],
    members: []
}));

const Departments: React.FC = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
    const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSaveDepartment = (departmentData: Omit<Department, 'id'> | Department) => {
        if ('id' in departmentData && departments.some(d => d.id === departmentData.id)) {
            // Editar
            setDepartments(prev => prev.map(d =>
                d.id === departmentData.id ? departmentData as Department : d
            ));
        } else {
            // Novo
            setDepartments(prev => [...prev, departmentData as Department]);
        }
        setEditingDepartment(null);
        setIsDepartmentModalOpen(false);
    };

    const handleEditDepartment = (department: Department) => {
        setEditingDepartment(department);
        setIsDepartmentModalOpen(true);
    };

    const handleViewDetails = (departmentId: string) => {
        navigate(`/departments/${departmentId}`);
    };

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Departamentos</h1>
                    <p className="text-slate-600 mt-1">Gestão de departamentos, líderes e escalas</p>
                </div>
                <button
                    onClick={() => {
                        setEditingDepartment(null);
                        setIsDepartmentModalOpen(true);
                    }}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm hover:shadow"
                >
                    <Plus size={18} />
                    Novo Departamento
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="text-blue-600" size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-slate-500">Total de Departamentos</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{departments.length}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Users className="text-green-600" size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-slate-500">Total de Membros</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                        {departments.reduce((acc, dept) => acc + dept.members.length, 0)}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Calendar className="text-purple-600" size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-slate-500">Escalas Ativas</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                        {departments.reduce((acc, dept) => acc + (dept.schedules?.length || 0), 0)}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar departamento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDepartments.map(department => (
                    <div
                        key={department.id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="text-4xl">
                                    {getIconEmoji(department.icon)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                                        {department.name}
                                    </h3>
                                    {department.isDefault && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                            Padrão
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {department.description && (
                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                {department.description}
                            </p>
                        )}

                        {/* Leader Info */}
                        {department.leader && (
                            <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <p className="text-xs font-semibold text-orange-600 uppercase mb-1">Líder</p>
                                <div className="flex items-center gap-2">
                                    <img
                                        src={department.leader.avatar}
                                        alt={department.leader.name}
                                        className="w-6 h-6 rounded-full"
                                    />
                                    <span className="text-sm font-medium text-slate-800">
                                        {department.leader.name}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users size={14} className="text-blue-600" />
                                    <span className="text-xs font-medium text-blue-700">Membros</span>
                                </div>
                                <p className="text-lg font-bold text-blue-700">{department.members.length}</p>
                            </div>

                            <div className="p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar size={14} className="text-purple-600" />
                                    <span className="text-xs font-medium text-purple-700">Escalas</span>
                                </div>
                                <p className="text-lg font-bold text-purple-700">{department.schedules?.length || 0}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleViewDetails(department.id)}
                                className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Ver Detalhes
                            </button>
                            <button
                                onClick={() => handleEditDepartment(department)}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                Editar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredDepartments.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                    <Users size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        {searchTerm ? 'Nenhum departamento encontrado' : 'Nenhum departamento cadastrado'}
                    </h3>
                    <p className="text-slate-600">
                        {searchTerm ? 'Tente ajustar sua pesquisa.' : 'Comece criando departamentos.'}
                    </p>
                </div>
            )}

            <DepartmentModal
                isOpen={isDepartmentModalOpen}
                onClose={() => setIsDepartmentModalOpen(false)}
                onSave={handleSaveDepartment}
                department={editingDepartment}
                members={MOCK_MEMBERS}
            />
        </div>
    );
};

export default Departments;
