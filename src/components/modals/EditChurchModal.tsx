import React, { useState, useEffect } from 'react';
import { X, Save, Building, Calendar, CreditCard, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface Church {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    plan_id?: string;
    settings?: {
        sigla?: string;
        provincia?: string;
        status?: 'active' | 'inactive' | 'pending';
    };
    subscriptions?: {
        id: string;
        plan_id: string;
        start_date: string;
        end_date: string;
        status: string;
        plans?: {
            name: string;
        };
    }[];
}

interface EditChurchModalProps {
    isOpen: boolean;
    onClose: () => void;
    church: Church | null;
    onUpdate: () => void;
}

const EditChurchModal: React.FC<EditChurchModalProps> = ({ isOpen, onClose, church, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        plan_id: '',
        start_date: '',
        end_date: '',
        status: 'active'
    });
    const [plans, setPlans] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && church) {
            // Find active subscription or use empty
            const activeSub = church.subscriptions?.[0]; // Assuming latest is first or single

            setFormData({
                plan_id: activeSub?.plan_id || church.plan_id || '',
                start_date: activeSub?.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
                end_date: activeSub?.end_date?.split('T')[0] || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                status: church.settings?.status || 'active'
            });

            fetchPlans();
        }
    }, [isOpen, church]);

    const fetchPlans = async () => {
        const { data } = await supabase.from('plans').select('*');
        if (data) setPlans(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!church) return;

        setLoading(true);
        try {
            // 1. Update Church Settings (Status)
            const { error: churchError } = await supabase
                .from('churches')
                .update({
                    settings: {
                        ...church.settings,
                        status: formData.status
                    }
                })
                .eq('id', church.id);

            if (churchError) throw churchError;

            // 2. Update or Create Subscription
            // For simplicity, we'll upsert based on church_id if we assume one sub per church, 
            // but normally we'd create a new one. 
            // Let's check if we have a sub id.
            const activeSub = church.subscriptions?.[0];

            if (activeSub) {
                const { error: subError } = await supabase
                    .from('subscriptions')
                    .update({
                        plan_id: formData.plan_id,
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                    })
                    .eq('id', activeSub.id);

                if (subError) throw subError;
            } else if (formData.plan_id) {
                // Create new subscription
                const { error: subError } = await supabase
                    .from('subscriptions')
                    .insert({
                        church_id: church.id,
                        plan_id: formData.plan_id,
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                    });

                if (subError) throw subError;
            }

            toast.success('Igreja atualizada com sucesso!');
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error updating church:', error);
            toast.error('Erro ao atualizar igreja: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Building className="text-orange-500" />
                        Gerenciar Igreja
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Igreja</label>
                        <input
                            type="text"
                            value={church?.name}
                            disabled
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-slate-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none appearance-none"
                                >
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Inativo</option>
                                    <option value="pending">Pendente</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Plano</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={formData.plan_id}
                                    onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none appearance-none"
                                >
                                    <option value="">Sem Plano</option>
                                    {plans.map(plan => (
                                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data de Fim</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? 'Salvando...' : (
                                <>
                                    <Save size={18} />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditChurchModal;
