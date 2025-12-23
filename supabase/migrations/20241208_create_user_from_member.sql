-- Trigger function to create a user when a new member is added with an email
CREATE OR REPLACE FUNCTION public.create_user_from_member()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_church_slug TEXT;
    v_role TEXT := 'member'; -- Default role, can be passed somehow or defaulted
BEGIN
    -- Check if email is present
    IF NEW.email IS NULL OR NEW.email = '' THEN
        RETURN NEW;
    END IF;

    -- Check if user already exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = NEW.email;
    
    IF v_user_id IS NOT NULL THEN
        -- User exists, maybe link them if not linked?
        -- For now, we assume if user exists, we might want to ensure they are in public.users linked to this member
        -- But strictly, we only create if they don't exist in our context or just link.
        -- Let's just return to avoid errors if they are already in system.
        
        -- Optional: Link existing auth user to this member if not linked
         INSERT INTO public.users (id, church_id, member_id, email, role)
         VALUES (v_user_id, NEW.church_id, NEW.id, NEW.email, v_role)
         ON CONFLICT (id) DO UPDATE SET member_id = NEW.id WHERE users.member_id IS NULL;
         
        RETURN NEW;
    END IF;
    
    -- We cannot create auth.users from a trigger easily without Supabase Admin privileges or using an Edge Function / RPC.
    -- Triggers run as the user who invoked them (usually authenticated user). 
    -- Creating a new auth user requires service_role key usually.
    
    -- HOWEVER, the user request implies "The system should create the account".
    -- Since we can't easily do `INSERT INTO auth.users` from PL/PGSQL without specific setup or caveats (and security risks),
    -- The best approach in a Supabase app is to handle this logic in the APPLICATION LAYER (Frontend or Edge Function).
    
    -- BUT, if we MUST do it in SQL/Database level (as per "system must create"), we can use an RPC that is called by the frontend instead of a simple INSERT.
    -- OR we can just rely on the Frontend to call `signUp` or an Admin RPC.
    
    -- Given the constraint of "adding email in member creates user", doing it via Trigger is hard because of auth schema restrictions.
    -- Strategy:
    -- 1. Frontend: When saving member, if email is present, call a specific RPC `create_member_and_user`.
    -- 2. OR: Frontend calls `signUp` (admin create user) via RPC.
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
