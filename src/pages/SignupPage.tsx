import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Building, Phone, User, MapPin, Hash, Link as LinkIcon, AlertCircle, Loader2, CheckCircle, Globe, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDenominations } from '../hooks/useDenominations';

// DENOMINACOES removido em favor de tabela no banco de dados


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

const PROVINCIAS_ANGOLA = {
    'Bengo': ['Ambriz', 'Bula Atumba', 'Dande', 'Dembos', 'Nambuangongo', 'Pango Aluquém'],
    'Benguela': ['Baía Farta', 'Balombo', 'Benguela', 'Bocoio', 'Caimbambo', 'Catumbela', 'Chongoroi', 'Cubal', 'Ganda', 'Lobito'],
    'Bié': ['Andulo', 'Camacupa', 'Catabola', 'Chinguar', 'Chitembo', 'Cuemba', 'Cunhinga', 'Cuíto', 'Nharea'],
    'Cabinda': ['Belize', 'Buco-Zau', 'Cabinda', 'Cacongo'],
    'Cuando Cubango': ['Calai', 'Cuangar', 'Cuchi', 'Cuito Cuanavale', 'Dirico', 'Mavinga', 'Menongue', 'Nancova', 'Rivungo'],
    'Cuanza Norte': ['Ambaca', 'Banga', 'Bolongongo', 'Cambambe', 'Cazengo', 'Golungo Alto', 'Gonguembo', 'Lucala', 'Quiculungo', 'Samba Caju'],
    'Cuanza Sul': ['Amboim', 'Cassongue', 'Cela', 'Conda', 'Ebo', 'Libolo', 'Mussende', 'Porto Amboim', 'Quibala', 'Quilenda', 'Seles', 'Sumbe'],
    'Cunene': ['Cahama', 'Cuanhama', 'Curoca', 'Cuvelai', 'Namacunde', 'Ombadja'],
    'Huambo': ['Bailundo', 'Caála', 'Catchiungo', 'Chinjenje', 'Ecunha', 'Huambo', 'Londuimbali', 'Longonjo', 'Mungo', 'Tchicala-Tcholohanga', 'Tchindjenje', 'Ucuma'],
    'Huíla': ['Caconda', 'Cacula', 'Caluquembe', 'Chiange', 'Chibia', 'Chicomba', 'Chipindo', 'Cuvango', 'Humpata', 'Jamba', 'Lubango', 'Matala', 'Quilengues', 'Quipungo'],
    'Luanda': ['Belas', 'Cacuaco', 'Cazenga', 'Icolo e Bengo', 'Luanda', 'Quiçama', 'Talatona', 'Viana', 'Kilamba Kiaxi'],
    'Lunda Norte': ['Cambulo', 'Capenda-Camulemba', 'Caungula', 'Chitato', 'Cuango', 'Cuilo', 'Lóvua', 'Lubalo', 'Lucapa', 'Xá-Muteba'],
    'Lunda Sul': ['Cacolo', 'Dala', 'Muconda', 'Saurimo'],
    'Malanje': ['Cacuso', 'Calandula', 'Cambundi-Catembo', 'Cangandala', 'Caombo', 'Cuaba Nzogo', 'Cunda-Dia-Baze', 'Luquembo', 'Malanje', 'Marimba', 'Massango', 'Mucari', 'Quela', 'Quirima'],
    'Moxico': ['Alto Zambeze', 'Bundas', 'Camanongue', 'Léua', 'Luacano', 'Luau', 'Luchazes', 'Lumeje', 'Moxico'],
    'Namibe': ['Bibala', 'Camacuio', 'Moçâmedes', 'Tômbwa', 'Virei'],
    'Uíge': ['Alto Cauale', 'Ambuíla', 'Bembe', 'Buengas', 'Bungo', 'Cangola', 'Damba', 'Maquela do Zombo', 'Milunga', 'Mucaba', 'Negage', 'Puri', 'Quimbele', 'Quitexe', 'Songo', 'Uíge'],
    'Zaire': ['Cuimba', 'Mbanza Congo', 'Nóqui', 'Nzeto', 'Soyo', 'Tomboco']
};

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { signup, loading, isAuthenticated } = useAuth();
    const { denominations, loading: loadingDenominations } = useDenominations();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // State for searchable denomination dropdown
    const [isDenominationOpen, setIsDenominationOpen] = useState(false);
    const [denominationSearch, setDenominationSearch] = useState('');

    // Filtered denominations
    const filteredDenominations = denominations.filter(den =>
        den.name.toLowerCase().includes(denominationSearch.toLowerCase()) ||
        den.acronym?.toLowerCase().includes(denominationSearch.toLowerCase())
    );

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, loading, navigate]);
    const [formData, setFormData] = useState({
        // Dados da Igreja
        nomeIgreja: '',
        sigla: '',
        denominacao: '',
        nif: '',
        endereco: '',
        pais: 'Angola',
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
        setFormData(prev => {
            // Se mudar a província, limpa o município
            if (field === 'provincia') {
                return { ...prev, [field]: value, municipio: '' };
            }
            return { ...prev, [field]: value };
        });
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
        if (!formData.provincia) {
            setError('Por favor, selecione a província');
            return false;
        }
        if (!formData.municipio) {
            setError('Por favor, selecione o município');
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
                    password: formData.password,
                    // Dados adicionais da igreja
                    sigla: formData.sigla,
                    denominacao: formData.denominacao,
                    nif: formData.nif,
                    endereco: formData.endereco,
                    provincia: formData.provincia,
                    municipio: formData.municipio,
                    bairro: formData.bairro,
                    categoria: formData.categoria
                });

                if (success) {
                    setShowSuccessModal(true);
                } else {
                    setError('Este email já está registrado ou ocorreu um erro');
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
                            <span className="font-bold text-white text-2xl">Tr</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-2xl text-slate-800">Tronus</h1>
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
                                    <div className="relative">
                                        <div
                                            onClick={() => setIsDenominationOpen(!isDenominationOpen)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent cursor-pointer flex justify-between items-center"
                                        >
                                            <span className={formData.denominacao ? "text-slate-800" : "text-gray-500"}>
                                                {formData.denominacao || "Selecione uma denominação"}
                                            </span>
                                            <ChevronDown size={20} className="text-gray-400" />
                                        </div>

                                        {isDenominationOpen && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                                                <div className="p-2 border-b border-gray-100 bg-gray-50">
                                                    <div className="relative">
                                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                        <input
                                                            type="text"
                                                            value={denominationSearch}
                                                            onChange={(e) => setDenominationSearch(e.target.value)}
                                                            placeholder="Pesquisar..."
                                                            className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-orange-500"
                                                            onClick={(e) => e.stopPropagation()}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="overflow-y-auto flex-1">
                                                    {loadingDenominations ? (
                                                        <div className="px-4 py-3 text-sm text-gray-500 text-center">Carregando...</div>
                                                    ) : filteredDenominations.length === 0 ? (
                                                        <div className="px-4 py-3 text-sm text-gray-500 text-center">Nenhuma denominação encontrada</div>
                                                    ) : (
                                                        filteredDenominations.map((den) => (
                                                            <button
                                                                key={den.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    updateFormData('denominacao', den.name);
                                                                    setIsDenominationOpen(false);
                                                                    setDenominationSearch('');
                                                                }}
                                                                className="w-full px-4 py-2 text-left hover:bg-orange-50 text-sm text-slate-700 transition-colors flex flex-col"
                                                            >
                                                                <span className="font-medium">{den.name}</span>
                                                                {den.acronym && <span className="text-xs text-slate-400">{den.acronym}</span>}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                {/* País */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        País *
                                    </label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            value="Angola"
                                            readOnly
                                            className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                {/* Província */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Província *
                                    </label>
                                    <select
                                        value={formData.provincia}
                                        onChange={(e) => updateFormData('provincia', e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="">Selecione a província</option>
                                        {Object.keys(PROVINCIAS_ANGOLA).sort().map((prov) => (
                                            <option key={prov} value={prov}>{prov}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Município */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Município *
                                    </label>
                                    <select
                                        value={formData.municipio}
                                        onChange={(e) => updateFormData('municipio', e.target.value)}
                                        required
                                        disabled={!formData.provincia}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        <option value="">Selecione o município</option>
                                        {formData.provincia && PROVINCIAS_ANGOLA[formData.provincia as keyof typeof PROVINCIAS_ANGOLA].sort().map((mun) => (
                                            <option key={mun} value={mun}>{mun}</option>
                                        ))}
                                    </select>
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

                                {/* Endereço */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Endereço Completo *
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                                        <textarea
                                            value={formData.endereco}
                                            onChange={(e) => updateFormData('endereco', e.target.value)}
                                            placeholder="Rua, Avenida, número, ponto de referência..."
                                            required
                                            rows={3}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                                        />
                                    </div>
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

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail className="text-green-600 w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Verifique seu Email</h3>
                            <p className="text-slate-600 mb-8">
                                Enviamos um link de confirmação para <strong>{formData.email}</strong>.
                                Por favor, verifique sua caixa de entrada (e spam) para ativar sua conta.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Ir para Login
                            </button>
                        </div>
                    </div>
                )}
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
