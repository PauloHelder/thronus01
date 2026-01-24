# Funcionalidades de Cultos Implementadas

## Resumo
Implementamos as funcionalidades completas de gerenciamento de cultos com integração ao Supabase, incluindo cadastro, listagem, edição, exclusão e página de detalhes com estatísticas.

## Componentes Criados/Atualizados

### 1. Hook useServices (`src/hooks/useServices.ts`)
- **Propósito**: Gerenciar todas as operações CRUD de cultos com Supabase
- **Funcionalidades**:
  - `fetchServices()`: Busca todos os cultos da igreja
  - `createService()`: Cria um novo culto
  - `updateService()`: Atualiza um culto existente
  - `deleteService()`: Exclui um culto (soft delete)
  - `getService()`: Busca um culto específico por ID
  - `updateStatistics()`: Atualiza as estatísticas de presença de um culto

### 2. Página de Listagem (`src/pages/Services.tsx`)
- **Funcionalidades**:
  - Listagem de todos os cultos com dados do Supabase
  - Cards de estatísticas (Total, Concluídos, Agendados, Total de Presença)
  - Filtros por:
    - Tipo de culto
    - Status (Agendado, Concluído, Cancelado)
    - Período (data início e fim)
  - Visualização responsiva (cards no mobile, tabela no desktop)
  - Ações: Ver detalhes, Editar, Excluir
  - Estado de loading enquanto busca dados
  - Integração com modal de cadastro/edição

### 3. Página de Detalhes (`src/pages/ServiceDetail.tsx`)
- **Funcionalidades**:
  - Visualização completa dos dados do culto
  - Informações exibidas:
    - Nome, tipo, status, data e horário
    - Pregador e dirigente
    - Local e descrição
  - Gerenciamento de estatísticas de presença:
    - Adultos (homens e mulheres)
    - Crianças (meninos e meninas)
    - Visitantes (homens e mulheres)
  - Cards de resumo com totais
  - Formulário para atualizar estatísticas
  - Estado de loading
  - Tratamento de erro quando culto não é encontrado

### 4. Modal de Cadastro/Edição (`src/components/modals/ServiceModal.tsx`)
- **Campos**:
  - Nome do culto
  - Tipo de culto (dropdown com opções pré-definidas)
  - Status (Agendado, Concluído, Cancelado)
  - Data e horário de início
  - Pregador (opcional)
  - Dirigente (opcional)
  - Local
  - Descrição (opcional)

## Estrutura do Banco de Dados

### Tabela `services`
```sql
- id: UUID (PK)
- church_id: UUID (FK para churches)
- name: VARCHAR(255)
- type: VARCHAR(50) - Tipos permitidos
- date: DATE
- start_time: TIME
- end_time: TIME (nullable)
- preacher_id: UUID (FK para members, nullable)
- leader_id: UUID (FK para members, nullable)
- location: VARCHAR(255)
- description: TEXT
- status: VARCHAR(20) - Agendado, Concluído, Cancelado
- stats_adults_men: INTEGER
- stats_adults_women: INTEGER
- stats_children_boys: INTEGER
- stats_children_girls: INTEGER
- stats_visitors_men: INTEGER
- stats_visitors_women: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- deleted_at: TIMESTAMP (soft delete)
```

## Tipos de Culto Disponíveis
1. Culto de Domingo
2. Culto de Meio da Semana
3. Culto Jovem
4. Reunião de Oração
5. Estudo Bíblico
6. Culto Especial
7. Conferência

## Fluxo de Uso

### Cadastrar um Novo Culto
1. Acessar a página de Cultos
2. Clicar em "Adicionar Culto"
3. Preencher o formulário no modal
4. Clicar em "Criar Culto"
5. O culto é salvo no Supabase e aparece na listagem

### Editar um Culto
1. Na listagem, clicar no ícone de editar (lápis)
2. O modal abre com os dados preenchidos
3. Modificar os campos desejados
4. Clicar em "Salvar Alterações"

### Excluir um Culto
1. Na listagem, clicar no ícone de excluir (lixeira)
2. Confirmar a exclusão
3. O culto é marcado como deletado (soft delete)

### Registrar Estatísticas de Presença
1. Acessar os detalhes do culto (clicar no culto ou no ícone de olho)
2. Preencher os campos de estatísticas:
   - Adultos (homens e mulheres)
   - Crianças (meninos e meninas)
   - Visitantes (homens e mulheres)
3. Clicar em "Salvar"
4. As estatísticas são atualizadas no banco

## Observações Importantes

### Cálculo de Totais
- **Total de Presença**: Soma de adultos e crianças (NÃO inclui visitantes)
- **Visitantes**: Contabilizados separadamente para análise

### Segurança
- Row Level Security (RLS) ativo no Supabase
- Usuários só podem ver/editar cultos da sua igreja
- Soft delete para manter histórico

### Performance
- Dados carregados sob demanda
- Estados de loading para melhor UX
- Filtros aplicados no frontend para resposta rápida

## Próximos Passos Sugeridos

1. **Integração com Membros**: Substituir campos de texto (pregador, dirigente) por seleção de membros cadastrados
2. **Relatórios**: Criar página de relatórios com gráficos de presença ao longo do tempo
3. **Notificações**: Enviar lembretes de cultos agendados
4. **Exportação**: Permitir exportar estatísticas em PDF/Excel
5. **Recorrência**: Adicionar opção de criar cultos recorrentes (semanais, mensais)
6. **Check-in**: Sistema de check-in de membros durante o culto
7. **Ofertas**: Integrar com módulo financeiro para registrar ofertas do culto
