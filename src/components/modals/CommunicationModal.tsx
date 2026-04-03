import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PushService } from '../../services/PushService';
import { X, Send, Users, MessageSquare, AlertCircle, Loader2, Activity, Bell, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface Recipient {
  name: string;
  phone: string;
  id?: string; // ID do membro para o OneSignal External ID
}

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Recipient[];
  contextType: 'discipleship' | 'department' | 'service' | 'teaching' | 'event' | 'finance';
  contextId: string;
  defaultMessage?: string;
  onSuccess?: () => void;
}

const CommunicationModal: React.FC<CommunicationModalProps> = ({
  isOpen,
  onClose,
  recipients,
  contextType,
  contextId,
  defaultMessage = '',
  onSuccess
}) => {
  const { user } = useAuth();
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<'sms' | 'push'>('push'); // Push por defeito por ser grátis
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Filtragem de destinatários
  const validSmsRecipients = recipients.filter(r => r.phone && r.phone.length > 5);
  const validPushRecipients = recipients.filter(r => r.id); // Requer ID para Push individual

  useEffect(() => {
    if (isOpen && user?.churchId) {
      fetchBalance();
    }
  }, [isOpen, user]);

  const fetchBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('church_sms_balances')
        .select('available_messages')
        .eq('church_id', user?.churchId)
        .single();
      
      if (data) setBalance(data.available_messages);
    } catch (err) {
      console.error('Error fetching SMS balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('O conteúdo da mensagem não pode estar vazio.');
      return;
    }

    const targetRecipients = channel === 'sms' ? validSmsRecipients : validPushRecipients;

    if (targetRecipients.length === 0) {
      toast.error(`Nenhum destinatário selecionado para o canal ${channel.toUpperCase()}.`);
      return;
    }

    if (channel === 'sms' && balance !== null && balance < targetRecipients.length) {
      toast.error('Saldo de SMS insuficiente.');
      return;
    }

    setSending(true);
    try {
      if (channel === 'sms') {
        const { error: rpcError } = await (supabase.rpc as any)('process_sms_send', {
          p_church_id: user?.churchId,
          p_content: message,
          p_recipients: targetRecipients,
          p_context_type: contextType,
          p_context_id: contextId,
          p_count: targetRecipients.length
        });
        if (rpcError) throw rpcError;
        toast.success(`${targetRecipients.length} SMS enviadas com sucesso!`);
      } else {
        // Envio de Push
        const recipientIds = targetRecipients.map(r => r.id as string);
        const { success, error } = await PushService.sendToUsers({
          recipients: recipientIds,
          message: message,
          title: `Nova mensagem - ${contextType.charAt(0).toUpperCase() + contextType.slice(1)}`
        });

        if (!success) throw new Error(error);

        // Log manual para o histórico (já que o Push não tem RPC automatizada no DB ainda)
        await PushService.logCommunication({
          church_id: user?.churchId || '',
          sender_id: user?.id || '',
          content: message,
          recipient_count: recipientIds.length,
          recipients: targetRecipients,
          context_type: contextType,
          context_id: contextId,
          channel: 'push',
          status: 'sent'
        });

        toast.success(`${recipientIds.length} Notificações Push enviadas!`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error sending communication:', error);
      toast.error('Falha no envio: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${channel === 'push' ? 'bg-blue-500 shadow-blue-500/20' : 'bg-orange-500 shadow-orange-500/20'} rounded-full flex items-center justify-center text-white shadow-lg transition-colors`}>
              {channel === 'push' ? <Bell size={20} /> : <MessageSquare size={20} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Enviar Comunicação</h2>
              <p className="text-xs text-slate-500 font-medium">Selecione o canal de envio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Channel Selector */}
          <div className="flex p-1 bg-slate-100 rounded-xl space-x-1">
            <button
              onClick={() => setChannel('push')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                channel === 'push' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Bell size={16} />
              Push (Grátis)
            </button>
            <button
              onClick={() => setChannel('sms')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                channel === 'sms' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Smartphone size={16} />
              SMS (Pago)
            </button>
          </div>

          {/* Context Info / Balance */}
          {channel === 'sms' ? (
            <div className="flex items-center justify-between px-4 py-3 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-center gap-2 text-orange-700">
                <Activity size={18} />
                <span className="text-sm font-medium">Saldo de SMS</span>
              </div>
              {loadingBalance ? (
                <Loader2 className="animate-spin text-orange-400" size={16} />
              ) : (
                <span className={`font-bold ${balance && balance >= validSmsRecipients.length ? 'text-green-600' : 'text-red-500'}`}>
                  {balance ?? 0} créditos
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700">
                <Bell size={18} />
                <span className="text-sm font-medium">Notificação Push</span>
              </div>
              <span className="text-blue-600 font-bold uppercase text-[10px] tracking-wider px-2 py-1 bg-white rounded-md border border-blue-200">
                Ilimitado
              </span>
            </div>
          )}

          {/* Recipients List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-700 font-bold">
                <Users size={16} className={channel === 'push' ? 'text-blue-500' : 'text-orange-500'} />
                Destinatários ({channel === 'push' ? validPushRecipients.length : validSmsRecipients.length})
              </label>
              <span className="text-[10px] text-slate-400 font-bold">
                {channel === 'push' ? 'Com app instalado' : 'Com número válido'}
              </span>
            </div>
            <div className="max-h-24 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-200/50 scrollbar-thin">
              {(channel === 'push' ? validPushRecipients : validSmsRecipients).map((r, i) => (
                <div key={i} className="py-2 flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{r.name}</span>
                  <span className="text-slate-500">{channel === 'push' ? 'ID' : 'Tel'}: {channel === 'push' ? r.id?.slice(0, 8) : r.phone}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Conteúdo da Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva a mensagem..."
              className={`w-full h-32 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 transition-all text-sm resize-none text-slate-700 ${
                channel === 'push' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'
              }`}
              maxLength={channel === 'sms' ? 160 : 500}
            />
            <div className="flex justify-between items-center text-[10px] font-bold px-1 uppercase tracking-wider text-slate-400">
              <span>{message.length} / {channel === 'sms' ? 160 : 500} caracteres</span>
              <span>{channel === 'sms' ? `${validSmsRecipients.length} créditos` : 'Push Grátis'}</span>
            </div>
          </div>

          {/* Warnings */}
          {channel === 'sms' && balance !== null && balance < validSmsRecipients.length && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-medium">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p>Saldo insuficiente para enviar SMS. Utilize Push ou recarregue o saldo.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending || (channel === 'sms' && validSmsRecipients.length === 0) || (channel === 'push' && validPushRecipients.length === 0)}
            className={`flex-1 py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
              channel === 'push' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
            }`}
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Enviar {channel.toUpperCase()}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunicationModal;
