# 📋 PLANO DE IMPLEMENTAÇÃO - Módulo de Grupos (Células)

## 🎯 **Objetivo**
Implementar CRUD completo de Grupos com integração ao Supabase, página de detalhes e funcionalidades avançadas.

## 📊 **Status Atual**
- ✅ Tipos TypeScript definidos
- ✅ Hook `useGroups` básico criado
- ✅ Página `Groups.tsx` com dados MOCK
- ✅ Modais básicos criados
- ❌ Integração com Supabase incompleta
- ❌ Página de detalhes não funcional
- ❌ Funcionalidades de reuniões não implementadas

---

## 🗄️ **1. BANCO DE DADOS**

### **Tabelas Necessárias:**

#### **`groups`**
```sql
- id (UUID, PK)
- church_id (UUID, FK)
- name (VARCHAR)
- description (TEXT)
- type (VARCHAR) - "Célula", "Grupo de Estudo", "Grupo de Oração", etc.
- leader_id (UUID, FK → members)
- co_leader_id (UUID, FK → members)
- meeting_day (VARCHAR) - "Segunda", "Terça", etc.
- meeting_time (TIME)
- location (TEXT)
- address (TEXT)
- neighborhood (VARCHAR)
- district (VARCHAR)
- province (VARCHAR)
- country (VARCHAR)
- municipality (VARCHAR)
- status (VARCHAR) - "Ativo", "Inativo", "Cheio"
- max_members (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP)
```

#### **`group_members`**
```sql
- id (UUID, PK)
- group_id (UUID, FK → groups)
- member_id (UUID, FK → members)
- role (VARCHAR) - "Líder", "Co-líder", "Membro", "Secretário", "Visitante"
- joined_at (TIMESTAMP)
- left_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### **`group_meetings`**
```sql
- id (UUID, PK)
- group_id (UUID, FK → groups)
- date (DATE)
- start_time (TIME)
- end_time (TIME)
- topic (VARCHAR)
- notes (TEXT)
- location (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **`group_meeting_attendance`**
```sql
- id (UUID, PK)
- meeting_id (UUID, FK → group_meetings)
- member_id (UUID, FK → members)
- status (VARCHAR) - "Presente", "Ausente", "Justificado"
- notes (TEXT)
- created_at (TIMESTAMP)
```

---

## 💻 **2. CÓDIGO**

### **2.1. Hook `useGroups.ts`**
- ✅ fetchGroups() - Buscar todos os grupos
- ✅ addGroup() - Criar novo grupo
- ✅ updateGroup() - Atualizar grupo
- ✅ deleteGroup() - Excluir grupo (soft delete)
- ❌ getGroupById() - Buscar grupo específico com detalhes
- ❌ addMemberToGroup() - Adicionar membro ao grupo
- ❌ removeMemberFromGroup() - Remover membro do grupo
- ❌ updateMemberRole() - Atualizar papel do membro

### **2.2. Hook `useGroupMeetings.ts` (NOVO)**
- ❌ fetchMeetings() - Buscar reuniões do grupo
- ❌ addMeeting() - Criar nova reunião
- ❌ updateMeeting() - Atualizar reunião
- ❌ deleteMeeting() - Excluir reunião
- ❌ recordAttendance() - Registrar presença
- ❌ getAttendanceStats() - Estatísticas de presença

### **2.3. Página `Groups.tsx`**
- ✅ Layout básico
- ❌ Integração com hook real
- ❌ Filtros funcionais
- ❌ Busca
- ❌ Ordenação
- ❌ Cards responsivos
- ❌ Navegação para detalhes

### **2.4. Página `GroupDetail.tsx`**
- ❌ Informações do grupo
- ❌ Lista de membros
- ❌ Adicionar/remover membros
- ❌ Histórico de reuniões
- ❌ Registrar nova reunião
- ❌ Estatísticas de presença
- ❌ Gráficos de crescimento

### **2.5. Modais**
- ❌ `GroupModal.tsx` - Criar/Editar grupo
- ❌ `AddGroupMemberModal.tsx` - Adicionar membro
- ❌ `GroupMeetingModal.tsx` - Registrar reunião

---

## 🎨 **3. INTERFACE**

### **3.1. Página de Listagem**
```
┌─────────────────────────────────────────────────────────┐
│ Grupos                                    [+ Novo Grupo] │
├─────────────────────────────────────────────────────────┤
│ [🔍 Buscar...] [Filtro ▼] [Ordenar ▼]                  │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│ │ Jovens      │ │ Casais      │ │ Mulheres    │       │
│ │ 👥 12       │ │ 👥 8        │ │ 👥 15       │       │
│ │ Seg, 19:00  │ │ Sáb, 18:00  │ │ Qua, 14:00  │       │
│ │ [Ver] [✏️]  │ │ [Ver] [✏️]  │ │ [Ver] [✏️]  │       │
│ └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### **3.2. Página de Detalhes**
```
┌─────────────────────────────────────────────────────────┐
│ ← Voltar    Grupo Jovens                    [✏️] [🗑️]  │
├─────────────────────────────────────────────────────────┤
│ 📍 Rua ABC, 123 - Centro                               │
│ 📅 Segundas-feiras, 19:00                              │
│ 👤 Líder: João Silva                                    │
│ 👥 12 membros                                           │
├─────────────────────────────────────────────────────────┤
│ [Membros] [Reuniões] [Estatísticas]                    │
├─────────────────────────────────────────────────────────┤
│ Membros (12)                          [+ Adicionar]     │
│ ┌───────────────────────────────────────────────────┐  │
│ │ João Silva (Líder)                    [Remover]   │  │
│ │ Maria Santos (Co-líder)               [Remover]   │  │
│ │ Pedro Costa (Membro)                  [Remover]   │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 **4. ORDEM DE IMPLEMENTAÇÃO**

### **Fase 1: Banco de Dados** (30min)
1. Criar migração para tabelas
2. Configurar RLS
3. Criar triggers e funções

### **Fase 2: Backend/Hooks** (1h)
1. Atualizar `useGroups.ts`
2. Criar `useGroupMeetings.ts`
3. Testar CRUD

### **Fase 3: Interface - Listagem** (1h)
1. Atualizar `Groups.tsx`
2. Integrar com hooks
3. Implementar filtros e busca

### **Fase 4: Interface - Detalhes** (1h30)
1. Implementar `GroupDetail.tsx`
2. Aba de membros
3. Aba de reuniões
4. Aba de estatísticas

### **Fase 5: Modais** (1h)
1. `GroupModal.tsx`
2. `AddGroupMemberModal.tsx`
3. `GroupMeetingModal.tsx`

### **Fase 6: Testes e Ajustes** (30min)
1. Testar fluxo completo
2. Ajustar responsividade
3. Corrigir bugs

---

## 📊 **5. FUNCIONALIDADES AVANÇADAS**

### **Estatísticas**
- Taxa de presença por membro
- Crescimento do grupo (gráfico)
- Membros mais ativos
- Frequência de reuniões

### **Relatórios**
- Exportar lista de membros
- Relatório de presença mensal
- Histórico de reuniões

### **Notificações**
- Lembrete de reunião
- Aniversariantes do grupo
- Novos membros

---

**Tempo estimado total: 5h30min**

Vamos começar?
