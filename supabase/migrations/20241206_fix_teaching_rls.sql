-- FIX TEACHING RLS & PERMISSIONS
-- Run this in Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE teaching_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_lesson_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE christian_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_categories ENABLE ROW LEVEL SECURITY;

-- 2. Grant Permissions to Authenticated Roles
GRANT ALL ON teaching_classes TO authenticated;
GRANT ALL ON teaching_class_students TO authenticated;
GRANT ALL ON teaching_lessons TO authenticated;
GRANT ALL ON teaching_lesson_attendance TO authenticated;
GRANT ALL ON christian_stages TO authenticated;
GRANT ALL ON teaching_categories TO authenticated;

-- 3. DROP ALL EXISTING POLICIES (Clean Slate)
DROP POLICY IF EXISTS "Teaching Classes Access" ON teaching_classes;
DROP POLICY IF EXISTS "Teaching Class Students Access" ON teaching_class_students;
DROP POLICY IF EXISTS "Teaching Lessons Access" ON teaching_lessons;
DROP POLICY IF EXISTS "Teaching Attendance Access" ON teaching_lesson_attendance;
DROP POLICY IF EXISTS "Christian Stages Access" ON christian_stages;
DROP POLICY IF EXISTS "Teaching Categories Access" ON teaching_categories;

-- Legacy drops
DROP POLICY IF EXISTS "Allow all" ON teaching_classes;
DROP POLICY IF EXISTS "Allow all" ON teaching_lessons;

-- 4. RECREATE POLICIES

-- Classes (Base Table)
CREATE POLICY "Teaching Classes Access"
ON teaching_classes FOR ALL
USING (
  church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
);

-- Stages (Base Table)
CREATE POLICY "Christian Stages Access"
ON christian_stages FOR ALL
USING (
  church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
);

-- Categories (Base Table)
CREATE POLICY "Teaching Categories Access"
ON teaching_categories FOR ALL
USING (
  church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
);

-- Class Students (Child of Classes)
CREATE POLICY "Teaching Class Students Access"
ON teaching_class_students FOR ALL
USING (
   EXISTS (
    SELECT 1 FROM teaching_classes
    WHERE teaching_classes.id = teaching_class_students.class_id
    AND teaching_classes.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
   )
);

-- Lessons (Child of Classes)
CREATE POLICY "Teaching Lessons Access"
ON teaching_lessons FOR ALL
USING (
   EXISTS (
    SELECT 1 FROM teaching_classes
    WHERE teaching_classes.id = teaching_lessons.class_id
    AND teaching_classes.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
   )
);

-- Attendance (Child of Lessons)
CREATE POLICY "Teaching Attendance Access"
ON teaching_lesson_attendance FOR ALL
USING (
   EXISTS (
    SELECT 1 FROM teaching_lessons
    JOIN teaching_classes ON teaching_classes.id = teaching_lessons.class_id
    WHERE teaching_lessons.id = teaching_lesson_attendance.lesson_id
    AND teaching_classes.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
   )
);
