import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Users,
    Calendar,
    Wallet,
    ArrowLeft,
    MapPin,
    Phone,
    Mail,
    ShieldAlert,
    Building,
    Loader2,
    BookOpen,
    Target,
    Briefcase,
    Zap,
    Shield,
    Activity,
    BarChart3,
    Heart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BranchDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [branch, setBranch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({
        memberCount: 0,
        servicesCount: 0,
        recentServices: [],
        members: [],
        groups: [],
        departments: [],
        teaching: [],
        discipleship: [],
        events: []
    });
    const [permissions, setPermissions] = useState<any>({});
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [serviceSearchTerm, setServiceSearchTerm] = useState('');

    useEffect(() => {
        const fetchBranchDetails = async () => {
            if (!id) return;
            setLoading(true);

            try {
                // 1. Fetch Church Details
                const { data: churchData, error: churchError } = await supabase
                    .from('churches')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (churchError) throw churchError;
                if (!churchData) throw new Error('Igreja não encontrada');

                // Security check: Must be a child of current user's church
                if ((churchData as any).parent_id !== user?.churchId) {
                    toast.error('Você não tem permissão para visualizar esta igreja.');
                    navigate('/network');
                    return;
                }

                setBranch(churchData as any);
                const perms = (churchData as any).settings?.shared_permissions || {};
                setPermissions(perms);

                // 2. Fetch Conditional Data based on Permissions
                // Using the specific supervision RPCs to bypass RLS and respect privacy settings

                // Members
                if (perms.view_members) {
                    const { data: membersResult }: any = await (supabase.rpc as any)('get_child_church_members', { p_church_id: id });
                    if (membersResult?.success) {
                        setStats((s: any) => ({ 
                            ...s, 
                            memberCount: membersResult.data?.length || 0,
                            members: membersResult.data || []
                        }));
                    }
                }

                // Services Stats (Removido limite de 20 conforme solicitado)
                if (perms.view_service_stats) {
                    const { data: servicesResult }: any = await (supabase.rpc as any)('get_child_church_services', { p_church_id: id });
                    
                    if (servicesResult?.success) {
                        const allServices = servicesResult.data || [];
                        
                        // Chart Data (Everything from month 1)
                        const chartData = allServices
                            .slice()
                            .reverse()
                            .map((s: any) => ({
                                name: new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                                presenca: (
                                    (s.stats_adults_men || 0) + 
                                    (s.stats_adults_women || 0) + 
                                    (s.stats_children_boys || 0) + 
                                    (s.stats_children_girls || 0) +
                                    (s.stats_visitors_men || 0) +
                                    (s.stats_visitors_women || 0) +
                                    (s.stats_new_converts_men || 0) +
                                    (s.stats_new_converts_women || 0) +
                                    (s.stats_new_converts_children || 0)
                                ) || 0,
                                fullDate: new Date(s.date).toLocaleDateString()
                            }));

                        setStats((s: any) => ({
                            ...s,
                            servicesCount: allServices.length,
                            recentServices: allServices, // Now showing all, let frontend filter handle it
                            chartData: chartData
                        }));
                    } else {
                        console.warn('RPC Cultos falhou:', servicesResult?.error);
                    }
                }

                // Departments
                if (perms.view_departments) {
                    const { data: deptResult }: any = await (supabase.rpc as any)('get_child_church_departments', { p_church_id: id });
                    if (deptResult?.success) {
                        setStats((s: any) => ({ ...s, departments: deptResult.data || [] }));
                    }
                }

                // Groups/Cells
                if (perms.view_groups || perms.view_members) {
                    const { data: groupsResult }: any = await (supabase.rpc as any)('get_child_church_groups', { p_church_id: id });
                    if (groupsResult?.success) {
                        setStats((s: any) => ({ 
                            ...s, 
                            groupsCount: groupsResult.data?.length || 0,
                            groups: groupsResult.data || []
                        }));
                    }
                }

                // Teaching
                if (perms.view_teaching) {
                    const { data: teachingResult }: any = await (supabase.rpc as any)('get_child_church_teaching', { p_church_id: id });
                    if (teachingResult?.success) {
                        setStats((s: any) => ({ ...s, teaching: teachingResult.data || [] }));
                    }
                }

                // Discipleship
                if (perms.view_discipleship) {
                    const { data: discipleshipResult }: any = await (supabase.rpc as any)('get_child_church_discipleship', { p_church_id: id });
                    if (discipleshipResult?.success) {
                        setStats((s: any) => ({ ...s, discipleship: discipleshipResult.data || [] }));
                    }
                }

                // Finance
                if (perms.view_finances) {
                    const { data: financeResult }: any = await (supabase.rpc as any)('get_child_church_finances', { p_church_id: id });
                    if (financeResult?.success) {
                        const summary = financeResult.data;
                        setStats((s: any) => ({ 
                            ...s, 
                            finances: summary.recent_transactions || [],
                            totalIncome: summary.total_income || 0,
                            totalExpense: summary.total_expense || 0,
                            balance: summary.balance || 0,
                            allTimeBalance: summary.all_time_balance || 0
                        }));
                    } else {
                        console.warn('RPC Finanças falhou:', financeResult?.error);
                    }
                }

                // Events
                if (perms.view_events) {
                    const { data: eventsResult }: any = await (supabase.rpc as any)('get_child_church_events', { p_church_id: id });
                    if (eventsResult?.success) {
                        setStats((s: any) => ({ ...s, events: eventsResult.data || [] }));
                    }
                }

                // API limitation: We assume RLS allows reading if parent_id matches.
                // If RLS blocks, counts will be 0 or error.
            } catch (error: any) {
                console.error('Error fetching branch details:', error);
                toast.error('Erro ao carregar dados da filial.');
            } finally {
                setLoading(false);
            }
        };

        fetchBranchDetails();
    }, [id, user?.churchId, navigate]);

    const filteredMembers = stats.members.filter((m: any) => 
        m.name?.toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
        m.member_code?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        m.church_role?.toLowerCase().includes(memberSearchTerm.toLowerCase())
    );

    const filteredServices = stats.recentServices.filter((s: any) => 
        (s.type || 'Culto')?.toLowerCase().includes(serviceSearchTerm.toLowerCase()) || 
        (s.preacher_name || '')?.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
        new Date(s.date).toLocaleDateString().includes(serviceSearchTerm)
    );

    const lastService = stats.recentServices?.[0] || null;
    const lastServiceAttendance = lastService ? 
        (
            (lastService.stats_adults_men || 0) + 
            (lastService.stats_adults_women || 0) + 
            (lastService.stats_children_boys || 0) + 
            (lastService.stats_children_girls || 0) +
            (lastService.stats_visitors_men || 0) +
            (lastService.stats_visitors_women || 0) +
            (lastService.stats_new_converts_men || 0) +
            (lastService.stats_new_converts_women || 0) +
            (lastService.stats_new_converts_children || 0)
        ) : 0;

    const totalNewConverts = stats.recentServices?.reduce((acc: number, s: any) => 
        acc + (s.stats_new_converts_men || 0) + (s.stats_new_converts_women || 0) + (s.stats_new_converts_children || 0), 0) || 0;


    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    }

    if (!branch) return null;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/network')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{branch.name}</h1>
                    <p className="text-slate-500 flex items-center gap-2 text-sm">
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            {branch.settings?.categoria || 'Filial'}
                        </span>
                        <span>•</span>
                        <span>Código: {branch.slug}</span>
                    </p>
                </div>
            </div>
            {/* Supervision Banner */}
            <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Relatório de Supervisão: {branch.name}</h2>
                        <p className="text-blue-100 text-sm">
                            Este é um painel de consulta via vínculo (parent/child). 
                            As opções visíveis dependem do que a filial compartilha.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/20">
                        Visualização de Rede
                    </span>
                    <span className="px-3 py-1 bg-green-500 rounded-full text-xs font-bold shadow-sm">
                        Conectado
                    </span>
                </div>
            </div>

            {/* At a Glance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-in slide-in-from-top duration-700 delay-150">
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Membros</p>
                        <p className="text-xl font-black text-slate-800">{stats.memberCount}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Último Culto</p>
                        <p className="text-xl font-black text-slate-800">{lastServiceAttendance}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
                        <Zap size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Células/Grupos</p>
                        <p className="text-xl font-black text-slate-800">{stats.groupsCount || stats.groups?.length || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Mês</p>
                        <p className="text-xl font-black text-slate-800">
                            {permissions.view_finances ? `${(stats.balance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'AOA' })}` : '---'}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                        <Heart size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conversões</p>
                        <p className="text-xl font-black text-slate-800">{totalNewConverts}</p>
                    </div>
                </div>
            </div>


            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact Info */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Building size={18} className="text-gray-400" />
                        Informações e Contato
                    </h3>
                    <div className="space-y-3 text-sm text-slate-600">
                        {branch.phone && (
                            <div className="flex items-center gap-3">
                                <Phone size={16} />
                                <span>{branch.phone}</span>
                            </div>
                        )}
                        {branch.email && (
                            <div className="flex items-center gap-3">
                                <Mail size={16} />
                                <span>{branch.email}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <MapPin size={16} className="shrink-0" />
                            <span>
                                {branch.address || 'Endereço não informado'}
                                {branch.settings?.municipio && `, ${branch.settings.municipio}`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Permissions Status */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1 md:col-span-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <ShieldAlert size={18} className="text-gray-400" />
                        Status de Compartilhamento
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {permissions.view_members && <PermissionBadge label="Membros" allowed={true} icon={Users} onClick={() => document.getElementById('members-section')?.scrollIntoView({ behavior: 'smooth' })} />}
                        {(permissions.view_groups || permissions.view_members) && <PermissionBadge label="Células" allowed={true} icon={Zap} onClick={() => document.getElementById('groups-section')?.scrollIntoView({ behavior: 'smooth' })} />}
                        {permissions.view_service_stats && <PermissionBadge label="Cultos" allowed={true} icon={Calendar} onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })} />}
                        {permissions.view_finances && <PermissionBadge label="Finanças" allowed={true} icon={Wallet} onClick={() => document.getElementById('finances-section')?.scrollIntoView({ behavior: 'smooth' })} />}
                        {permissions.view_teaching && <PermissionBadge label="Ensino" allowed={true} icon={BookOpen} onClick={() => document.getElementById('teaching-section')?.scrollIntoView({ behavior: 'smooth' })} />}
                        {permissions.view_discipleship && <PermissionBadge label="Discipulado" allowed={true} icon={Target} onClick={() => document.getElementById('discipleship-section')?.scrollIntoView({ behavior: 'smooth' })} />}
                        {permissions.view_departments && <PermissionBadge label="Departamentos" allowed={true} icon={Briefcase} onClick={() => document.getElementById('departments-section')?.scrollIntoView({ behavior: 'smooth' })} />}
                        {permissions.view_events && <PermissionBadge label="Eventos" allowed={true} icon={Zap} onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })} />}
                    </div>
                    {!permissions.view_members && !permissions.view_service_stats && !permissions.view_finances && (
                        <p className="text-sm text-orange-600 mt-4 bg-orange-50 p-3 rounded-lg border border-orange-100 italic">
                            Esta igreja ainda não compartilhou dados de gestão com a Sede.
                        </p>
                    )}
                </div>
            </div>

            {/* Data Sections */}
            <div className="space-y-8">
                {permissions.view_members && stats.members.length > 0 && (
                    <div id="members-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-bottom duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Users className="text-blue-500" />
                                Listagem de Membros
                            </h3>
                            <div className="relative w-full md:w-64">
                                <input
                                    type="text"
                                    placeholder="Buscar membros..."
                                    value={memberSearchTerm}
                                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <Users className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3">Código</th>
                                        <th className="px-4 py-3">Nome</th>
                                        <th className="px-4 py-3">Cargo</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.map((m: any) => (
                                        <tr key={m.id} className="border-b hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{m.member_code}</td>
                                            <td className="px-4 py-3">{m.name}</td>
                                            <td className="px-4 py-3">{m.church_role || 'Membro'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {m.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredMembers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                                                Nenhum membro encontrado com os termos da busca.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {permissions.view_service_stats && (
                    <div id="services-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-bottom duration-500 delay-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="text-purple-500" />
                                Estatísticas de Culto
                            </h3>
                            <div className="relative w-full md:w-64">
                                <input
                                    type="text"
                                    placeholder="Data ou Pregador..."
                                    value={serviceSearchTerm}
                                    onChange={(e) => setServiceSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                                <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="mb-8">
                            <h4 className="text-sm font-semibold text-slate-700 mb-4">Evolução da Presença (Desde o Início)</h4>
                            <div className="h-64 w-full">
                                {stats.chartData && stats.chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.chartData} barCategoryGap="10%">
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 10 }}
                                                padding={{ left: 10, right: 10 }}
                                            />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                cursor={{ fill: '#f3f4f6' }}
                                            />
                                            <Bar
                                                dataKey="presenca"
                                                name="Presença"
                                                fill="#8b5cf6"
                                                radius={[4, 4, 0, 0]}
                                                barSize={30}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg">
                                        <p className="text-slate-400 text-sm">Dados insuficientes para gerar gráfico</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 text-center">
                                <p className="text-purple-600 text-sm font-medium uppercase tracking-wide">Cultos Realizados</p>
                                <p className="text-4xl font-bold text-purple-900 mt-2">{stats.servicesCount}</p>
                            </div>
                             <div className="md:col-span-3">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Histórico de Cultos</h4>
                                {filteredServices.length > 0 ? (
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredServices.map((service: any) => {
                                            const attendanceCount = (
                                                (service.stats_adults_men || 0) + 
                                                (service.stats_adults_women || 0) + 
                                                (service.stats_children_boys || 0) + 
                                                (service.stats_children_girls || 0) +
                                                (service.stats_visitors_men || 0) +
                                                (service.stats_visitors_women || 0) +
                                                (service.stats_new_converts_men || 0) +
                                                (service.stats_new_converts_women || 0) +
                                                (service.stats_new_converts_children || 0)
                                            ) || 0;
                                            const visitorsCount = (service.stats_visitors_men || 0) + (service.stats_visitors_women || 0);
                                            const serviceNewConverts = (service.stats_new_converts_men || 0) + (service.stats_new_converts_women || 0) + (service.stats_new_converts_children || 0);
                                            
                                            return (
                                                <div key={service.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-slate-800">{service.type || 'Culto'}</p>
                                                            <p className="text-xs text-slate-500">{new Date(service.date).toLocaleDateString()} • {service.preacher_name || 'Pregador não informado'}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <div className="bg-white px-3 py-1 rounded border border-gray-200 text-center min-w-[70px]">
                                                                <p className="text-[10px] text-slate-400 font-bold">Membros</p>
                                                                <p className="text-sm font-bold text-slate-700">{attendanceCount}</p>
                                                            </div>
                                                            <div className="bg-blue-50 px-3 py-1 rounded border border-blue-100 text-center min-w-[70px]">
                                                                <p className="text-[10px] text-blue-400 font-bold">Visitantes</p>
                                                                <p className="text-sm font-bold text-blue-600">{visitorsCount}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Detalhes de Presença */}
                                                    <div className="mt-3 flex flex-wrap gap-4 border-t border-dashed border-gray-200 pt-3">
                                                        <div className="text-[10px] text-slate-500">
                                                            <span className="font-bold">Adultos:</span> H: {service.stats_adults_men} | M: {service.stats_adults_women}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">
                                                            <span className="font-bold">Crianças:</span> M: {service.stats_children_boys} | F: {service.stats_children_girls}
                                                        </div>
                                                        <div className="text-[10px] text-blue-500">
                                                            <span className="font-bold">Visitantes:</span> H: {service.stats_visitors_men} | M: {service.stats_visitors_women}
                                                        </div>
                                                        <div className="text-[10px] text-green-600 bg-green-50 px-2 rounded-full font-bold">
                                                            🚀 {serviceNewConverts} Novos Convertidos
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {stats.servicesCount > filteredServices.length && serviceSearchTerm === '' && (
                                            <p className="text-center text-xs text-slate-400 pt-2 italic">Exibindo histórico completo</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm italic py-8 text-center bg-gray-50 rounded-lg border-2 border-dashed">Nenhum culto encontrado.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Groups Section */}
                {(permissions.view_groups || permissions.view_members) && stats.groups.length > 0 && (
                    <div id="groups-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-bottom duration-500">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Zap className="text-orange-500" />
                            Células e Grupos de Vida
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stats.groups.map((group: any) => (
                                <div key={group.id} className="p-5 bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 hover:border-orange-200 hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <Zap size={20} />
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${group.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {group.status}
                                        </span>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-lg mb-1">{group.name}</h4>
                                    <p className="text-xs text-slate-500 mb-4 line-clamp-1">{group.meeting_place || 'Local não definido'}</p>
                                    
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-tighter">Líder</span>
                                            <span className="text-slate-700 font-bold">{group.leader_name || 'Não informado'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-tighter">Membros</span>
                                            <span className="text-slate-700 font-bold">{group.member_count} pessoas</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-tighter">Dia/Hora</span>
                                            <span className="text-slate-700 font-bold">{group.meeting_day}, {group.meeting_time?.substring(0, 5)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Finance Section */}
                {permissions.view_finances && (
                    <div id="finances-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-bottom duration-500">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Wallet className="text-green-500" />
                            Relatórios Financeiros
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                                <p className="text-green-600 text-sm font-bold uppercase">Total de Entradas</p>
                                <p className="text-3xl font-black text-green-900 mt-1">
                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(stats.totalIncome || 0)}
                                </p>
                            </div>
                            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                                <p className="text-red-600 text-sm font-bold uppercase">Total de Saídas</p>
                                <p className="text-3xl font-black text-red-900 mt-1">
                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(stats.totalExpense || 0)}
                                </p>
                            </div>
                            <div className={`${(stats.balance || 0) >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} p-6 rounded-xl border`}>
                                <p className={`${(stats.balance || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'} text-sm font-bold uppercase`}>Saldo Atual</p>
                                <p className={`text-3xl font-black ${(stats.balance || 0) >= 0 ? 'text-blue-900' : 'text-orange-900'} mt-1`}>
                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(stats.balance || 0)}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-4">Lançamentos Recentes</h4>
                            {stats.finances?.length > 0 ? (
                                <div className="space-y-2">
                                    {stats.finances.slice(0, 10).map((t: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{t.description}</p>
                                                <p className="text-[10px] text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                            <p className={`font-bold ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'Income' ? '+' : '-'} {new Intl.NumberFormat('pt-AO').format(t.amount)}
                                            </p>
                                        </div>
                                    ))}
                                    {stats.finances.length > 10 && (
                                        <p className="text-center text-[10px] text-slate-400 mt-2 italic">Exibindo os últimos 10 lançamentos</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center text-sm text-slate-400 py-4 italic border-2 border-dashed border-gray-50 rounded-xl">
                                    Nenhuma transação registrada.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Departments Section */}
                {permissions.view_departments && stats.departments.length > 0 && (
                    <div id="departments-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-bottom duration-500">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Briefcase className="text-orange-500" />
                            Departamentos e Ministérios
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.departments.map((dept: any) => (
                                <div key={dept.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-4">
                                    <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100 text-orange-500">
                                        <Briefcase size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{dept.name}</p>
                                        <p className="text-xs text-slate-500">Líder: {dept.leader_name || 'Não definido'}</p>
                                        {dept.description && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{dept.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Teaching Section */}
                {permissions.view_teaching && stats.teaching.length > 0 && (
                    <div id="teaching-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-bottom duration-500">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BookOpen className="text-cyan-500" />
                            Ensino e Classes Bíblicas
                        </h3>
                        <div className="space-y-4">
                            {stats.teaching.map((cls: any) => (
                                <div key={cls.id} className="p-4 bg-cyan-50/30 rounded-lg border border-cyan-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="font-bold text-slate-800">{cls.name}</p>
                                        <p className="text-xs text-slate-500">Professor: {cls.teacher_name || 'Não informado'}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase text-slate-400 font-bold">Horário</p>
                                            <p className="text-xs font-semibold text-slate-700">{cls.day_of_week}, {cls.time}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase text-slate-400 font-bold">Status</p>
                                            <p className="text-xs font-semibold text-cyan-600">{cls.status}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Discipleship Section */}
                {permissions.view_discipleship && stats.discipleship.length > 0 && (
                    <div id="discipleship-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-bottom duration-500">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Target className="text-red-500" />
                            Encontros de Discipulado
                        </h3>
                        <div className="space-y-2">
                            {stats.discipleship.map((meeting: any) => (
                                <div key={meeting.id} className="p-3 border-l-4 border-red-500 bg-red-50/20 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-800">Encontro com {meeting.leader_name}</p>
                                        <p className="text-xs text-slate-500">{new Date(meeting.date).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${meeting.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {meeting.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Events Section */}
                {permissions.view_events && stats.events.length > 0 && (
                    <div id="events-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-bottom duration-500">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Zap className="text-yellow-500" />
                            Próximos Eventos
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stats.events.map((event: any) => (
                                <div key={event.id} className="p-4 bg-yellow-50/30 rounded-xl border border-yellow-100 flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg border border-yellow-100 flex flex-col items-center justify-center text-yellow-600">
                                        <p className="text-[10px] font-bold uppercase">{new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                                        <p className="text-lg font-bold leading-none">{new Date(event.date).getDate()}</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{event.title}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin size={10} /> {event.location || 'Local a definir'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PermissionBadge: React.FC<{ label: string, allowed: boolean, icon: any, onClick?: () => void }> = ({ label, allowed, icon: Icon, onClick }) => (
    <button 
        disabled={!allowed}
        onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-lg border text-left w-full sm:w-auto transition-all ${allowed ? 'bg-green-50 border-green-200 hover:shadow-md hover:bg-green-100 cursor-pointer' : 'bg-gray-50 border-gray-200 opacity-75 grayscale'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${allowed ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
            <Icon size={20} />
        </div>
        <div>
            <p className={`font-medium ${allowed ? 'text-green-900' : 'text-slate-600'}`}>{label}</p>
            <p className={`text-xs ${allowed ? 'text-green-700' : 'text-slate-400'}`}>
                {allowed ? 'Clique para ver' : 'Acesso Restrito'}
            </p>
        </div>
    </button>
);

export default BranchDetails;
