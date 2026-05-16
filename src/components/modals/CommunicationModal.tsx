import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PushService } from '../../services/PushService';
import { X, Send, Users, MessageSquare, AlertCircle, Loader2, Activity, Bell, Smartphone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useWhatsapp } from '../../hooks/useWhatsapp';

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
  const { user, hasRole, hasPermission } = useAuth();
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<'whatsapp'>('whatsapp');
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { isConnected: whatsappConnected, sendMessages: sendWhatsapp } = useWhatsapp();

  // Filtragem de destinatários
  const validSmsRecipients = recipients.filter(r => r.phone && r.phone.length > 5);
  const validPushRecipients = recipients.filter(r => r.id); // Requer ID para Push individual

  useEffect(() => {
    if (isOpen) {
      if (user?.churchId) {
        fetchBalance();
      }
      
      // Predefinir nome da igreja no início da mensagem
      const prefix = `*${user?.churchName}*\n\n`;
      if (!message || message === defaultMessage) {
        setMessage(prefix + (defaultMessage || ''));
      }

      // Inicializar todos como selecionados
      const allValidPhones = validSmsRecipients.map(r => r.phone);
      setSelectedIds(allValidPhones);
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

    let targetRecipients: Recipient[];
    if (channel === 'push') {
        targetRecipients = validPushRecipients.filter(r => selectedIds.includes(r.phone));
    } else {
        targetRecipients = validSmsRecipients.filter(r => selectedIds.includes(r.phone));
    }

    if (targetRecipients.length === 0) {
      toast.error('Selecione pelo menos um destinatário.');
      return;
    }

    if (channel === 'sms' && balance !== null && balance < targetRecipients.length) {
      toast.error('Saldo de SMS insuficiente.');
      return;
    }

    setSending(true);
    try {
      if (channel === 'whatsapp') {
        if (!whatsappConnected) {
            toast.error('O WhatsApp não está configurado ou ativo.');
            setSending(false);
            return;
        }
        const phones = targetRecipients.map(r => {
          let cleanPhone = r.phone.replace(/\D/g, '');
          if (!cleanPhone.startsWith('244')) {
            cleanPhone = '244' + cleanPhone;
          }
          return cleanPhone;
        });
        const result = await sendWhatsapp(phones, message, contextType, contextId);
        if (result.success) {
            toast.success(`${result.deliveredCount} WhatsApps enviados com sucesso!`);
        } else {
            toast.error('Falha ao enviar mensagens via WhatsApp.');
        }
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
            <div className={`w-10 h-10 ${channel === 'push' ? 'bg-blue-500 shadow-blue-500/20' : channel === 'whatsapp' ? 'bg-green-500 shadow-green-500/20' : 'bg-orange-500 shadow-orange-500/20'} rounded-full flex items-center justify-center text-white shadow-lg transition-colors`}>
              {channel === 'push' ? <Bell size={20} /> : channel === 'whatsapp' ? <MessageCircle size={20} /> : <MessageSquare size={20} />}
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
          {/* Channel Selector - Disabled since only WhatsApp is available */}
          <div className="flex p-1 bg-slate-100 rounded-xl space-x-1">
            <button
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-white text-green-600 shadow-sm"
            >
              <MessageCircle size={16} />
              WhatsApp
            </button>
          </div>

          {/* Context Info / Balance */}
            <div className={`flex items-center justify-between px-4 py-3 ${whatsappConnected ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} rounded-xl border`}>
              <div className={`flex items-center gap-2 ${whatsappConnected ? 'text-green-700' : 'text-red-700'}`}>
                <MessageCircle size={18} />
                <span className="text-sm font-medium">WhatsApp Evolution</span>
              </div>
              <span className={`${whatsappConnected ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'} font-bold uppercase text-[10px] tracking-wider px-2 py-1 bg-white rounded-md border`}>
                {whatsappConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

          {/* Recipients List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-700 font-bold">
                <Users size={16} className="text-green-500" />
                Destinatários ({selectedIds.length} selecionados)
              </label>
              <button 
                onClick={() => {
                  if (selectedIds.length === validSmsRecipients.length) {
                    setSelectedIds([]);
                  } else {
                    setSelectedIds(validSmsRecipients.map(r => r.phone));
                  }
                }}
                className="text-[10px] text-green-600 font-bold hover:underline"
              >
                {selectedIds.length === validSmsRecipients.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-200/50 scrollbar-thin">
              {validSmsRecipients.map((r, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-3 p-3 transition-colors cursor-pointer hover:bg-white rounded-lg ${selectedIds.includes(r.phone) ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => {
                    if (selectedIds.includes(r.phone)) {
                      setSelectedIds(selectedIds.filter(id => id !== r.phone));
                    } else {
                      setSelectedIds([...selectedIds, r.phone]);
                    }
                  }}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.includes(r.phone) ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 bg-white'}`}>
                    {selectedIds.includes(r.phone) && <Activity size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{r.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{r.phone}</p>
                  </div>
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
                channel === 'push' ? 'focus:ring-blue-500' : channel === 'whatsapp' ? 'focus:ring-green-500' : 'focus:ring-orange-500'
              }`}
              maxLength={channel === 'sms' ? 160 : channel === 'whatsapp' ? 4096 : 500}
            />
            <div className="flex justify-between items-center text-[10px] font-bold px-1 uppercase tracking-wider text-slate-400">
              <span>{message.length} / 4096 caracteres</span>
              <span>Evolução API</span>
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
            disabled={sending || selectedIds.length === 0}
            className="flex-1 py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] bg-green-500 hover:bg-green-600 shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Enviar {channel.toUpperCase()}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunicationModal;
