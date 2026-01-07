-- ==========================================================
-- FIX DE EMERGÊNCIA V2: Corrigido e A Prova de Falhas
-- ==========================================================

-- 1. Limpeza COMPLETA de políticas antigas e novas
-- Isso evita o erro "policy already exists"

-- Tabela: Departments
DROP POLICY IF EXISTS "Users can manage departments" ON departments;
DROP POLICY IF EXISTS "Users can create departments" ON departments;
DROP POLICY IF EXISTS "Users can update departments" ON departments;
DROP POLICY IF EXISTS "Users can delete departments" ON departments;
DROP POLICY IF EXISTS "Users can view departments from their church" ON departments;
DROP POLICY IF EXISTS "Users allow all departments" ON departments; -- Adicionado para corrigir o erro

-- Tabela: Department Members
DROP POLICY IF EXISTS "Users can manage department members" ON department_members;
DROP POLICY IF EXISTS "Users allow all department members" ON department_members; -- Adicionado

-- Tabela: Department Schedules
DROP POLICY IF EXISTS "Users can manage department schedules" ON department_schedules;
DROP POLICY IF EXISTS "Users allow all department schedules" ON department_schedules; -- Adicionado

-- Tabela: Department Schedule Assignments
DROP POLICY IF EXISTS "Users can manage department schedule assignments" ON department_schedule_assignments;
DROP POLICY IF EXISTS "Users allow all department assignments" ON department_schedule_assignments; -- Adicionado


-- 2. Recriar Políticas Permissivas

CREATE POLICY "Users allow all departments" ON departments
FOR ALL USING (
    church_id = get_user_church_id()
);

CREATE POLICY "Users allow all department members" ON department_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments 
        WHERE departments.id = department_members.department_id 
        AND departments.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users allow all department schedules" ON department_schedules
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments 
        WHERE departments.id = department_schedules.department_id 
        AND departments.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users allow all department assignments" ON department_schedule_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM department_schedules ds
        JOIN departments d ON d.id = ds.department_id
        WHERE ds.id = department_schedule_assignments.schedule_id 
        AND d.church_id = get_user_church_id()
    )
);

-- 3. Confirmação
NOTIFY pgrst, 'reload config';
