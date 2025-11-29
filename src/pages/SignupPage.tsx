import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Building, Phone, User, MapPin, Hash, Link as LinkIcon, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DENOMINACOES = [
    'Assembleia Cristã Alfa e Omega de Angola',
    'Assembleia Missionaria Cristã de Angola',
    'Comunidade das Igrejas do Santo Espirito em África',
    'Comunidade Evangélica Batistaa em Angola',
    'Comunidade Evangélica de Aliança em Angola',
    'Comunidade Islâmica de Angola (CISA)',
    'Comunidade Islâmica de Angola (COR)',
    'Congregação Cristã Boa Vontade',
    'Congregação da Cura e Inspiração Profética',
    'Convenção Baptista Nacional',
    'Christ Embassy Angola',
    'Igreja Assembleia dc Deus',
    'Igreja de Amor a Jesus Cristo e Espirito Santo',
    'Igreja dos Apóstolos de Jesus Cristo em Angola',
    'Igreja dos Apóstolos de Oração e de Salvação Eterna',
    'Igreja Reformada em Angola',
    'Igreja de Reavivamento de Angola',
    'Igreja da Revelação dos Espirito Santos em Angola',
    'Religião Mpadismo',
    'Igreja de Senhor Jesus Cristo Renovada Com a Lei do Espirito Santo',
    'Igreja do Templo Água Viva para todas as Nações',
    'Igreja Trono de Deus em Angola',
    'Igreja União da Promessa dos Profetas',
    'Igreja União dos Profetas Africanos',
    'Igreja Unida em Angola',
    'Igreja Universal dos Espirito Santo Deus dos Nossos Antepassados',
    'Igreja Zintumua Za Bangunza Mua Felica',
    'Missão Profética Unida em Angola',
    'Missão Evangélica de Ensinamentos, Libertação e Adoração',
    'Ministério da Vida Cristã Aprofundada',
    'União dos Santos Africanos no Mundo'
];

const CATEGORIAS = [
    'Sede',
    'Ministério',
    'Centro',
    'Congregação',
    'SubCongregação',
    'Ponto de Pregação',
    'Ponto de oração',
    'Grupo de oração'
];

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { signup, loading } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        // Dados da Igreja
        nomeIgreja: '',
        sigla: '',
        denominacao: '',
        nif: '',
        endereco: '',
        provincia: '',
        municipio: '',
        bairro: '',
        categoria: '',
        email: '',
        telefone: '',
        nomePastor: '',
        codigoVinculacao: '',
        vincularIgreja: '',
        // Credenciais
        password: '',
        confirmPassword: '',
        agreeTerms: false
    });

    const updateFormData = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    // Generate random 6-digit alphanumeric code
    const generateCodigoVinculacao = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        updateFormData('codigoVinculacao', code);
    };

    const validateStep1 = () => {
        if (!formData.nomeIgreja.trim()) {
            setError('Por favor, insira o nome da igreja');
            return false;
        }
        if (!formData.sigla.trim()) {
            setError('Por favor, insira a sigla');
            return false;
        }
        if (!formData.denominacao) {
            setError('Por favor, selecione uma denominação');
            return false;
        }
        if (!formData.nif.trim()) {
            setError('Por favor, insira o NIF');
            return false;
        }
        if (!formData.categoria) {
            setError('Por favor, selecione uma categoria');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.endereco.trim()) {
            setError('Por favor, insira o endereço');
            return false;
        }
        if (!formData.provincia.trim()) {
            setError('Por favor, insira a província');
            return false;
        }
        if (!formData.municipio.trim()) {
            setError('Por favor, insira o município');
            return false;
        }
        if (!formData.bairro.trim()) {
            setError('Por favor, insira o bairro');
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(formData.email)) {
            setError('Por favor, insira um email válido');
            return false;
        }
        if (!formData.telefone.trim()) {
            setError('Por favor, insira o telefone');
            return false;
        }
        if (!formData.nomePastor.trim()) {
            setError('Por favor, insira o nome do pastor');
            return false;
        }
        if (!formData.password) {
            setError('Por favor, insira uma senha');
            return false;
        }
        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return false;
        }
        if (!formData.agreeTerms) {
            setError('Por favor, aceite os termos de serviço');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (step === 1) {
            if (validateStep1()) {
                setStep(2);
            }
        } else if (step === 2) {
            if (validateStep2()) {
                setStep(3);
            }
        } else if (step === 3) {
            if (validateStep3()) {
                const success = await signup({
                    churchName: formData.nomeIgreja,
                    fullName: formData.nomePastor,
                    email: formData.email,
                    phone: formData.telefone,
                    password: formData.password
                });

                if (success) {
                    navigate('/dashboard');
                } else {
                    setError('Este email já está registrado');
                }
            }
        }
    };

    React.useEffect(() => {
        if (!formData.codigoVinculacao) {
            generateCodigoVinculacao();
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex items-center justify-center p-4">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-4xl relative z-10">
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="font-bold text-white text-2xl">Th</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-2xl text-slate-800">Thronus</h1>
                            <p className="text-xs text-slate-500">Gestão de Igrejas</p>
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            {[1, 2, 3].map((s) => (
                                <React.Fragment key={s}>
                                    <div className={`flex items-center gap-2 ${step >= s ? 'text-orange-500' : 'text-gray-400'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= s ? 'bg-orange-500 text-white' : 'bg-gray-200'} transition-all font-semibold`}>
                                            {step > s ? <CheckCircle size={20} /> : s}
                                        </div>
                                        <span className="text-sm font-medium hidden sm:inline">
                                            {s === 1 ? 'Dados Básicos' : s === 2 ? 'Localização' : 'Contacto & Senha'}
                                        </span>
                                    </div>
                                    {s < 3 && <div className={`flex-1 h-1 mx-4 ${step > s ? 'bg-orange-500' : 'bg-gray-200'} transition-all`}></div>}
                                </React.Fragment>
                            ))}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                            {step === 1 ? 'Dados da Igreja' : step === 2 ? 'Localização' : 'Informações de Contacto'}
                        </h2>
                        <p className="text-slate-600">
                            {step === 1 ? 'Informações básicas sobre a igreja' : step === 2 ? 'Endereço completo' : 'Dados do pastor e credenciais'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top">
                            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {step === 1 && (
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Nome da Igreja */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Nome da Igreja *
                                    </label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            value={formData.nomeIgreja}
                                            onChange={(e) => updateFormData('nomeIgreja', e.target.value)}
                                            placeholder="Ex: Igreja Assembleia de Deus"
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Sigla */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Sigla *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.sigla}
                                        onChange={(e) => updateFormData('sigla', e.target.value.toUpperCase())}
                                        placeholder="Ex: IAD"
                                        required
                                        maxLength={10}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all uppercase"
                                    />
                                </div>

                                {/* NIF */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        NIF *
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            value={formData.nif}
                                            onChange={(e) => updateFormData('nif', e.target.value)}
                                            placeholder="Número de Identificação Fiscal"
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Denominação */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Denominação *
                                    </label>
                                    <select
                                        value={formData.denominacao}
                                        onChange={(e) => updateFormData('denominacao', e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="">Selecione uma denominação</option>
                                        {DENOMINACOES.map((den) => (
                                            <option key={den} value={den}>{den}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Categoria */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Categoria *
                                    </label>
                                    <select
                                        value={formData.categoria}
                                        onChange={(e) => updateFormData('categoria', e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="">Selecione uma categoria</option>
                                        {CATEGORIAS.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Endereço */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Endereço *
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                                        <textarea
                                            value={formData.endereco}
                                            onChange={(e) => updateFormData('endereco', e.target.value)}
                                            placeholder="Rua, Avenida, número..."
                                            required
                                            rows={3}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Província */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Província *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.provincia}
                                        onChange={(e) => updateFormData('provincia', e.target.value)}
                                        placeholder="Ex: Luanda"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                {/* Município */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Município *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.municipio}
                                        onChange={(e) => updateFormData('municipio', e.target.value)}
                                        placeholder="Ex: Viana"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                {/* Bairro */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Bairro *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bairro}
                                        onChange={(e) => updateFormData('bairro', e.target.value)}
                                        placeholder="Ex: Zango"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Email */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Email *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => updateFormData('email', e.target.value)}
                                            placeholder="igreja@exemplo.com"
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Telefone */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Telefone *
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="tel"
                                            value={formData.telefone}
                                            onChange={(e) => updateFormData('telefone', e.target.value)}
                                            placeholder="+244 900 000 000"
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Nome do Pastor */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Nome do Pastor *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            value={formData.nomePastor}
                                            onChange={(e) => updateFormData('nomePastor', e.target.value)}
                                            placeholder="Nome completo"
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Código de Vinculação */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Código de Vinculação
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.codigoVinculacao}
                                            readOnly
                                            className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg font-mono text-center text-lg font-bold text-orange-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={generateCodigoVinculacao}
                                            className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                                            title="Gerar novo código"
                                        >
                                            🔄
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Código para vincular membros</p>
                                </div>

                                {/* Vincular Igreja (Opcional) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Vincular a Igreja (Opcional)
                                    </label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            value={formData.vincularIgreja}
                                            onChange={(e) => updateFormData('vincularIgreja', e.target.value.toUpperCase())}
                                            placeholder="Código da igreja mãe"
                                            maxLength={6}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all uppercase font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Senha */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Senha *
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => updateFormData('password', e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            required
                                            className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
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

                                {/* Confirmar Senha */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Confirmar Senha *
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={formData.confirmPassword}
                                            onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                                            placeholder="Repita a senha"
                                            required
                                            className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Termos */}
                                <div className="md:col-span-2">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.agreeTerms}
                                            onChange={(e) => updateFormData('agreeTerms', e.target.checked)}
                                            required
                                            className="mt-1 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-slate-600">
                                            Concordo com os{' '}
                                            <a href="/terms" className="text-orange-500 hover:text-orange-600 font-medium">
                                                Termos de Serviço
                                            </a>{' '}
                                            e{' '}
                                            <a href="/privacy" className="text-orange-500 hover:text-orange-600 font-medium">
                                                Política de Privacidade
                                            </a>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-4 pt-4">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    Voltar
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-lg shadow-orange-500/30 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        {step === 3 ? 'Criar Igreja' : 'Continuar'}
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Login Link */}
                    <p className="mt-8 text-center text-slate-600">
                        Já tem uma conta?{' '}
                        <a href="/#/login" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
                            Fazer login
                        </a>
                    </p>
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

export default SignupPage;
