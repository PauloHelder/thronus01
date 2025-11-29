import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Member, TeachingLesson } from '../../types';
import { Save, Calendar, CheckSquare } from 'lucide-react';

interface AddLessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (lesson: Omit<TeachingLesson, 'id' | 'classId'> | TeachingLesson) => void;
    lesson?: TeachingLesson | null;
    students: Member[];
}

const AddLessonModal: React.FC<AddLessonModalProps> = ({
    isOpen,
    onClose,
    onSave,
    lesson,
    students
}) => {
    const [date, setDate] = useState('');
    const [title, setTitle] = useState('');
    const [attendance, setAttendance] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (lesson) {
            setDate(lesson.date);
            setTitle(lesson.title);
            setAttendance(lesson.attendance);
            setNotes(lesson.notes || '');
        } else {
            setDate(new Date().toISOString().split('T')[0]);
            setTitle('');
            setAttendance([]);
            setNotes('');
        }
    }, [lesson, isOpen]);

    const handleToggleAttendance = (studentId: string) => {
        setAttendance(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!date || !title.trim()) {
            alert('Por favor, preencha a data e o título da aula.');
            return;
        }

        onSave({
            id: lesson?.id || crypto.randomUUID(),
            classId: lesson?.classId || '',
            date,
            title,
            attendance,
            notes
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={lesson ? 'Editar Aula' : 'Nova Aula'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Data da Aula <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Título da Aula <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: Introdução ao Evangelho"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Presença dos Alunos
                        </label>
                        <span className="text-xs text-slate-500">
                            {attendance.length} de {students.length} presentes
                        </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 space-y-2">
                        {students.length > 0 ? (
                            students.map(student => (
                                <label
                                    key={student.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${attendance.includes(student.id)
                                            ? 'bg-green-50 border border-green-200'
                                            : 'hover:bg-white border border-transparent'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${attendance.includes(student.id)
                                            ? 'bg-green-500 border-green-500'
                                            : 'bg-white border-gray-300'
                                        }`}>
                                        {attendance.includes(student.id) && <CheckSquare size={14} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={attendance.includes(student.id)}
                                        onChange={() => handleToggleAttendance(student.id)}
                                    />
                                    <img src={student.avatar} alt="" className="w-8 h-8 rounded-full" />
                                    <span className="text-sm text-slate-700 flex-1 font-medium">{student.name}</span>
                                </label>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                Nenhum aluno cadastrado na turma.
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Observações (opcional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none transition-all"
                        placeholder="Conteúdo abordado, atividades realizadas..."
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
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} />
                        {lesson ? 'Salvar Alterações' : 'Criar Aula'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddLessonModal;
