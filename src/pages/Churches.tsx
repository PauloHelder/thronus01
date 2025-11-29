import React, { useState } from 'react';
import { Search, Building, Eye, TrendingUp, Users, DollarSign, Calendar, MapPin, Filter, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_CHURCHES } from '../mocks/churches';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const Churches: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Pending' | 'Inactive'>('all');

    const filteredChurches = MOCK_CHURCHES.filter(church => {
        const matchesSearch = church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            church.pastorName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || church.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Estatísticas
    const totalChurches = MOCK_CHURCHES.length;
    const activeChurches = MOCK_CHURCHES.filter(c => c.status === 'Active').length;
    const pendingChurches = MOCK_CHURCHES.filter(c => c.status === 'Pending').length;
    const totalMembers = MOCK_CHURCHES.reduce((sum, c) => sum + c.memberCount, 0);
    const averageMembers = Math.round(totalMembers / totalChurches);

    // Dados para gráfico de barras - Igrejas por denominação
    const denominationData = MOCK_CHURCHES.reduce((acc, church) => {
        const existing = acc.find(item => item.name === church.denomination);
        if (existing) {
            existing.count += 1;
        } else {
            acc.push({ name: church.denomination, count: 1 });
        }
        return acc;
    }, [] as { name: string; count: number }[]);

    // Dados para gráfico de pizza - Status
    const statusData = [
        { name: 'Ativas', value: activeChurches, color: '#10b981' },
        { name: 'Pendentes', value: pendingChurches, color: '#f59e0b' },
        { name: 'Inativas', value: MOCK_CHURCHES.filter(c => c.status === 'Inactive').length, color: '#ef4444' }
    ];

    // Dados para gráfico de membros por igreja
    const memberData = MOCK_CHURCHES.map(church => ({
        name: church.name.length > 15 ? church.name.substring(0, 15) + '...' : church.name,
        members: church.memberCount
    })).sort((a, b) => b.members - a.members).slice(0, 5);

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Dashboard de Igrejas</h1>
                    <p className="text-slate-600 mt-1">Visão geral e gestão das igrejas na plataforma</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Building className="text-white" size={24} />
                        </div>
                        <TrendingUp className="text-blue-600" size={20} />
                    </div>
                    <p className="text-blue-600 text-sm font-medium">Total de Igrejas</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{totalChurches}</p>
                    <p className="text-xs text-blue-700 mt-2">{activeChurches} ativas</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                            <Users className="text-white" size={24} />
                        </div>
                        <TrendingUp className="text-green-600" size={20} />
                    </div>
                    <p className="text-green-600 text-sm font-medium">Total de Membros</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">{totalMembers.toLocaleString()}</p>
                    <p className="text-xs text-green-700 mt-2">Média de {averageMembers} por igreja</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                            <Calendar className="text-white" size={24} />
                        </div>
                        <TrendingUp className="text-orange-600" size={20} />
                    </div>
                    <p className="text-orange-600 text-sm font-medium">Igrejas Pendentes</p>
                    <p className="text-3xl font-bold text-orange-900 mt-1">{pendingChurches}</p>
                    <p className="text-xs text-orange-700 mt-2">Aguardando aprovação</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                            <BarChart3 className="text-white" size={24} />
                        </div>
                        <TrendingUp className="text-purple-600" size={20} />
                    </div>
                    <p className="text-purple-600 text-sm font-medium">Taxa de Crescimento</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">+12%</p>
                    <p className="text-xs text-purple-700 mt-2">Últimos 30 dias</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart - Top 5 Igrejas por Membros */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Top 5 Igrejas por Membros</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={memberData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="members" fill="#f97316" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart - Status das Igrejas */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Status das Igrejas</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Denominações */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Distribuição por Denominação</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {denominationData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-800">{item.name}</p>
                                <p className="text-sm text-slate-600">{item.count} {item.count === 1 ? 'igreja' : 'igrejas'}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl font-bold text-orange-600">{item.count}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome da igreja ou pastor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-transparent focus:border-orange-300 rounded-lg pl-10 pr-4 py-2 text-sm outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-500" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Todos Status</option>
                        <option value="Active">Ativas</option>
                        <option value="Pending">Pendentes</option>
                        <option value="Inactive">Inativas</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase">
                                <th className="px-6 py-4">Nome da Igreja</th>
                                <th className="px-6 py-4">Denominação</th>
                                <th className="px-6 py-4">Pastor Responsável</th>
                                <th className="px-6 py-4 text-center">Membros</th>
                                <th className="px-6 py-4">Localização</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredChurches.map((church) => (
                                <tr key={church.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                                <Building size={20} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{church.name}</p>
                                                <p className="text-xs text-slate-500">{church.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{church.denomination}</td>
                                    <td className="px-6 py-4 text-slate-600">{church.pastorName}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold text-slate-800">{church.memberCount}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-sm text-slate-600">
                                            <MapPin size={14} />
                                            <span>{church.address}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${church.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                church.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {church.status === 'Active' ? 'Ativo' : church.status === 'Pending' ? 'Pendente' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => navigate(`/churches/${church.id}`)}
                                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                            title="Ver Perfil"
                                        >
                                            <Eye size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredChurches.length === 0 && (
                    <div className="text-center py-12">
                        <Building className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-slate-600">Nenhuma igreja encontrada</p>
                        <p className="text-sm text-slate-500 mt-1">Tente ajustar os filtros de pesquisa</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Churches;
