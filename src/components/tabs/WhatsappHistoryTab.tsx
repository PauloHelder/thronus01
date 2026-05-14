import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Search, RefreshCw, MessageCircle, AlertCircle, Check } from 'lucide-react';

interface WhatsappHistoryTabProps {
    contextType: string;
    contextId?: string;
}

const WhatsappHistoryTab: React.FC<WhatsappHistoryTabProps> = ({ contextType, contextId }) => {
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchHistory = async () => {
        if (!user?.churchId) return;
        setLoading(true);

        try {
            let query = supabase
                .from('whatsapp_message_log')
                .select(`
                    *,
                    sender:sent_by(member:member_id(name))
                `)
                .eq('church_id', user.churchId)
                .eq('context_type', contextType)
                .order('sent_at', { ascending: false });

            if (contextId) {
                query = query.eq('context_id', contextId);
            }

            const { data, error } = await query;
            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Error fetching WhatsApp history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [user?.churchId, contextType, contextId]);

    const filteredHistory = history.filter(item => 
        item.message?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar nas mensagens..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 w-64 bg-slate-50"
                        />
                    </div>
                </div>
                <button 
                    onClick={fetchHistory}
                    className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                    <RefreshCw size={16} /> Atualizar
                </button>
            </div>

            {filteredHistory.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                    <MessageCircle size={48} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="text-slate-800 font-medium text-lg">Nenhum registo encontrado</h3>
                    <p className="text-slate-500 mt-1">O histórico de mensagens WhatsApp enviadas aparecerá aqui.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredHistory.map((item) => (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-green-300 transition-colors shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Calendar size={14} />
                                    <span>{new Date(item.sent_at).toLocaleString('pt-PT')}</span>
                                    <span className="mx-2">•</span>
                                    <span>Por: <strong>{item.sender?.member?.name || 'Administrador'}</strong></span>
                                </div>
                                
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                    item.status === 'sent' ? 'bg-green-100 text-green-700' : 
                                    item.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {item.status === 'sent' ? <Check size={12} /> : <AlertCircle size={12} />}
                                    {item.status === 'sent' ? 'Enviado' : 
                                     item.status === 'partial' ? 'Envio Parcial' : 'Falha'}
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 whitespace-pre-wrap text-sm mb-3">
                                {item.message}
                            </div>
                            
                            <div className="flex justify-between items-center text-xs text-slate-500 bg-white pt-2 border-t border-slate-100">
                                <span className="font-medium text-slate-600">
                                    {item.phones?.length || 0} destinatário(s)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WhatsappHistoryTab;
