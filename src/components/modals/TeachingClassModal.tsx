import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { TeachingClass, Member, ChristianStage, TeachingCategory } from '../../types';
import { DAYS_OF_WEEK } from '../../data/teachingDefaults';
import { Save, Calendar, Clock } from 'lucide-react';

interface TeachingClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (classData: Omit<TeachingClass, 'id'> | TeachingClass) => void;
    teachingClass?: TeachingClass | null;
    members: Member[];
    stages: ChristianStage[];
    categories: TeachingCategory[];
}

const TeachingClassModal: React.FC<TeachingClassModalProps> = ({
    isOpen,
    onClose,
    onSave,
    teachingClass,
    members,
    stages,
    categories
}) => {
    const [name, setName] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [stage, setStage] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState<typeof DAYS_OF_WEEK[number]>('Domingo');
    const [time, setTime] = useState('');
    const [room, setRoom] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState<TeachingClass['status']>('Agendada');

    useEffect(() => {
        if (teachingClass) {
            setName(teachingClass.name);
            setTeacherId(teachingClass.teacherId);
            // Map name to ID for the select input
            const foundStage = stages.find(s => s.name === teachingClass.stage || s.id === teachingClass.stage);
            setStage(foundStage ? foundStage.id : '');

            setDayOfWeek(teachingClass.dayOfWeek as any);
            setTime(teachingClass.time);
            setRoom(teachingClass.room);
            setStartDate(teachingClass.startDate);
            setEndDate(teachingClass.endDate || '');

            const foundCat = categories.find(c => c.name === teachingClass.category || c.id === teachingClass.category);
            setCategory(foundCat ? foundCat.id : '');

            setStatus(teachingClass.status);
        } else {
            setName('');
            setTeacherId('');
            setStage('');
            setDayOfWeek('Domingo');
            setTime('');
            setRoom('');
            setStartDate('');
            setEndDate('');
            setCategory('');
            setStatus('Agendada');
        }
    }, [teachingClass, isOpen, stages, categories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !teacherId || !stage || !time || !room || !startDate || !category) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const teacher = members.find(m => m.id === teacherId);
        // Pass ID here, the hook will handle it

        onSave({
            id: teachingClass?.id || crypto.randomUUID(), // Hook ignores ID on add
            name,
            teacherId,
            teacher,
            stage, // Sending ID
            dayOfWeek,
            time,
            room,
            startDate,
            endDate: endDate || undefined,
            category, // Sending ID
            status,
            students: teachingClass?.students || [],
            lessons: teachingClass?.lessons || []
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={teachingClass ? 'Editar Turma' : 'Nova Turma'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nome da Turma <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        placeholder="Ex: Escola Bíblica Dominical"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Professor <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={teacherId}
                            onChange={(e) => setTeacherId(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Selecione um professor...</option>
                            {members.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Estágio da Carreira Cristã <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={stage}
                            onChange={(e) => setStage(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Selecione um estágio...</option>
                            {stages.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Dia da Semana <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={dayOfWeek}
                            onChange={(e) => setDayOfWeek(e.target.value as typeof dayOfWeek)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            {DAYS_OF_WEEK.map(day => (
                                <option key={day} value={day}>{day}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Horário <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="time"
                                required
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Sala <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: Sala 1"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Data de Início <span className="text-red-500">*</span>
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Data de Término (Opcional)
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Categoria <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Selecione uma categoria...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Status <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={status}
                            onChange={(e) => setStatus(e.target.value as typeof status)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="Agendada">Agendada</option>
                            <option value="Em Andamento">Em Andamento</option>
                            <option value="Concluída">Concluída</option>
                            <option value="Cancelada">Cancelada</option>
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
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} />
                        {teachingClass ? 'Salvar Alterações' : 'Criar Turma'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TeachingClassModal;
