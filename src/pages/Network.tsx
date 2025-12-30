import React, { useState, useEffect } from 'react';
import {
    Building,
    Search,
    Plus,
    MapPin,
    MoreVertical,
    Trash2,
    ExternalLink,
    Network as NetworkIcon,
    Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AddBranchModal from '../components/modals/AddBranchModal';

const Network: React.FC = () => {
    const { user } = useAuth();
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchBranches = async () => {
        if (!user?.churchId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('churches')
            .select('*')
            .eq('parent_id', user.churchId);

        if (error) {
            console.error('Error fetching branches:', error);
            toast.error('Erro ao carregar filiais.');
        } else {
            setBranches(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBranches();
    }, [user?.churchId]);

    const filteredBranches = branches.filter(branch =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.settings?.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUnlink = async (branchId: string, branchName: string) => {
        if (!confirm(`Tem certeza que deseja desvincular ${branchName}?`)) return;

        try {
            const { error } = await supabase
                .from('churches')
                .update({
                    parent_id: null,
                    settings: { ...branches.find(b => b.id === branchId)?.settings, categoria: 'Sede' } // Reset category to Sede? Or keep? Usually Sede if independent
                } as any)
                .eq('id', branchId);

            if (error) throw error;
            toast.success('Igreja desvinculada com sucesso.');
            fetchBranches();
        } catch (error: any) {
            console.error('Error unlinking:', error);
            toast.error('Erro ao desvincular igreja.');
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <NetworkIcon className="text-orange-500" />
                        Minha Rede de Igrejas
                    </h1>
                    <p className="text-slate-500 mt-1">Gerencie suas filiais e congregações.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-sm transition-all hover:scale-105"
                >
                    <Plus size={20} />
                    <span>Adicionar Filial</span>
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar filial por nome ou categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-orange-500" size={32} />
                </div>
            ) : filteredBranches.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <NetworkIcon className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700">Nenhuma filial conectada</h3>
                    <p className="text-slate-500 mt-1 mb-6">Comece adicionando igrejas à sua rede.</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-orange-500 font-medium hover:text-orange-600 hover:underline"
                    >
                        Adicionar primeira filial
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBranches.map(branch => (
                        <div
                            key={branch.id}
                            onClick={(e) => {
                                // Prevent navigation if clicking on trash icon
                                if ((e.target as HTMLElement).closest('button')) return;
                                // Use window.location as fallback or hook
                                window.location.hash = `/network/${branch.id}`;
                            }}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 group cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 font-bold text-lg">
                                        {branch.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{branch.name}</h3>
                                        <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium mt-1">
                                            {branch.settings?.categoria || 'Filial'}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => handleUnlink(branch.id, branch.name)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Desvincular"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm text-slate-600 mt-4 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-slate-400" />
                                    <span className="truncate">
                                        {branch.settings?.municipio ? `${branch.settings.municipio}, ` : ''}
                                        {branch.settings?.provincia || 'Localização não informada'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ExternalLink size={16} className="text-slate-400" />
                                    <span>Código: <span className="font-mono bg-gray-100 px-1 rounded">{branch.slug}</span></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddBranchModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchBranches}
            />
        </div>
    );
};

export default Network;
