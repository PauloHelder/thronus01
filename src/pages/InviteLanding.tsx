import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building, User, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Mail } from 'lucide-react';

const InviteLanding: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false); // Only loading when submitting
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState('');
    const [inviteData, setInviteData] = useState<any>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        validateToken();
    }, [token]);

    const validateToken = async () => {
        if (!token) {
            setError('Link de convite inválido ou ausente (Token não encontrado).');
            setVerifying(false);
            return;
        }

        // Basic UUID validation to prevent RPC errors
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(token)) {
            setError('Link de convite inválido (Formato de token incorreto).');
            setVerifying(false);
            return;
        }

        try {
            console.log('Validating token:', token);
            // Validate via RPC v2
            const { data, error } = await supabase.rpc('validate_invite_token_v2', { p_token: token });

            if (error) {
                console.error('RPC Error:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.warn('No data returned for token');
                setError('Convite não encontrado ou expirado.');
                setVerifying(false);
                return;
            }

            const info = data[0];
            if (!info.is_valid) {
                setError('Convite inválido ou expirado.');
            } else {
                setInviteData(info);
                // Pre-fill name if available
                if (info.member_name) {
                    setFormData(prev => ({ ...prev, fullName: info.member_name }));
                }
            }
        } catch (err: any) {
            console.error('Exception in validateToken:', err);
            setError(`Erro ao validar convite: ${err.message || JSON.stringify(err)}`);
        } finally {
            setVerifying(false);
        }
    };

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não conferem');
            return;
        }

        setLoading(true);
        try {
            // 1. SignUp Authentication
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: inviteData.invite_email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Falha ao criar usuário (sem dados retornados)");

            // 2. Accept Invite (Link to Church)
            const { error: rpcError } = await supabase.rpc('accept_invite', {
                p_token: token,
                p_user_id: authData.user.id,
                p_full_name: formData.fullName,
                p_phone: formData.phone
            });

            if (rpcError) throw rpcError;

            // Success
            alert('Conta criada com sucesso! Você será redirecionado para o login.');
            navigate('/login');

        } catch (err: any) {
            console.error(err);
            setError('Erro ao aceitar convite: ' + (err.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-orange-500" size={48} />
            </div>
        );
    }

    if (error && !inviteData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Erro no Convite</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button onClick={() => navigate('/login')} className="bg-gray-100 px-4 py-2 rounded-lg text-slate-700 font-medium">
                        Ir para Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-lg border border-gray-100">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                        <Building className="text-orange-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Convite para {inviteData.church_name}</h1>
                    <p className="text-slate-600 mt-2">
                        Você foi convidado para participar como <span className="font-semibold text-orange-600 capitalize">{inviteData.invite_role === 'member' ? 'Membro' : inviteData.invite_role === 'leader' ? 'Líder' : 'Administrador'}</span>
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 text-sm text-slate-600">
                        <Mail size={14} />
                        {inviteData.invite_email}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleAccept} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="Seu nome"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefone (Whatsapp)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="+244 9xx xxx xxx"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="Senha"
                                    minLength={6}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmação</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="Repita"
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Criar Minha Conta'}
                    </button>

                    <p className="text-center text-sm text-slate-500">
                        Ao criar conta você concorda com os Termos de Uso
                    </p>
                </form>
            </div>
        </div>
    );
};

export default InviteLanding;
