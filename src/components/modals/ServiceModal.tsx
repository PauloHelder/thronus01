import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Service, Member } from '../../types';
import { useServiceTypes } from '../../hooks/useServiceTypes';
import { useMembers } from '../../hooks/useMembers';
import { Search, User } from 'lucide-react';

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (service: Omit<Service, 'id'> | Service) => void;
    service?: Service;
    churchId: string;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onSave, service, churchId }) => {
    const { serviceTypes, loading: loadingTypes } = useServiceTypes();
    const { members, loading: loadingMembers } = useMembers();
    const [formData, setFormData] = useState<Omit<Service, 'id'>>({
        churchId: churchId,
        serviceTypeId: '',
        typeName: '',
        status: 'Agendado',
        date: '',
        startTime: '',
        theme: '',
        preacher: '',
        preacherId: '',
        substitutePreacher: '',
        substitutePreacherId: '',
        leader: '',
        leaderId: '',
        substituteLeader: '',
        substituteLeaderId: '',
        location: 'Templo Local',
        description: '',
    });

    useEffect(() => {
        if (service) {
            setFormData({
                churchId: service.churchId,
                serviceTypeId: service.serviceTypeId,
                typeName: service.typeName,
                status: service.status,
                date: service.date,
                startTime: service.startTime,
                theme: service.theme || '',
                preacher: service.preacher,
                preacherId: service.preacherId || '',
                substitutePreacher: service.substitutePreacher || '',
                substitutePreacherId: service.substitutePreacherId || '',
                leader: service.leader,
                leaderId: service.leaderId || '',
                substituteLeader: service.substituteLeader || '',
                substituteLeaderId: service.substituteLeaderId || '',
                location: service.location,
                description: service.description || '',
                statistics: service.statistics,
            });
        } else {
            // Set first service type as default when creating new service
            if (serviceTypes.length > 0 && !formData.serviceTypeId) {
                const firstType = serviceTypes[0];
                setFormData(prev => ({
                    ...prev,
                    serviceTypeId: firstType.id,
                    typeName: firstType.name,
                    startTime: firstType.defaultStartTime?.substring(0, 5) || prev.startTime
                }));
            }
        }
    }, [service, isOpen, serviceTypes]);

    const handleServiceTypeChange = (typeId: string) => {
        const selectedType = serviceTypes.find(t => t.id === typeId);
        const updates: any = {
            ...formData,
            serviceTypeId: typeId,
            typeName: selectedType?.name || ''
        };

        // Pre-fill start time if type has default and form doesn't have a time yet
        if (selectedType?.defaultStartTime && !service) {
            updates.startTime = selectedType.defaultStartTime.substring(0, 5);
        }

        setFormData(updates);
    };

    const handleMemberSelect = (role: string, memberId: string) => {
        const member = members.find(m => m.id === memberId);
        const nameField = role.replace('Id', '');
        
        setFormData(prev => ({
            ...prev,
            [role]: memberId,
            [nameField]: member?.name || ''
        }));
    };

    const renderMemberSelect = (label: string, role: string, placeholder: string) => {
        const idValue = (formData as any)[role];
        const nameField = role.replace('Id', '');
        const nameValue = (formData as any)[nameField];

        return (
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label} <span className="text-xs text-slate-400">(opcional)</span></label>
                <div className="relative">
                    <select
                        value={idValue}
                        onChange={(e) => handleMemberSelect(role, e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all appearance-none"
                    >
                        <option value="">{placeholder}</option>
                        {members.map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                        <option value="custom">-- Digitar nome personalizado --</option>
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <User size={18} />
                    </div>
                </div>
                {idValue === 'custom' && (
                    <input
                        type="text"
                        value={nameValue}
                        onChange={(e) => setFormData({ ...formData, [nameField]: e.target.value })}
                        className="mt-2 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        placeholder="Digite o nome completo"
                    />
                )}
            </div>
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // If 'custom' is selected, set ID to null
        const finalData = { ...formData };
        if (finalData.preacherId === 'custom') (finalData as any).preacherId = null;
        if (finalData.substitutePreacherId === 'custom') (finalData as any).substitutePreacherId = null;
        if (finalData.leaderId === 'custom') (finalData as any).leaderId = null;
        if (finalData.substituteLeaderId === 'custom') (finalData as any).substituteLeaderId = null;

        // If editing existing service, include ID. Otherwise, let backend generate it.
        if (service?.id) {
            onSave({
                ...finalData,
                id: service.id,
            });
        } else {
            // Don't include ID for new services - backend will generate it
            const { id, ...dataWithoutId } = finalData as any;
            onSave(dataWithoutId);
        }

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Culto</label>
                            {loadingTypes ? (
                                <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-slate-500">
                                    Carregando tipos...
                                </div>
                            ) : (
                                <select
                                    required
                                    value={formData.serviceTypeId}
                                    onChange={(e) => handleServiceTypeChange(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="">Selecione um tipo</option>
                                    {serviceTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            )}
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tema da Ministração <span className="text-xs text-slate-400">(opcional)</span></label>
                        <input
                            type="text"
                            value={formData.theme}
                            onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: O Poder da Oração"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderMemberSelect('Pregador', 'preacherId', 'Selecione o pregador')}
                        {renderMemberSelect('Pregador Suplente', 'substitutePreacherId', 'Selecione o suplente')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderMemberSelect('Dirigente', 'leaderId', 'Selecione o dirigente')}
                        {renderMemberSelect('Dirigente Suplente', 'substituteLeaderId', 'Selecione o suplente')}
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
