import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TeachingClass, ChristianStage, TeachingCategory, Member, TeachingLesson } from '../types';
import { DEFAULT_CHRISTIAN_STAGES, DEFAULT_TEACHING_CATEGORIES } from '../data/teachingDefaults';

export const useTeaching = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState<TeachingClass[]>([]);
    const [stages, setStages] = useState<ChristianStage[]>([]);
    const [categories, setCategories] = useState<TeachingCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        if (!user?.churchId) return;
        setLoading(true);
        try {
            await Promise.all([fetchStagesAndCategories(), fetchClasses()]);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.churchId]);

    const ensureDefaults = async () => {
        if (!user?.churchId) return;

        try {
            // Check and Seed Stages
            const { data: existingStages } = await supabase
                .from('christian_stages')
                .select('name')
                .eq('church_id', user.churchId);

            const existingStageNames = new Set(existingStages?.map((s: any) => s.name) || []);
            const stagesToInsert = DEFAULT_CHRISTIAN_STAGES
                .filter(s => !existingStageNames.has(s.name))
                .map(s => ({
                    church_id: user.churchId,
                    name: s.name,
                    description: s.description,
                    order_index: s.order
                }));

            if (stagesToInsert.length > 0) {
                await supabase.from('christian_stages').insert(stagesToInsert);
            }

            // Check and Seed Categories
            const { data: existingCats } = await supabase
                .from('teaching_categories')
                .select('name')
                .eq('church_id', user.churchId);

            const existingCatNames = new Set(existingCats?.map((c: any) => c.name) || []);
            const catsToInsert = DEFAULT_TEACHING_CATEGORIES
                .filter(c => !existingCatNames.has(c.name))
                .map(c => ({
                    church_id: user.churchId,
                    name: c.name,
                    description: c.description
                }));

            if (catsToInsert.length > 0) {
                await supabase.from('teaching_categories').insert(catsToInsert);
            }
        } catch (err) {
            console.error('Error ensuring defaults:', err);
        }
    };

    const fetchStagesAndCategories = async () => {
        if (!user?.churchId) return;

        await ensureDefaults();

        const { data: sData } = await supabase
            .from('christian_stages')
            .select('*')
            .eq('church_id', user.churchId)
            .order('order_index');

        if (sData) {
            setStages(sData.map((s: any) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                order: s.order_index
            })));
        }

        const { data: cData } = await supabase
            .from('teaching_categories')
            .select('*')
            .eq('church_id', user.churchId)
            .order('name');

        if (cData) {
            setCategories(cData.map((c: any) => ({
                id: c.id,
                name: c.name,
                description: c.description
            })));
        }
    };

    const fetchClasses = async () => {
        if (!user?.churchId) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('teaching_classes' as any)
                .select(`
                    *,
                    teacher:members!teacher_id(id, name, avatar_url),
                    stage:christian_stages(id, name),
                    category:teaching_categories(id, name),
                    students:teaching_class_students(member:members(id, name, avatar_url)),
                    lessons:teaching_lessons(id)
                `)
                .eq('church_id', user.churchId)
                .is('deleted_at', null)
                .order('start_date', { ascending: false });

            if (fetchError) throw fetchError;

            const formattedClasses: TeachingClass[] = data.map((d: any) => ({
                id: d.id,
                name: d.name,
                teacherId: d.teacher_id,
                teacher: d.teacher ? { ...d.teacher, avatar: d.teacher.avatar_url } : undefined,
                stage: d.stage?.name || '', // Map to name string as per frontend type
                category: d.category?.name || '', // Map to name string
                dayOfWeek: d.day_of_week,
                time: d.time?.substring(0, 5),
                room: d.room,
                startDate: d.start_date,
                endDate: d.end_date,
                status: d.status,
                students: d.students?.map((s: any) => ({
                    id: s.member.id,
                    name: s.member.name,
                    avatar: s.member.avatar_url
                })) || [],
                lessons: d.lessons || []
            }));

            setClasses(formattedClasses);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching classes:', err);
            setError('Erro ao carregar turmas');
        }
    };

    const addClass = async (classData: Omit<TeachingClass, 'id'>) => {
        if (!user?.churchId) return false;

        try {
            // Find IDs for stage and category names
            // Assumes user selected from dropdown populated by stages/categories derived from DB
            // But if frontend sends ID in 'stage' field (which we might do in modal), we handle that.
            // Wait, Modal logic: 
            // setStage(stages.find(s => s.id === stage)?.name || stage);
            // The modal sends NAMES to onSave in the current code I read !!!
            // "stage: stageName,"

            // I need to reverse lookup ID from Name OR change Modal to send IDs.
            // Changing Modal to send IDs is cleaner but "no layout change".
            // I will update the Modal to send IDs or just handle ID lookup here.
            // Ideally, Frontend Type 'stage' should be string (name) or ID.

            // Let's assume for now I'll fix the modal to send IDs in 'stage' field but type might be string.
            // Actually, querying by name is risky if duplicates.
            // Best: Update Modal to send IDs in a separate field or stick to ID if 'stage' type allows it.
            // In types.ts, stage is string. It can be ID.

            // Let's verify what data comes in.
            // I will implement a helper to find ID by Name if needed, or just expect ID.

            // For robust implementation, I'll prefer the Modal to send IDs.
            // I will check the Modal code again. It sets stage state to ID from select, then finds name on submit.
            // "const stageName = stages.find(s => s.id === stage)?.name || stage;"
            // "onSave({ ... stage: stageName ... })"

            // I SHOULD CHANGE this in Modal to send ID, or I have to look it up.
            // I will change the Modal to send ID to make backend life easier and cleaner.

            const stageId = stages.find(s => s.name === classData.stage || s.id === classData.stage)?.id;
            const categoryId = categories.find(c => c.name === classData.category || c.id === classData.category)?.id;

            const { error: insertError } = await supabase
                .from('teaching_classes' as any)
                .insert({
                    church_id: user.churchId,
                    name: classData.name,
                    teacher_id: classData.teacherId,
                    stage_id: stageId,
                    category_id: categoryId,
                    day_of_week: classData.dayOfWeek,
                    time: classData.time,
                    room: classData.room,
                    start_date: classData.startDate,
                    end_date: classData.endDate || null,
                    status: classData.status
                });

            if (insertError) throw insertError;

            await fetchClasses();
            return true;
        } catch (err: any) {
            console.error('Error adding class:', err);
            setError(err.message);
            return false;
        }
    };

    const updateClass = async (id: string, classData: Partial<TeachingClass>) => {
        if (!user?.churchId) return false;

        try {
            const stageId = stages.find(s => s.name === classData.stage || s.id === classData.stage)?.id;
            const categoryId = categories.find(c => c.name === classData.category || c.id === classData.category)?.id;

            const updatePayload: any = {
                name: classData.name,
                teacher_id: classData.teacherId,
                day_of_week: classData.dayOfWeek,
                time: classData.time,
                room: classData.room,
                start_date: classData.startDate,
                end_date: classData.endDate || null,
                status: classData.status
            };
            if (stageId) updatePayload.stage_id = stageId;
            if (categoryId) updatePayload.category_id = categoryId;

            const { error: updateError } = await supabase
                .from('teaching_classes' as any)
                .update(updatePayload)
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchClasses();
            return true;
        } catch (err: any) {
            console.error('Error updating class:', err);
            setError(err.message);
            return false;
        }
    };

    const addStage = async (name: string) => {
        if (!user?.churchId) return false;
        try {
            const { error: insertError } = await supabase
                .from('christian_stages')
                .insert({
                    church_id: user.churchId,
                    name,
                    order_index: stages.length + 1
                });
            if (insertError) throw insertError;
            await fetchStagesAndCategories();
            return true;
        } catch (err: any) {
            console.error('Error adding stage:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteStage = async (id: string) => {
        if (!user?.churchId) return false;
        try {
            const { error: deleteError } = await supabase
                .from('christian_stages')
                .delete()
                .eq('id', id)
                .eq('church_id', user.churchId);
            if (deleteError) throw deleteError;
            await fetchStagesAndCategories();
            return true;
        } catch (err: any) {
            console.error('Error deleting stage:', err);
            setError(err.message);
            return false;
        }
    };

    const addCategory = async (name: string) => {
        if (!user?.churchId) return false;
        try {
            const { error: insertError } = await supabase
                .from('teaching_categories')
                .insert({
                    church_id: user.churchId,
                    name
                });
            if (insertError) throw insertError;
            await fetchStagesAndCategories();
            return true;
        } catch (err: any) {
            console.error('Error adding category:', err);
            setError(err.message);
            return false;
        }
    };

    const deleteCategory = async (id: string) => {
        if (!user?.churchId) return false;
        try {
            const { error: deleteError } = await supabase
                .from('teaching_categories')
                .delete()
                .eq('id', id)
                .eq('church_id', user.churchId);
            if (deleteError) throw deleteError;
            await fetchStagesAndCategories();
            return true;
        } catch (err: any) {
            console.error('Error deleting category:', err);
            setError(err.message);
            return false;
        }
    };

    const fetchClassDetails = useCallback(async (classId: string) => {
        if (!user?.churchId) return null;
        try {
            const { data, error } = await supabase
                .from('teaching_classes' as any)
                .select(`
                    *,
                    teacher:members!teacher_id(id, name, email, phone, avatar_url),
                    stage:christian_stages(name),
                    category:teaching_categories(name),
                    students:teaching_class_students(member:members(id, name, email, avatar_url)),
                    lessons:teaching_lessons(
                        id, date, title, notes,
                        attendance:teaching_lesson_attendance(member_id)
                    )
                `)
                .eq('id', classId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;

            const formatted: TeachingClass = {
                id: data.id,
                name: data.name,
                teacherId: data.teacher_id,
                teacher: data.teacher ? { ...data.teacher, avatar: data.teacher.avatar_url } : undefined,
                stage: data.stage?.name || '',
                category: data.category?.name || '',
                dayOfWeek: data.day_of_week,
                time: data.time?.substring(0, 5),
                room: data.room,
                startDate: data.start_date,
                endDate: data.end_date,
                status: data.status,
                students: data.students?.map((s: any) => ({
                    id: s.member.id,
                    name: s.member.name,
                    email: s.member.email,
                    avatar: s.member.avatar_url
                })) || [],
                lessons: data.lessons?.map((l: any) => ({
                    id: l.id,
                    classId: data.id,
                    date: l.date,
                    title: l.title,
                    notes: l.notes,
                    attendance: l.attendance?.map((a: any) => a.member_id) || []
                })) || []
            };

            return formatted;
        } catch (err: any) {
            console.error('Error fetching class details:', err);
            return null;
        }
    }, [user?.churchId]);

    const addStudentToClass = async (classId: string, studentIds: string[]) => {
        if (!user?.churchId) return false;
        try {
            const records = studentIds.map(id => ({
                class_id: classId,
                member_id: id
            }));
            const { error: insertError } = await supabase
                .from('teaching_class_students')
                .insert(records);

            if (insertError) throw insertError;
            return true;
        } catch (err: any) {
            console.error('Error adding students:', err);
            return false;
        }
    };

    const removeStudentFromClass = async (classId: string, studentId: string) => {
        if (!user?.churchId) return false;
        try {
            const { error: deleteError } = await supabase
                .from('teaching_class_students')
                .delete()
                .eq('class_id', classId)
                .eq('member_id', studentId);

            if (deleteError) throw deleteError;
            return true;
        } catch (err: any) {
            console.error('Error removing student:', err);
            return false;
        }
    };

    const addLesson = async (classId: string, lessonData: any) => {
        if (!user?.churchId) return false;
        try {
            const { data: lessonId, error: rpcError } = await supabase
                .rpc('manage_teaching_lesson_v2', {
                    p_lesson_id: null, // Insert mode
                    p_class_id: classId,
                    p_date: lessonData.date,
                    p_title: lessonData.title,
                    p_notes: lessonData.notes || '',
                    p_attendance: lessonData.attendance || []
                });

            if (rpcError) throw rpcError;
            return true;
        } catch (err: any) {
            console.error('Error adding lesson (RPC v2):', err);
            return false;
        }
    };

    const updateLesson = async (id: string, classId: string, lessonData: any) => {
        if (!user?.churchId) return false;
        try {
            // Using RPC v2 which is robust against classId mismatch on update
            const { error: rpcError } = await supabase
                .rpc('manage_teaching_lesson_v2', {
                    p_lesson_id: id, // Update mode
                    p_class_id: classId, // Only used for insert logic fallback, update logic derives it
                    p_date: lessonData.date,
                    p_title: lessonData.title,
                    p_notes: lessonData.notes || '',
                    p_attendance: lessonData.attendance || []
                });

            if (rpcError) throw rpcError;
            return true;
        } catch (err: any) {
            console.error('Error updating lesson (RPC v2):', err);
            setError(err.message || 'Erro ao atualizar aula');
            return false;
        }
    };

    const deleteLesson = async (id: string) => {
        if (!user?.churchId) return false;
        try {
            // Deleting lesson automatically deletes attendance due to cascade if configured, 
            // but let's assume standard behavior. If cascade is not set, we should delete children first.
            // Usually Supabase relationships have cascade but let's be safe or rely on DB.
            // Assuming DB has cascade on delete.
            const { error: deleteError } = await supabase
                .from('teaching_lessons')
                .delete()
                .eq('id', id);
            if (deleteError) throw deleteError;
            return true;
        } catch (err: any) {
            console.error('Error deleting lesson:', err);
            return false;
        }
    };

    useEffect(() => {
        refetch();
    }, [refetch]);

    return {
        classes,
        stages,
        categories,
        loading,
        error,
        addClass,
        updateClass,
        addStage,
        deleteStage,
        addCategory,
        deleteCategory,

        fetchClassDetails,
        addStudentToClass,
        removeStudentFromClass,
        addLesson,
        updateLesson,
        deleteLesson,
        refetch
    };
};
