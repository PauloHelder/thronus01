import React, { useState, useEffect } from 'react';
import { X, Package, Tag, Calendar, DollarSign, MapPin, Building2, User, AlertCircle, Info } from 'lucide-react';
import { Asset, AssetCategory } from '../../types/database.types';
import { Department, Member } from '../../types';

interface AssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<boolean>;
    asset: Asset | null;
    categories: AssetCategory[];
    departments: Department[];
    members: Member[];
}

const AssetModal: React.FC<AssetModalProps> = ({
    isOpen,
    onClose,
    onSave,
    asset,
    categories,
    departments,
    members
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category_id: '',
        department_id: '',
        assigned_to: '',
        serial_number: '',
        location: '',
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_price: 0,
        condition: 'good',
        status: 'available',
        image_url: '',
        useful_life_years: undefined as number | undefined,
        salvage_value: 0
    });

    useEffect(() => {
        if (asset) {
            setFormData({
                name: asset.name || '',
                description: asset.description || '',
                category_id: asset.category_id || '',
                department_id: asset.department_id || '',
                assigned_to: asset.assigned_to || '',
                serial_number: asset.serial_number || '',
                location: asset.location || '',
                purchase_date: asset.purchase_date || new Date().toISOString().split('T')[0],
                purchase_price: asset.purchase_price || 0,
                condition: asset.condition || 'good',
                status: asset.status || 'available',
                image_url: asset.image_url || '',
                useful_life_years: asset.useful_life_years || undefined,
                salvage_value: Number(asset.salvage_value || 0)
            });
        } else {
            setFormData({
                name: '',
                description: '',
                category_id: '',
                department_id: '',
                assigned_to: '',
                serial_number: '',
                location: '',
                purchase_date: new Date().toISOString().split('T')[0],
                purchase_price: 0,
                condition: 'good',
                status: 'available',
                image_url: '',
                useful_life_years: undefined,
                salvage_value: 0
            });
        }
    }, [asset, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onSave(formData);
        if (success) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Package size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{asset ? 'Editar Ativo' : 'Novo Ativo'}</h2>
                            <p className="text-orange-100 text-xs tracking-wide">Preencha as informações do patrimônio</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Info size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Informações Básicas</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Ativo *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                    placeholder="Ex: Projetor Epson 4K"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                >
                                    <option value="">Sem categoria</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Número de Série / Patrimônio</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.serial_number}
                                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                        placeholder="SN-123456"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium h-24 resize-none"
                                placeholder="Detalhes técnicos, acessórios inclusos..."
                            />
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Acquisition Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <DollarSign size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Aquisição e Valor</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Data de Compra</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="date"
                                        value={formData.purchase_date}
                                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Preço de Compra (AOA)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        value={formData.purchase_price}
                                        onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Vida Útil (Anos)</label>
                                <input
                                    type="number"
                                    placeholder="Vazio p/ usar padrão"
                                    value={formData.useful_life_years || ''}
                                    onChange={(e) => setFormData({ ...formData, useful_life_years: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 italic">Sobrescreve o padrão da categoria.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Valor Residual (AOA)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        value={formData.salvage_value}
                                        onChange={(e) => setFormData({ ...formData, salvage_value: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 italic">Valor estimado após a vida útil.</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Location & Ownership Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <MapPin size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Localização e Responsável</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Departamento</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        value={formData.department_id}
                                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                    >
                                        <option value="">Nenhum departamento</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Responsável Atual</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        value={formData.assigned_to}
                                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                    >
                                        <option value="">Nenhum responsável</option>
                                        {members.map(member => (
                                            <option key={member.id} value={member.id}>{member.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Localização Específica</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                        placeholder="Ex: Sala de Som - Prateleira 2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Status & Condition */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <AlertCircle size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Estado e Disponibilidade</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Condição Física</label>
                                <select
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                >
                                    <option value="new">Novo</option>
                                    <option value="good">Bom</option>
                                    <option value="fair">Regular</option>
                                    <option value="poor">Ruim</option>
                                    <option value="broken">Quebrado</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Status de Uso</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                >
                                    <option value="available">Disponível</option>
                                    <option value="in_use">Em Uso</option>
                                    <option value="under_maintenance">Em Manutenção</option>
                                    <option value="disposed">Descartado / Vendido</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-600 font-bold hover:bg-gray-200 rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-10 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black shadow-lg shadow-orange-200 transition-all transform active:scale-95"
                    >
                        {asset ? 'Atualizar Ativo' : 'Salvar Ativo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssetModal;
