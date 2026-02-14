import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    Users,
    Users2,
    BookOpenCheck,
    Network,
    Baby,
    Heart,
    TrendingUp,
    Filter,
    Download,
    Printer,
    Building
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

import { useMembers } from '../hooks/useMembers';
import { useGroups } from '../hooks/useGroups';
import { useDepartments } from '../hooks/useDepartments';
import { useDiscipleship } from '../hooks/useDiscipleship';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];

const Reports: React.FC = () => {
    const { user } = useAuth();
    const { members, loading: membersLoading } = useMembers();
    const { groups, loading: groupsLoading } = useGroups();
    const { departments, loading: deptsLoading } = useDepartments();
    const { leaders, loading: leadersLoading } = useDiscipleship();

    const isLoading = membersLoading || groupsLoading || deptsLoading || leadersLoading;



    const reportRef = useRef<HTMLDivElement>(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [churchDetails, setChurchDetails] = useState<any>(null);
    const [realStats, setRealStats] = useState({
        groups: 0,
        departments: 0,
        discipleship: 0
    });

    // Fetch exact counts directly from DB to ensure "General Data" is correct
    useEffect(() => {
        if (!user?.churchId) return;

        const fetchCounts = async () => {
            try {
                // Groups Count
                const { count: groupsCount } = await supabase
                    .from('groups')
                    .select('*', { count: 'exact', head: true })
                    .eq('church_id', user.churchId)
                    .is('deleted_at', null);

                // Departments Count
                const { count: deptsCount } = await supabase
                    .from('departments')
                    .select('*', { count: 'exact', head: true })
                    .eq('church_id', user.churchId)
                    .is('deleted_at', null);

                // Discipleship Count (distinct pairs? or just leaders rows?)
                // Assuming "Em Discipulado" means members who have a leader?
                // Or members involved in discipleship?
                // Existing logic: filteredMembers.filter(m => hasLeader || isLeader).
                // Let's stick to existing logic for Discipleship if it works ("44" worked), 
                // but for Groups/Depts use the direct count.

                setRealStats(prev => ({
                    ...prev,
                    groups: groupsCount || 0,
                    departments: deptsCount || 0
                }));
            } catch (error) {
                console.error("Error fetching stats counts:", error);
            }
        };

        fetchCounts();
    }, [user?.churchId]);
    useEffect(() => {
        if (!user?.churchId) return;
        const fetchChurchDetails = async () => {
            const { data } = await supabase
                .from('churches')
                .select('name, logo_url, settings')
                .eq('id', user.churchId)
                .single();
            if (data) setChurchDetails(data);
        };
        fetchChurchDetails();
    }, [user?.churchId]);

    // --- Filters State ---
    const [genderFilter, setGenderFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [baptismFilter, setBaptismFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [maritalFilter, setMaritalFilter] = useState<string>('all');
    const [occupationFilter, setOccupationFilter] = useState<string>('all');
    const [birthMonthFilter, setBirthMonthFilter] = useState<string>('all');

    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const uniqueOccupations = useMemo(() => {
        const occupations = new Set(members.map(m => m.occupation).filter(Boolean));
        return Array.from(occupations).sort() as string[];
    }, [members]);

    // --- Filtered Data ---
    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const matchesGender = genderFilter === 'all' || m.gender === genderFilter;
            const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

            let matchesMarital = true;
            if (maritalFilter !== 'all') {
                matchesMarital = m.maritalStatus === maritalFilter;
            }

            const matchesOccupation = occupationFilter === 'all' || m.occupation === occupationFilter;

            const matchesBirthMonth = birthMonthFilter === 'all' || (() => {
                if (!m.birthDate) return false;
                return new Date(m.birthDate).getMonth() === parseInt(birthMonthFilter);
            })();

            return matchesGender && matchesStatus && matchesMarital && matchesOccupation && matchesBirthMonth;
        });
    }, [members, genderFilter, statusFilter, maritalFilter, occupationFilter, birthMonthFilter]);

    // --- Statistics Calculations ---
    const stats = useMemo(() => {
        const totalMembers = filteredMembers.length;
        const totalGroups = groups.length;
        const totalDepartments = departments.length;

        const allDiscipleIds = new Set<string>();
        leaders.forEach(l => {
            if (l.disciples) {
                l.disciples.forEach((d: any) => allDiscipleIds.add(d.id || d.member_id));
            }
        });

        const totalInDiscipleship = filteredMembers.filter(m => allDiscipleIds.has(m.id)).length;

        let children = 0;
        let teens = 0;
        let youths = 0;
        let adults = 0;
        let seniors = 0;
        let unknownAge = 0;

        const currentYear = new Date().getFullYear();

        filteredMembers.forEach(m => {
            if (m.birthDate) {
                const birthYear = new Date(m.birthDate).getFullYear();
                const age = currentYear - birthYear;

                if (age <= 12) children++;
                else if (age <= 18) teens++;
                else if (age <= 29) youths++;
                else if (age <= 59) adults++;
                else seniors++;
            } else {
                unknownAge++;
            }
        });

        const ageData = [
            { name: 'Crianças (0-12)', value: children },
            { name: 'Adolesc. (13-18)', value: teens },
            { name: 'Jovens (19-29)', value: youths },
            { name: 'Adultos (30-59)', value: adults },
            { name: 'Idosos (60+)', value: seniors },
        ].filter(d => d.value > 0);


        const maritalCount: Record<string, number> = {
            'Single': 0,
            'Married': 0,
            'Divorced': 0,
            'Widowed': 0,
            'Other': 0
        };

        filteredMembers.forEach(m => {
            const status = m.maritalStatus || 'Other';
            if (maritalCount[status] !== undefined) {
                maritalCount[status]++;
            } else {
                maritalCount['Other']++;
            }
        });

        const maritalLabels: Record<string, string> = {
            'Single': 'Solteiros',
            'Married': 'Casados',
            'Divorced': 'Divorciados',
            'Widowed': 'Viúvos',
            'Other': 'Não Informado'
        };

        const maritalData = Object.entries(maritalCount)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => ({
                name: maritalLabels[key] || key,
                value
            }));

        return {
            totalMembers, // Added totalMembers to stats
            totalInDiscipleship,
            ageData,
            maritalData,
            maritalCount,
            statusData: [
                { name: 'Ativos', value: filteredMembers.filter(m => m.status === 'Active').length, color: '#10b981' },
                { name: 'Inativos', value: filteredMembers.filter(m => m.status === 'Inactive').length, color: '#ef4444' },
                { name: 'Visitantes', value: filteredMembers.filter(m => m.status === 'Visitor').length, color: '#f59e0b' }
            ],
            genderData: [
                { name: 'Masculino', value: filteredMembers.filter(m => m.gender === 'Male').length, color: '#3b82f6' },
                { name: 'Feminino', value: filteredMembers.filter(m => m.gender === 'Female').length, color: '#ec4899' }
            ],
            roleData: filteredMembers.reduce((acc, member) => {
                const role = member.churchRole || 'Não definido';
                const existing = acc.find(item => item.name === role);
                if (existing) {
                    existing.count += 1;
                } else {
                    acc.push({ name: role, count: 1 });
                }
                return acc;
            }, [] as { name: string; count: number }[])
        };
    }, [filteredMembers, groups, departments, leaders]);

    const hasActiveFilters = statusFilter !== 'all' ||
        genderFilter !== 'all' ||
        baptismFilter !== 'all' ||
        roleFilter !== 'all' ||
        maritalFilter !== 'all' ||
        occupationFilter !== 'all' ||
        birthMonthFilter !== 'all';

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;

        try {
            setGeneratingPdf(true);
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                ignoreElements: (element) => element.classList.contains('no-print')
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            const finalWidth = pdfWidth;
            const finalHeight = (imgHeight * pdfWidth) / imgWidth;

            if (finalHeight > pdfHeight) {
                let heightLeft = finalHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, finalWidth, finalHeight);
                heightLeft -= pdfHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - finalHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, finalWidth, finalHeight);
                    heightLeft -= pdfHeight;
                }
            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);
            }

            pdf.save('relatorio-igreja.pdf');
            toast.success('PDF baixado com sucesso!');

        } catch (err) {
            console.error(err);
            toast.error('Erro ao gerar PDF');
        } finally {
            setGeneratingPdf(false);
        }
    };

    return (
        <div ref={reportRef} className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 bg-gray-50 min-h-screen">
            {/* Report Header (Visible on Report & Print) */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-2">
                <div className="flex items-center gap-4">
                    {churchDetails?.logo_url ? (
                        <img
                            src={churchDetails.logo_url}
                            alt="Logo"
                            className="w-16 h-16 object-contain rounded-lg bg-white p-1 border border-gray-100"
                        />
                    ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                            <Building size={32} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{churchDetails?.name || user?.churchName || 'Minha Igreja'}</h1>
                        <p className="text-sm text-slate-500 max-w-md">
                            {churchDetails?.settings?.municipio ? `${churchDetails.settings.municipio}, ` : ''}
                            {churchDetails?.settings?.provincia || ''}
                        </p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-700">Relatório Geral</p>
                    <p className="text-xs text-slate-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </div>

            {/* Controls (No Print) */}
            <div className="flex flex-col md:flex-row justify-end items-center gap-4 no-print mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Printer size={18} />
                        <span className="hidden sm:inline">Imprimir</span>
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={generatingPdf}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Download size={18} />
                        {generatingPdf ? 'Gerando...' : <span className="hidden sm:inline">Exportar PDF</span>}
                    </button>
                </div>
            </div>

            {/* Filters Bar (No Print) */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center no-print">
                <div className="flex items-center gap-2 text-slate-500 mr-auto">
                    <Filter size={20} />
                    <span className="font-medium text-sm">Filtros:</span>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="Active">Ativos</option>
                        <option value="Inactive">Inativos</option>
                        <option value="Visitor">Visitantes</option>
                    </select>

                    {/* Gender Filter */}
                    <select
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Todos os Gêneros</option>
                        <option value="Male">Masculino</option>
                        <option value="Female">Feminino</option>
                    </select>

                    {/* Marital Filter */}
                    <select
                        value={maritalFilter}
                        onChange={(e) => setMaritalFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Todo Estado Civil</option>
                        <option value="Single">Solteiros</option>
                        <option value="Married">Casados</option>
                        <option value="Divorced">Divorciados</option>
                        <option value="Widowed">Viúvos</option>
                    </select>

                    {/* Occupation Filter */}
                    <select
                        value={occupationFilter}
                        onChange={(e) => setOccupationFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Todas as Profissões</option>
                        {uniqueOccupations.map(occ => (
                            <option key={occ} value={occ}>{occ}</option>
                        ))}
                    </select>

                    {/* Birth Month Filter */}
                    <select
                        value={birthMonthFilter}
                        onChange={(e) => setBirthMonthFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Mês de Nascimento</option>
                        {months.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>

                    {/* Baptism Filter */}
                    <select
                        value={baptismFilter}
                        onChange={(e) => setBaptismFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Batismo</option>
                        <option value="baptized">Batizados</option>
                        <option value="not-baptized">Não Batizados</option>
                    </select>

                    {/* Role Filter (Example, assuming roles are available) */}
                    {/* You might need to fetch unique roles similar to uniqueOccupations */}
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Função na Igreja</option>
                        {/* Example roles, replace with dynamic data if available */}
                        <option value="Membro">Membro</option>
                        <option value="Líder">Líder</option>
                        <option value="Pastor">Pastor</option>
                        <option value="Diácono">Diácono</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1">
                            {hasActiveFilters ? 'Filtrado' : 'Global'}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            {hasActiveFilters ? 'Membros Filtrados' : 'Total de Membros'}
                        </p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">
                            {isLoading ? '...' : (stats.totalMembers ?? 0)}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                            <Users2 size={24} />
                        </div>
                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Grupos</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Células / Grupos</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">
                            {isLoading ? '...' : (realStats.groups || stats.totalGroups || 0)}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Total Geral da Igreja</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <BookOpenCheck size={24} />
                        </div>
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Discipulado</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            {hasActiveFilters ? 'Em Discipulado (Filtrado)' : 'Total em Discipulado'}
                        </p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">
                            {isLoading ? '...' : (stats.totalInDiscipleship ?? 0)}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            {stats.totalMembers ? Math.round((stats.totalInDiscipleship / stats.totalMembers) * 100) : 0}% do total
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Network size={24} />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Departamentos</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Departamentos</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">
                            {isLoading ? '...' : (realStats.departments || stats.totalDepartments || 0)}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Total Geral da Igreja</p>
                    </div>
                </div>
            </div>

            {/* Members Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm break-inside-avoid">
                    <h3 className="font-semibold text-slate-800 mb-4 text-center">Distribuição por Status</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                    {stats.statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Status Legend */}
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
                        {stats.statusData.map((item, idx) => (
                            <div key={idx} className="flex justify-between border-b border-gray-100 py-1">
                                <span className="truncate mr-2">{item.name}:</span>
                                <span className="font-semibold">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm break-inside-avoid">
                    <h3 className="font-semibold text-slate-800 mb-4 text-center">Distribuição por Gênero</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.genderData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                    {stats.genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Gender Legend */}
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
                        {stats.genderData.map((item, idx) => (
                            <div key={idx} className="flex justify-between border-b border-gray-100 py-1">
                                <span className="truncate mr-2">{item.name}:</span>
                                <span className="font-semibold">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm break-inside-avoid">
                    <h3 className="font-semibold text-slate-800 mb-4 text-center">Distribuição por Função</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.roleData}>
                                <XAxis dataKey="name" hide />
                                <Tooltip />
                                <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Role Legend */}
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600 max-h-40 overflow-y-auto custom-scrollbar">
                        {stats.roleData.map((item, idx) => (
                            <div key={idx} className="flex justify-between border-b border-gray-100 py-1">
                                <span className="truncate mr-2">{item.name}:</span>
                                <span className="font-semibold">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Age Distribution */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm break-inside-avoid">
                    <div className="flex items-center gap-2 mb-6">
                        <Baby className="text-orange-500" size={20} />
                        <h3 className="font-semibold text-slate-800">Faixa Etária (Seleção)</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.ageData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#F97316" radius={[0, 4, 4, 0]} barSize={20}>
                                    {stats.ageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Age Legend */}
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
                        {stats.ageData.map((item, idx) => (
                            <div key={idx} className="flex justify-between border-b border-gray-100 py-1">
                                <span className="truncate mr-2">{item.name}:</span>
                                <span className="font-semibold">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Marital Status Distribution */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm break-inside-avoid">
                    <div className="flex items-center gap-2 mb-6">
                        <Heart className="text-rose-500" size={20} />
                        <h3 className="font-semibold text-slate-800">Estado Civil (Seleção)</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.maritalData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.maritalData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Detailed Counts - Useful for printing */}
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600">
                        <div className="flex justify-between border-b border-gray-100 py-1">
                            <span>Casados:</span>
                            <span className="font-semibold">{stats.maritalCount['Married']}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-1">
                            <span>Solteiros:</span>
                            <span className="font-semibold">{stats.maritalCount['Single']}</span>
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background-color: white; }
                    .shadow-sm, .shadow-md, .shadow-lg { box-shadow: none !important; }
                    .rounded-xl { border-radius: 0 !important; }
                    @page { margin: 2cm; }
                }
            `}</style>
        </div>
    );
};

export default Reports;
