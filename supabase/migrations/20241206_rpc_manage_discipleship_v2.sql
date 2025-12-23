-- FUNCTION: Manage Discipleship Meeting v2 (Robust)
-- Handles both Create and Update atomically, fixing RLS and FK issues.

CREATE OR REPLACE FUNCTION manage_discipleship_meeting_v2(
    p_meeting_id UUID, -- NULL for new meeting
    p_leader_id UUID,  -- Required for Insert
    p_date DATE,
    p_status TEXT,
    p_notes TEXT,
    p_attendees UUID[] -- Array of Member IDs (disciples) present
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Superuser privileges to bypass RLS checks
SET search_path = public
AS $$
DECLARE
    v_meeting_id UUID;
    v_user_church_id UUID;
    v_leader_church_id UUID;
BEGIN
    -- 1. Security Context
    SELECT church_id INTO v_user_church_id FROM public.users WHERE id = auth.uid() LIMIT 1;
    IF v_user_church_id IS NULL THEN RAISE EXCEPTION 'User not associated with a church'; END IF;

    -- 2. LOGIC SPLIT
    IF p_meeting_id IS NOT NULL THEN
        -- UPDATE MODE
        v_meeting_id := p_meeting_id;

        -- Verify ownership via Leader->Church
        -- First get the leader of this meeting
        SELECT l.church_id INTO v_leader_church_id
        FROM public.discipleship_meetings m
        JOIN public.discipleship_leaders l ON l.id = m.leader_id
        WHERE m.id = p_meeting_id;
        
        IF v_leader_church_id IS NULL THEN 
            RAISE EXCEPTION 'Meeting not found or invalid';
        END IF;

        IF v_leader_church_id != v_user_church_id THEN
            RAISE EXCEPTION 'Permission Denied: Meeting belongs to another church';
        END IF;

        -- Perform Update
        UPDATE public.discipleship_meetings
        SET date = p_date, status = p_status, notes = p_notes, updated_at = NOW()
        WHERE id = p_meeting_id;

        -- Reset Attendance
        DELETE FROM public.discipleship_meeting_attendance WHERE meeting_id = v_meeting_id;

    ELSE
        -- INSERT MODE
        -- Verify Leader belongs to User's Church
        SELECT church_id INTO v_leader_church_id FROM public.discipleship_leaders WHERE id = p_leader_id;
        
        IF v_leader_church_id IS NULL OR v_leader_church_id != v_user_church_id THEN
            RAISE EXCEPTION 'Invalid Leader or Permission Denied';
        END IF;

        INSERT INTO public.discipleship_meetings (leader_id, date, status, notes)
        VALUES (p_leader_id, p_date, p_status, p_notes)
        RETURNING id INTO v_meeting_id;
    END IF;

    -- 3. Handle Attendance
    IF p_attendees IS NOT NULL AND array_length(p_attendees, 1) > 0 THEN
        INSERT INTO public.discipleship_meeting_attendance (meeting_id, disciple_id, present)
        SELECT v_meeting_id, unnest(p_attendees), true;
    END IF;

    RETURN v_meeting_id;
END;
$$;

GRANT EXECUTE ON FUNCTION manage_discipleship_meeting_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION manage_discipleship_meeting_v2 TO service_role;
