import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState('');
    const [sessionValid, setSessionValid] = useState(false);

    useEffect(() => {
        let mounted = true;

        const setupSession = async () => {
            // 1. Check if we already have a session
            const { data: { session } } = await supabase.auth.getSession();

            if (session && mounted) {
                setSessionValid(true);
                setInitializing(false);
                return;
            }

            // 2. If no session, wait for the recovery event (implicit flow handling)
            // The handling of the hash fragment happens automatically by the Supabase client.
            // We just need to wait for the event.
        };

        setupSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth Event:", event);
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                if (mounted) {
                    setSessionValid(true);
                    setInitializing(false);
                }
            } else if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setSessionValid(false);
                    // Don't necessarily stop initializing if we are waiting for a sign-in
                }
            }
        });

        // Timeout to stop waiting if nothing happens (e.g. invalid link)
        const timeout = setTimeout(() => {
            if (mounted && initializing && !sessionValid) {
                setInitializing(false);
                // If we still don't have a session after 3 seconds, it's likely an invalid link or direct access
            }
        }, 4000);

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (!sessionValid) {
            setError('Sessão de recuperação inválida ou expirada. Solicite um novo link.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            alert('Senha atualizada com sucesso! Você será redirecionado para o Painel.');
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Update password error:', err);
            setError(err.message || 'Erro ao atualizar a senha.');
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                    <p className="text-slate-600 font-medium">Verificando link de recuperação...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-md border border-gray-100 relative z-10">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="font-bold text-white text-xl">Th</span>
                        </div>
                        <span className="font-bold text-2xl text-slate-800">Thronus</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Redefinir Senha</h1>
                    <p className="text-slate-600">
                        Digite sua nova senha abaixo.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {!sessionValid && !loading ? (
                    <div className="text-center bg-orange-50 p-6 rounded-lg border border-orange-100 mb-4">
                        <AlertCircle className="w-10 h-10 text-orange-500 mx-auto mb-2" />
                        <h3 className="font-medium text-slate-800 mb-1">Link Inválido</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Não foi possível verificar sua sessão de recuperação. O link pode ter expirado.
                        </p>
                        <a href="/#/forgot-password" className="text-orange-600 font-medium hover:underline">
                            Solicitar novo link
                        </a>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nova Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="Mínimo 6 caracteres"
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Confirmar Nova Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="Repita a senha"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !sessionValid}
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:scale-100"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    Atualizar Senha
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
            {/* Styles for animations */}
            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animate-delay-2000 {
                    animation-delay: 2s;
                }
                .animate-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};

export default ResetPassword;
