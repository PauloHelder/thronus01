import React, { useState } from 'react';
import { X, Link2, Search, Check, AlertCircle, Loader2, Building } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface LinkChurchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CHURCH_HIERARCHY = [
    'Sede',
    'Ministério',
    'Centro',
    'Congregação',
    'SubCongregação',
    'Ponto de Pregação',
    'Ponto de Oração'
];

const LinkChurchModal: React.FC<LinkChurchModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [parentChurch, setParentChurch] = useState<any | null>(null);
    const [permissions, setPermissions] = useState({
        view_members: true,
        view_service_stats: true,
        view_discipleship: true,
        view_departments: true,
        view_teaching: true,
        view_events: true,
    });
    const [selectedCategory, setSelectedCategory] = useState('');

    if (!isOpen) return null;

    const handleVerifyCode = async () => {
        if (!code.trim()) {
            toast.error('Digite o código de vinculação');
            return;
        }

        setIsLoading(true);
        setParentChurch(null);
        setSelectedCategory('');

        try {
            const { data, error } = await supabase
                .from('churches')
                .select('*')
                .eq('slug', code.trim())
                .single();

            if (error) throw error;
            if (!data) {
                toast.error('Igreja não encontrada com este código');
                return;
            }

            // Cast data to any to avoid strict type checks on dynamic settings
            const churchData = data as any;

            if (churchData.id === user?.churchId) {
                toast.error('Você não pode vincular à sua própria igreja');
                return;
            }

            setParentChurch(churchData);
            toast.success('Igreja encontrada!');
        } catch (error) {
            console.error('Error finding church:', error);
            toast.error('Erro ao buscar igreja. Verifique o código.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLink = async () => {
        if (!parentChurch || !selectedCategory) return;
        if (!user?.churchId) {
            toast.error('Erro de identificação da sua igreja');
            return;
        }

        setIsLinking(true);
        try {
            // Update current church's parent_id and category
            // 1. Get current settings
            const { data: currentChurchResult, error: fetchError } = await supabase
                .from('churches')
                .select('settings')
                .eq('id', user.churchId)
                .single();

            if (fetchError || !currentChurchResult) {
                console.error('Error fetching current church:', fetchError);
                throw new Error('Não foi possível carregar os dados da sua igreja. Tente recarregar a página.');
            }

            const currentChurch = currentChurchResult as any;
            const currentSettings = currentChurch?.settings || {};

            const newSettings = {
                ...currentSettings,
                categoria: selectedCategory,
                shared_permissions: permissions // Save selected permissions
            };

            // 2. Update
            const { error: updateError } = await supabase
                .from('churches')
                .update({
                    parent_id: parentChurch.id,
                    settings: newSettings
                } as any) // Explicit cast for partial update
                .eq('id', user.churchId);

            if (updateError) throw updateError;

            toast.success(`Vinculado com sucesso à ${parentChurch.name}!`);
            onClose();
            window.location.reload(); // Reload to reflect changes
        } catch (error: any) {
            console.error('Error linking church:', error);

            if (error.message?.includes('JWT') || error.message?.includes('Refresh Token') || error.status === 401) {
                toast.error('Sessão expirada. Por favor, faça logout e login novamente.');
            } else if (error.code === '42501') {
                toast.error('Você não tem permissão para realizar esta alteração.');
            } else {
                toast.error(`Erro ao vincular: ${error.message || 'Erro desconhecido'}`);
            }
        } finally {
            setIsLinking(false);
        }
    };

    const getAvailableCategories = () => {
        if (!parentChurch) return [];
        const parentCategory = parentChurch.settings?.categoria || 'Sede';
        const parentIndex = CHURCH_HIERARCHY.indexOf(parentCategory);

        if (parentIndex === -1) return CHURCH_HIERARCHY; // Fallback

        // Return only categories "smaller" (index > parentIndex)
        // e.g. if Parent is Sede (0), return 1..end (Ministerio...)
        return CHURCH_HIERARCHY.slice(parentIndex + 1);
    };

    const availableCategories = getAvailableCategories();

    const togglePermission = (key: keyof typeof permissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const PERMISSION_LABELS = {
        view_members: 'Ver Membros',
        view_service_stats: 'Ver Estatísticas de Culto',
        view_discipleship: 'Ver Discipulados',
        view_departments: 'Ver Departamentos',
        view_teaching: 'Ver Ensino',
        view_events: 'Ver Eventos'
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50 sticky top-0 bg-white z-10">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Link2 className="text-orange-500" size={20} />
                        Vincular Igreja
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {!parentChurch ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Código de Vinculação
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="Digite o código da igreja mãe..."
                                        className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all uppercase"
                                    />
                                    <button
                                        onClick={handleVerifyCode}
                                        disabled={isLoading || !code.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Peça o código para a liderança da igreja à qual deseja se vincular.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {/* Parent Info */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Building className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-blue-900">{parentChurch.name}</h4>
                                    <p className="text-sm text-blue-700">{parentChurch.settings?.denominacao}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full font-medium">
                                        {parentChurch.settings?.categoria || 'Sede'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setParentChurch(null);
                                        setCode('');
                                    }}
                                    className="ml-auto text-blue-400 hover:text-blue-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Selecione a Categoria da sua Igreja
                                </label>
                                {availableCategories.length > 0 ? (
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                                    >
                                        <option value="">Selecione uma categoria...</option>
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        <span>Não há categorias inferiores disponíveis para vincular.</span>
                                    </div>
                                )}
                                <p className="text-xs text-slate-500 mt-2">
                                    A categoria deve ser hierarquicamente inferior à da igreja mãe ({parentChurch.settings?.categoria}).
                                </p>
                            </div>

                            {/* Permissions Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">
                                    Dados Compartilhados com a Igreja Mãe
                                </label>
                                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    {(Object.keys(permissions) as Array<keyof typeof permissions>).map((key) => (
                                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border border-gray-300 flex items-center justify-center transition-colors ${permissions[key] ? 'bg-orange-500 border-orange-500' : 'bg-white group-hover:border-orange-400'}`}>
                                                {permissions[key] && <Check size={14} className="text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={permissions[key]}
                                                onChange={() => togglePermission(key)}
                                                className="hidden"
                                            />
                                            <span className="text-sm text-slate-700">{PERMISSION_LABELS[key]}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Selecione quais dados a igreja mãe ({parentChurch.name}) poderá visualizar.
                                </p>
                            </div>

                            <button
                                onClick={handleLink}
                                disabled={!selectedCategory || isLinking}
                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold hover:shadow-lg hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLinking ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Vinculando...
                                    </>
                                ) : (
                                    <>
                                        <Link2 size={18} />
                                        Confirmar Vinculação
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LinkChurchModal;
