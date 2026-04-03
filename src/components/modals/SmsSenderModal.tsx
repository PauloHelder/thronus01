import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Send, Users, MessageSquare, AlertCircle, Loader2, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface Recipient {
  name: string;
  phone: string;
}

interface SmsSenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Recipient[];
  contextType: 'discipleship' | 'department' | 'service' | 'teaching' | 'event' | 'finance';
  contextId: string;
  defaultMessage?: string;
  onSuccess?: () => void;
}

const SmsSenderModal: React.FC<SmsSenderModalProps> = ({
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
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Filter out recipients without phone numbers
  const validRecipients = recipients.filter(r => r.phone && r.phone.length > 5);

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

    if (validRecipients.length === 0) {
      toast.error('Nenhum destinatário com número de telefone válido.');
      return;
    }

    if (balance !== null && balance < validRecipients.length) {
      toast.error('Saldo de SMS insuficiente para enviar para todos os destinatários.');
      return;
    }

    setSending(true);
    try {
      // 1. Chamar a Edge Function para o envio real via TelcoSMS
      const { data, error: functionError } = await (supabase.functions as any).invoke('send-sms', {
        body: {
          phones: validRecipients.map(r => r.phone),
          message: message,
          context_type: contextType,
          context_id: contextId
        }
      });

      if (functionError) throw functionError;
      if (data?.error) throw new Error(data.error);

      const deliveredCount = data?.delivered_count || validRecipients.length;
      toast.success(`${deliveredCount} SMS enviadas com sucesso!`);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error sending SMS via Edge Function:', error);
      toast.error('Falha ao enviar SMS: ' + (error.message || 'Erro de rede ou servidor'));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Enviar SMS</h2>
              <p className="text-xs text-orange-600 font-medium">Comunicação Contextual</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Balance Info */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-500" size={18} />
              <span className="text-sm font-medium text-slate-600">Saldo Disponível</span>
            </div>
            {loadingBalance ? (
              <Loader2 className="animate-spin text-slate-400" size={16} />
            ) : (
              <span className={`font-bold ${balance && balance >= validRecipients.length ? 'text-green-600' : 'text-red-500'}`}>
                {balance ?? 0} SMS
              </span>
            )}
          </div>

          {/* Recipients Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-700 font-bold">
                <Users size={16} className="text-orange-500" />
                Destinatários ({validRecipients.length})
              </label>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Apenas com telefone
              </span>
            </div>
            <div className="max-h-24 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-200/50 scrollbar-thin scrollbar-thumb-slate-200">
              {validRecipients.length > 0 ? (
                validRecipients.map((r, i) => (
                  <div key={i} className="py-2 flex justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate mr-4">{r.name}</span>
                    <span className="font-mono text-slate-500 shrink-0">{r.phone}</span>
                  </div>
                ))
              ) : (
                <div className="py-2 text-center text-slate-400 italic text-xs">
                  Nenhum telefone válido encontrado.
                </div>
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Conteúdo da Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva a sua mensagem aqui..."
              className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm resize-none text-slate-700 placeholder:text-slate-400"
              maxLength={160}
            />
            <div className="flex justify-between items-center text-[10px] font-bold px-1 uppercase tracking-wider">
              <span className={message.length > 140 ? 'text-orange-500' : 'text-slate-400'}>
                {message.length} / 160 caracteres
              </span>
              <span className="text-slate-400">
                1 SMS ({validRecipients.length} créditos)
              </span>
            </div>
          </div>

          {/* Warnings */}
          {balance !== null && balance < validRecipients.length && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-medium">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p>Saldo insuficiente para enviar para {validRecipients.length} pessoas. Por favor, carregue o seu saldo na Loja de SMS.</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending || validRecipients.length === 0 || (balance !== null && balance < validRecipients.length)}
            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
          >
            {sending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Send size={18} />
                Enviar Mensagens
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmsSenderModal;
