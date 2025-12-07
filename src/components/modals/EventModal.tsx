import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';
import { Event, Member } from '../../types';
import { CheckSquare, Camera, X, Image as ImageIcon } from 'lucide-react';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<Event, 'id'> | Event, coverFile?: File) => Promise<void> | void;
    event?: Event;
    members: Member[];
}

import { useEventTypes } from '../../hooks/useEventTypes';

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, event, members }) => {
    const { eventTypes } = useEventTypes();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Omit<Event, 'id'>>({
        title: '',
        date: '',
        time: '',
        type: 'Service',
        description: '',
        attendees: [],
        coverUrl: '',
    });

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                date: event.date,
                time: event.time,
                type: event.type,
                description: event.description,
                attendees: event.attendees || [],
                coverUrl: event.coverUrl || '',
            });
            setSelectedFile(undefined);
        } else {
            setFormData({
                title: '',
                date: '',
                time: '',
                type: 'Service',
                description: '',
                attendees: [],
                coverUrl: '',
            });
            setSelectedFile(undefined);
        }
    }, [event, isOpen]);

    // ... (handleToggleMember stays same)
    const handleToggleMember = (memberId: string) => {
        setFormData(prev => ({
            ...prev,
            attendees: prev.attendees?.includes(memberId)
                ? prev.attendees.filter(id => id !== memberId)
                : [...(prev.attendees || []), memberId]
        }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione apenas arquivos de imagem.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('A imagem deve ter no máximo 5MB.');
                return;
            }

            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, coverUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setFormData(prev => ({ ...prev, coverUrl: '' }));
        setSelectedFile(undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave({
                ...formData,
                id: event?.id || crypto.randomUUID(),
            }, selectedFile);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={event ? 'Editar Evento' : 'Novo Evento'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Cover Image Upload */}
                <div className="relative w-full h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden group hover:border-orange-400 transition-colors">
                    {formData.coverUrl ? (
                        <>
                            <img
                                src={formData.coverUrl}
                                alt="Capa do evento"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                                    title="Alterar imagem"
                                >
                                    <Camera size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRemovePhoto}
                                    className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors"
                                    title="Remover imagem"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-orange-500 transition-colors cursor-pointer"
                        >
                            <ImageIcon size={32} className="mb-2" />
                            <span className="text-sm font-medium">Adicionar Imagem de Capa</span>
                            <span className="text-xs mt-1">Clique para upload (Max 5MB)</span>
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                    />
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título do Evento</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: Conferência Anual"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Evento</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            {eventTypes.length > 0 ? (
                                eventTypes.map(type => (
                                    <option key={type.id} value={type.name}>{type.name}</option>
                                ))
                            ) : (
                                <>
                                    <option value="Service">Culto</option>
                                    <option value="Meeting">Reunião</option>
                                    <option value="Social">Social</option>
                                    <option value="Youth">Jovens</option>
                                </>
                            )}
                        </select>
                    </div>

                </div>

                {/* Membros Participantes */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Participantes
                        </label>
                        <span className="text-xs text-slate-500">
                            {formData.attendees?.length || 0} de {members.length} selecionados
                        </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 space-y-2">
                        {members.length > 0 ? (
                            members.map(member => (
                                <label
                                    key={member.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${formData.attendees?.includes(member.id)
                                        ? 'bg-green-50 border border-green-200'
                                        : 'hover:bg-white border border-transparent'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.attendees?.includes(member.id)
                                        ? 'bg-green-500 border-green-500'
                                        : 'bg-white border-gray-300'
                                        }`}>
                                        {formData.attendees?.includes(member.id) && <CheckSquare size={14} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.attendees?.includes(member.id) || false}
                                        onChange={() => handleToggleMember(member.id)}
                                    />
                                    <img src={member.avatar} alt="" className="w-8 h-8 rounded-full" />
                                    <span className="text-sm text-slate-700 flex-1 font-medium">{member.name}</span>
                                </label>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                Nenhum membro cadastrado.
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Descrição do evento (opcional)"
                    />
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
                        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-sm shadow-orange-500/20 transition-all hover:shadow-orange-500/40"
                    >
                        {event ? 'Salvar Alterações' : 'Criar Evento'}
                    </button>
                </div>
            </form>
        </Modal >
    );
};

export default EventModal;
