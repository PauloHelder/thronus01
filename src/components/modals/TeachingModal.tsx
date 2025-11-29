import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { TeachingClass } from '../../types';

interface TeachingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (teachingClass: Omit<TeachingClass, 'id'> | TeachingClass) => void;
    teachingClass?: TeachingClass;
}

const TeachingModal: React.FC<TeachingModalProps> = ({ isOpen, onClose, onSave, teachingClass }) => {
    const [formData, setFormData] = useState<Omit<TeachingClass, 'id'>>({
        name: '',
        teacher: '',
        teacherAvatar: '',
        schedule: '',
        room: '',
        studentsCount: 0,
        maxStudents: 30,
        status: 'Active',
        category: 'Adults',
        progress: 0,
    });

    useEffect(() => {
        if (teachingClass) {
            setFormData({
                name: teachingClass.name,
                teacher: teachingClass.teacher,
                teacherAvatar: teachingClass.teacherAvatar,
                schedule: teachingClass.schedule,
                room: teachingClass.room,
                studentsCount: teachingClass.studentsCount,
                maxStudents: teachingClass.maxStudents,
                status: teachingClass.status,
                category: teachingClass.category,
                progress: teachingClass.progress,
            });
        } else {
            setFormData({
                name: '',
                teacher: '',
                teacherAvatar: '',
                schedule: '',
                room: '',
                studentsCount: 0,
                maxStudents: 30,
                status: 'Active',
                category: 'Adults',
                progress: 0,
            });
        }
    }, [teachingClass, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: teachingClass?.id || crypto.randomUUID(),
            teacherAvatar: formData.teacherAvatar || `https://i.pravatar.cc/150?u=${formData.teacher}`,
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={teachingClass ? 'Editar Classe' : 'Nova Classe de Ensino'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Classe</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: Escola Bíblica Dominical"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Professor</label>
                            <input
                                type="text"
                                required
                                value={formData.teacher}
                                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="Nome do professor"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as TeachingClass['category'] })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="Kids">Crianças</option>
                                <option value="Youth">Jovens</option>
                                <option value="Adults">Adultos</option>
                                <option value="Leadership">Liderança</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                            <input
                                type="text"
                                required
                                value={formData.schedule}
                                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ex: Domingos 9:00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sala</label>
                            <input
                                type="text"
                                required
                                value={formData.room}
                                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ex: Sala 101"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Alunos Atuais</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.studentsCount}
                                onChange={(e) => setFormData({ ...formData, studentsCount: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Máximo de Alunos</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.maxStudents}
                                onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Progresso (%)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                value={formData.progress}
                                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as TeachingClass['status'] })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="Active">Ativo</option>
                            <option value="Upcoming">Próximo</option>
                            <option value="Completed">Concluído</option>
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
                        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-sm shadow-orange-500/20 transition-all hover:shadow-orange-500/40"
                    >
                        {teachingClass ? 'Salvar Alterações' : 'Criar Classe'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TeachingModal;
