import React, { useState } from 'react';
import { useWhatsapp } from '../../hooks/useWhatsapp';
import { Save, Activity, Link2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

const WhatsappSettingsTab: React.FC = () => {
    const { config, saveConfig, testConnection, loading } = useWhatsapp();
    
    const [apiUrl, setApiUrl] = useState(config?.api_url || '');
    const [apiKey, setApiKey] = useState(config?.api_key || '');
    const [instanceName, setInstanceName] = useState(config?.instance_name || '');
    const [isActive, setIsActive] = useState(config?.is_active ?? true);
    
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);

    // Update state when config loads
    React.useEffect(() => {
        if (config) {
            setApiUrl(config.api_url);
            setApiKey(config.api_key);
            setInstanceName(config.instance_name);
            setIsActive(config.is_active);
        }
    }, [config]);

    const handleTest = async () => {
        if (!apiUrl || !instanceName || !apiKey) {
            toast.error('Preencha todos os campos para testar.');
            return;
        }

        setTesting(true);
        const result = await testConnection(apiUrl, instanceName, apiKey);
        setTesting(false);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const handleSave = async () => {
        if (!apiUrl || !instanceName || !apiKey) {
            toast.error('Preencha todos os campos.');
            return;
        }

        setSaving(true);
        const success = await saveConfig({
            api_url: apiUrl,
            api_key: apiKey,
            instance_name: instanceName,
            is_active: isActive
        });
        setSaving(false);

        if (success) {
            toast.success('Configuração guardada com sucesso!');
        } else {
            toast.error('Erro ao guardar configuração.');
        }
    };

    if (loading && !config) {
        return (
            <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
                <Activity className="mx-auto text-green-500 animate-spin mb-4" size={32} />
                <p className="text-slate-600 font-medium">Carregando configurações do WhatsApp...</p>
                <p className="text-slate-400 text-sm mt-1">Isso pode levar alguns segundos se estivermos verificando a conexão.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <MessageSquareIcon size={20} className="text-green-500" />
                            Integração WhatsApp (Evolution API)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Configure a ligação à sua instância da Evolution API para envio de notificações.</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">Status:</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                        <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-slate-500'}`}>
                            {isActive ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            URL da API (Evolution API)
                        </label>
                        <input
                            type="text"
                            placeholder="https://sua-api.com"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Ex: https://api.whatsapp.minhaigreja.com</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nome da Instância
                        </label>
                        <input
                            type="text"
                            placeholder="igreja-principal"
                            value={instanceName}
                            onChange={(e) => setInstanceName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Global API Key
                        </label>
                        <input
                            type="password"
                            placeholder="Sua chave de API"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                    <div className="flex items-start gap-3">
                        <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                        <div className="text-sm text-blue-800">
                            <p className="font-bold mb-1">Configuração na Evolution API</p>
                            <p className="mb-2">Para que o Thronus receba atualizações de status, configure o Webhook na sua instância da Evolution API com o seguinte link:</p>
                            <div className="bg-white/50 p-2 rounded font-mono text-xs break-all border border-blue-100 flex justify-between items-center group">
                                <span>{`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`}</span>
                                <button 
                                    onClick={() => {
                                        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;
                                        navigator.clipboard.writeText(url);
                                        toast.success('Link copiado!');
                                    }}
                                    className="text-blue-600 hover:text-blue-800 font-bold ml-2"
                                >
                                    Copiar
                                </button>
                            </div>
                            <p className="mt-2 text-xs opacity-80">* Este link é exclusivo para o seu projecto Thronus.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex items-start gap-3">
                    <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-slate-600">
                        <p className="font-medium text-slate-700 mb-1">Passos para integração:</p>
                        <ol className="list-decimal pl-4 space-y-1">
                            <li>Tenha uma instância da <strong>Evolution API</strong> instalada.</li>
                            <li>Crie uma instância (ex: <code>igreja-sede</code>).</li>
                            <li>Copie a <strong>URL da API</strong> e a <strong>Global API Key</strong> para os campos acima.</li>
                            <li>Clique em <strong>Testar Ligação</strong> para validar.</li>
                            <li>Leia o QR Code no seu telemóvel se solicitado.</li>
                        </ol>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={handleTest}
                        disabled={testing || !apiUrl || !instanceName || !apiKey}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        {testing ? <Activity size={18} className="animate-pulse" /> : <Link2 size={18} />}
                        Testar Ligação
                    </button>
                    
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        Guardar Configuração
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper component since we don't import MessageSquare everywhere in this file to keep it clean
const MessageSquareIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

export default WhatsappSettingsTab;
