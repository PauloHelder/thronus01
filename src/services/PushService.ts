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
  async sendToUsers({ recipients, message, title = 'Thronus', data = {} }: PushPayload) {
    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    const apiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      console.warn('PushService: OneSignal App ID ou API Key não configurada.');
      return { success: false, error: 'Configuração de Push ausente.' };
    }

    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Basic ${apiKey}`,
        },
        body: JSON.stringify({
          app_id: appId,
          include_external_user_ids: recipients,
          contents: { en: message, pt: message },
          headings: { en: title, pt: title },
          data: data,
          send_after: payload.send_after, // Se for indefinido, o OneSignal envia agora
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]);
      }

      return { success: true, result };
    } catch (error: any) {
      console.error('PushService Error:', error);
      return { success: false, error: error.message };
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
    const { error } = await supabase.from('sms_history').insert({
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
