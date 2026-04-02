import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, MessageSquare, Save, X, CheckCircle, XCircle, Building, Server, ArrowUpDown, Activity, CreditCard, Clock, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSmsPackages() {
    const [activeTab, setActiveTab] = useState<'catalog' | 'churches' | 'orders'>('catalog');
    
    // Catalog State
    const [packages, setPackages] = useState<any[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    
    // Churches State
    const [churches, setChurches] = useState<any[]>([]);
    const [loadingChurches, setLoadingChurches] = useState(false);
    const [systemBalance, setSystemBalance] = useState(0);
    const [telcoBalance, setTelcoBalance] = useState<any>(null);
    const [isLoadingTelco, setIsLoadingTelco] = useState(false);

    // Orders State
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    
    // Sort State
    const [sortField, setSortField] = useState<'name' | 'balance'>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPkg, setEditingPkg] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        messages_count: 0,
        price: 0,
        active: true
    });

    // Assign Package Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState<any>(null);
    const [selectedPackage, setSelectedPackage] = useState('');

    useEffect(() => {
        if (activeTab === 'catalog') {
            fetchPackages();
        } else if (activeTab === 'churches') {
            fetchChurchesData();
            if (telcoBalance === null) fetchTelcoBalance();
        } else {
            fetchOrders();
        }
    }, [activeTab]);

    const fetchPackages = async () => {
        setLoadingCatalog(true);
        try {
            const { data, error } = await supabase
                .from('sms_packages')
                .select('*')
                .order('price', { ascending: true });
            
            if (error) throw error;
            setPackages(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar pacotes SMS.');
        } finally {
            setLoadingCatalog(false);
        }
    };

    const fetchChurchesData = async () => {
        setLoadingChurches(true);
        try {
            const { data, error } = await supabase
                .from('churches')
                .select(`
                    id, 
                    name, 
                    email, 
                    created_at,
                    church_sms_balances(available_messages, total_sent)
                `);
            
            if (error) throw error;
            
            let totalSys = 0;
            const formatted = (data || []).map(c => {
                const balance = c.church_sms_balances ? (c.church_sms_balances as any).available_messages : 0;
                const sent = c.church_sms_balances ? (c.church_sms_balances as any).total_sent : 0;
                totalSys += balance;
                return {
                    ...c,
                    balance,
                    sent
                };
            });
            
            setSystemBalance(totalSys);
            setChurches(formatted);
            if (packages.length === 0) fetchPackages();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados das igrejas.');
        } finally {
            setLoadingChurches(false);
        }
    };

    const fetchTelcoBalance = async () => {
        setIsLoadingTelco(true);
        try {
            const { data, error } = await (supabase.rpc as any)('get_telco_balance_rpc');
            if (error) throw error;
            const apiRes = data as any;
            if (apiRes && apiRes.success && apiRes.telco_data && typeof apiRes.telco_data.balance !== 'undefined') {
                setTelcoBalance(apiRes.telco_data);
            } else {
                setTelcoBalance({ error: true });
            }
        } catch (error) {
            console.error("Falha ao invocar RPC get_telco_balance_rpc", error);
            setTelcoBalance({ error: true });
        } finally {
            setIsLoadingTelco(false);
        }
    };

    const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
            const { data, error } = await supabase
                .from('sms_transactions')
                .select('*, churches(name), sms_packages(name, price)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar pedidos.');
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleApproveOrder = async (id: string, churchName: string) => {
        if (!window.confirm(`Confirmar recebimento do pagamento de '${churchName}' e libertar saldo?`)) return;
        try {
            const { error } = await (supabase.rpc as any)('approve_sms_purchase', {
                p_transaction_id: id
            });
            if (error) throw error;
            toast.success('Pedido aprovado e saldo libertado!');
            fetchOrders();
        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao aprovar: ' + error.message);
        }
    };

    const handleRejectOrder = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja rejeitar este pedido?')) return;
        try {
            const { error } = await supabase
                .from('sms_transactions')
                .update({ status: 'rejected' })
                .eq('id', id);
            if (error) throw error;
            toast.success('Pedido rejeitado.');
            fetchOrders();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao rejeitar pedido.');
        }
    };

    // --- Original Logic Keepers ---
    const handleSavePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPkg) {
                const { error } = await (supabase.from('sms_packages') as any).update(formData).eq('id', editingPkg.id);
                if (error) throw error;
                toast.success('Pacote atualizado com sucesso!');
            } else {
                const { error } = await (supabase.from('sms_packages') as any).insert([formData]);
                if (error) throw error;
                toast.success('Pacote criado com sucesso!');
            }
            setIsModalOpen(false);
            fetchPackages();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao guardar pacote.');
        }
    };

    const handleDeletePackage = async (id: string, name: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir '${name}'?`)) return;
        try {
            const { error } = await supabase.from('sms_packages').delete().eq('id', id);
            if (error) throw error;
            toast.success('Pacote excluído!');
            fetchPackages();
        } catch (error) {
            console.error(error);
            toast.error('Erro: Pacote possivelmente em uso.');
        }
    };

    const openPackageModal = (pkg?: any) => {
        if (pkg) {
            setEditingPkg(pkg);
            setFormData({ name: pkg.name, messages_count: pkg.messages_count, price: pkg.price, active: pkg.active });
        } else {
            setEditingPkg(null);
            setFormData({ name: '', messages_count: 1000, price: 0, active: true });
        }
        setIsModalOpen(true);
    };

    const openAssignModal = (church: any) => {
        setAssignTarget(church);
        setSelectedPackage('');
        setIsAssignModalOpen(true);
    };

    const handleAssignPackage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignTarget || !selectedPackage) return;
        try {
            const { error } = await (supabase.rpc as any)('admin_credit_sms_package', {
                p_church_id: assignTarget.id,
                p_package_id: selectedPackage
            });
            if (error) throw error;
            toast.success(`Pacote atribuído com sucesso a ${assignTarget.name}!`);
            setIsAssignModalOpen(false);
            fetchChurchesData();
        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao atribuir pacote: ' + error.message);
        }
    };

    const handleSort = (field: 'name' | 'balance') => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const sortedChurches = useMemo(() => {
        return [...churches].sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [churches, sortField, sortDir]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="text-orange-600" />
                        Gestão Global de SMS (TelcoSMS)
                    </h2>
                    <p className="text-sm text-slate-500">Monitorize e controle o fluxo de SMS em toda a plataforma.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 gap-6">
                <button 
                    onClick={() => setActiveTab('catalog')} 
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'catalog' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Catálogo de Pacotes
                </button>
                <button 
                    onClick={() => setActiveTab('orders')} 
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors relative ${activeTab === 'orders' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Pedidos de Compra
                    {orders.length > 0 && (
                        <span className="absolute -top-1 -right-4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                            {orders.length}
                        </span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('churches')} 
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'churches' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Igrejas & Saldos
                </button>
            </div>

            {/* --- TAB: CATALOGO --- */}
            {activeTab === 'catalog' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-end">
                        <button onClick={() => openPackageModal()} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition flex items-center gap-2">
                            <Plus size={18} /> Adicionar Pacote
                        </button>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-gray-200 font-bold text-xs text-slate-500 uppercase tracking-widest px-6">
                                        <th className="px-6 py-4">Pacote</th>
                                        <th className="px-6 py-4">Quantidade SMS</th>
                                        <th className="px-6 py-4">Preço (AOA)</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loadingCatalog ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">Carregando catálogo...</td></tr>
                                    ) : packages.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Nenhum pacote de SMS configurado.</td></tr>
                                    ) : (
                                        packages.map((pkg) => (
                                            <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-800">{pkg.name}</td>
                                                <td className="px-6 py-4 text-slate-600">{new Intl.NumberFormat('pt-AO').format(pkg.messages_count)} un.</td>
                                                <td className="px-6 py-4 font-black text-slate-900">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(pkg.price)}</td>
                                                <td className="px-6 py-4">
                                                    {pkg.active ? 
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-green-100 text-green-700 uppercase"><CheckCircle size={12} /> Ativo</span> : 
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 uppercase"><XCircle size={12} /> Inativo</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => openPackageModal(pkg)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Editar"><Edit size={16} /></button>
                                                        <button onClick={() => handleDeletePackage(pkg.id, pkg.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir"><Trash2 size={16} /></button>
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
            )}

            {/* --- TAB: PEDIDOS --- */}
            {activeTab === 'orders' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-gray-200 font-bold text-xs text-slate-500 uppercase tracking-widest px-6">
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Igreja</th>
                                        <th className="px-6 py-4">Pacote Solicitado</th>
                                        <th className="px-6 py-4">Valor a Confirmar</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Ação Super Admin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loadingOrders ? (
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">Carregando pedidos pendentes...</td></tr>
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <CheckCircle size={40} className="text-green-200 mb-2" />
                                                    <p className="font-bold">Tudo em dia!</p>
                                                    <p className="text-xs">Não existem pedidos de SMS aguardando aprovação.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-amber-50/30 transition-colors bg-amber-50/5">
                                                <td className="px-6 py-4 text-slate-500">{new Date(order.created_at).toLocaleString('pt-AO')}</td>
                                                <td className="px-6 py-4 font-bold text-slate-800">{(order.churches as any)?.name}</td>
                                                <td className="px-6 py-4">{(order.sms_packages as any)?.name} ({new Intl.NumberFormat('pt-AO').format(order.amount)} SMS)</td>
                                                <td className="px-6 py-4 font-black text-orange-600">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format((order.sms_packages as any)?.price || 0)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 uppercase">
                                                        <Clock size={12} /> Pendente
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleRejectOrder(order.id)} 
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-bold text-xs transition"
                                                        >
                                                            <X size={14} /> Rejeitar
                                                        </button>
                                                        <button 
                                                            onClick={() => handleApproveOrder(order.id, (order.churches as any)?.name)} 
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs shadow-md transition"
                                                        >
                                                            <Check size={14} /> Aprovar Pagamento
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
            )}

            {/* --- TAB: GESTÃO E SALDOS --- */}
            {activeTab === 'churches' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-inner text-white group hover:border-orange-500/30 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Server size={14} className="text-orange-500"/>
                                        Gateway TelcoSMS (Saldo Real)
                                    </p>
                                    <div className="text-3xl font-black flex items-center gap-3">
                                        {isLoadingTelco ? '...' : (telcoBalance?.error ? 'Erro' : telcoBalance ? new Intl.NumberFormat('pt-AO').format(telcoBalance.balance) : '---')}
                                        <span className="text-xs text-slate-500 font-normal">SMS na Cloud</span>
                                    </div>
                                    {telcoBalance && !telcoBalance.error && (
                                        <p className="text-orange-500 text-xs mt-2 font-bold bg-orange-500/10 inline-block px-2 py-0.5 rounded">
                                            Valor em Conta: {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(telcoBalance.balance_real)}
                                        </p>
                                    )}
                                </div>
                                <Activity className="text-orange-500 opacity-20 group-hover:opacity-100 transition-opacity" size={32} />
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Building size={14} className="text-blue-500" />
                                        Custódia Thronus (Rede)
                                    </p>
                                    <div className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                        {new Intl.NumberFormat('pt-AO').format(systemBalance)}
                                        <span className="text-xs text-slate-400 font-normal uppercase italic tracking-tighter">Reservado</span>
                                    </div>
                                    <p className="text-slate-400 text-[10px] mt-2 italic flex items-center gap-1"><AlertCircle size={10} /> Total de crédito já distribuído e ativo nas igrejas.</p>
                                </div>
                                <MessageSquare className="text-blue-500 opacity-10" size={32} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-gray-200 font-bold text-xs text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-1">Igreja <ArrowUpDown size={12}/></div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort('balance')}>
                                            <div className="flex items-center gap-1 text-right">Saldo SMS <ArrowUpDown size={12}/></div>
                                        </th>
                                        <th className="px-6 py-4 text-center">Consumo Total</th>
                                        <th className="px-6 py-4 text-right">Ação Super Admin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loadingChurches ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Cruzando dados de igrejas...</td></tr>
                                    ) : sortedChurches.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Nenhuma igreja encontrada.</td></tr>
                                    ) : (
                                        sortedChurches.map((church) => (
                                            <tr key={church.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">{church.name}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">{church.email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ring-1 ring-inset ${church.balance > 100 ? 'bg-orange-50 text-orange-700 ring-orange-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
                                                        {new Intl.NumberFormat('pt-AO').format(church.balance)} SMS
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono text-slate-500 text-xs">
                                                    {new Intl.NumberFormat('pt-AO').format(church.sent)} envios
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => openAssignModal(church)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95">
                                                        <Plus size={14} /> Atribuir Bonus/Débito
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS PERSISTED (CATALOG & ASSIGN) */}
            {/* [MODAL CODE MAINTAINED AS PER STEP 401 BUT UPDATED FOR LOOK & FEEL] */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-8 pb-4">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                {editingPkg ? 'Editar Pacote' : 'Novo Pacote SMS'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSavePackage} className="p-8 pt-4 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nome Comercial</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition font-bold" placeholder="Ex: Pacote Premium 10k" />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Qtd Mensagens</label>
                                    <input type="number" required min="1" value={formData.messages_count} onChange={e => setFormData({...formData, messages_count: parseInt(e.target.value) || 0})} className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Preço (AOA)</label>
                                    <input type="number" required min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition font-bold" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 py-2">
                                <input type="checkbox" id="active-pkg" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-5 h-5 text-orange-600 border-slate-300 rounded-lg focus:ring-orange-500" />
                                <label htmlFor="active-pkg" className="text-sm font-bold text-slate-600">Disponível para venda agora</label>
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                                    <Save size={20} /> {editingPkg ? 'Salvar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-8 pb-4">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">Atribuir Crédito</h2>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAssignPackage} className="p-8 pt-4 space-y-6">
                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                <p className="text-[10px] font-black uppercase text-orange-400 mb-1">Destinatário</p>
                                <p className="font-bold text-orange-950 text-lg">{assignTarget?.name}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Selecione o Pacote</label>
                                <select required value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)} className="w-full px-5 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition font-bold appearance-none">
                                    <option value="" disabled>-- Catálogo Thronus --</option>
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>{pkg.name} ({new Intl.NumberFormat('pt-AO').format(pkg.messages_count)} SMS)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                                <p className="text-xs text-blue-700 leading-tight">Ao confirmar, o saldo será injetado imediatamente na carteira da igreja como uma "Atribuição Administrativa".</p>
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black hover:bg-orange-700 shadow-xl shadow-orange-600/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                                    <CheckCircle size={20} /> Confirmar Atribuição
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
