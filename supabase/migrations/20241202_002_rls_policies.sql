-- =====================================================
-- THRONUS V5 - ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant Data Isolation
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE christian_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_lesson_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipleship_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipleship_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipleship_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipleship_meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get current user's church_id
CREATE OR REPLACE FUNCTION get_user_church_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT church_id 
        FROM users 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT 
            CASE 
                WHEN role = 'admin' THEN true
                WHEN permissions ? permission_name THEN (permissions->permission_name)::boolean
                ELSE false
            END
        FROM users
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin'
        FROM users
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CHURCHES POLICIES
-- =====================================================

-- Users can view their own church
CREATE POLICY "Users can view their own church"
ON churches FOR SELECT
USING (id = get_user_church_id());

-- Admins can update their church
CREATE POLICY "Admins can update their church"
ON churches FOR UPDATE
USING (id = get_user_church_id() AND is_admin());

-- Service role can do everything (for migrations, seeds, etc.)
CREATE POLICY "Service role has full access to churches"
ON churches FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- PLANS POLICIES
-- =====================================================

-- Everyone can view plans
CREATE POLICY "Anyone can view plans"
ON plans FOR SELECT
TO authenticated
USING (true);

-- Service role can manage plans
CREATE POLICY "Service role can manage plans"
ON plans FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SUBSCRIPTIONS POLICIES
-- =====================================================

-- Users can view their church's subscriptions
CREATE POLICY "Users can view their church subscriptions"
ON subscriptions FOR SELECT
USING (church_id = get_user_church_id());

-- Admins can manage their church's subscriptions
CREATE POLICY "Admins can manage subscriptions"
ON subscriptions FOR ALL
USING (church_id = get_user_church_id() AND is_admin());

-- =====================================================
-- MEMBERS POLICIES
-- =====================================================

-- Users can view members from their church
CREATE POLICY "Users can view members from their church"
ON members FOR SELECT
USING (church_id = get_user_church_id() AND deleted_at IS NULL);

-- Users with permission can create members
CREATE POLICY "Users can create members"
ON members FOR INSERT
WITH CHECK (
    church_id = get_user_church_id() 
    AND (is_admin() OR user_has_permission('manage_members'))
);

-- Users with permission can update members
CREATE POLICY "Users can update members"
ON members FOR UPDATE
USING (
    church_id = get_user_church_id() 
    AND deleted_at IS NULL
    AND (is_admin() OR user_has_permission('manage_members'))
);

-- Users with permission can delete members (soft delete)
CREATE POLICY "Users can delete members"
ON members FOR DELETE
USING (
    church_id = get_user_church_id() 
    AND (is_admin() OR user_has_permission('manage_members'))
);

-- =====================================================
-- USERS POLICIES
-- =====================================================

-- Users can view users from their church
CREATE POLICY "Users can view users from their church"
ON users FOR SELECT
USING (church_id = get_user_church_id());

-- Admins can manage users
CREATE POLICY "Admins can manage users"
ON users FOR ALL
USING (church_id = get_user_church_id() AND is_admin());

-- =====================================================
-- GROUPS POLICIES
-- =====================================================

-- Users can view groups from their church
CREATE POLICY "Users can view groups from their church"
ON groups FOR SELECT
USING (church_id = get_user_church_id() AND deleted_at IS NULL);

-- Users with permission can manage groups
CREATE POLICY "Users can manage groups"
ON groups FOR ALL
USING (
    church_id = get_user_church_id() 
    AND (is_admin() OR user_has_permission('manage_groups'))
);

-- =====================================================
-- GROUP MEMBERS POLICIES
-- =====================================================

CREATE POLICY "Users can view group members from their church"
ON group_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM groups 
        WHERE groups.id = group_members.group_id 
        AND groups.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage group members"
ON group_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM groups 
        WHERE groups.id = group_members.group_id 
        AND groups.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_groups'))
);

-- =====================================================
-- GROUP MEETINGS POLICIES
-- =====================================================

CREATE POLICY "Users can view group meetings from their church"
ON group_meetings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM groups 
        WHERE groups.id = group_meetings.group_id 
        AND groups.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage group meetings"
ON group_meetings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM groups 
        WHERE groups.id = group_meetings.group_id 
        AND groups.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_groups'))
);

-- =====================================================
-- GROUP MEETING ATTENDANCE POLICIES
-- =====================================================

CREATE POLICY "Users can view group meeting attendance"
ON group_meeting_attendance FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM group_meetings gm
        JOIN groups g ON g.id = gm.group_id
        WHERE gm.id = group_meeting_attendance.meeting_id 
        AND g.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage group meeting attendance"
ON group_meeting_attendance FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM group_meetings gm
        JOIN groups g ON g.id = gm.group_id
        WHERE gm.id = group_meeting_attendance.meeting_id 
        AND g.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_groups'))
);

-- =====================================================
-- SERVICES POLICIES
-- =====================================================

CREATE POLICY "Users can view services from their church"
ON services FOR SELECT
USING (church_id = get_user_church_id() AND deleted_at IS NULL);

CREATE POLICY "Users can manage services"
ON services FOR ALL
USING (
    church_id = get_user_church_id() 
    AND (is_admin() OR user_has_permission('manage_services'))
);

-- =====================================================
-- DEPARTMENTS POLICIES
-- =====================================================

CREATE POLICY "Users can view departments from their church"
ON departments FOR SELECT
USING (church_id = get_user_church_id() AND deleted_at IS NULL);

CREATE POLICY "Users can manage departments"
ON departments FOR ALL
USING (
    church_id = get_user_church_id() 
    AND (is_admin() OR user_has_permission('manage_departments'))
);

-- =====================================================
-- DEPARTMENT MEMBERS POLICIES
-- =====================================================

CREATE POLICY "Users can view department members"
ON department_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM departments 
        WHERE departments.id = department_members.department_id 
        AND departments.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage department members"
ON department_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM departments 
        WHERE departments.id = department_members.department_id 
        AND departments.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_departments'))
);

-- =====================================================
-- DEPARTMENT SCHEDULES POLICIES
-- =====================================================

CREATE POLICY "Users can view department schedules"
ON department_schedules FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM departments 
        WHERE departments.id = department_schedules.department_id 
        AND departments.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage department schedules"
ON department_schedules FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM departments 
        WHERE departments.id = department_schedules.department_id 
        AND departments.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_departments'))
);

-- =====================================================
-- DEPARTMENT SCHEDULE ASSIGNMENTS POLICIES
-- =====================================================

CREATE POLICY "Users can view department schedule assignments"
ON department_schedule_assignments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM department_schedules ds
        JOIN departments d ON d.id = ds.department_id
        WHERE ds.id = department_schedule_assignments.schedule_id 
        AND d.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage department schedule assignments"
ON department_schedule_assignments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM department_schedules ds
        JOIN departments d ON d.id = ds.department_id
        WHERE ds.id = department_schedule_assignments.schedule_id 
        AND d.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_departments'))
);

-- =====================================================
-- EVENTS POLICIES
-- =====================================================

CREATE POLICY "Users can view events from their church"
ON events FOR SELECT
USING (church_id = get_user_church_id() AND deleted_at IS NULL);

CREATE POLICY "Users can manage events"
ON events FOR ALL
USING (
    church_id = get_user_church_id() 
    AND (is_admin() OR user_has_permission('manage_events'))
);

-- =====================================================
-- EVENT ATTENDEES POLICIES
-- =====================================================

CREATE POLICY "Users can view event attendees"
ON event_attendees FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events 
        WHERE events.id = event_attendees.event_id 
        AND events.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage event attendees"
ON event_attendees FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM events 
        WHERE events.id = event_attendees.event_id 
        AND events.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_events'))
);

-- =====================================================
-- TEACHING POLICIES
-- =====================================================

CREATE POLICY "Users can view christian stages"
ON christian_stages FOR SELECT
USING (church_id = get_user_church_id());

CREATE POLICY "Admins can manage christian stages"
ON christian_stages FOR ALL
USING (church_id = get_user_church_id() AND is_admin());

CREATE POLICY "Users can view teaching categories"
ON teaching_categories FOR SELECT
USING (church_id = get_user_church_id());

CREATE POLICY "Admins can manage teaching categories"
ON teaching_categories FOR ALL
USING (church_id = get_user_church_id() AND is_admin());

CREATE POLICY "Users can view teaching classes"
ON teaching_classes FOR SELECT
USING (church_id = get_user_church_id() AND deleted_at IS NULL);

CREATE POLICY "Users can manage teaching classes"
ON teaching_classes FOR ALL
USING (
    church_id = get_user_church_id() 
    AND (is_admin() OR user_has_permission('manage_teaching'))
);

-- Teaching class students, lessons, and attendance follow similar patterns
CREATE POLICY "Users can view teaching class students"
ON teaching_class_students FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM teaching_classes 
        WHERE teaching_classes.id = teaching_class_students.class_id 
        AND teaching_classes.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage teaching class students"
ON teaching_class_students FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM teaching_classes 
        WHERE teaching_classes.id = teaching_class_students.class_id 
        AND teaching_classes.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_teaching'))
);

CREATE POLICY "Users can view teaching lessons"
ON teaching_lessons FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM teaching_classes 
        WHERE teaching_classes.id = teaching_lessons.class_id 
        AND teaching_classes.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage teaching lessons"
ON teaching_lessons FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM teaching_classes 
        WHERE teaching_classes.id = teaching_lessons.class_id 
        AND teaching_classes.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_teaching'))
);

CREATE POLICY "Users can view teaching lesson attendance"
ON teaching_lesson_attendance FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM teaching_lessons tl
        JOIN teaching_classes tc ON tc.id = tl.class_id
        WHERE tl.id = teaching_lesson_attendance.lesson_id 
        AND tc.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage teaching lesson attendance"
ON teaching_lesson_attendance FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM teaching_lessons tl
        JOIN teaching_classes tc ON tc.id = tl.class_id
        WHERE tl.id = teaching_lesson_attendance.lesson_id 
        AND tc.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_teaching'))
);

-- =====================================================
-- DISCIPLESHIP POLICIES
-- =====================================================

CREATE POLICY "Users can view discipleship leaders"
ON discipleship_leaders FOR SELECT
USING (church_id = get_user_church_id());

CREATE POLICY "Users can manage discipleship leaders"
ON discipleship_leaders FOR ALL
USING (
    church_id = get_user_church_id() 
    AND (is_admin() OR user_has_permission('manage_discipleship'))
);

CREATE POLICY "Users can view discipleship relationships"
ON discipleship_relationships FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM discipleship_leaders 
        WHERE discipleship_leaders.id = discipleship_relationships.leader_id 
        AND discipleship_leaders.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage discipleship relationships"
ON discipleship_relationships FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM discipleship_leaders 
        WHERE discipleship_leaders.id = discipleship_relationships.leader_id 
        AND discipleship_leaders.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_discipleship'))
);

CREATE POLICY "Users can view discipleship meetings"
ON discipleship_meetings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM discipleship_leaders 
        WHERE discipleship_leaders.id = discipleship_meetings.leader_id 
        AND discipleship_leaders.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage discipleship meetings"
ON discipleship_meetings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM discipleship_leaders 
        WHERE discipleship_leaders.id = discipleship_meetings.leader_id 
        AND discipleship_leaders.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_discipleship'))
);

CREATE POLICY "Users can view discipleship meeting attendance"
ON discipleship_meeting_attendance FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM discipleship_meetings dm
        JOIN discipleship_leaders dl ON dl.id = dm.leader_id
        WHERE dm.id = discipleship_meeting_attendance.meeting_id 
        AND dl.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage discipleship meeting attendance"
ON discipleship_meeting_attendance FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM discipleship_meetings dm
        JOIN discipleship_leaders dl ON dl.id = dm.leader_id
        WHERE dm.id = discipleship_meeting_attendance.meeting_id 
        AND dl.church_id = get_user_church_id()
    )
    AND (is_admin() OR user_has_permission('manage_discipleship'))
);

-- =====================================================
-- FINANCE POLICIES
-- =====================================================

CREATE POLICY "Users can view transaction categories"
ON transaction_categories FOR SELECT
USING (church_id = get_user_church_id() AND deleted_at IS NULL);

CREATE POLICY "Users can manage transaction categories"
ON transaction_categories FOR ALL
USING (
    church_id = get_user_church_id() 
    AND (is_admin() OR user_has_permission('manage_finances'))
);

CREATE POLICY "Users can view transactions"
ON transactions FOR SELECT
USING (church_id = get_user_church_id() AND deleted_at IS NULL);

CREATE POLICY "Users can manage transactions"
ON transactions FOR ALL
USING (
    church_id = get_user_church_id() 
    AND (is_admin() OR user_has_permission('manage_finances'))
);

-- =====================================================
-- AUDIT LOGS POLICIES
-- =====================================================

CREATE POLICY "Users can view audit logs from their church"
ON audit_logs FOR SELECT
USING (church_id = get_user_church_id());

CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- =====================================================
-- SERVICE ROLE BYPASS
-- =====================================================
-- Service role can bypass all RLS policies for migrations and seeds

CREATE POLICY "Service role bypass" ON members FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON users FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON groups FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON group_members FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON group_meetings FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON group_meeting_attendance FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON services FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON departments FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON department_members FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON department_schedules FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON department_schedule_assignments FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON events FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON event_attendees FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON christian_stages FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON teaching_categories FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON teaching_classes FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON teaching_class_students FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON teaching_lessons FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON teaching_lesson_attendance FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON discipleship_leaders FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON discipleship_relationships FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON discipleship_meetings FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON discipleship_meeting_attendance FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON transaction_categories FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON transactions FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON audit_logs FOR ALL USING (auth.jwt()->>'role' = 'service_role');
