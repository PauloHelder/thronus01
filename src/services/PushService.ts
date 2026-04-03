import { supabase } from '../lib/supabase';

interface PushPayload {
  recipients: string[]; // ids dos membros (External User IDs no OneSignal)
  message: string;
  title?: string;
  data?: any;
  send_after?: string; // Formato OneSignal: "2025-04-03 14:00:00 GMT-0100"
}

export const PushService = {
  /**
   * Envia uma notificação push para usuários específicos da igreja.
   */
  async sendToUsers({ recipients, message, title = 'Thronus', data = {}, send_after }: PushPayload) {
    try {
      // 1. Chamar a Edge Function segura no Supabase
      const { data: functionResult, error: functionError } = await (supabase.functions as any).invoke('send-push', {
        body: {
          recipients,
          message,
          title,
          data,
          send_after
        }
      });

      if (functionError) throw functionError;
      if (functionResult?.success === false) throw new Error(functionResult.error);

      return { success: true, result: functionResult };
    } catch (error: any) {
      console.error('PushService Error calling Edge Function:', error);
      return { success: false, error: error.message || 'Erro ao contactar serviço de notificações.' };
    }
  },

  /**
   * Registra o log da comunicação no banco de dados.
   */
  async logCommunication(payload: {
    church_id: string;
    sender_id: string;
    content: string;
    recipient_count: number;
    recipients: any[];
    context_type: string;
    context_id: string;
    channel: 'sms' | 'push';
    status: 'sent' | 'failed';
  }) {
    const { error } = await (supabase.from('sms_history') as any).insert({
      church_id: payload.church_id,
      sender_id: payload.sender_id,
      content: payload.content,
      recipient_count: payload.recipient_count,
      recipients: payload.recipients,
      context_type: payload.context_type,
      context_id: payload.context_id,
      channel: payload.channel,
      status: payload.status
    });

    if (error) console.error('Error logging communication:', error);
  }
};
