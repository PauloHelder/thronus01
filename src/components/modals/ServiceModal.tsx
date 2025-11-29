import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Service } from '../../types';

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (service: Omit<Service, 'id'> | Service) => void;
    service?: Service;
    churchId: string;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onSave, service, churchId }) => {
    const [formData, setFormData] = useState<Omit<Service, 'id'>>({
        churchId: churchId,
        name: '',
        type: 'Culto de Domingo',
        status: 'Agendado',
        date: '',
        startTime: '',
        preacher: '',
        leader: '',
        location: '',
        description: '',
    });

    useEffect(() => {
        if (service) {
            setFormData({
                churchId: service.churchId,
                name: service.name,
                type: service.type,
                status: service.status,
                date: service.date,
                startTime: service.startTime,
                preacher: service.preacher,
                leader: service.leader,
                location: service.location,
                description: service.description || '',
                statistics: service.statistics,
            });
        } else {
            setFormData({
                churchId: churchId,
                name: '',
                type: 'Culto de Domingo',
                status: 'Agendado',
                date: '',
                startTime: '',
                preacher: '',
                leader: '',
                location: '',
                description: '',
            });
        }
    }, [service, isOpen, churchId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: service?.id || crypto.randomUUID(),
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={service ? 'Editar Culto' : 'Adicionar Novo Culto'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Culto</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: Culto de Celebração"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Culto</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as Service['type'] })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="Culto de Domingo">Culto de Domingo</option>
                                <option value="Culto de Meio da Semana">Culto de Meio da Semana</option>
                                <option value="Culto Jovem">Culto Jovem</option>
                                <option value="Reunião de Oração">Reunião de Oração</option>
                                <option value="Estudo Bíblico">Estudo Bíblico</option>
                                <option value="Culto Especial">Culto Especial</option>
                                <option value="Conferência">Conferência</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as Service['status'] })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="Agendado">Agendado</option>
                                <option value="Concluído">Concluído</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Horário de Início</label>
                            <input
                                type="time"
                                required
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Pregador</label>
                            <input
                                type="text"
                                required
                                value={formData.preacher}
                                onChange={(e) => setFormData({ ...formData, preacher: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="Nome do pregador"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Dirigente</label>
                            <input
                                type="text"
                                required
                                value={formData.leader}
                                onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="Nome do dirigente"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
                        <input
                            type="text"
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Local do culto"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                            placeholder="Descrição do culto (opcional)"
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
                        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-sm shadow-orange-500/20 transition-all hover:shadow-orange-500/40"
                    >
                        {service ? 'Salvar Alterações' : 'Criar Culto'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ServiceModal;
