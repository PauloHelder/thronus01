import React, { useState, useEffect } from 'react';
import { 
    Users, FileText, Calendar, Search, Trash2, Edit, Plus, 
    Settings, CheckCircle2, Clock, X, ArrowLeft, Loader2, 
    MessageSquare, ShieldAlert, ChevronRight, Eye, CalendarDays
} from 'lucide-react';
import { useCounseling, CounselingRecord } from '../hooks/useCounseling';
import { useMembers } from '../hooks/useMembers';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const Counseling: React.FC = () => {
    const { user } = useAuth();
    const { members } = useMembers();
    const { 
        counselings, loading, error, fetchCounselings, 
        addCounseling, updateCounseling, deleteCounseling 
    } = useCounseling();

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Edit/View target records
    const [selectedRecord, setSelectedRecord] = useState<CounselingRecord | null>(null);
    const [recordToDelete, setRecordToDelete] = useState<CounselingRecord | null>(null);

    // Form inputs state
    const [formData, setFormData] = useState({
        pastor_id: '',
        member_id: '',
        counseling_date: '',
        status: 'Scheduled' as CounselingRecord['status'],
        subject: '',
        description: ''
    });

    // Autocomplete searches
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);

    const [pastorSearchTerm, setPastorSearchTerm] = useState('');
    const [showPastorDropdown, setShowPastorDropdown] = useState(false);
    const [selectedPastor, setSelectedPastor] = useState<any | null>(null);

    useEffect(() => {
        fetchCounselings();
    }, [fetchCounselings]);

    // Format ISO string to datetime-local input value
    const formatForDateTimeInput = (isoString: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Filter members for autocomplete
    const filteredCounselees = members.filter(m => 
        m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        (m.memberCode && m.memberCode.toLowerCase().includes(memberSearchTerm.toLowerCase()))
    );

    // Filter members whose roles contain Pastor, Bispo or Presbítero
    const filteredPastors = members.filter(m => {
        const role = (m.churchRole || '').toLowerCase();
        const isMatch = role.includes('pastor') || role.includes('bispo') || role.includes('presb') || role.includes('presbítero');
        const searchMatch = m.name.toLowerCase().includes(pastorSearchTerm.toLowerCase());
        return isMatch && searchMatch;
    });

    const handleOpenCreateModal = () => {
        setSelectedRecord(null);
        setSelectedMember(null);
        setMemberSearchTerm('');
        setSelectedPastor(null);
        setPastorSearchTerm('');
        
        // Default to now
        const now = new Date();
        const localNow = formatForDateTimeInput(now.toISOString());

        setFormData({
            pastor_id: '',
            member_id: '',
            counseling_date: localNow,
            status: 'Scheduled',
            subject: '',
            description: ''
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (record: CounselingRecord) => {
        setSelectedRecord(record);
        
        // Find member and pastor in list
        const m = members.find(x => x.id === record.member_id);
        const p = members.find(x => x.id === record.pastor_id);
        
        setSelectedMember(m || null);
        setMemberSearchTerm(m ? m.name : '');
        setSelectedPastor(p || null);
        setPastorSearchTerm(p ? p.name : '');

        setFormData({
            pastor_id: record.pastor_id || '',
            member_id: record.member_id || '',
            counseling_date: formatForDateTimeInput(record.counseling_date),
            status: record.status,
            subject: record.subject || '',
            description: record.description || ''
        });
        setIsFormModalOpen(true);
    };

    const handleOpenDetailModal = (record: CounselingRecord) => {
        setSelectedRecord(record);
        setIsDetailModalOpen(true);
    };

    const handleSaveRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.member_id) {
            toast.warning('Por favor, selecione o membro a ser aconselhado.');
            return;
        }
        if (!formData.pastor_id) {
            toast.warning('Por favor, selecione o pastor / conselheiro.');
            return;
        }

        const dateISO = new Date(formData.counseling_date).toISOString();
        const payload = {
            pastor_id: formData.pastor_id,
            member_id: formData.member_id,
            counseling_date: dateISO,
            status: formData.status,
            subject: formData.subject || null,
            description: formData.description || null
        } as any;

        let result;
        if (selectedRecord) {
            result = await updateCounseling(selectedRecord.id, payload);
            if (result) {
                toast.success('Aconselhamento pastoral atualizado!');
                setIsFormModalOpen(false);
            } else {
                toast.error('Erro ao atualizar aconselhamento.');
            }
        } else {
            result = await addCounseling(payload);
            if (result) {
                toast.success('Aconselhamento agendado com sucesso!');
                setIsFormModalOpen(false);
            } else {
                toast.error('Erro ao agendar aconselhamento.');
            }
        }
    };

    const handleConfirmDelete = async () => {
        if (!recordToDelete) return;
        const success = await deleteCounseling(recordToDelete.id);
        if (success) {
            toast.success('Aconselhamento removido do histórico.');
        } else {
            toast.error('Erro ao excluir aconselhamento.');
        }
        setIsDeleteModalOpen(false);
        setRecordToDelete(null);
    };

    // Filter list records
    const filteredRecords = counselings.filter(c => {
        const pastorName = c.pastor?.name || '';
        const memberName = c.member?.name || '';
        const subject = c.subject || '';
        const matchesSearch = pastorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusLabel = (status: CounselingRecord['status']) => {
        switch(status) {
            case 'Scheduled': return 'Agendado';
            case 'Completed': return 'Concluído';
            case 'Cancelled': return 'Cancelado';
        }
    };

    const getStatusBadgeClass = (status: CounselingRecord['status']) => {
        switch(status) {
            case 'Scheduled': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <MessageSquare className="text-orange-500" />
                        Aconselhamento Pastoral
                    </h1>
                    <p className="text-sm text-slate-500">Agendamentos, histórico e registros confidenciais de aconselhamentos espirituais</p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all"
                >
                    <Plus size={18} />
                    Agendar Aconselhamento
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="m-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-sm animate-in fade-in duration-300">
                    <ShieldAlert className="shrink-0 text-rose-600" />
                    <div>
                        <p className="font-bold">Aviso de Segurança / Permissão</p>
                        <p className="text-xs opacity-90 mt-0.5">{error}. Detalhes e notas de aconselhamentos são restritos a administradores e ao pastor conselheiro do agendamento.</p>
                    </div>
                </div>
            )}

            {/* Dashboard grid */}
            <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                    {/* Filters Toolbar */}
                    <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/30">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Pesquisar por membro, pastor ou assunto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm shadow-sm transition-all"
                            />
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm shadow-sm"
                            >
                                <option value="all">Todos os Status</option>
                                <option value="Scheduled">Agendado</option>
                                <option value="Completed">Concluído</option>
                                <option value="Cancelled">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    {/* Table list */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-6 py-4">Data e Hora</th>
                                    <th className="px-6 py-4">Membro</th>
                                    <th className="px-6 py-4">Conselheiro (Pastor)</th>
                                    <th className="px-6 py-4">Assunto / Motivo</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            <Loader2 className="animate-spin mx-auto mb-2 text-orange-500" />
                                            Carregando aconselhamentos...
                                        </td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                                            <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                                            <p className="font-bold text-slate-700 text-sm">Nenhum aconselhamento registrado</p>
                                            <p className="text-xs text-slate-400 mt-1 italic">Use o botão no topo da página para agendar e registrar um aconselhamento.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((rec) => (
                                        <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays size={16} className="text-slate-400" />
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {new Date(rec.counseling_date).toLocaleDateString('pt-BR')}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-400">
                                                        {new Date(rec.counseling_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <img 
                                                        src={rec.member?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.member?.name || 'M')}&background=random`} 
                                                        alt="" 
                                                        className="w-7 h-7 rounded-full object-cover"
                                                    />
                                                    <span className="font-bold text-slate-800 text-sm">{rec.member?.name || 'Membro Excluído'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <img 
                                                        src={rec.pastor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.pastor?.name || 'P')}&background=f97316&color=fff`} 
                                                        alt="" 
                                                        className="w-7 h-7 rounded-full object-cover"
                                                    />
                                                    <span className="text-sm text-slate-600 font-medium">{rec.pastor?.name || 'Conselheiro'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm max-w-xs truncate">
                                                {rec.subject || <span className="text-slate-400 italic">Não informado</span>}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold">
                                                <span className={`px-2.5 py-1 rounded-full border ${getStatusBadgeClass(rec.status)}`}>
                                                    {getStatusLabel(rec.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenDetailModal(rec)}
                                                        className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                                                        title="Visualizar Notas Privadas"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditModal(rec)}
                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="Editar Agendamento"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setRecordToDelete(rec);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Excluir Aconselhamento"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create / Edit Form Modal */}
            {isFormModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 p-6 space-y-6 relative overflow-visible">
                        <button 
                            onClick={() => setIsFormModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div>
                            <h3 className="text-xl font-black text-slate-800">
                                {selectedRecord ? 'Editar Aconselhamento' : 'Agendar Aconselhamento'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Preencha as informações para registrar o atendimento espiritual.</p>
                        </div>

                        <form onSubmit={handleSaveRecord} className="space-y-4">
                            {/* Autocomplete Member Selector */}
                            <div className="relative">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Pesquisar Membro</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Digite o nome do membro..."
                                        value={memberSearchTerm}
                                        onChange={(e) => {
                                            setMemberSearchTerm(e.target.value);
                                            setShowMemberDropdown(true);
                                        }}
                                        onFocus={() => setShowMemberDropdown(true)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                    />
                                </div>
                                {showMemberDropdown && memberSearchTerm.length > 0 && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-gray-50">
                                        {filteredCounselees.slice(0, 5).map(m => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedMember(m);
                                                    setMemberSearchTerm(m.name);
                                                    setFormData({ ...formData, member_id: m.id });
                                                    setShowMemberDropdown(false);
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm font-semibold text-slate-700 flex items-center gap-2"
                                            >
                                                <img 
                                                    src={m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`} 
                                                    alt="" 
                                                    className="w-6 h-6 rounded-full object-cover"
                                                />
                                                {m.name}
                                            </button>
                                        ))}
                                        {filteredCounselees.length === 0 && (
                                            <p className="p-2.5 text-xs text-center text-gray-400 italic">Nenhum membro encontrado</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Autocomplete Pastor Selector */}
                            <div className="relative">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Pastor / Conselheiro</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar por Pastor, Bispo ou Presbítero..."
                                        value={pastorSearchTerm}
                                        onChange={(e) => {
                                            setPastorSearchTerm(e.target.value);
                                            setShowPastorDropdown(true);
                                        }}
                                        onFocus={() => setShowPastorDropdown(true)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                    />
                                </div>
                                {showPastorDropdown && pastorSearchTerm.length > 0 && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto divide-y divide-gray-50">
                                        {filteredPastors.slice(0, 5).map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPastor(p);
                                                    setPastorSearchTerm(p.name);
                                                    setFormData({ ...formData, pastor_id: p.id });
                                                    setShowPastorDropdown(false);
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm font-semibold text-slate-700 flex items-center gap-2"
                                            >
                                                <img 
                                                    src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=f97316&color=fff`} 
                                                    alt="" 
                                                    className="w-6 h-6 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p>{p.name}</p>
                                                    <p className="text-[10px] text-orange-500 uppercase">{p.churchRole}</p>
                                                </div>
                                            </button>
                                        ))}
                                        {filteredPastors.length === 0 && (
                                            <p className="p-2.5 text-xs text-center text-gray-400 italic">Nenhum pastor ou oficial encontrado</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Date, Time and Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Data e Hora</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.counseling_date}
                                        onChange={(e) => setFormData({ ...formData, counseling_date: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800 font-semibold"
                                    >
                                        <option value="Scheduled">Agendado</option>
                                        <option value="Completed">Concluído</option>
                                        <option value="Cancelled">Cancelado</option>
                                    </select>
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Assunto / Motivo <span className="text-gray-400 font-normal">(Opcional)</span></label>
                                <input
                                    type="text"
                                    placeholder="Ex: Fortalecimento espiritual, conflito familiar"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Notas Confidenciais / Descrição <span className="text-gray-400 font-normal">(Opcional)</span></label>
                                <textarea
                                    placeholder="Escreva aqui os detalhes, aconselhamento dado e observações espirituais..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-800 h-24"
                                />
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-black text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
                                >
                                    {selectedRecord ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Secure Detail View Modal (Private notes) */}
            {isDetailModalOpen && selectedRecord && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl animate-in zoom-in duration-200 p-6 space-y-6 relative border border-slate-100">
                        <button 
                            onClick={() => setIsDetailModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-start gap-3 border-b border-gray-150 pb-4">
                            <div className="p-3 bg-orange-50 rounded-2xl text-orange-500">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Notas de Aconselhamento Pastoral</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Registro confidencial em conformidade com as regras de RLS.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm">
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Membro Aconselhado</p>
                                <div className="flex items-center gap-2">
                                    <img 
                                        src={selectedRecord.member?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedRecord.member?.name || 'M')}&background=random`} 
                                        alt="" 
                                        className="w-6 h-6 rounded-full object-cover"
                                    />
                                    <p className="font-bold text-slate-800">{selectedRecord.member?.name || 'Membro'}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Pastor Conselheiro</p>
                                <div className="flex items-center gap-2">
                                    <img 
                                        src={selectedRecord.pastor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedRecord.pastor?.name || 'P')}&background=f97316&color=fff`} 
                                        alt="" 
                                        className="w-6 h-6 rounded-full object-cover"
                                    />
                                    <p className="font-bold text-slate-800">{selectedRecord.pastor?.name || 'Pastor'}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Data e Horário</p>
                                <p className="font-semibold text-slate-700">
                                    {new Date(selectedRecord.counseling_date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Status do Atendimento</p>
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mt-1 ${getStatusBadgeClass(selectedRecord.status)}`}>
                                    {getStatusLabel(selectedRecord.status)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Assunto / Motivo</h4>
                                <p className="text-sm font-bold text-slate-800 mt-1">
                                    {selectedRecord.subject || <span className="text-slate-400 italic">Sem assunto informado</span>}
                                </p>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Anotações e Detalhes Confidenciais</h4>
                                <div className="bg-orange-50/20 border border-orange-100 rounded-2xl p-4 text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap font-serif">
                                    {selectedRecord.description || <span className="text-slate-400 italic">Nenhuma anotação descritiva registrada.</span>}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsDetailModalOpen(false)}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm transition-all"
                        >
                            Fechar Notas Privadas
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && recordToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 p-6 space-y-4">
                        <div className="flex items-center gap-3 text-red-600">
                            <Trash2 size={24} />
                            <h3 className="text-lg font-bold text-slate-800">Confirmar Exclusão</h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Tem certeza que deseja excluir o agendamento de aconselhamento de <strong>{recordToDelete.member?.name}</strong>? Esta ação apagará permanentemente o histórico.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-slate-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                            >
                                Confirmar e Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Counseling;
