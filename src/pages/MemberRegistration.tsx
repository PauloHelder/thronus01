import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Phone, Mail, MapPin, Loader2, CheckCircle, AlertCircle, Building } from 'lucide-react';

const MemberRegistration: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [church, setChurch] = useState<any>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        birthDate: '',
        gender: '',
        address: ''
    });

    useEffect(() => {
        fetchChurchDetails();
    }, [slug]);

    const fetchChurchDetails = async () => {
        if (!slug) return;
        try {
            // Find church by slug to display details
            const { data, error } = await supabase
                .from('churches')
                .select('id, name, logo_url')
                .eq('slug', slug)
                .single();

            if (error) throw error;
            setChurch(data);
        } catch (err) {
            console.error('Error fetching church:', err);
            setError('Igreja não encontrada. Verifique o link e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            if (!slug) throw new Error('Link inválido');

            // @ts-ignore - RPC not yet in types
            const { data, error } = await supabase.rpc('public_register_member', {
                p_slug: slug,
                p_name: formData.name,
                p_phone: formData.phone || null,
                p_email: formData.email || null,
                p_birth_date: formData.birthDate || null,
                p_gender: formData.gender || null,
                p_address: formData.address || null
            });

            if (error) throw error;

            if (data && !(data as any).success) {
                throw new Error((data as any).error || 'Erro ao realizar cadastro');
            }

            setSuccess(true);
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Ocorreu um erro ao processar seu cadastro.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-orange-500" size={48} />
            </div>
        );
    }

    if (!church && error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Link Inválido</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-green-600 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Cadastro Realizado!</h2>
                    <p className="text-slate-600 mb-6">
                        Seus dados foram enviados com sucesso para a igreja <strong>{church?.name}</strong>.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-orange-600 font-medium hover:underline"
                    >
                        Voltar ao início
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-xl w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-2xl border border-gray-100">
                <div className="text-center">
                    {church?.logo_url ? (
                        <img src={church.logo_url} alt={church.name} className="mx-auto h-20 w-auto rounded-xl shadow-sm mb-4" />
                    ) : (
                        <div className="mx-auto h-20 w-20 bg-orange-100 rounded-xl flex items-center justify-center mb-4 text-orange-600">
                            <Building size={40} />
                        </div>
                    )}
                    <h2 className="text-3xl font-extrabold text-slate-900">{church?.name || 'Carregando...'}</h2>
                    <p className="mt-2 text-lg text-slate-600 font-medium">Ficha de Membro</p>
                    <p className="text-sm text-slate-500">
                        Preencha seus dados para se cadastrar
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Nome */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                                Nome Completo *
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                                    placeholder="Seu nome completo"
                                />
                            </div>
                        </div>

                        {/* Telefone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                                Telefone (WhatsApp) <span className="text-gray-400 font-normal">(Opcional)</span>
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                                    placeholder="999 999 999"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                Email (Opcional)
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        {/* Data Nascimento e Gênero */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">
                                    Data de Nascimento
                                </label>
                                <input
                                    id="birthDate"
                                    name="birthDate"
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                    className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-lg py-3 bg-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="gender" className="block text-sm font-medium text-slate-700">
                                    Gênero
                                </label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-lg bg-white"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Male">Masculino</option>
                                    <option value="Female">Feminino</option>
                                </select>
                            </div>
                        </div>

                        {/* Endereço */}
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                                Endereço
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="h-5 w-5 text-gray-400" />
                                </div>
                                <textarea
                                    id="address"
                                    name="address"
                                    rows={2}
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 resize-none"
                                    placeholder="Bairro, Rua..."
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-lg shadow-orange-500/30 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                    Enviando...
                                </>
                            ) : (
                                'Cadastrar-se'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div >
    );
};

export default MemberRegistration;
