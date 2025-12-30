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
    Loader2
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
        recentServices: []
    });
    const [permissions, setPermissions] = useState<any>({});

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

                // Security check: Must be a child of current user's church
                if (churchData.parent_id !== user?.churchId) {
                    toast.error('Você não tem permissão para visualizar esta igreja.');
                    navigate('/network');
                    return;
                }

                setBranch(churchData);
                const perms = churchData.settings?.shared_permissions || {};
                setPermissions(perms);

                // 2. Fetch Conditional Data based on Permissions
                // Note: This requires RLS policies allowing parent church to view child data

                // Members
                if (perms.view_members) {
                    const { count } = await supabase
                        .from('members')
                        .select('*', { count: 'exact', head: true })
                        .eq('church_id', id);
                    setStats((s: any) => ({ ...s, memberCount: count || 0 }));
                }

                // Services Stats
                if (perms.view_service_stats) {
                    // Get Count
                    const { count: servicesCount } = await supabase
                        .from('services')
                        .select('*', { count: 'exact', head: true })
                        .eq('church_id', id);

                    // Get History for Chart (Last 20)
                    const { data: servicesHistory } = await supabase
                        .from('services')
                        .select('id, title, date, attendance_count')
                        .eq('church_id', id)
                        .order('date', { ascending: false })
                        .limit(20);

                    // Sort valid data for chart (Chronological)
                    const chartData = (servicesHistory || [])
                        .slice()
                        .reverse()
                        .map((s: any) => ({
                            name: new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                            presenca: s.attendance_count || 0,
                            fullDate: new Date(s.date).toLocaleDateString()
                        }));

                    setStats((s: any) => ({
                        ...s,
                        servicesCount: servicesCount || 0,
                        recentServices: servicesHistory?.slice(0, 5) || [], // Top 5 for list
                        chartData: chartData // All 20 for chart
                    }));
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <PermissionBadge
                            label="Membros"
                            allowed={permissions.view_members}
                            icon={Users}
                        />
                        <PermissionBadge
                            label="Relatórios de Culto"
                            allowed={permissions.view_service_stats}
                            icon={Calendar}
                        />
                        <PermissionBadge
                            label="Finanças"
                            allowed={permissions.view_financials}
                            icon={Wallet}
                        />
                    </div>
                    {!permissions.view_members && !permissions.view_service_stats && !permissions.view_financials && (
                        <p className="text-sm text-orange-600 mt-4 bg-orange-50 p-3 rounded-lg border border-orange-100">
                            Esta igreja ainda não compartilhou nenhum dado com a Sede.
                            Solicite ao administrador local para habilitar as opções de compartilhamento nas configurações de vínculo.
                        </p>
                    )}
                </div>
            </div>

            {/* Data Sections */}
            <div className="space-y-8">
                {permissions.view_members ? (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-bottom duration-500">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Users className="text-blue-500" />
                            Visão Geral de Membros
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-center">
                                <p className="text-blue-600 text-sm font-medium uppercase tracking-wide">Total de Membros</p>
                                <p className="text-4xl font-bold text-blue-900 mt-2">{stats.memberCount}</p>
                            </div>
                            {/* Placeholder for future detailed stats if API allows */}
                            <div className="col-span-2 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg">
                                Gráficos detalhados de crescimento disponíveis em breve
                            </div>
                        </div>
                    </div>
                ) : null}

                {permissions.view_service_stats ? (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-bottom duration-500 delay-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="text-purple-500" />
                            Estatísticas de Culto
                        </h3>

                        {/* Chart Section */}
                        <div className="mb-8">
                            <h4 className="text-sm font-semibold text-slate-700 mb-4">Evolução da Presença (Últimos 20 Cultos)</h4>
                            <div className="h-64 w-full">
                                {stats.chartData && stats.chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.chartData} barCategoryGap="20%">
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 12 }}
                                                padding={{ left: 30, right: 30 }}
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
                                                barSize={40}
                                                maxBarSize={60}
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 text-center">
                                <p className="text-purple-600 text-sm font-medium uppercase tracking-wide">Cultos Realizados</p>
                                <p className="text-4xl font-bold text-purple-900 mt-2">{stats.servicesCount}</p>
                            </div>
                            <div className="col-span-2">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Histórico Recente</h4>
                                {stats.recentServices.length > 0 ? (
                                    <div className="space-y-2">
                                        {stats.recentServices.map((service: any) => (
                                            <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div>
                                                    <p className="font-medium text-slate-800">{service.title || 'Culto sem título'}</p>
                                                    <p className="text-xs text-slate-500">{new Date(service.date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="bg-white px-3 py-1 rounded border border-gray-200 text-sm font-bold text-slate-600">
                                                    {service.attendance_count || 0} <span className="text-xs font-normal text-slate-400">pessoas</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm italic">Nenhum culto registrado recentemente.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const PermissionBadge: React.FC<{ label: string, allowed: boolean, icon: any }> = ({ label, allowed, icon: Icon }) => (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${allowed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${allowed ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
            <Icon size={20} />
        </div>
        <div>
            <p className={`font-medium ${allowed ? 'text-green-900' : 'text-slate-600'}`}>{label}</p>
            <p className={`text-xs ${allowed ? 'text-green-700' : 'text-slate-400'}`}>
                {allowed ? 'Acesso Permitido' : 'Acesso Restrito'}
            </p>
        </div>
    </div>
);

export default BranchDetails;
