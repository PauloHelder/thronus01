import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export interface WhatsappConfig {
    id?: string;
    api_url: string;
    api_key: string;
    instance_name: string;
    is_active: boolean;
    connected_at?: string;
}

export function useWhatsapp() {
    const { user } = useAuth();
    const [config, setConfig] = useState<WhatsappConfig | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.churchId) {
            fetchConfig();
        }
    }, [user?.churchId]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('church_whatsapp_config')
                .select('*')
                .eq('church_id', user?.churchId)
                .single();

            if (data) {
                setConfig(data);
                
                // Se estiver marcado como ativo, verificar se realmente está conectado
                if (data.is_active) {
                    const result = await testConnection(data.api_url, data.instance_name, data.api_key);
                    setIsConnected(result.success);
                    
                    // Se houver discrepância, atualizar is_active no banco
                    if (data.is_active !== result.success) {
                        await supabase
                            .from('church_whatsapp_config')
                            .update({ is_active: result.success })
                            .eq('id', data.id);
                    }
                } else {
                    setIsConnected(false);
                }
            } else {
                setConfig(null);
                setIsConnected(false);
            }
        } catch (error) {
            console.error('Error fetching WhatsApp config:', error);
            setConfig(null);
            setIsConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async (newConfig: Omit<WhatsappConfig, 'id'>) => {
        if (!user?.churchId) return false;
        
        try {
            if (config?.id) {
                // Update
                const { error } = await supabase
                    .from('church_whatsapp_config')
                    .update(newConfig)
                    .eq('id', config.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('church_whatsapp_config')
                    .insert({
                        ...newConfig,
                        church_id: user.churchId
                    });
                if (error) throw error;
            }
            
            await fetchConfig();
            return true;
        } catch (error) {
            console.error('Error saving WhatsApp config:', error);
            return false;
        }
    };

    const testConnection = async (apiUrl: string, instanceName: string, apiKey: string) => {
        try {
            const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
            const endpoint = `${baseUrl}/instance/connectionState/${instanceName}`;
            
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'apikey': apiKey
                }
            });
            
            if (!response.ok) {
                return { success: false, message: 'Não foi possível conectar à API. Verifique a URL e a Chave.' };
            }
            
            const data = await response.json();
            
            // Evolution API returns connection state in instance.state
            const state = data?.instance?.state || data?.state;
            
            if (state === 'open') {
                return { success: true, message: 'Conectado com sucesso!' };
            } else {
                return { success: false, message: `Instância não está conectada. Estado atual: ${state || 'Desconhecido'}` };
            }
        } catch (error: any) {
            return { success: false, message: `Erro de conexão: ${error.message}` };
        }
    };

    const sendMessages = async (phones: string[], message: string, contextType: string, contextId: string) => {
        if (!config || !isConnected) {
            throw new Error("WhatsApp não está conectado.");
        }

        const results = [];
        let deliveredCount = 0;
        let failedCount = 0;

        try {
            // 1. Enviar mensagens uma a uma (Direct API Call)
            const baseUrl = config.api_url.endsWith('/') ? config.api_url.slice(0, -1) : config.api_url;
            const endpoint = `${baseUrl}/message/sendText/${config.instance_name}`;

            for (const phone of phones) {
                try {
                    // Limpar o número (manter apenas dígitos)
                    const cleanPhone = phone.replace(/\D/g, '');
                    const whatsappId = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
                    
                    const res = await fetch(endpoint, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "apikey": config.api_key
                        },
                        body: JSON.stringify({
                            number: whatsappId,
                            text: message,
                            delay: 1200,
                            linkPreview: false
                        })
                    });
                    
                    const data = await res.json();
                    const success = res.ok;
                    
                    if (success) {
                        console.log(`Mensagem enviada com sucesso para ${phone}:`, data);
                        deliveredCount++;
                    } else {
                        console.error(`Erro da Evolution API para ${phone}:`, data);
                        // Tentar extrair a mensagem de erro de vários locais possíveis
                        const errorMsg = data.message || data.error || data.status || 'Erro desconhecido na API';
                        toast.error(`Erro na API (${phone}): ${errorMsg}`);
                        failedCount++;
                    }
                    
                    results.push({ phone, success, response: data });
                } catch (e: any) {
                    console.error(`Excepção de rede ao enviar para ${phone}:`, e);
                    toast.error(`Erro de Rede: ${e.message}`);
                    failedCount++;
                    results.push({ phone, success: false, error: e.message });
                }
            }

            // 2. Gravar Log no Supabase
            await supabase.from('whatsapp_message_log').insert({
                church_id: user?.churchId,
                sent_by: user?.id,
                message: message,
                phones: phones,
                context_type: contextType,
                context_id: contextId,
                status: deliveredCount === phones.length ? 'sent' : (deliveredCount > 0 ? 'partial' : 'failed')
            });

            return {
                success: deliveredCount > 0,
                deliveredCount,
                failedCount
            };
        } catch (error: any) {
            console.error('Error sending WhatsApp messages:', error);
            throw error;
        }
    };

    return {
        config,
        isConnected,
        loading,
        fetchConfig,
        saveConfig,
        testConnection,
        sendMessages
    };
}
