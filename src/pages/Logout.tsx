import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Loader2 } from 'lucide-react';

const Logout: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = React.useState(true);

    useEffect(() => {
        const performLogout = async () => {
            // Simular um pequeno delay para melhor UX
            await new Promise(resolve => setTimeout(resolve, 1000));

            logout();

            // Redirecionar para a landing page
            navigate('/');
        };

        performLogout();
    }, [logout, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    {isLoggingOut ? (
                        <Loader2 className="text-orange-500 animate-spin" size={40} />
                    ) : (
                        <LogOut className="text-orange-500" size={40} />
                    )}
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-3">
                    {isLoggingOut ? 'Encerrando Sessão...' : 'Sessão Encerrada'}
                </h1>

                <p className="text-slate-600 mb-6">
                    {isLoggingOut
                        ? 'Por favor, aguarde enquanto encerramos sua sessão com segurança.'
                        : 'Você foi desconectado com sucesso. Até breve!'}
                </p>

                {!isLoggingOut && (
                    <div className="space-y-3">
                        <a
                            href="/#/login"
                            className="block w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Fazer Login Novamente
                        </a>
                        <a
                            href="/"
                            className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            Voltar à Página Inicial
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Logout;
