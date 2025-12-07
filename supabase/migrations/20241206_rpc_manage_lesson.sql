-- FUNCTION: Manage Teaching Lesson (Create or Update)
-- Using RPC to strictly bypass RLS for complex parent-child operations

CREATE OR REPLACE FUNCTION manage_teaching_lesson(
    p_lesson_id UUID, -- NULL for new lesson
    p_class_id UUID,
    p_date DATE,
    p_title TEXT,
    p_notes TEXT,
    p_attendance UUID[] -- Array of Member IDs present
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges, bypassing RLS
SET search_path = public
AS $$
DECLARE
    v_lesson_id UUID;
    v_user_church_id UUID;
    v_class_church_id UUID;
BEGIN
    -- 1. Security Check: Get User's Church
    SELECT church_id INTO v_user_church_id
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;

    IF v_user_church_id IS NULL THEN
        RAISE EXCEPTION 'User not associated with a church';
    END IF;

    -- 2. Verify Class belongs to User's Church
    SELECT church_id INTO v_class_church_id
    FROM public.teaching_classes
    WHERE id = p_class_id;

    IF v_class_church_id IS NULL OR v_class_church_id != v_user_church_id THEN
        RAISE EXCEPTION 'Invalid Class or Permission Denied';
    END IF;

    -- 3. Operations
    IF p_lesson_id IS NOT NULL THEN
        -- UPDATE existing lesson
        -- Verify lesson belongs to the class (sanity check)
        PERFORM 1 FROM public.teaching_lessons WHERE id = p_lesson_id AND class_id = p_class_id;
        IF NOT FOUND THEN
             RAISE EXCEPTION 'Lesson not found in this class';
        END IF;

        UPDATE public.teaching_lessons
        SET date = p_date,
            title = p_title,
            notes = p_notes,
            updated_at = NOW()
        WHERE id = p_lesson_id
        RETURNING id INTO v_lesson_id;
        
        -- Update Attendance: Delete all and re-insert
        DELETE FROM public.teaching_lesson_attendance WHERE lesson_id = v_lesson_id;

    ELSE
        -- INSERT new lesson
        INSERT INTO public.teaching_lessons (class_id, date, title, notes)
        VALUES (p_class_id, p_date, p_title, p_notes)
        RETURNING id INTO v_lesson_id;
    END IF;

    -- 4. Insert Attendance (Common for both)
    IF p_attendance IS NOT NULL AND array_length(p_attendance, 1) > 0 THEN
        INSERT INTO public.teaching_lesson_attendance (lesson_id, member_id, present)
        SELECT v_lesson_id, unnest(p_attendance), true;
    END IF;

    RETURN v_lesson_id;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION manage_teaching_lesson TO authenticated;
GRANT EXECUTE ON FUNCTION manage_teaching_lesson TO service_role;
