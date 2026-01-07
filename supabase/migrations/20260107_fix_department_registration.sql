-- ==========================================================
-- FIX: Permitir cadastro de departamentos para Líderes e Supervisores
-- ==========================================================

-- 1. Função auxiliar para verificar permissão de departamentos
-- Esta função verifica se o usuário é admin, supervisor ou líder
-- OU se possui a permissão específica 'manage_departments' ou 'departments_create'
CREATE OR REPLACE FUNCTION public.user_has_department_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      -- Verificação por Role (Padrão do AuthContext)
      role IN ('admin', 'supervisor', 'leader')
      OR
      -- Verificação por Permissão Explícita (Jsonb)
      permissions ? 'manage_departments'
      OR
      permissions ? 'departments_create'
      OR
      permissions ? 'departments_edit'
    )
  );
END;
$$;

-- 2. Atualizar Políticas da Tabela departments

-- Remover política antiga restritiva
DROP POLICY IF EXISTS "Users can manage departments" ON departments;
DROP POLICY IF EXISTS "Users can create departments" ON departments;
DROP POLICY IF EXISTS "Users can update departments" ON departments;
DROP POLICY IF EXISTS "Users can delete departments" ON departments;

-- Criar nova política abrangente (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Users can manage departments" ON departments
FOR ALL USING (
    church_id = get_user_church_id() 
    AND user_has_department_access()
);

-- 3. Atualizar Políticas das Sub-tabelas (Membros, Escalas, etc.)

-- department_members
DROP POLICY IF EXISTS "Users can manage department members" ON department_members;
CREATE POLICY "Users can manage department members" ON department_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments 
        WHERE departments.id = department_members.department_id 
        AND departments.church_id = get_user_church_id()
    )
    AND user_has_department_access()
);

-- department_schedules
DROP POLICY IF EXISTS "Users can manage department schedules" ON department_schedules;
CREATE POLICY "Users can manage department schedules" ON department_schedules
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments 
        WHERE departments.id = department_schedules.department_id 
        AND departments.church_id = get_user_church_id()
    )
    AND user_has_department_access()
);

-- department_schedule_assignments
DROP POLICY IF EXISTS "Users can manage department schedule assignments" ON department_schedule_assignments;
CREATE POLICY "Users can manage department schedule assignments" ON department_schedule_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM department_schedules ds
        JOIN departments d ON d.id = ds.department_id
        WHERE ds.id = department_schedule_assignments.schedule_id 
        AND d.church_id = get_user_church_id()
    )
    AND user_has_department_access()
);

-- Confirmação
NOTIFY pgrst, 'reload config';
