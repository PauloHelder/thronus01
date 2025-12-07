-- FUNCTION: Manage Teaching Lesson v2 (Robust Fix)
-- Fixes NULL lesson_id issue by explicitly handling ID assignment and ensuring atomic operations.

CREATE OR REPLACE FUNCTION manage_teaching_lesson_v2(
    p_lesson_id UUID, -- NULL for new lesson
    p_class_id UUID,  -- Required for Insert, ignored for Update (we derive it)
    p_date DATE,
    p_title TEXT,
    p_notes TEXT,
    p_attendance UUID[] -- Array of Member IDs present
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges to bypass RLS
SET search_path = public
AS $$
DECLARE
    v_lesson_id UUID;
    v_user_church_id UUID;
    v_target_class_id UUID;
    v_class_church_id UUID;
BEGIN
    -- 1. Get User's Church
    SELECT church_id INTO v_user_church_id FROM public.users WHERE id = auth.uid() LIMIT 1;
    IF v_user_church_id IS NULL THEN RAISE EXCEPTION 'User not associated with a church'; END IF;

    -- 2. LOGIC SPLIT
    IF p_lesson_id IS NOT NULL THEN
        -- UPDATE MODE
        v_lesson_id := p_lesson_id; -- Explicitly set ID to avoid RETURNING pitfalls

        -- Find the lesson and its class independently
        SELECT class_id INTO v_target_class_id FROM public.teaching_lessons WHERE id = p_lesson_id;
        
        IF v_target_class_id IS NULL THEN
            RAISE EXCEPTION 'Lesson not found (invalid ID)';
        END IF;

        -- Verify ownership via Class->Church
        SELECT church_id INTO v_class_church_id FROM public.teaching_classes WHERE id = v_target_class_id;
        
        IF v_class_church_id IS NULL OR v_class_church_id != v_user_church_id THEN
            RAISE EXCEPTION 'Permission Denied: Lesson belongs to another church';
        END IF;

        -- Perform Update
        UPDATE public.teaching_lessons
        SET date = p_date, title = p_title, notes = p_notes, updated_at = NOW()
        WHERE id = p_lesson_id;
        -- NOTE: We removed RETURNING here because we already have v_lesson_id
        
        -- Reset Attendance
        DELETE FROM public.teaching_lesson_attendance WHERE lesson_id = v_lesson_id;

    ELSE
        -- INSERT MODE
        -- Verify provided Class ID
        SELECT church_id INTO v_class_church_id FROM public.teaching_classes WHERE id = p_class_id;
        
        IF v_class_church_id IS NULL OR v_class_church_id != v_user_church_id THEN
            RAISE EXCEPTION 'Invalid Class or Permission Denied';
        END IF;

        INSERT INTO public.teaching_lessons (class_id, date, title, notes)
        VALUES (p_class_id, p_date, p_title, p_notes)
        RETURNING id INTO v_lesson_id;
    END IF;

    -- Safety Check
    IF v_lesson_id IS NULL THEN
        RAISE EXCEPTION 'Internal Error: Failed to resolve Lesson ID';
    END IF;

    -- 3. Handle Attendance
    IF p_attendance IS NOT NULL AND array_length(p_attendance, 1) > 0 THEN
        INSERT INTO public.teaching_lesson_attendance (lesson_id, member_id, present)
        SELECT v_lesson_id, unnest(p_attendance), true;
    END IF;

    RETURN v_lesson_id;
END;
$$;

GRANT EXECUTE ON FUNCTION manage_teaching_lesson_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION manage_teaching_lesson_v2 TO service_role;
