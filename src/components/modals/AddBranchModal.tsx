import React, { useState } from 'react';
import { X, Search, Building, Loader2, Link2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface AddBranchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES = [
    'Ministério',
    'Centro',
    'Congregação',
    'SubCongregação',
    'Ponto de Pregação',
    'Ponto de Oração'
];

const AddBranchModal: React.FC<AddBranchModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [branchCode, setBranchCode] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[2]); // Default to Congregação
    const [isSearching, setIsSearching] = useState(false);
    const [branchName, setBranchName] = useState<string | null>(null);
    const [isLinking, setIsLinking] = useState(false);

    if (!isOpen) return null;

    const handleSearch = async () => {
        if (!branchCode) return;
        setIsSearching(true);
        setBranchName(null);

        try {
            const { data, error } = await supabase
                .from('churches')
                .select('name')
                .eq('slug', branchCode.trim())
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setBranchName(data.name);
                toast.success('Igreja encontrada!');
            } else {
                toast.error('Igreja não encontrada.');
            }
        } catch (error: any) {
            console.error('Erro ao buscar igreja:', error);

            if (error.message?.includes('JWT') || error.code === 'PGRST301' || error.status === 401) {
                toast.error('Sessão expirada. Por favor, recarregue a página ou faça login novamente.');
            } else {
                toast.error('Não foi possível encontrar a igreja. Verifique se o código está correto.');
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleLink = async () => {
        if (!branchCode || !selectedCategory) return;
        setIsLinking(true);

        try {
            const { data, error } = await supabase.rpc('link_church_branch', {
                branch_slug: branchCode.trim(),
                category: selectedCategory
            });

            if (error) throw error;

            // O retorno do RPC é um JSON { success, message }
            if (data && data.success) {
                toast.success(data.message);
                onSuccess();
                onClose();
            } else {
                toast.error(data?.message || 'Erro ao vincular filial.');
            }

        } catch (error: any) {
            console.error('Erro ao vincular:', error);
            if (error.code === '42501' || error.message?.includes('found')) {
                // Fallback: Talvez RPC não exista. Tenta alertar usuário a rodar script.
                toast.error('Erro de sistema. Contate o suporte (RPC 404).');
            } else {
                toast.error('Erro ao vincular filial: ' + error.message);
            }
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Link2 className="text-orange-500" />
                        Adicionar Filial
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Search Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Código da Igreja (Filial)</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={branchCode}
                                onChange={(e) => setBranchCode(e.target.value)}
                                placeholder="Ex: rj0123"
                                className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={!branchCode || isSearching}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 transition-colors disabled:opacity-50"
                            >
                                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            Digite o código da igreja que será sua filial.
                        </p>
                    </div>

                    {/* Result and Category */}
                    {branchName && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <Building size={20} className="text-orange-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{branchName}</p>
                                    <p className="text-xs text-orange-600 font-medium">Igreja Encontrada</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Definir Categoria</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={handleLink}
                        disabled={!branchName || isLinking}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLinking ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Vinculando...
                            </>
                        ) : (
                            <>
                                <Link2 size={20} />
                                Confirmar Vínculo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddBranchModal;
