import React, { useState, useEffect } from 'react';
import { X, Send, AlertTriangle, MessageCircle, AlertCircle, Phone, Info } from 'lucide-react';
import { useWhatsapp } from '../../hooks/useWhatsapp';
import { toast } from 'sonner';

interface WhatsappSenderModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipients: { name: string; phone: string }[];
    contextType?: string;
    contextId?: string;
    onSuccess?: () => void;
}

const WhatsappSenderModal: React.FC<WhatsappSenderModalProps> = ({
    isOpen,
    onClose,
    recipients,
    contextType = 'manual',
    contextId = '',
    onSuccess
}) => {
    const { isConnected, sendMessages, fetchConfig, loading: configLoading } = useWhatsapp();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sendResults, setSendResults] = useState<{ success: boolean; delivered: number; failed: number } | null>(null);

    // Filter recipients to only those with valid phones
    const validRecipients = recipients.filter(r => r.phone && r.phone.trim().length >= 9);

    useEffect(() => {
        if (isOpen) {
            setSendResults(null);
            setMessage('');
            fetchConfig();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!message.trim()) {
            toast.error('A mensagem não pode estar vazia');
            return;
        }

        if (validRecipients.length === 0) {
            toast.error('Nenhum destinatário com número de telefone válido');
            return;
        }

        setSending(true);
        try {
            const phones = validRecipients.map(r => r.phone);
            const result = await sendMessages(phones, message, contextType, contextId);
            
            setSendResults({
                success: result.success,
                delivered: result.deliveredCount,
                failed: result.failedCount
            });

            if (result.success) {
                toast.success('Envio de mensagens concluído!');
                if (onSuccess) onSuccess();
            } else {
                toast.error('Falha ao enviar mensagens. Verifique os registos.');
            }
        } catch (error: any) {
            toast.error(`Erro ao enviar: ${error.message}`);
        } finally {
            setSending(false);
        }
    };

    if (configLoading) {
        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-green-500 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <MessageCircle size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Enviar WhatsApp</h2>
                            <p className="text-green-100 text-sm">Notificação direta pelo WhatsApp</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        disabled={sending}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {!isConnected ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 mb-6">
                            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-red-800">WhatsApp Não Conectado</h3>
                                <p className="text-sm mt-1">A integração com o WhatsApp não está ativa ou configurada. Vá para as Configurações &gt; WhatsApp para configurar sua instância.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {sendResults ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Envio Concluído!</h3>
                                    <div className="flex justify-center gap-4 mt-6">
                                        <div className="bg-green-50 px-4 py-3 rounded-lg border border-green-100">
                                            <p className="text-sm text-green-600 font-medium">Entregues</p>
                                            <p className="text-2xl font-bold text-green-700">{sendResults.delivered}</p>
                                        </div>
                                        {sendResults.failed > 0 && (
                                            <div className="bg-red-50 px-4 py-3 rounded-lg border border-red-100">
                                                <p className="text-sm text-red-600 font-medium">Falharam</p>
                                                <p className="text-2xl font-bold text-red-700">{sendResults.failed}</p>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="mt-8 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                                    >
                                        Fechar Janela
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex gap-4">
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-green-800 flex items-center gap-2 mb-1">
                                                <Phone size={16} /> Destinatários Válidos
                                            </h4>
                                            <p className="text-2xl font-bold text-green-600">
                                                {validRecipients.length} <span className="text-sm font-normal text-green-600/70">de {recipients.length}</span>
                                            </p>
                                        </div>
                                        {validRecipients.length < recipients.length && (
                                            <div className="flex-1 bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                                                <p className="text-xs text-yellow-800 font-medium flex items-start gap-1">
                                                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                                    {recipients.length - validRecipients.length} contatos não possuem número de telefone válido cadastrado e serão ignorados.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Mensagem ({message.length}/4096 caracteres)
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={6}
                                            maxLength={4096}
                                            placeholder="Digite sua mensagem aqui..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-all"
                                        />
                                        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                            <Info size={14} /> As mensagens serão enviadas pela sua instância Evolution API.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!sendResults && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                            disabled={sending}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={sending || validRecipients.length === 0 || !message.trim() || !isConnected}
                            className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            {sending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Enviar ({validRecipients.length})
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsappSenderModal;
