import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageSquare, Calendar, User, CheckCircle2, AlertCircle, Loader2, Bell, Smartphone } from 'lucide-react';

interface SmsHistoryTabProps {
  contextType: 'discipleship' | 'department' | 'service' | 'teaching' | 'event' | 'finance';
  contextId: string;
}

const SmsHistoryTab: React.FC<SmsHistoryTabProps> = ({ contextType, contextId }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [contextId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sms_history')
        .select('*, sender:sender_id(members(name))')
        .eq('context_type', contextType)
        .eq('context_id', contextId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching SMS history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
        <p className="text-sm text-slate-500">A carregar histórico de mensagens...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-slate-600 font-bold">Nenhuma mensagem enviada</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
          As mensagens enviadas opcionalmente neste módulo aparecerão aqui para registo e controlo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="text-orange-500" size={18} />
          Histórico de Comunicações
        </h3>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
          {history.length} {history.length === 1 ? 'Mensagem' : 'Mensagens'}
        </span>
      </div>

      <div className="grid gap-4">
        {history.map((msg) => (
          <div 
            key={msg.id} 
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                  <User size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {msg.sender?.members?.name || 'Sistema'}
                  </p>
                    {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(msg.created_at))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter ${
                  msg.status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {msg.status === 'sent' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                  {msg.status === 'sent' ? 'Enviada' : 'Falhou'}
                </span>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter ${
                  msg.channel === 'push' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {msg.channel === 'push' ? <Bell size={10} /> : <Smartphone size={10} />}
                  {msg.channel === 'push' ? 'Push' : 'SMS'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {msg.recipient_count} {msg.recipient_count === 1 ? 'Destinatário' : 'Destinatários'}
                </span>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-50 relative overflow-hidden group-hover:bg-white transition-colors duration-200">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500/20 group-hover:bg-orange-500 transition-colors"></div>
              <p className="text-sm text-slate-700 leading-relaxed italic">
                "{msg.content}"
              </p>
            </div>
            
            {msg.recipients && msg.recipients.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                {msg.recipients.slice(0, 3).map((r: any, i: number) => (
                  <span key={i} className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">
                    {r.name.split(' ')[0]}
                  </span>
                ))}
                {msg.recipients.length > 3 && (
                  <span className="text-[9px] text-slate-400 font-medium">
                    + {msg.recipients.length - 3} outros
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmsHistoryTab;
