import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, UserPlus, Plus, Trash2, Pencil, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { TeachingClass, TeachingLesson } from '../types';
import AddStudentModal from '../components/modals/AddStudentModal';
import AddLessonModal from '../components/modals/AddLessonModal';
import { useTeaching } from '../hooks/useTeaching';
import { useMembers } from '../hooks/useMembers';

const TeachingDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchClassDetails, addStudentToClass, removeStudentFromClass, addLesson, updateLesson, deleteLesson } = useTeaching();
    const { members } = useMembers();

    const [teachingClass, setTeachingClass] = useState<TeachingClass | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<TeachingLesson | null>(null);

    const loadClass = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        const data = await fetchClassDetails(id);
        if (data) {
            setTeachingClass(data);
        } else {
            console.error("Class not found");
            // Optionally navigate back or show error
        }
        setLoading(false);
    }, [id, fetchClassDetails]);

    useEffect(() => {
        loadClass();
    }, [loadClass]);

    const handleAddStudents = async (memberIds: string[]) => {
        if (!teachingClass) return;
        const success = await addStudentToClass(teachingClass.id, memberIds);
        if (success) {
            await loadClass();
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!teachingClass) return;
        if (window.confirm('Tem certeza que deseja remover este aluno da turma?')) {
            const success = await removeStudentFromClass(teachingClass.id, studentId);
            if (success) {
                await loadClass();
            }
        }
    };

    const handleSaveLesson = async (lessonData: Omit<TeachingLesson, 'id' | 'classId'> | TeachingLesson) => {
        if (!teachingClass) return;

        if ('id' in lessonData) {
            // Edit
            const success = await updateLesson(lessonData.id, teachingClass.id, lessonData);
            if (success) {
                await loadClass();
                setIsLessonModalOpen(false);
                setEditingLesson(null);
            }
        } else {
            // New
            const success = await addLesson(teachingClass.id, lessonData);
            if (success) {
                await loadClass();
                setIsLessonModalOpen(false);
            }
        }
    };

    const handleEditLesson = (lesson: TeachingLesson) => {
        setEditingLesson(lesson);
        setIsLessonModalOpen(true);
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta aula?')) {
            const success = await deleteLesson(lessonId);
            if (success) {
                await loadClass();
            }
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const getStatusColor = (status: TeachingClass['status']) => {
        switch (status) {
            case 'Agendado':
            case 'Agendada': return 'bg-blue-100 text-blue-700';
            case 'Em Andamento': return 'bg-green-100 text-green-700';
            case 'Concluído':
            case 'Concluída': return 'bg-gray-100 text-gray-700';
            case 'Cancelado':
            case 'Cancelada': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!teachingClass) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-semibold text-gray-700">Turma não encontrada</h2>
                <button
                    onClick={() => navigate('/teaching')}
                    className="text-orange-500 hover:underline"
                >
                    Voltar para Ensino
                </button>
            </div>
        );
    }

    // Available members (not in class and not the teacher)
    // Ensure we handle cases where members might be loading
    const availableMembers = members ? members.filter(
        member => member.id !== teachingClass.teacherId && !teachingClass.students.some(s => s.id === member.id)
    ) : [];

    // Calculate attendance rate
    const totalLessons = teachingClass.lessons?.length || 0;
    const totalAttendances = teachingClass.lessons?.reduce((acc, l) => acc + l.attendance.length, 0) || 0;
    const maxPossibleAttendances = totalLessons * teachingClass.students.length;
    const attendanceRate = (totalLessons > 0 && teachingClass.students.length > 0)
        ? Math.round((totalAttendances / maxPossibleAttendances) * 100)
        : 0;

    return (
        <div className="h-full overflow-y-auto bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
                <button
                    onClick={() => navigate('/teaching')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Voltar para Ensino</span>
                </button>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                        <BookOpen className="text-orange-600" size={32} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-slate-800">{teachingClass.name}</h1>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(teachingClass.status)}`}>
                                {teachingClass.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{teachingClass.dayOfWeek} às {teachingClass.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <BookOpen size={14} />
                                <span>{teachingClass.stage} • {teachingClass.category}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>📍 {teachingClass.room}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <p className="text-blue-600 text-sm font-medium mb-1">Total de Alunos</p>
                        <p className="text-3xl font-bold text-blue-700">{teachingClass.students.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <p className="text-green-600 text-sm font-medium mb-1">Aulas Ministradas</p>
                        <p className="text-3xl font-bold text-green-700">{totalLessons}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <p className="text-purple-600 text-sm font-medium mb-1">Taxa de Presença</p>
                        <p className="text-3xl font-bold text-purple-700">{attendanceRate}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                        <p className="text-orange-600 text-sm font-medium mb-1">Início</p>
                        <p className="text-lg font-bold text-orange-700">{formatDate(teachingClass.startDate)}</p>
                    </div>
                </div>

                {/* Teacher */}
                {teachingClass.teacher && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Professor</h2>
                        <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <img src={teachingClass.teacher.avatar} alt="" className="w-16 h-16 rounded-full" />
                            <div>
                                <p className="font-semibold text-slate-800 text-lg">{teachingClass.teacher.name}</p>
                                <p className="text-sm text-slate-600">{teachingClass.teacher.email}</p>
                                <p className="text-sm text-slate-600">{teachingClass.teacher.phone}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Students List */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Alunos da Turma</h2>
                        <button
                            onClick={() => setIsAddStudentModalOpen(true)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <UserPlus size={16} /> Adicionar Alunos
                        </button>
                    </div>

                    {teachingClass.students.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {teachingClass.students.map(student => (
                                <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <img src={student.avatar} alt="" className="w-12 h-12 rounded-full" />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">{student.name}</p>
                                        <p className="text-sm text-slate-600">{student.email}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveStudent(student.id)}
                                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Remover
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Users size={48} className="mx-auto mb-2 text-gray-300" />
                            <p>Nenhum aluno cadastrado ainda</p>
                        </div>
                    )}
                </div>

                {/* Lessons List */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Aulas</h2>
                        <button
                            onClick={() => {
                                setEditingLesson(null);
                                setIsLessonModalOpen(true);
                            }}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} /> Nova Aula
                        </button>
                    </div>

                    {teachingClass.lessons && teachingClass.lessons.length > 0 ? (
                        <div className="space-y-3">
                            {teachingClass.lessons
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map(lesson => (
                                    <div key={lesson.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Calendar size={16} className="text-slate-600" />
                                                    <span className="font-medium text-slate-800">{formatDate(lesson.date)}</span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-800 mb-1">{lesson.title}</h3>
                                                {lesson.notes && (
                                                    <p className="text-sm text-slate-600">{lesson.notes}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditLesson(lesson)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                                            <div className="flex items-center gap-2 text-sm">
                                                <CheckCircle size={14} className="text-green-600" />
                                                <span className="text-slate-600">
                                                    {lesson.attendance.length} de {teachingClass.students.length} presentes
                                                </span>
                                            </div>
                                            {lesson.attendance.length > 0 && (
                                                <div className="flex -space-x-2">
                                                    {lesson.attendance.slice(0, 5).map(studentId => {
                                                        const student = teachingClass.students.find(s => s.id === studentId);
                                                        return student ? (
                                                            <img
                                                                key={studentId}
                                                                src={student.avatar}
                                                                alt={student.name}
                                                                title={student.name}
                                                                className="w-6 h-6 rounded-full border-2 border-white"
                                                            />
                                                        ) : null;
                                                    })}
                                                    {lesson.attendance.length > 5 && (
                                                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                                                            +{lesson.attendance.length - 5}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Calendar size={48} className="mx-auto mb-2 text-gray-300" />
                            <p>Nenhuma aula registrada ainda</p>
                        </div>
                    )}
                </div>
            </div>

            <AddStudentModal
                isOpen={isAddStudentModalOpen}
                onClose={() => setIsAddStudentModalOpen(false)}
                onSave={handleAddStudents}
                availableMembers={availableMembers}
            />

            <AddLessonModal
                isOpen={isLessonModalOpen}
                onClose={() => setIsLessonModalOpen(false)}
                onSave={handleSaveLesson}
                lesson={editingLesson}
                students={teachingClass.students}
            />
        </div>
    );
};

export default TeachingDetail;
