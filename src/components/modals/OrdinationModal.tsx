import React, { useState } from 'react';
import Modal from '../Modal';
import { Member } from '../../types';
import { Search, User, X, Calendar, Award } from 'lucide-react';

interface OrdinationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (ordinationData: { date: string, category: string, celebrant: string, notes: string, memberIds: string[] }) => void;
    members: Member[];
}

const CATEGORIES = [
    'Cooperador', 'Diácono', 'Ministro', 'Evangelista', 'Pastor', 
    'Mestre', 'Profeta', 'Apóstolo', 'Bispo', 'Líder', 'Supervisor', 'Ancião'
];

const OrdinationModal: React.FC<OrdinationModalProps> = ({ isOpen, onClose, onSave, members }) => {
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [celebrant, setCelebrant] = useState('');
    const [notes, setNotes] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMembers = members.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedMembers.includes(m.id)
    );

    const handleSelectMember = (id: string) => {
        setSelectedMembers(prev => [...prev, id]);
        setSearchQuery('');
    };

    const handleRemoveMember = (id: string) => {
        setSelectedMembers(prev => prev.filter(mid => mid !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedMembers.length === 0) {
            alert('Por favor, selecione pelo menos um membro para ser consagrado.');
            return;
        }
        onSave({ date, category, celebrant, notes, memberIds: selectedMembers });
        setSelectedMembers([]);
        setCelebrant('');
        setNotes('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Adicionar Nova Consagração"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <Calendar size={16} className="text-orange-500" />
                            Data da Consagração
                        </label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <Award size={16} className="text-orange-500" />
                            Categoria/Grau
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <User size={16} className="text-orange-500" />
                        Ministro Celebrante
                    </label>
                    <input
                        type="text"
                        placeholder="Nome do ministro que realizará a consagração"
                        value={celebrant}
                        onChange={(e) => setCelebrant(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        Observações
                    </label>
                    <textarea
                        placeholder="Detalhes adicionais sobre esta consagração..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Selecionar Membros para Consagração</label>
                    
                    {/* Selected Members Tags */}
                    {selectedMembers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedMembers.map(id => {
                                const m = members.find(member => member.id === id);
                                return (
                                    <div key={id} className="flex items-center gap-1 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium border border-orange-100">
                                        <span>{m?.name}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveMember(id)}
                                            className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar membros..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                        
                        {searchQuery.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                                {filteredMembers.length > 0 ? (
                                    filteredMembers.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => handleSelectMember(m.id)}
                                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
                                                {m.avatar ? (
                                                    <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={14} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{m.name}</p>
                                                <p className="text-xs text-slate-500">{m.churchRole || 'Membro'}</p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-slate-500">Nenhum membro encontrado</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-sm shadow-orange-500/20 transition-all hover:shadow-orange-500/40"
                    >
                        Consagrar {selectedMembers.length > 0 ? `${selectedMembers.length} ${selectedMembers.length === 1 ? 'Membro' : 'Membros'}` : ''}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default OrdinationModal;
