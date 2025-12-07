import React, { useState } from 'react';
import { Plus, Trash2, Tag, Calendar, Save, X } from 'lucide-react';
import { useEventTypes, EventType } from '../../hooks/useEventTypes';

const EventTypesSettings: React.FC = () => {
    const { eventTypes, loading, addEventType, deleteEventType } = useEventTypes();
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('bg-gray-100 text-gray-700');
    const [error, setError] = useState<string | null>(null);

    const colors = [
        { label: 'Azul', value: 'bg-blue-100 text-blue-700' },
        { label: 'Roxo', value: 'bg-purple-100 text-purple-700' },
        { label: 'Verde', value: 'bg-green-100 text-green-700' },
        { label: 'Laranja', value: 'bg-orange-100 text-orange-700' },
        { label: 'Indigo', value: 'bg-indigo-100 text-indigo-700' },
        { label: 'Vermelho', value: 'bg-red-100 text-red-700' },
        { label: 'Rosa', value: 'bg-pink-100 text-pink-700' },
        { label: 'Amarelo', value: 'bg-yellow-100 text-yellow-800' },
        { label: 'Cinza', value: 'bg-gray-100 text-gray-700' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        const success = await addEventType(newName, newColor);
        if (success) {
            setNewName('');
            setNewColor('bg-gray-100 text-gray-700');
            setError(null);
        } else {
            setError('Erro ao criar tipo de evento. Tente novamente.');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o tipo "${name}"?`)) {
            await deleteEventType(id, name);
        }
    };

    return (
        <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Tipos de Evento</h2>
            <p className="text-sm text-slate-500 mb-6">
                Gerencie os tipos de eventos disponíveis para o calendário. Tipos padrão não podem ser excluídos, mas você pode adicionar novos tipos personalizados.
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Tipo</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Ex: Retiro, Evangelismo"
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Cor da Etiqueta</label>
                        <select
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            {colors.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={!newName.trim() || loading}
                        className="w-full md:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Adicionar
                    </button>
                </div>
                <div className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${newColor}`}>
                        Preview: {newName || 'Nome do Tipo'}
                    </span>
                </div>
            </form>

            {/* List */}
            <div className="space-y-2">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    </div>
                ) : eventTypes.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <Tag size={48} className="mx-auto mb-3 text-gray-300" />
                        <p>Nenhum tipo encontrado.</p>
                    </div>
                ) : (
                    eventTypes.map(type => (
                        <div
                            key={type.id}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-200 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${type.color}`}>
                                    {type.name}
                                </span>
                                {type.isDefault && (
                                    <span className="text-xs text-slate-400 italic bg-gray-100 px-2 py-0.5 rounded">Padrão</span>
                                )}
                            </div>

                            {!type.isDefault && (
                                <button
                                    onClick={() => handleDelete(type.id, type.name)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EventTypesSettings;
