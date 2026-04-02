import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    ArrowLeft, Building, Users, Calendar, CreditCard, Activity,
    Edit, Trash2, Clock, CheckCircle, XCircle, AlertTriangle,
    Mail, Phone, MapPin, Globe, Hash, Shield, BookOpen, GraduationCap,
    Network, Package, CalendarDays, MoreVertical
} from 'lucide-react';
import EditChurchModal from '../../components/modals/EditChurchModal';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string | null | undefined, locale = 'pt-AO') => {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
};

const getDaysRemaining = (endDate: string | null | undefined): number | null => {
    if (!endDate) return null;
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const DaysBadge: React.FC<{ days: number | null }> = ({ days }) => {
    if (days === null) return <span className="text-slate-400 text-sm">–</span>;
    if (days < 0) return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <XCircle size={12} /> Expirado
        </span>
    );
    if (days <= 7) return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
            <AlertTriangle size={12} /> {days}d restantes
        </span>
    );
    if (days <= 30) return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Clock size={12} /> {days}d restantes
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle size={12} /> {days}d restantes
        </span>
    );
};

const StatusBadge: React.FC<{ church: any }> = ({ church }) => {
    const status = church?.settings?.status;
    const sub = church?.subscriptions?.[0];
    const isActiveSub = sub && new Date(sub.end_date) > new Date();

    if (status === 'active' || isActiveSub) {
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700"><CheckCircle size={14} />Ativo</span>;
    }
    if (status === 'inactive') {
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700"><XCircle size={14} />Inativo</span>;
    }
    if (status === 'pending') {
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700"><Clock size={14} />Pendente</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600">Sem Status</span>;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: number | string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon size={22} className="text-white" />
        </div>
        <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: React.ElementType; label: string; value?: string | null }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
        <div className="p-1.5 bg-slate-50 rounded-lg">
            <Icon size={16} className="text-slate-400" />
        </div>
        <div className="flex-1 flex items-center justify-between">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-medium text-slate-700">{value || '–'}</span>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminChurchDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [church, setChurch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);

    useEffect(() => {
        if (id) fetchChurch();
    }, [id]);

    const fetchChurch = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_admin_dashboard_data');
            if (error) throw error;
            const found = (data || []).find((c: any) => c.id === id);
            if (!found) {
                toast.error('Igreja não encontrada.');
                navigate('/admin');
            } else {
                setChurch(found);
            }
        } catch (err) {
            console.error(err);
            toast.error('Erro ao carregar detalhes da igreja.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir esta igreja? Esta ação não pode ser desfeita.')) return;
        try {
            const { error } = await supabase.from('churches').delete().eq('id', id!);
            if (error) throw error;
            toast.success('Igreja excluída.');
            navigate('/admin');
        } catch (err) {
            toast.error('Erro ao excluir a igreja.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">A carregar dados da igreja...</p>
            </div>
        );
    }

    if (!church) return null;

    const sub = church.subscriptions?.[0];
    const getCount = (prop: any) => prop?.[0]?.count || 0;
    const daysRemaining = getDaysRemaining(sub?.end_date);

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 text-slate-500 hover:text-orange-600 transition-colors text-sm font-medium group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    Voltar ao Painel Admin
                </button>

                {/* ─── Header ─── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-2 w-full bg-gradient-to-r from-orange-500 to-amber-400" />
                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-start gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 border-2 border-orange-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Building size={36} className="text-orange-500" />
                        </div>

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 truncate">{church.name}</h1>
                                <StatusBadge church={church} />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                {church.slug && (
                                    <span className="flex items-center gap-1">
                                        <Hash size={14} />
                                        {church.slug}
                                    </span>
                                )}
                                {church.settings?.city && (
                                    <span className="flex items-center gap-1">
                                        <MapPin size={14} />
                                        {church.settings.city}
                                        {church.settings.province ? `, ${church.settings.province}` : ''}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <CalendarDays size={14} />
                                    Membro desde {formatDate(church.created_at)}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => setIsEditOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-sm"
                            >
                                <Edit size={16} />
                                Editar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"
                                title="Excluir Igreja"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Subscription Block ─── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <CreditCard size={20} className="text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">Assinatura</h2>
                    </div>

                    {sub ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Plan */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Plano</p>
                                <p className="font-bold text-slate-800 text-lg">{sub.plans?.name || '–'}</p>
                                {sub.plans?.billing_period && (
                                    <p className="text-xs text-slate-500 mt-1">Faturação {sub.plans.billing_period}</p>
                                )}
                            </div>
                            {/* Start Date */}
                            <div className="bg-blue-50 rounded-xl p-4">
                                <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Data de Adesão</p>
                                <p className="font-bold text-slate-800 text-base">{formatDate(sub.start_date || church.created_at)}</p>
                                <p className="text-xs text-slate-500 mt-1">Início da assinatura</p>
                            </div>
                            {/* End Date */}
                            <div className="bg-amber-50 rounded-xl p-4">
                                <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Data Final</p>
                                <p className="font-bold text-slate-800 text-base">{formatDate(sub.end_date)}</p>
                                <p className="text-xs text-slate-500 mt-1">Expiração do plano</p>
                            </div>
                            {/* Days Remaining */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Dias Restantes</p>
                                <DaysBadge days={daysRemaining} />
                                {daysRemaining !== null && daysRemaining > 0 && (
                                    <div className="mt-3">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full transition-all ${daysRemaining <= 7 ? 'bg-red-500' : daysRemaining <= 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                style={{ width: `${Math.min(100, (daysRemaining / 365) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Sem assinatura registada</p>
                            <p className="text-sm">Esta igreja não tem um plano ativo.</p>
                        </div>
                    )}
                </div>

                {/* ─── Stats Grid ─── */}
                <div>
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Estatísticas de Uso</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard icon={Users} label="Membros" value={getCount(church.members)} color="bg-blue-500" />
                        <StatCard icon={Users} label="Utilizadores" value={getCount(church.users)} color="bg-indigo-500" />
                        <StatCard icon={BookOpen} label="Grupos" value={getCount(church.groups)} color="bg-purple-500" />
                        <StatCard icon={Shield} label="Discipulado" value={getCount(church.discipleship_leaders)} color="bg-teal-500" />
                        <StatCard icon={Network} label="Departamentos" value={getCount(church.departments)} color="bg-orange-500" />
                        <StatCard icon={GraduationCap} label="Ensino" value={getCount(church.teaching_classes)} color="bg-rose-500" />
                    </div>
                </div>

                {/* ─── Church Info ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact & Basic Info */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <Building size={18} className="text-orange-500" />
                            </div>
                            <h2 className="font-semibold text-slate-800">Informações Básicas</h2>
                        </div>
                        <div>
                            <InfoRow icon={Hash} label="Slug / Identificador" value={church.slug} />
                            <InfoRow icon={Mail} label="Email" value={church.settings?.email} />
                            <InfoRow icon={Phone} label="Telefone" value={church.settings?.phone} />
                            <InfoRow icon={Globe} label="Website" value={church.settings?.website} />
                            <InfoRow icon={MapPin} label="Endereço" value={church.settings?.address} />
                            <InfoRow icon={MapPin} label="Cidade / Província" value={
                                [church.settings?.city, church.settings?.province].filter(Boolean).join(', ') || null
                            } />
                        </div>
                    </div>

                    {/* System / Dates */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Activity size={18} className="text-slate-500" />
                            </div>
                            <h2 className="font-semibold text-slate-800">Datas do Sistema</h2>
                        </div>
                        <div>
                            <InfoRow icon={CalendarDays} label="Data de Registro" value={formatDate(church.created_at)} />
                            <InfoRow icon={Calendar} label="Última Atualização" value={formatDate(church.updated_at)} />
                            <InfoRow icon={CreditCard} label="Início da Assinatura" value={formatDate(sub?.start_date)} />
                            <InfoRow icon={Clock} label="Expiração da Assinatura" value={formatDate(sub?.end_date)} />
                            <InfoRow icon={Package} label="Plano Atual" value={sub?.plans?.name} />
                            <InfoRow icon={Activity} label="Status" value={church.settings?.status || 'Não definido'} />
                        </div>
                    </div>
                </div>

            </div>

            <EditChurchModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                church={church}
                onUpdate={fetchChurch}
            />
        </div>
    );
};

export default AdminChurchDetail;
