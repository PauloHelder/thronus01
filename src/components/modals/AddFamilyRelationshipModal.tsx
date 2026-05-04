import React, { useState } from 'react';
import { X, Search, User } from 'lucide-react';
import { Member } from '../../types';

interface AddFamilyRelationshipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (relatedMemberId: string, type: string) => Promise<void>;
    members: Member[];
    currentMemberId: string;
}

const RELATIONSHIP_TYPES = [
    { value: 'Pai', label: 'Pai' },
    { value: 'Mãe', label: 'Mãe' },
    { value: 'Filho(a)', label: 'Filho(a)' },
    { value: 'Cônjuge', label: 'Cônjuge' },
    { value: 'Irmão/Irmã', label: 'Irmão/Irmã' },
    { value: 'Avô/Avó', label: 'Avô/Avó' },
    { value: 'Neto(a)', label: 'Neto(a)' },
    { value: 'Tio(a)', label: 'Tio(a)' },
    { value: 'Sobrinho(a)', label: 'Sobrinho(a)' },
    { value: 'Outro', label: 'Outro' }
];

const AddFamilyRelationshipModal: React.FC<AddFamilyRelationshipModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    members,
    currentMemberId
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [relationshipType, setRelationshipType] = useState('Cônjuge');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const availableMembers = members.filter(
        m => m.id !== currentMemberId && 
        (m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         (m.memberCode && m.memberCode.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemberId || !relationshipType) return;

        try {
            setLoading(true);
            await onAdd(selectedMemberId, relationshipType);
            onClose();
            // Reset state
            setSearchQuery('');
            setSelectedMemberId('');
            setRelationshipType('Cônjuge');
        } catch (error) {
            console.error('Error adding relationship', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Adicionar Vínculo Familiar</h2>
                        <p className="text-sm text-slate-500 mt-1">Conecte este membro a um parente no sistema</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="family-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Buscar Parente (Nome ou Código)
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Digite o nome ou código..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                        </div>

                        {searchQuery && (
                            <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                                {availableMembers.length > 0 ? (
                                    availableMembers.map(member => (
                                        <div
                                            key={member.id}
                                            onClick={() => setSelectedMemberId(member.id)}
                                            className={`p-3 border-b last:border-0 cursor-pointer flex items-center gap-3 transition-colors ${
                                                selectedMemberId === member.id ? 'bg-orange-50 border-orange-200' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    <User size={16} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800 text-sm">{member.name}</p>
                                                <p className="text-xs text-slate-500">{member.memberCode || 'Sem código'}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-slate-500">
                                        Nenhum membro encontrado.
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Tipo de Parentesco
                            </label>
                            <select
                                value={relationshipType}
                                onChange={(e) => setRelationshipType(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                {RELATIONSHIP_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="family-form"
                        disabled={loading || !selectedMemberId}
                        className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Adicionando...' : 'Adicionar Vínculo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddFamilyRelationshipModal;
