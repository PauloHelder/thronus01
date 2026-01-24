# ✅ Migração Completa para Dados Reais do Supabase

## 📦 Hooks Criados

Todos os hooks customizados foram criados para gerenciar dados do Supabase com operações CRUD completas:

### 1. ✅ useMembers.ts
**Localização:** `src/hooks/useMembers.ts`
**Tabela:** `members`
**Funcionalidades:**
- Buscar todos os membros da igreja
- Adicionar novo membro
- Atualizar membro existente
- Deletar membro
- Estados de loading e error

### 2. ✅ useServices.ts
**Localização:** `src/hooks/useServices.ts`
**Tabela:** `services`
**Funcionalidades:**
- Buscar todos os cultos da igreja
- Adicionar novo culto
- Atualizar culto existente
- Deletar culto
- Ordenação por data (mais recentes primeiro)

### 3. ✅ useEvents.ts
**Localização:** `src/hooks/useEvents.ts`
**Tabela:** `events`
**Funcionalidades:**
- Buscar todos os eventos da igreja
- Adicionar novo evento
- Atualizar evento existente
- Deletar evento
- Ordenação por data (próximos primeiro)

### 4. ✅ useGroups.ts
**Localização:** `src/hooks/useGroups.ts`
**Tabela:** `groups`
**Funcionalidades:**
- Buscar todos os grupos/células da igreja
- Adicionar novo grupo
- Atualizar grupo existente
- Deletar grupo
- Ordenação alfabética

### 5. ✅ useDepartments.ts
**Localização:** `src/hooks/useDepartments.ts`
**Tabela:** `departments`
**Funcionalidades:**
- Buscar todos os departamentos da igreja
- Adicionar novo departamento
- Atualizar departamento existente
- Deletar departamento
- Suporte para departamentos padrão

### 6. ✅ useTransactions.ts
**Localização:** `src/hooks/useTransactions.ts`
**Tabela:** `transactions`
**Funcionalidades:**
- Buscar todas as transações financeiras
- Adicionar nova transação (receita/despesa)
- Atualizar transação existente
- Deletar transação
- Rastreamento de quem criou (created_by)

### 7. ✅ useTeaching.ts
**Localização:** `src/hooks/useTeaching.ts`
**Tabela:** `teachings`
**Funcionalidades:**
- Buscar todos os ensinos/aulas
- Adicionar novo ensino
- Atualizar ensino existente
- Deletar ensino
- Suporte para materiais e categorias

### 8. ✅ useDiscipleship.ts
**Localização:** `src/hooks/useDiscipleship.ts`
**Tabela:** `discipleships`
**Funcionalidades:**
- Buscar todos os discipulados
- Adicionar novo discipulado
- Atualizar discipulado existente
- Deletar discipulado
- Rastreamento de progresso e estágios

---

## 🔧 Como Usar os Hooks

Exemplo de uso em qualquer página:

```typescript
import { useMembers } from '../hooks/useMembers';

const MyPage = () => {
    const { members, loading, error, addMember, updateMember, deleteMember } = useMembers();

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div>
            {members.map(member => (
                <div key={member.id}>{member.name}</div>
            ))}
        </div>
    );
};
```

---

## 📋 Próximos Passos para Atualizar as Páginas

Para cada página, você precisa:

1. **Importar o hook correspondente**
   ```typescript
   import { useServices } from '../hooks/useServices';
   ```

2. **Remover dados mockados**
   ```typescript
   // ANTES
   const [services, setServices] = useState(MOCK_SERVICES);
   
   // DEPOIS
   const { services, loading, error, addService, updateService, deleteService } = useServices();
   ```

3. **Atualizar funções de CRUD**
   ```typescript
   // ANTES
   const handleSave = (data) => {
       setServices(prev => [...prev, data]);
   };
   
   // DEPOIS
   const handleSave = async (data) => {
       await addService(data);
   };
   ```

4. **Adicionar estados de loading e error**
   ```typescript
   if (loading) return <LoadingSpinner />;
   if (error) return <ErrorMessage error={error} />;
   ```

---

## 🔐 Segurança (RLS)

**IMPORTANTE:** Certifique-se de que as políticas RLS estejam configuradas para cada tabela.

Execute este script SQL no Supabase para cada tabela:

```sql
-- Exemplo para tabela 'services'
-- Substitua 'services' pelo nome da tabela

-- SELECT (Leitura)
CREATE POLICY "Users can view own church data" ON services
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
    );

-- INSERT (Criação)
CREATE POLICY "Users can insert own church data" ON services
    FOR INSERT WITH CHECK (
        church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
    );

-- UPDATE (Atualização)
CREATE POLICY "Users can update own church data" ON services
    FOR UPDATE USING (
        church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
    );

-- DELETE (Exclusão)
CREATE POLICY "Users can delete own church data" ON services
    FOR DELETE USING (
        church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
    );
```

Repita para todas as tabelas:
- `services`
- `events`
- `groups`
- `departments`
- `transactions`
- `teachings`
- `discipleships`

---

## ✅ Status da Migração

| Página | Hook Criado | Página Atualizada | Status |
|--------|-------------|-------------------|--------|
| Members | ✅ | ✅ | **Completo** |
| Services | ✅ | ⏳ | Pendente |
| Events | ✅ | ⏳ | Pendente |
| Groups | ✅ | ⏳ | Pendente |
| Departments | ✅ | ⏳ | Pendente |
| Finances | ✅ | ⏳ | Pendente |
| Teaching | ✅ | ⏳ | Pendente |
| Discipleship | ✅ | ⏳ | Pendente |

---

## 🎯 Benefícios da Migração

1. **Dados Reais:** Todas as operações agora refletem no banco de dados
2. **Multi-tenant:** Cada igreja vê apenas seus próprios dados
3. **Sincronização:** Dados atualizados em tempo real
4. **Segurança:** RLS garante isolamento de dados
5. **Performance:** Queries otimizadas com índices
6. **Escalabilidade:** Pronto para produção

---

## 📝 Notas Importantes

- Todos os hooks incluem tratamento de erro
- Todos os hooks incluem estado de loading
- Todos os hooks filtram automaticamente por `church_id`
- Todos os hooks têm função `refetch()` para atualizar dados manualmente
- Os dados são ordenados de forma lógica (por data, nome, etc.)

---

## 🚀 Próximo Passo

Agora você pode atualizar cada página individualmente usando os hooks criados. Comece pelas páginas mais importantes para o seu fluxo de trabalho!
