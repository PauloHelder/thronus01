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

        initOneSignal();
    }, []);

    // Sync external user ID when user logs in
    useEffect(() => {
        if (user?.id) {
            OneSignal.login(user.id);
            console.log('OneSignal: Usuário identificado:', user.id);
        } else {
            OneSignal.logout();
        }
    }, [user?.id]);

    return null; // Este componente não renderiza nada visualmente por padrão
};

export default OneSignalSetup;
