import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, loading, isAuthenticated } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loginType, setLoginType] = useState<'email' | 'phone'>('email');

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, loading, navigate]);

    // Detect if input is email or phone
    const detectInputType = (value: string) => {
        const phonePattern = /^[\d\s\-\+\(\)]+$/;
        if (phonePattern.test(value.replace(/\s/g, ''))) {
            setLoginType('phone');
        } else {
            setLoginType('email');
        }
    };

    const handleInputChange = (value: string) => {
        setEmailOrPhone(value);
        detectInputType(value);
        setError('');
    };

    const validateInput = () => {
        if (!emailOrPhone.trim()) {
            setError('Por favor, insira seu email ou telefone');
            return false;
        }

        if (loginType === 'email') {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailOrPhone)) {
                setError('Por favor, insira um endereço de email válido');
                return false;
            }
        }

        if (!password) {
            setError('Por favor, insira sua senha');
            return false;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateInput()) {
            return;
        }

        const success = await login(emailOrPhone, password);

        if (success) {
            // Save remember me preference
            if (rememberMe) {
                localStorage.setItem('thronus_remember', emailOrPhone);
            }
            navigate('/dashboard');
        } else {
            setError('Credenciais inválidas. Verifique seu email/telefone e senha.');
        }
    };

    // Load remembered email on mount
    React.useEffect(() => {
        const remembered = localStorage.getItem('thronus_remember');
        if (remembered) {
            setEmailOrPhone(remembered);
            setRememberMe(true);
            detectInputType(remembered);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center p-4">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
                {/* Left Side - Branding */}
                <div className="hidden lg:block space-y-8 animate-in fade-in slide-in-from-left duration-700">
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                            <span className="font-bold text-white text-3xl tracking-tighter">Tr</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-3xl tracking-tight text-slate-800">Tronus</h1>
                            <p className="text-slate-500">Plataforma de Gestão de Igrejas</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-4xl font-bold text-slate-800 leading-tight">
                            Bem-vindo de volta ao seu painel de gestão
                        </h2>
                        <p className="text-lg text-slate-600">
                            Gerencie sua congregação, eventos e doações em um só lugar.
                        </p>
                    </div>

                    {/* Feature List */}
                    <div className="space-y-4">
                        {[
                            'Acompanhe a frequência e engajamento dos membros',
                            'Agende eventos e envie notificações',
                            'Monitore doações e gere relatórios',
                            'Armazenamento de dados seguro e criptografado'
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 animate-in fade-in slide-in-from-left"
                                style={{ animationDelay: `${(index + 1) * 100}ms` }}
                            >
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-slate-600">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full animate-in fade-in slide-in-from-right duration-700">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">Entrar</h2>
                            <p className="text-slate-600">Insira suas credenciais para acessar sua conta</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top">
                                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email/Phone Field */}
                            <div className="space-y-2">
                                <label htmlFor="emailOrPhone" className="block text-sm font-medium text-slate-700">
                                    Endereço de Email ou Telefone
                                </label>
                                <div className="relative">
                                    {loginType === 'email' ? (
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    ) : (
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    )}
                                    <input
                                        id="emailOrPhone"
                                        type="text"
                                        value={emailOrPhone}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        placeholder="igreja@email.com"
                                        required
                                        disabled={loading}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    {loginType === 'email' ? 'Usando login por email' : 'Usando login por telefone'}
                                </p>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                    Senha
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        disabled={loading}
                                        className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={loading}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        disabled={loading}
                                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 disabled:opacity-50"
                                    />
                                    <span className="text-sm text-slate-600">Lembrar-me</span>
                                </label>
                                <a href="/#/forgot-password" className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">
                                    Esqueceu a senha?
                                </a>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-lg shadow-orange-500/30 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    <>
                                        Entrar
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Sign Up Link */}
                        <p className="mt-8 text-center text-slate-600">
                            Não tem uma conta?{' '}
                            <a href="/#/signup" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
                                Cadastre-se gratuitamente
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom Animations */}
            <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </div>
    );
};

export default LoginPage;
