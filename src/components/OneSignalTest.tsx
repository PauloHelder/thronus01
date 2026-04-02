import React, { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { Bell, BellOff, CheckCircle2, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const OneSignalTest: React.FC = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [pushId, setPushId] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        const checkSubscription = async () => {
            try {
                // Check if browser supports push
                if (!OneSignal.Notifications.isPushSupported()) {
                    setIsSupported(false);
                    return;
                }

                const permission = OneSignal.Notifications.permission;
                setIsSubscribed(permission);
                
                // Get User ID (Subscription ID)
                const id = OneSignal.User.PushSubscription.id;
                setPushId(id || null);
            } catch (error) {
                console.error('Erro ao verificar subscrição OneSignal:', error);
            }
        };

        checkSubscription();
        
        // Listen for changes
        const handleChangeListener = () => checkSubscription();
        OneSignal.Notifications.addEventListener("permissionChange", handleChangeListener);
        
        return () => {
            OneSignal.Notifications.removeEventListener("permissionChange", handleChangeListener);
        };
    }, []);

    const handleRequestPermission = async () => {
        try {
            await OneSignal.Notifications.requestPermission();
            toast.success('Permissão solicitada com sucesso!');
        } catch (error) {
            toast.error('Erro ao solicitar permissão.');
            console.error(error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.info('ID da Subscrição copiado!');
    };

    if (!isSupported) return null;

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-500" />
                Notificações Push
            </h3>

            <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSubscribed ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                            {isSubscribed ? <Bell size={20} /> : <BellOff size={20} />}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">
                                {isSubscribed ? 'Subscrição Ativa' : 'Não Subscrito'}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
                                Estado do OneSignal
                            </p>
                        </div>
                    </div>
                    
                    {!isSubscribed && (
                        <button 
                            onClick={handleRequestPermission}
                            className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold transition-all shadow-md shadow-orange-500/20"
                        >
                            Ativar
                        </button>
                    )}
                </div>

                {isSubscribed && pushId && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase px-1">
                            <span>ID de Subscrição</span>
                            <button 
                                onClick={() => copyToClipboard(pushId)}
                                className="hover:text-orange-500 flex items-center gap-1 transition-colors"
                            >
                                <Copy size={12} /> Copiar
                            </button>
                        </div>
                        <div className="bg-slate-900 text-slate-300 p-2.5 rounded-lg font-mono text-[10px] break-all border border-slate-800 shadow-inner">
                            {pushId}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                            Use este ID no painel do <span className="font-bold">OneSignal</span> para enviar uma notificação de teste diretamente para este dispositivo.
                        </p>
                    </div>
                )}

                <a 
                    href="https://onesignal.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    Painel OneSignal <ExternalLink size={12} />
                </a>
            </div>
        </div>
    );
};

export default OneSignalTest;
