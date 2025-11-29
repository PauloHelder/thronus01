import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Member } from '../../types';
import { Save, Search } from 'lucide-react';

interface AddDiscipleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (memberId: string) => void;
    availableMembers: Member[];
}

const AddDiscipleModal: React.FC<AddDiscipleModalProps> = ({
    isOpen,
    onClose,
    onSave,
    availableMembers
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedMemberId('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedMemberId) {
            alert('Por favor, selecione um membro.');
            return;
        }

        onSave(selectedMemberId);
        onClose();
    };

    const filteredMembers = availableMembers.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Adicionar Discípulo"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Pesquisar Membro
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Digite o nome ou email..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Membros Disponíveis ({filteredMembers.length})
                    </label>
                    <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                        {filteredMembers.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {filteredMembers.map(member => (
                                    <label
                                        key={member.id}
                                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${selectedMemberId === member.id
                                                ? 'bg-orange-50 border-l-4 border-orange-500'
                                                : 'hover:bg-white'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="disciple"
                                            value={member.id}
                                            checked={selectedMemberId === member.id}
                                            onChange={() => setSelectedMemberId(member.id)}
                                            className="text-orange-500 focus:ring-orange-500"
                                        />
                                        <img
                                            src={member.avatar}
                                            alt={member.name}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-800">{member.name}</p>
                                            <p className="text-sm text-slate-600">{member.email}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-500">
                                <p>Nenhum membro disponível encontrado.</p>
                                {searchTerm && (
                                    <p className="text-sm mt-1">Tente ajustar sua pesquisa.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!selectedMemberId}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} />
                        Adicionar Discípulo
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddDiscipleModal;
