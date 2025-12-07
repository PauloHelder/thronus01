-- FUNCTION: Create Discipleship Meeting Atomically
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION create_discipleship_meeting_v2(
    p_leader_id UUID,
    p_date TIMESTAMP WITH TIME ZONE,
    p_status TEXT,
    p_notes TEXT,
    p_attendees UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS table policies
SET search_path = public
AS $$
DECLARE
    v_meeting_id UUID;
    v_user_church_id UUID;
    v_leader_church_id UUID;
BEGIN
    -- 1. Get User's Church
    SELECT church_id INTO v_user_church_id
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;

    IF v_user_church_id IS NULL THEN
        RAISE EXCEPTION 'User not associated with a church';
    END IF;

    -- 2. Validate Leader belongs to User's Church
    SELECT church_id INTO v_leader_church_id
    FROM public.discipleship_leaders
    WHERE id = p_leader_id;

    IF v_leader_church_id IS NULL OR v_leader_church_id != v_user_church_id THEN
        RAISE EXCEPTION 'Invalid Leader or Permission Denied';
    END IF;

    -- 3. Insert Meeting
    INSERT INTO public.discipleship_meetings (leader_id, date, status, notes)
    VALUES (p_leader_id, p_date, p_status, p_notes)
    RETURNING id INTO v_meeting_id;

    -- 4. Insert Attendance
    IF p_attendees IS NOT NULL AND array_length(p_attendees, 1) > 0 THEN
        INSERT INTO public.discipleship_meeting_attendance (meeting_id, disciple_id, present)
        SELECT v_meeting_id, unnest(p_attendees), true;
    END IF;

    RETURN v_meeting_id;
END;
$$;

-- IMPORTANT: Grant permission to use this function!
GRANT EXECUTE ON FUNCTION create_discipleship_meeting_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION create_discipleship_meeting_v2 TO service_role;
