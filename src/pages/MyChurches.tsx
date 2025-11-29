import React, { useState } from 'react';
import { Search, Building, Eye, TrendingUp, Users, MapPin, Filter, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_CHURCHES } from '../mocks/churches';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MyChurches: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Pending' | 'Inactive'>('all');

    // Filtrar apenas igrejas vinculadas (simulação - em produção viria do backend)
    // Assumindo que a igreja atual tem ID 'demo-user-1' e está vinculada a outras igrejas
    const linkedChurches = MOCK_CHURCHES.filter(church =>
        church.id !== 'demo-user-1' // Excluir a própria igreja
    );

    const filteredChurches = linkedChurches.filter(church => {
        const matchesSearch = church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            church.pastorName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || church.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Estatísticas
    const totalLinkedChurches = linkedChurches.length;
    const activeChurches = linkedChurches.filter(c => c.status === 'Active').length;
    const totalMembers = linkedChurches.reduce((sum, c) => sum + c.memberCount, 0);
    const averageMembers = totalLinkedChurches > 0 ? Math.round(totalMembers / totalLinkedChurches) : 0;

    // Dados para gráfico - Top 5 igrejas por membros
    const memberData = linkedChurches.map(church => ({
        name: church.name.length > 15 ? church.name.substring(0, 15) + '...' : church.name,
        members: church.memberCount
    })).sort((a, b) => b.members - a.members).slice(0, 5);

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Minhas Igrejas</h1>
                    <p className="text-slate-600 mt-1">Igrejas vinculadas à sua supervisão</p>
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
                    <p className="text-blue-600 text-sm font-medium">Igrejas Vinculadas</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{totalLinkedChurches}</p>
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
                    <p className="text-xs text-green-700 mt-2">Em todas as igrejas</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                            <BarChart3 className="text-white" size={24} />
                        </div>
                        <TrendingUp className="text-purple-600" size={20} />
                    </div>
                    <p className="text-purple-600 text-sm font-medium">Média de Membros</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">{averageMembers}</p>
                    <p className="text-xs text-purple-700 mt-2">Por igreja</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                            <Building className="text-white" size={24} />
                        </div>
                        <TrendingUp className="text-orange-600" size={20} />
                    </div>
                    <p className="text-orange-600 text-sm font-medium">Taxa de Crescimento</p>
                    <p className="text-3xl font-bold text-orange-900 mt-1">+8%</p>
                    <p className="text-xs text-orange-700 mt-2">Últimos 30 dias</p>
                </div>
            </div>

            {/* Chart */}
            {memberData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Top 5 Igrejas por Membros</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={memberData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="members" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

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
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
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
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                        <p className="text-slate-600">Nenhuma igreja vinculada encontrada</p>
                        <p className="text-sm text-slate-500 mt-1">
                            {searchTerm || filterStatus !== 'all'
                                ? 'Tente ajustar os filtros de pesquisa'
                                : 'Você ainda não possui igrejas vinculadas à sua supervisão'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyChurches;
