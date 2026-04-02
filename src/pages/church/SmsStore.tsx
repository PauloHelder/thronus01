import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, CreditCard, Activity, CheckCircle, Smartphone, X, History, Clock, XCircle, ChevronRight, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function SmsStore() {
    const { user } = useAuth();
    const [packages, setPackages] = useState<any[]>([]);
    const [balance, setBalance] = useState({
        available_messages: 0,
        total_sent: 0
    });
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [selectedPkg, setSelectedPkg] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user?.churchId) {
            fetchData();
        } else if (user) {
            // Se o usuário já carregou mas não tem churchId, libera o loading
            setLoading(false);
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Packages
            const { data: pkgs, error: pkgsError } = await (supabase.rpc as any)('get_sms_packages');
            if (pkgsError) throw pkgsError;
            setPackages((pkgs || []).filter((p: any) => p.active));

            // Fetch Balance
            const { data: balData, error: balError } = await supabase
                .from('church_sms_balances')
                .select('*')
                .eq('church_id', user?.churchId)
                .single();

            if (balData) {
                const b = balData as any;
                setBalance({
                    available_messages: b.available_messages,
                    total_sent: b.total_sent
                });
            }

            // Fetch History
            const { data: histData, error: histError } = await supabase
                .from('sms_transactions')
                .select('*, sms_packages(name)')
                .eq('church_id', user?.churchId)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (histError) throw histError;
            setHistory(histData || []);

        } catch (error) {
            console.error('Error fetching SMS store data:', error);
            toast.error('Erro ao carregar dados da loja.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenBuy = (pkg: any) => {
        setSelectedPkg(pkg);
        setIsBuyModalOpen(true);
    };

    const handleConfirmPurchase = async () => {
        if (!selectedPkg) return;
        setIsSubmitting(true);
        try {
            const { data, error } = await (supabase.rpc as any)('request_sms_purchase', {
                p_package_id: selectedPkg.id
            });
            if (error) throw error;
            
            toast.success('Pedido registado! O saldo será libertado após confirmação do pagamento.');
            setIsBuyModalOpen(false);
            fetchData(); // Refresh history
        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao processar pedido: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyIban = () => {
        navigator.clipboard.writeText('AO06.0040.0000.1234.5678.9012.3'); // Placeholder IBAN
        toast.success('IBAN copiado para a área de transferência!');
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Carregando Loja...</div>;
    }

    return (
        <div className="p-1 md:p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header & Balance Card */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50 rounded-full blur-3xl -mr-48 -mt-48 opacity-60"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-4">
                            <Activity size={14} /> Integração TelcoSMS
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            Mensagens de <span className="text-orange-600">Texto SMS</span>
                        </h1>
                        <p className="text-slate-600 mt-4 leading-relaxed">
                            Mantenha a sua igreja conectada com alertas em tempo real, lembretes de eventos e mensagens inspiradoras enviadas diretamente para o telemóvel dos membros.
                        </p>
                    </div>

                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-2xl min-w-[220px] transform hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center gap-3 mb-4 opacity-70">
                            <Smartphone size={20} className="text-orange-500" />
                            <span className="text-sm font-medium uppercase tracking-widest">Saldo Disponível</span>
                        </div>
                        <div className="text-4xl font-black flex items-baseline gap-2">
                            {new Intl.NumberFormat('pt-AO').format(balance.available_messages)} 
                            <span className="text-xs font-normal text-slate-400">SMS</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                            <span className="text-xs text-slate-400">Total Enviado:</span>
                            <span className="text-sm font-bold text-orange-400">{new Intl.NumberFormat('pt-AO').format(balance.total_sent)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Packages Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <CreditCard className="text-orange-600" size={24} />
                        Escolha um Pacote de Recarga
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.length === 0 ? (
                        <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 p-12 text-center rounded-2xl">
                            <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500 font-medium">A Thronus ainda não disponibilizou pacotes de venda.</p>
                        </div>
                    ) : (
                        packages.map((pkg) => (
                            <div key={pkg.id} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-orange-400 hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-300 flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-5">
                                    <MessageSquare size={80} />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="text-xs font-bold text-orange-600 mb-1 uppercase tracking-widest">{pkg.name}</div>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="text-4xl font-black text-slate-900">{new Intl.NumberFormat('pt-AO').format(pkg.messages_count)}</span>
                                        <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">SMS</span>
                                    </div>
                                    
                                    <div className="mt-8 space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <CheckCircle size={16} className="text-green-500" /> 
                                            <span>Validade Ilimitada</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <CheckCircle size={16} className="text-green-500" />
                                            <span>Gateway Direta TelcoSMS</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <CheckCircle size={16} className="text-green-500" />
                                            <span>Preço por SMS: {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(pkg.price / pkg.messages_count)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-8 flex items-center justify-between border-t border-slate-50 mt-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Preço Total</span>
                                        <span className="text-xl font-black text-slate-900">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(pkg.price)}</span>
                                    </div>
                                    <button
                                        onClick={() => handleOpenBuy(pkg)}
                                        className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                                    >
                                        Comprar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <History size={18} className="text-slate-400" />
                        Histórico de Pedidos de SMS
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Descrição</th>
                                <th className="px-6 py-4">Quantidade</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                                        Ainda não existem transações ou pedidos registados.
                                    </td>
                                </tr>
                            ) : (
                                history.map((h) => (
                                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(h.created_at).toLocaleDateString('pt-AO')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-800">{h.description}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{h.type === 'credit' ? 'Compra' : h.type === 'bonus' ? 'Bónus' : 'Envio'}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm">
                                            {h.type === 'credit' || h.type === 'bonus' ? '+' : '-'}{h.amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            {h.status === 'completed' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-700">
                                                    <CheckCircle size={12} /> CONCLUÍDO
                                                </span>
                                            ) : h.status === 'pending' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                                                    <Clock size={12} /> AGUARDANDO
                                                </span>
                                            ) : h.status === 'rejected' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                                                    <XCircle size={12} /> REJEITADO
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">---</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Purchase Modal */}
            {isBuyModalOpen && selectedPkg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-8 pb-0 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Confirmar Compra</h3>
                                <p className="text-slate-500 mt-1">Siga as instruções para ativar o seu pacote.</p>
                            </div>
                            <button onClick={() => setIsBuyModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 space-y-6">
                            {/* Selected Package Summary */}
                            <div className="bg-slate-100 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                        <MessageSquare className="text-orange-600" size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{selectedPkg.name}</div>
                                        <div className="text-xs text-slate-500">{new Intl.NumberFormat('pt-AO').format(selectedPkg.messages_count)} SMS incluídos</div>
                                    </div>
                                </div>
                                <div className="text-lg font-black text-slate-900">
                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(selectedPkg.price)}
                                </div>
                            </div>

                            {/* Payment Instructions */}
                            <div className="space-y-4">
                                <div className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard size={16} /> Instruções de Pagamento
                                </div>
                                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-6 space-y-4">
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Transfira o valor total via **Multicaixa Express** ou **ATM** para o IBAN abaixo:
                                    </p>
                                    <div className="bg-white border border-orange-200 rounded-xl p-3 flex items-center justify-between group">
                                        <code className="text-orange-900 font-mono text-sm break-all font-bold">AO06.0040.0000.1234.5678.9012.3</code>
                                        <button onClick={copyIban} className="p-2 text-orange-400 hover:text-orange-600 transition-colors" title="Copiar IBAN">
                                            <Copy size={18} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <div className="text-slate-400 mb-1">Banco</div>
                                            <div className="font-bold text-slate-800">BANCO SOL / BFA</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-400 mb-1">Titular</div>
                                            <div className="font-bold text-slate-800 uppercase text-[10px]">THRONUS - TECNOLOGIA LTDA</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                <Clock className="text-blue-600 shrink-0" size={20} />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Após clicar em "Confirmar Pedido", o Super Admin irá verificar o pagamento no extrato e libertar o seu saldo em até **24 horas úteis**.
                                </p>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => setIsBuyModalOpen(false)}
                                    className="flex-1 py-4 text-slate-500 font-bold hover:text-slate-700 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmPurchase}
                                    disabled={isSubmitting}
                                    className="flex-[2] bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 shadow-xl shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                                >
                                    {isSubmitting ? 'Processando...' : 'Confirmar Pedido'}
                                    {!isSubmitting && <ChevronRight size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
