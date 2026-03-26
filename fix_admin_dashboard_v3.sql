-- Drop function if exists to avoid conflicts
DROP FUNCTION IF EXISTS public.get_admin_dashboard_data();

-- Re-create the function with corrected ORDER BY clause
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run as creator (admin) to bypass RLS
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      jsonb_agg(
        to_jsonb(c) || jsonb_build_object(
          'subscriptions', (
              SELECT COALESCE(jsonb_agg(
                  to_jsonb(s) || jsonb_build_object(
                      'plans', (SELECT jsonb_build_object('name', p.name) FROM plans p WHERE p.id = s.plan_id)
                  )
              ), '[]'::jsonb)
              FROM subscriptions s 
              WHERE s.church_id = c.id
          ),
          'members', jsonb_build_array(jsonb_build_object('count', (SELECT count(*) FROM members m WHERE m.church_id = c.id))),
          'groups', jsonb_build_array(jsonb_build_object('count', (SELECT count(*) FROM groups g WHERE g.church_id = c.id))),
          'departments', jsonb_build_array(jsonb_build_object('count', (SELECT count(*) FROM departments d WHERE d.church_id = c.id))),
          'teaching_classes', jsonb_build_array(jsonb_build_object('count', (SELECT count(*) FROM teaching_classes t WHERE t.church_id = c.id))),
          'discipleship_leaders', jsonb_build_array(jsonb_build_object('count', (SELECT count(*) FROM discipleship_leaders dl WHERE dl.church_id = c.id))),
          'users', jsonb_build_array(jsonb_build_object('count', (SELECT count(*) FROM users u WHERE u.church_id = c.id)))
        )
        ORDER BY c.created_at DESC -- Correct placement of ORDER BY
      ),
      '[]'::jsonb
    )
    FROM churches c
  );
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_data() TO service_role;
