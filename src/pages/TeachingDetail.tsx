import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, UserPlus, Plus, Trash2, Pencil, BookOpen, Clock, CheckCircle, LayoutDashboard, Info, GraduationCap } from 'lucide-react';
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

    const [activeTab, setActiveTab] = useState<'geral' | 'alunos' | 'aulas'>('geral');
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

            {/* Content Tabs Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 lg:px-6">
                <div className="flex overflow-x-auto no-scrollbar gap-8">
                    {[
                        { id: 'geral', label: 'Geral', icon: <LayoutDashboard size={18} /> },
                        { id: 'alunos', label: 'Alunos', icon: <Users size={18} /> },
                        { id: 'aulas', label: 'Aulas', icon: <GraduationCap size={18} /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-all font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
                {activeTab === 'geral' && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                                <p className="text-blue-600 text-sm font-medium mb-1">Total de Alunos</p>
                                <p className="text-3xl font-bold text-blue-700">{teachingClass.students.length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
                                <p className="text-green-600 text-sm font-medium mb-1">Aulas Ministradas</p>
                                <p className="text-3xl font-bold text-green-700">{totalLessons}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
                                <p className="text-purple-600 text-sm font-medium mb-1">Taxa de Presença</p>
                                <p className="text-3xl font-bold text-purple-700">{attendanceRate}%</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200 shadow-sm">
                                <p className="text-orange-600 text-sm font-medium mb-1">Início</p>
                                <p className="text-lg font-bold text-orange-700">{formatDate(teachingClass.startDate)}</p>
                            </div>
                        </div>

                        {/* Teacher */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Info size={18} className="text-orange-500" />
                                Instrutor da Turma
                            </h2>
                            {teachingClass.teacher ? (
                                <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200 hover:shadow-md transition-shadow">
                                    <img src={teachingClass.teacher.avatar} alt="" className="w-16 h-16 rounded-full border-2 border-white shadow-sm" />
                                    <div>
                                        <p className="font-bold text-slate-800 text-lg uppercase tracking-tight">{teachingClass.teacher.name}</p>
                                        <p className="text-sm text-slate-600">{teachingClass.teacher.email}</p>
                                        <p className="text-xs font-bold text-orange-600 uppercase mt-1">Professor(a)</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 italic">
                                    Nenhum professor atribuído a esta turma.
                                </div>
                            )}
                        </div>

                        {/* Detalhes da Turma */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <BookOpen size={18} className="text-orange-500" />
                                Configurações e Local
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Horário</p>
                                            <p className="text-sm font-bold text-slate-800">{teachingClass.dayOfWeek} às {teachingClass.time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Fase / Módulo</p>
                                            <p className="text-sm font-bold text-slate-800">{teachingClass.stage}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                            <GraduationCap size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Categoria</p>
                                            <p className="text-sm font-bold text-slate-800">{teachingClass.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Sala / Local</p>
                                            <p className="text-sm font-bold text-slate-800">{teachingClass.room || 'Não definida'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border shadow-sm mb-2 ${getStatusColor(teachingClass.status)}`}>
                                        {teachingClass.status}
                                    </span>
                                    <p className="text-[10px] text-slate-500 font-medium">Situação cadastral da turma no sistema.</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'alunos' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Alunos Matriculados</h2>
                                <p className="text-sm text-slate-500">Gestão de estudantes desta turma</p>
                            </div>
                            <button
                                onClick={() => setIsAddStudentModalOpen(true)}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                            >
                                <UserPlus size={16} /> Adicionar Alunos
                            </button>
                        </div>

                        {teachingClass.students.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {teachingClass.students.map(student => (
                                    <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-gray-100">
                                        <img src={student.avatar} alt="" className="w-10 h-10 rounded-full border border-gray-200 shadow-sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{student.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-semibold truncate">{student.email || 'Sem email'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveStudent(student.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Remover"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <Users size={48} className="mx-auto mb-2 opacity-20" />
                                <p>Nenhum aluno matriculado nesta turma ainda.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'aulas' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">Cronograma de Aulas</h2>
                                <p className="text-sm text-slate-500">Histórico de lições e frequência escolar</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingLesson(null);
                                    setIsLessonModalOpen(true);
                                }}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                            >
                                <Plus size={16} /> Nova Aula
                            </button>
                        </div>

                        {teachingClass.lessons && teachingClass.lessons.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {teachingClass.lessons
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map(lesson => (
                                        <div key={lesson.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="p-2 bg-white rounded-lg border border-gray-200 text-orange-500 shadow-sm">
                                                            <Calendar size={18} />
                                                        </div>
                                                        <span className="font-black text-slate-800">{formatDate(lesson.date)}</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-800 mb-1 uppercase tracking-tight">{lesson.title}</h3>
                                                    {lesson.notes && (
                                                        <p className="text-sm text-slate-600 italic bg-white p-3 rounded-xl border border-gray-100 mt-2">
                                                            "{lesson.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right mr-2">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-green-50 text-green-700 border-green-200 shadow-sm`}>
                                                            <CheckCircle size={12} />
                                                            {lesson.attendance.length} / {teachingClass.students.length} presentes
                                                        </span>
                                                        <div className="flex -space-x-2 mt-2 justify-end">
                                                            {lesson.attendance.slice(0, 5).map(studentId => {
                                                                const student = teachingClass.students.find(s => s.id === studentId);
                                                                return student ? (
                                                                    <img
                                                                        key={studentId}
                                                                        src={student.avatar}
                                                                        alt={student.name}
                                                                        title={student.name}
                                                                        className="w-7 h-7 rounded-full border-2 border-white shadow-sm"
                                                                    />
                                                                ) : null;
                                                            })}
                                                            {lesson.attendance.length > 5 && (
                                                                <div className="w-7 h-7 rounded-full border-2 border-white bg-orange-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                                                                    +{lesson.attendance.length - 5}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 border-l pl-3 border-gray-200">
                                                        <button
                                                            onClick={() => handleEditLesson(lesson)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLesson(lesson.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <Calendar size={48} className="mx-auto mb-2 opacity-20" />
                                <p>Nenhuma aula registrada ainda.</p>
                            </div>
                        )}
                    </div>
                )}
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
