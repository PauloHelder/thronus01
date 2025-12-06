import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Group } from '../../hooks/useGroups';
import { Member } from '../../types';
import { ANGOLA_PROVINCES, ANGOLA_MUNICIPALITIES } from '../../data/angolaLocations';

interface GroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (group: any) => void;
    group?: Group;
    members?: Member[];
}

const DAYS_OF_WEEK = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo'
];

const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose, onSave, group, members = [] }) => {
    const [formData, setFormData] = useState<{
        name: string;
        meetingDay: string;
        meetingTime: string;
        location: string;
        address: string;
        neighborhood: string;
        district: string;
        country: string;
        province: string;
        municipality: string;
        status: string;
        leaderId: string;
        coLeaderId: string;
        type: string;
        description: string;
    }>({
        name: '',
        meetingDay: '',
        meetingTime: '',
        location: '',
        address: '',
        neighborhood: '',
        district: '',
        country: 'Angola',
        province: '',
        municipality: '',
        status: 'Ativo',
        leaderId: '',
        coLeaderId: '',
        type: 'Célula',
        description: ''
    });
    const [groupProvince, setGroupProvince] = useState('');

    useEffect(() => {
        if (group) {
            setFormData({
                name: group.name,
                meetingDay: group.meeting_day || '',
                meetingTime: group.meeting_time || '',
                location: group.location || '',
                address: group.address || '',
                neighborhood: group.neighborhood || '',
                district: group.district || '',
                country: group.country || 'Angola',
                province: group.province || '',
                municipality: group.municipality || '',
                status: group.status || 'Ativo',
                leaderId: group.leader_id || '',
                coLeaderId: group.co_leader_id || '',
                type: group.type || 'Célula',
                description: group.description || ''
            });
            setGroupProvince(group.province || '');
        } else {
            setFormData({
                name: '',
                meetingDay: '',
                meetingTime: '',
                location: '',
                address: '',
                neighborhood: '',
                district: '',
                country: 'Angola',
                province: '',
                municipality: '',
                status: 'Ativo',
                leaderId: '',
                coLeaderId: '',
                type: 'Célula',
                description: ''
            });
            setGroupProvince('');
        }
    }, [group, isOpen]);

    const handleProvinceChange = (newProvince: string) => {
        setGroupProvince(newProvince);
        setFormData({ ...formData, province: newProvince, municipality: '' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const groupData = {
            ...(group?.id ? { id: group.id } : {}),
            name: formData.name,
            description: formData.description,
            type: formData.type,
            leader_id: formData.leaderId || null,
            co_leader_id: formData.coLeaderId || null,
            meeting_day: formData.meetingDay,
            meeting_time: formData.meetingTime,
            location: formData.location,
            address: formData.address,
            neighborhood: formData.neighborhood,
            district: formData.district,
            province: formData.province,
            country: formData.country,
            municipality: formData.municipality,
            status: formData.status
        };

        onSave(groupData);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={group ? 'Editar Grupo' : 'Criar Novo Grupo'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Grupo</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ex: Estudo Bíblico"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="Célula">Célula</option>
                                <option value="Grupo de Estudo">Grupo de Estudo</option>
                                <option value="Grupo de Oração">Grupo de Oração</option>
                                <option value="Discipulado">Discipulado</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all h-20 resize-none"
                            placeholder="Breve descrição do grupo..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Líder</label>
                            <select
                                required
                                value={formData.leaderId}
                                onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">Selecione um líder</option>
                                {members.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Co-líder (Opcional)</label>
                            <select
                                value={formData.coLeaderId}
                                onChange={(e) => setFormData({ ...formData, coLeaderId: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">Selecione um co-líder</option>
                                {members
                                    .filter(m => m.id !== formData.leaderId)
                                    .map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.name}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Dia da Reunião</label>
                            <select
                                value={formData.meetingDay}
                                onChange={(e) => setFormData({ ...formData, meetingDay: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">Selecione o dia</option>
                                {DAYS_OF_WEEK.map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                            <input
                                type="time"
                                value={formData.meetingTime}
                                onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Local de Encontro</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: Casa do Líder, Sala 3, Online"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: Rua das Flores, 123"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                            <input
                                type="text"
                                value={formData.neighborhood}
                                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="Nome do bairro"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Distrito/Comuna</label>
                            <input
                                type="text"
                                value={formData.district}
                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="Distrito ou comuna"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
                            <select
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="Angola">Angola</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Província</label>
                            <select
                                value={groupProvince}
                                onChange={(e) => handleProvinceChange(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">Selecione a província</option>
                                {ANGOLA_PROVINCES.map(prov => (
                                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Município</label>
                            <select
                                value={formData.municipality}
                                onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                                disabled={!groupProvince}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Selecione o município</option>
                                {groupProvince && ANGOLA_MUNICIPALITIES
                                    .filter(mun => mun.provinceId === groupProvince)
                                    .map(mun => (
                                        <option key={mun.id} value={mun.id}>{mun.name}</option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="Ativo">Ativo</option>
                            <option value="Cheio">Cheio</option>
                            <option value="Inativo">Inativo</option>
                        </select>
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
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                    >
                        {group ? 'Salvar Alterações' : 'Criar Grupo'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default GroupModal;
