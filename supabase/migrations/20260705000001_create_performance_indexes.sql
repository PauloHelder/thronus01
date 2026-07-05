-- Migration: Otimização de Performance via Índices
-- Objetivo: Acelerar as consultas mais frequentes e eliminar sequential scans lentos (joins e filtros).

-- 1. Otimização de Membros (Filtros e ordenação padrão por nome)
CREATE INDEX IF NOT EXISTS idx_members_church_name_perf 
ON public.members (church_id, name ASC);

-- 2. Otimização de Cultos (Filtros de igreja e ordenação por data recente)
CREATE INDEX IF NOT EXISTS idx_services_church_date_perf 
ON public.services (church_id, date DESC) 
WHERE deleted_at IS NULL;

-- 3. Otimização de Eventos/Agenda (Filtro e ordenação de eventos por data)
CREATE INDEX IF NOT EXISTS idx_events_church_date_perf 
ON public.events (church_id, date DESC);

-- 4. Otimização de Transações Financeiras (Tesouraria / Extracto)
-- Otimiza a listagem principal (ordenada por date ASC e created_at ASC)
CREATE INDEX IF NOT EXISTS idx_financial_transactions_church_date_created_perf 
ON public.financial_transactions (church_id, date ASC, created_at ASC) 
WHERE deleted_at IS NULL;

-- Otimiza buscas filtrando por conta bancária e data
CREATE INDEX IF NOT EXISTS idx_financial_transactions_church_account_date_perf 
ON public.financial_transactions (church_id, account_id, date DESC) 
WHERE deleted_at IS NULL;

-- Otimiza buscas filtrando por categoria e data
CREATE INDEX IF NOT EXISTS idx_financial_transactions_church_category_date_perf 
ON public.financial_transactions (church_id, category_id, date DESC) 
WHERE deleted_at IS NULL;

-- 5. Otimização de Joins e Chaves Estrangeiras (Foreign Keys sem índice que causam lentidão em joins)
CREATE INDEX IF NOT EXISTS idx_department_members_member_id_perf 
ON public.department_members (member_id);

CREATE INDEX IF NOT EXISTS idx_group_members_member_id_perf 
ON public.group_members (member_id);

CREATE INDEX IF NOT EXISTS idx_discipleship_relationships_disciple_id_perf 
ON public.discipleship_relationships (disciple_id);

CREATE INDEX IF NOT EXISTS idx_discipleship_relationships_leader_id_perf 
ON public.discipleship_relationships (leader_id);

CREATE INDEX IF NOT EXISTS idx_member_relationships_member_id_perf 
ON public.member_relationships (member_id);

CREATE INDEX IF NOT EXISTS idx_member_relationships_related_member_id_perf 
ON public.member_relationships (related_member_id);
