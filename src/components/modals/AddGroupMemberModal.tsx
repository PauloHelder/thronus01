import React, { useState, useMemo } from 'react';
import Modal from '../Modal';
import { Member } from '../../types';
import { Search, UserPlus, AlertCircle } from 'lucide-react';

interface AddGroupMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMember: (memberId: string) => void;
    allMembers: Member[];
    currentGroupId: string;
}

const AddGroupMemberModal: React.FC<AddGroupMemberModalProps> = ({
    isOpen,
    onClose,
    onAddMember,
    allMembers,
    currentGroupId
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    // Filtrar membros elegíveis:
    // 1. Não devem estar no grupo atual (embora a lógica de groupId já cubra isso, é bom garantir)
    // 2. Não devem ter um groupId definido (não estão em nenhum grupo)
    const eligibleMembers = useMemo(() => {
        return allMembers.filter(member => {
            // Se o membro já tem um groupId, ele não é elegível (já está em um grupo)
            if (member.groupId && member.groupId !== '') return false;

            // Filtro de pesquisa
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return (
                    member.name.toLowerCase().includes(searchLower) ||
                    member.email.toLowerCase().includes(searchLower)
                );
            }

            return true;
        });
    }, [allMembers, searchTerm]);

    const handleAdd = () => {
        if (selectedMemberId) {
            onAddMember(selectedMemberId);
            onClose();
            setSearchTerm('');
            setSelectedMemberId(null);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Adicionar Membro ao Grupo"
        >
            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-blue-700">
                        Apenas membros que não pertencem a nenhum grupo serão listados aqui.
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar membro por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {eligibleMembers.length > 0 ? (
                        eligibleMembers.map(member => (
                            <div
                                key={member.id}
                                onClick={() => setSelectedMemberId(member.id)}
                                className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${selectedMemberId === member.id
                                        ? 'bg-orange-50 border-l-4 border-orange-500'
                                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                                    }`}
                            >
                                <img
                                    src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`}
                                    alt={member.name}
                                    className="w-10 h-10 rounded-full bg-gray-200 object-cover"
                                />
                                <div>
                                    <p className="font-medium text-slate-800">{member.name}</p>
                                    <p className="text-xs text-slate-500">{member.email}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            {searchTerm ? 'Nenhum membro encontrado.' : 'Todos os membros já estão em grupos.'}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!selectedMemberId}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${selectedMemberId
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <UserPlus size={18} />
                        Adicionar Membro
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddGroupMemberModal;
