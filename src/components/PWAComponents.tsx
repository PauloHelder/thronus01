import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, X } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Mostrar banner brevemente ao reconectar
            setShowBanner(true);
            setTimeout(() => setShowBanner(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showBanner) return null;

    return (
        <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 
                px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm
                flex items-center gap-3 min-w-[280px] max-w-[400px]
                animate-in slide-in-from-bottom-4 duration-300
                ${isOnline
                    ? 'bg-green-50/95 border-green-200 text-green-800'
                    : 'bg-amber-50/95 border-amber-200 text-amber-800'
                }`}
        >
            {isOnline ? (
                <>
                    <Wifi size={20} className="text-green-600 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">Conexão restaurada</p>
                        <p className="text-xs opacity-75">Os dados serão sincronizados automaticamente.</p>
                    </div>
                </>
            ) : (
                <>
                    <WifiOff size={20} className="text-amber-600 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">Você está offline</p>
                        <p className="text-xs opacity-75">Mostrando dados salvos localmente.</p>
                    </div>
                </>
            )}
            <button
                onClick={() => setShowBanner(false)}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors shrink-0"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export const ReloadPrompt: React.FC = () => {
    const [needRefresh, setNeedRefresh] = useState(false);

    useEffect(() => {
        // Listen for service worker update events
        const handleSwUpdate = () => setNeedRefresh(true);

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                // Reload when new SW takes over
            });

            // Check for updates periodically
            const checkUpdate = async () => {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration?.waiting) {
                    setNeedRefresh(true);
                }
            };

            // Check on focus
            window.addEventListener('focus', checkUpdate);
            return () => window.removeEventListener('focus', checkUpdate);
        }
    }, []);

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 max-w-[350px] animate-in slide-in-from-bottom-4 duration-300">
            <RefreshCw size={20} className="text-orange-400 shrink-0" />
            <div className="flex-1">
                <p className="text-sm font-medium">Nova versão disponível</p>
                <p className="text-xs text-slate-400">Atualize para ter as últimas melhorias.</p>
            </div>
            <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
            >
                Atualizar
            </button>
            <button
                onClick={() => setNeedRefresh(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export const IOSInstallPrompt: React.FC = () => {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Detecção de iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        
        // Verificação se já está em modo standalone (instalado)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        // Verificação se o usuário já fechou o prompt antes
        const hasDismissed = localStorage.getItem('thronus_ios_prompt_dismissed');

        if (isIOS && !isStandalone && !hasDismissed) {
            // Mostrar após um pequeno delay para não ser imediato
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('thronus_ios_prompt_dismissed', 'true');
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 relative overflow-hidden">
                {/* Indicador visual de 'balão' apontando para baixo (onde fica o botão compartilhar no iPhone) */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45" />
                
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg shadow-orange-500/20">
                        Tr
                    </div>
                    <div className="flex-1 pr-6">
                        <h3 className="font-bold text-slate-800 text-base mb-1">Instalar Thronus no iPhone</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Para uma experiência melhor, adicione este app à sua tela de início:
                        </p>
                        
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-700 bg-gray-50 p-2 rounded-lg">
                                <div className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-md">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M9 11H5V21H19V11H15" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <p>1. Toque no botão <strong>Compartilhar</strong></p>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm text-slate-700 bg-gray-50 p-2 rounded-lg">
                                <div className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-md text-slate-700">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                </div>
                                <p>2. Toque em <strong>Adicionar à Tela de Início</strong></p>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Zap as ZapIcon } from 'lucide-react';

export const PWAInstallSheet: React.FC = () => {
    const { showInstallBtn, handleInstallClick } = usePWAInstall();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (showInstallBtn) {
            // Verificar se o usuário já fechou este prompt específico hoje
            const lastDismissed = localStorage.getItem('thronus_install_sheet_dismissed');
            const now = new Date().getTime();
            
            // Mostrar se nunca fechou ou se fechou há mais de 24 horas
            if (!lastDismissed || now - parseInt(lastDismissed) > 24 * 60 * 60 * 1000) {
                const timer = setTimeout(() => setIsVisible(true), 2000);
                return () => clearTimeout(timer);
            }
        } else {
            setIsVisible(false);
        }
    }, [showInstallBtn]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('thronus_install_sheet_dismissed', new Date().getTime().toString());
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-[60] p-4 md:p-6 lg:p-8 flex justify-center animate-in slide-in-from-bottom duration-500">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-lg flex items-center gap-4 md:gap-6 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                    <ZapIcon size={32} className="text-white fill-white/20" />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg md:text-xl mb-1 truncate">Instalar Thronus App</h3>
                    <p className="text-slate-400 text-sm md:text-base leading-tight">
                        Acesse mais rápido e use offline. Prático e seguro.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={handleInstallClick}
                        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm md:text-base transition-all hover:scale-105 shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2"
                    >
                        <Download size={18} />
                        Instalar
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm transition-colors md:hidden"
                    >
                        Agora não
                    </button>
                </div>

                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 text-slate-500 hover:text-white transition-colors hidden md:block"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
