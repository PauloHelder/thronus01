import React, { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '../contexts/AuthContext';

const OneSignalSetup: React.FC = () => {
    const { user } = useAuth();
    const initialized = useRef(false);

    useEffect(() => {
        const initOneSignal = async () => {
            if (initialized.current) return;
            initialized.current = true;

            try {
                const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
                
                if (!appId) {
                    console.warn('OneSignal: VITE_ONESIGNAL_APP_ID não encontrada. Notificações desativadas.');
                    return;
                }

                await OneSignal.init({
                    appId: appId,
                    allowLocalhostAsSecureOrigin: true,
                    welcomeNotification: {
                        title: "Thronus - Bem-vindo!",
                        message: "Obrigado por ativar as notificações!"
                    },
                    promptOptions: {
                        slidedown: {
                            prompts: [
                                {
                                    type: "push",
                                    autoPrompt: true,
                                    text: {
                                        actionMessage: "Deseja receber notificações da sua igreja?",
                                        acceptButton: "Ativar",
                                        cancelButton: "Agora não"
                                    },
                                    delay: {
                                        pageViews: 1,
                                        timeDelay: 5
                                    }
                                }
                            ]
                        }
                    }
                });

                console.log('OneSignal: Inicializado com sucesso.');

            } catch (error) {
                console.error('OneSignal: Erro na inicialização:', error);
            }
        };

        const checkSubscription = async () => {
            try {
                // Check if SDK is available
                if (typeof OneSignal === 'undefined') {
                    console.warn('OneSignal SDK não carregado.');
                    return;
                }

                // Check if browser supports push
                if (!OneSignal.Notifications.isPushSupported()) {
                    return;
                }

                const permission = OneSignal.Notifications.permission;
                
                // Get User ID (Subscription ID)
                const id = OneSignal.User.PushSubscription.id;
            } catch (error) {
                // Silently fail if not initialized due to domain error
                console.debug('OneSignalTest: SDK ainda não inicializado ou erro de domínio.');
            }
        };

        initOneSignal();
    }, []);

    // Sync external user ID when user logs in
    useEffect(() => {
        const syncUser = async () => {
            if (user?.id && initialized.current) {
                try {
                    // Check if initialized and not in error state
                    const isInitialized = await OneSignal.Notifications.isPushSupported();
                    if (isInitialized) {
                        await OneSignal.login(user.id);
                        console.log('OneSignal: Usuário identificado com sucesso:', user.id);
                    }
                } catch (e) {
                    console.warn('OneSignal: Falha ao identificar usuário (provavelmente erro de domínio):', e);
                }
            } else if (!user && initialized.current) {
                try {
                    await OneSignal.logout();
                } catch (e) {}
            }
        };

        syncUser();
    }, [user?.id]);

    return null; // Este componente não renderiza nada visualmente por padrão
};

export default OneSignalSetup;
