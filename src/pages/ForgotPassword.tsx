import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // Determine redirect URL
            // We use the origin (root) and rely on the app's global auth listener to detect
            // the PASSWORD_RECOVERY event and redirect to /reset-password.
            // This prevents issues with double hashes in HashRouter.
            const redirectUrl = window.location.origin;

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: any) {
            console.error('Reset password error:', err);
            setError(err.message || 'Erro ao enviar email de recuperação.');
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Recuperar Senha</h1>
                    <p className="text-slate-600">
                        Digite seu email para receber um link de redefinição.
                    </p>
                </div>

                {success ? (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Email Enviado!</h3>
                        <p className="text-slate-600 mb-6">
                            Verifique sua caixa de entrada (e spam) para encontrar o link de redefinição de senha para <strong>{email}</strong>.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center text-orange-500 hover:text-orange-600 font-medium"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Voltar para o Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:scale-100"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    Enviar Link
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="text-center pt-2">
                            <Link to="/login" className="text-slate-500 hover:text-orange-500 text-sm font-medium transition-colors inline-flex items-center">
                                <ArrowLeft size={16} className="mr-1" />
                                Voltar para o login
                            </Link>
                        </div>
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

export default ForgotPassword;
