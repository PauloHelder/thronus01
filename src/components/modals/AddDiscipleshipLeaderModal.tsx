import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Member } from '../../types';
import { Save, Calendar, User } from 'lucide-react';

interface AddDiscipleshipLeaderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (memberId: string, startDate: string) => void;
    members: Member[];
}

const AddDiscipleshipLeaderModal: React.FC<AddDiscipleshipLeaderModalProps> = ({
    isOpen,
    onClose,
    onSave,
    members
}) => {
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [startDate, setStartDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedMemberId('');
            setStartDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedMemberId || !startDate) {
            alert('Por favor, selecione um membro e uma data.');
            return;
        }

        onSave(selectedMemberId, startDate);
        onClose();
    };

    const selectedMember = members.find(m => m.id === selectedMemberId);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Adicionar Novo Líder de Discipulado"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Selecionar Membro
                    </label>
                    <select
                        required
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    >
                        <option value="">Escolha um membro...</option>
                        {members.map(member => (
                            <option key={member.id} value={member.id}>
                                {member.name} - {member.email}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedMember && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <img
                                src={selectedMember.avatar}
                                alt={selectedMember.name}
                                className="w-12 h-12 rounded-full"
                            />
                            <div>
                                <p className="font-semibold text-slate-800">{selectedMember.name}</p>
                                <p className="text-sm text-slate-600">{selectedMember.email}</p>
                                <p className="text-sm text-slate-600">{selectedMember.phone}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Data de Início como Líder
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="date"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        />
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
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} />
                        Adicionar Líder
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddDiscipleshipLeaderModal;
