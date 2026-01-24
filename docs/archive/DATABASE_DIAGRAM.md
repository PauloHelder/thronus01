# Diagrama de Relacionamento do Banco de Dados - Thronus V5

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                      MULTI-TENANT ARCHITECTURE                   │
│                                                                   │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐        │
│  │ Church 1 │         │ Church 2 │         │ Church N │        │
│  │  (Tenant)│         │  (Tenant)│         │  (Tenant)│        │
│  └────┬─────┘         └────┬─────┘         └────┬─────┘        │
│       │                    │                    │               │
│       └────────────────────┴────────────────────┘               │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │  Row Level     │                           │
│                    │  Security (RLS)│                           │
│                    └───────┬────────┘                           │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │   PostgreSQL   │                           │
│                    │    Database    │                           │
│                    └────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

## Estrutura de Tabelas

### 1. Core (Núcleo)

```
┌─────────────┐
│  churches   │ ◄─── Tenant principal (multi-tenant)
├─────────────┤
│ id          │
│ name        │
│ slug        │
│ plan_id     │──┐
│ parent_id   │  │
└─────────────┘  │
                 │
       ┌─────────▼──────┐
       │     plans      │
       ├────────────────┤
       │ id             │
       │ name           │
       │ price          │
       │ features (JSON)│
       └────────────────┘
                 ▲
                 │
       ┌─────────┴────────┐
       │  subscriptions   │
       ├──────────────────┤
       │ id               │
       │ church_id        │
       │ plan_id          │
       │ start_date       │
       │ end_date         │
       └──────────────────┘
```

### 2. Usuários e Membros

```
┌──────────────┐           ┌──────────────┐
│ auth.users   │           │    users     │
│ (Supabase)   │◄──────────┤ (App Users)  │
├──────────────┤           ├──────────────┤
│ id           │           │ id           │
│ email        │           │ church_id    │
│ ...          │           │ member_id    │
└──────────────┘           │ role         │
                           │ permissions  │
                           └──────┬───────┘
                                  │
                           ┌──────▼───────┐
                           │   members    │
                           ├──────────────┤
                           │ id           │
                           │ church_id    │
                           │ member_code  │
                           │ name         │
                           │ email        │
                           │ status       │
                           │ is_baptized  │
                           └──────────────┘
```

### 3. Grupos (Células)

```
┌──────────────┐
│    groups    │
├──────────────┤
│ id           │
│ church_id    │
│ name         │
│ leader_id    │──┐
│ co_leader_id │  │
└──────┬───────┘  │
       │          │
       │          └──────────────┐
       │                         │
       │                  ┌──────▼───────┐
       │                  │   members    │
       │                  └──────────────┘
       │
       │         ┌────────────────────┐
       └────────►│  group_members     │
                 ├────────────────────┤
                 │ id                 │
                 │ group_id           │
                 │ member_id          │
                 │ role               │
                 └────────┬───────────┘
                          │
                 ┌────────▼───────────┐
                 │  group_meetings    │
                 ├────────────────────┤
                 │ id                 │
                 │ group_id           │
                 │ date               │
                 └────────┬───────────┘
                          │
          ┌───────────────▼──────────────────┐
          │ group_meeting_attendance         │
          ├──────────────────────────────────┤
          │ id                               │
          │ meeting_id                       │
          │ member_id                        │
          │ present                          │
          └──────────────────────────────────┘
```

### 4. Cultos e Eventos

```
┌──────────────┐           ┌──────────────┐
│   services   │           │    events    │
├──────────────┤           ├──────────────┤
│ id           │           │ id           │
│ church_id    │           │ church_id    │
│ name         │           │ title        │
│ type         │           │ type         │
│ date         │           │ date         │
│ preacher_id  │──┐        └──────┬───────┘
│ leader_id    │  │               │
│ stats_*      │  │        ┌──────▼────────────┐
└──────────────┘  │        │ event_attendees   │
                  │        ├───────────────────┤
                  │        │ id                │
                  │        │ event_id          │
                  │        │ member_id         │
                  │        └───────────────────┘
                  │
           ┌──────▼───────┐
           │   members    │
           └──────────────┘
```

### 5. Departamentos

```
┌──────────────────┐
│   departments    │
├──────────────────┤
│ id               │
│ church_id        │
│ name             │
│ leader_id        │──┐
│ co_leader_id     │  │
│ is_default       │  │
└────────┬─────────┘  │
         │            │
         │            └──────────────┐
         │                           │
         │                    ┌──────▼───────┐
         │                    │   members    │
         │                    └──────────────┘
         │
         │         ┌──────────────────────┐
         └────────►│ department_members   │
                   ├──────────────────────┤
                   │ id                   │
                   │ department_id        │
                   │ member_id            │
                   └──────────┬───────────┘
                              │
                   ┌──────────▼──────────────┐
                   │ department_schedules    │
                   ├─────────────────────────┤
                   │ id                      │
                   │ department_id           │
                   │ type                    │
                   │ service_id / event_id   │
                   │ date                    │
                   └──────────┬──────────────┘
                              │
          ┌───────────────────▼─────────────────────┐
          │ department_schedule_assignments         │
          ├─────────────────────────────────────────┤
          │ id                                      │
          │ schedule_id                             │
          │ member_id                               │
          └─────────────────────────────────────────┘
```

### 6. Ensino (Teaching)

```
┌────────────────────┐         ┌──────────────────────┐
│ christian_stages   │         │ teaching_categories  │
├────────────────────┤         ├──────────────────────┤
│ id                 │         │ id                   │
│ church_id          │         │ church_id            │
│ name               │         │ name                 │
│ order_index        │         └──────────┬───────────┘
└────────┬───────────┘                    │
         │                                │
         │         ┌──────────────────────▼───┐
         └────────►│   teaching_classes       │
                   ├──────────────────────────┤
                   │ id                       │
                   │ church_id                │
                   │ name                     │
                   │ teacher_id               │──┐
                   │ stage_id                 │  │
                   │ category_id              │  │
                   │ status                   │  │
                   └────────┬─────────────────┘  │
                            │                    │
                            │             ┌──────▼───────┐
                            │             │   members    │
                            │             └──────────────┘
                            │
         ┌──────────────────▼─────────────────┐
         │   teaching_class_students          │
         ├────────────────────────────────────┤
         │ id                                 │
         │ class_id                           │
         │ member_id                          │
         └────────────────────────────────────┘
                            │
         ┌──────────────────▼─────────────────┐
         │   teaching_lessons                 │
         ├────────────────────────────────────┤
         │ id                                 │
         │ class_id                           │
         │ date                               │
         │ title                              │
         └────────┬───────────────────────────┘
                  │
  ┌───────────────▼────────────────────────┐
  │ teaching_lesson_attendance             │
  ├────────────────────────────────────────┤
  │ id                                     │
  │ lesson_id                              │
  │ member_id                              │
  │ present                                │
  └────────────────────────────────────────┘
```

### 7. Discipulado

```
┌──────────────────────┐
│ discipleship_leaders │
├──────────────────────┤
│ id                   │
│ church_id            │
│ member_id            │──┐
│ start_date           │  │
└────────┬─────────────┘  │
         │                │
         │         ┌──────▼───────┐
         │         │   members    │
         │         └──────────────┘
         │
         │         ┌───────────────────────────┐
         └────────►│ discipleship_relationships│
                   ├───────────────────────────┤
                   │ id                        │
                   │ leader_id                 │
                   │ disciple_id               │
                   │ start_date                │
                   └───────────────────────────┘
                   
         ┌─────────────────────────┐
         │ discipleship_meetings   │
         ├─────────────────────────┤
         │ id                      │
         │ leader_id               │
         │ date                    │
         │ status                  │
         └────────┬────────────────┘
                  │
  ┌───────────────▼──────────────────────────┐
  │ discipleship_meeting_attendance          │
  ├──────────────────────────────────────────┤
  │ id                                       │
  │ meeting_id                               │
  │ disciple_id                              │
  │ present                                  │
  └──────────────────────────────────────────┘
```

### 8. Finanças

```
┌──────────────────────────┐
│ transaction_categories   │
├──────────────────────────┤
│ id                       │
│ church_id                │
│ name                     │
│ type (Income/Expense)    │
│ is_system                │
└────────┬─────────────────┘
         │
         │         ┌──────────────────┐
         └────────►│  transactions    │
                   ├──────────────────┤
                   │ id               │
                   │ church_id        │
                   │ type             │
                   │ category_id      │
                   │ amount           │
                   │ date             │
                   │ source           │
                   │ source_id        │
                   │ description      │
                   └──────────────────┘
```

### 9. Auditoria

```
┌──────────────┐
│ audit_logs   │
├──────────────┤
│ id           │
│ church_id    │
│ user_id      │
│ action       │
│ entity_type  │
│ entity_id    │
│ old_values   │ (JSONB)
│ new_values   │ (JSONB)
│ ip_address   │
│ user_agent   │
│ created_at   │
└──────────────┘
```

## Relacionamentos Principais

### Chave Estrangeira (FK)
```
→  Indica relacionamento direto (Foreign Key)
```

### Relacionamentos Many-to-Many
```
┌─────────┐     ┌──────────────┐     ┌─────────┐
│ groups  │────►│group_members │◄────│ members │
└─────────┘     └──────────────┘     └─────────┘
```

## Índices Importantes

### Performance
- `church_id` em todas as tabelas (para RLS)
- `email` em members e users
- `date` em services, events, transactions
- `status` em members, groups, services

### Unique Constraints
- `churches.slug`
- `members(church_id, member_code)` - Único por igreja
- `group_members(group_id, member_id)` - Evita duplicatas

## Triggers Automáticos

```
┌─────────────────────────────────────────────┐
│ BEFORE INSERT ON members                    │
│ → generate_member_code()                    │
│   Gera M001, M002, M003...                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ BEFORE UPDATE ON *                          │
│ → update_updated_at_column()                │
│   Atualiza updated_at automaticamente       │
└─────────────────────────────────────────────┘
```

## Row Level Security (RLS)

### Políticas Principais

```
┌─────────────────────────────────────────────┐
│ SELECT: Apenas dados da própria igreja      │
│ WHERE church_id = get_user_church_id()      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ INSERT/UPDATE/DELETE: Admin ou permissão    │
│ WHERE is_admin() OR                         │
│       user_has_permission('manage_X')       │
└─────────────────────────────────────────────┘
```

## Soft Delete

Tabelas com soft delete (deleted_at):
- members
- groups
- services
- departments
- events
- teaching_classes
- transaction_categories
- transactions

## JSON Fields

Campos JSONB para flexibilidade:
- `churches.settings` - Configurações customizadas
- `plans.features` - Features do plano
- `users.permissions` - Permissões granulares
- `audit_logs.old_values` - Valores antigos
- `audit_logs.new_values` - Valores novos

## Estatísticas e Contadores

### Services
- stats_adults_men
- stats_adults_women
- stats_children_boys
- stats_children_girls
- stats_visitors_men
- stats_visitors_women

### Calculados via Query
- Total de membros por grupo
- Total de alunos por classe
- Total de discípulos por líder
- Saldo financeiro (receitas - despesas)

---

**Legenda:**
- `◄─` : Relacionamento (Foreign Key)
- `─►` : Relacionamento Many-to-Many
- `*` : Todas as tabelas relevantes
