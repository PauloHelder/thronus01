import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Group, Member } from '../../types';
import { ANGOLA_PROVINCES, ANGOLA_MUNICIPALITIES } from '../../data/angolaLocations';

interface GroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (group: Omit<Group, 'id'> | Group) => void;
    group?: Group;
    members?: Member[];
}

const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose, onSave, group, members = [] }) => {
    const [formData, setFormData] = useState<{
        name: string;
        meetingTime: string;
        meetingPlace: string;
        address: string;
        neighborhood: string;
        district: string;
        country: string;
        province: string;
        municipality: string;
        status: Group['status'];
        leaderId: string;
        coLeaderId: string;
    }>({
        name: '',
        meetingTime: '',
        meetingPlace: '',
        address: '',
        neighborhood: '',
        district: '',
        country: 'Angola',
        province: '',
        municipality: '',
        status: 'Active',
        leaderId: '',
        coLeaderId: '',
    });
    const [groupProvince, setGroupProvince] = useState('');

    useEffect(() => {
        if (group) {
            setFormData({
                name: group.name,
                meetingTime: group.meetingTime,
                meetingPlace: group.meetingPlace || '',
                address: group.address || '',
                neighborhood: group.neighborhood || '',
                district: group.district || '',
                country: group.country || 'Angola',
                province: group.province || '',
                municipality: group.municipality || '',
                status: group.status,
                leaderId: group.leaderId || (group.leaders && group.leaders.length > 0 ? group.leaders[0].id : ''),
                coLeaderId: group.coLeaderId || (group.leaders && group.leaders.length > 1 ? group.leaders[1].id : ''),
            });
            setGroupProvince(group.province || '');
        } else {
            setFormData({
                name: '',
                meetingTime: '',
                meetingPlace: '',
                address: '',
                neighborhood: '',
                district: '',
                country: 'Angola',
                province: '',
                municipality: '',
                status: 'Active',
                leaderId: '',
                coLeaderId: '',
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

        // Encontrar os objetos Member completos para os líderes selecionados
        const leader = members.find(m => m.id === formData.leaderId);
        const coLeader = members.find(m => m.id === formData.coLeaderId);

        const leaders: Member[] = [];
        if (leader) leaders.push(leader);
        if (coLeader) leaders.push(coLeader);

        onSave({
            ...formData,
            id: group?.id || crypto.randomUUID(),
            leaders: leaders,
            members: group?.members || [],
            memberCount: group?.memberCount || 0,
        });
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
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Grupo</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: Estudo Bíblico dos Homens"
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
                                    .filter(m => m.id !== formData.leaderId) // Não mostrar o líder selecionado
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Horário da Reunião</label>
                            <input
                                type="text"
                                required
                                value={formData.meetingTime}
                                onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ex: Quartas, 19:00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Local de Encontro</label>
                            <input
                                type="text"
                                value={formData.meetingPlace}
                                onChange={(e) => setFormData({ ...formData, meetingPlace: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ex: Casa do Líder, Sala 3, Online"
                            />
                        </div>
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
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as Group['status'] })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="Active">Ativo</option>
                            <option value="Full">Cheio</option>
                            <option value="Inactive">Inativo</option>
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
