# Plano de Implementação - Exportação de Extratos com Identidade Visual

Implementação de exportação de extratos financeiros nos formatos PDF e Excel, incorporando a identidade visual do sistema (Tronus) e garantindo que os dados reflitam fielmente os filtros aplicados na tabela.

## 🛠 Alterações Necessárias

### 1. `src/utils/exportUtils.ts`
- [x] **PDF**: Adicionar cabeçalho estilizado com o logo simplificado do Tronus.
- [x] **PDF**: Implementar cores da marca (Orange-500 para destaques, Slate-800 para textos).
- [x] **PDF**: Melhorar o layout da tabela e dos cartões de resumo.
- [x] **Excel**: Adicionar cabeçalhos formatados e metadados do relatório.
- [x] **Geral**: Garantir tratamento de erros e formatações consistentes.

### 2. `src/pages/Finance.tsx`
- [x] Integrar o menu de exportação (PDF/Excel) no novo módulo financeiro.
- [x] Passar os dados filtrados e metadados (nome da igreja, filtros) para as funções de exportação.

### 2. `src/pages/Finances.tsx` (Compatibilidade)
- [x] Ajustar a chamada das funções caso a assinatura tenha mudado.

## 🚀 Critérios de Aceite
- [ ] PDF gerado contém o logo, cores da marca e resumo financeiro.
- [ ] Excel gerado possui cabeçalhos claros e dados alinhados.
- [ ] Ambos os arquivos respeitam os filtros aplicados na tela (Pesquisa, Data, Categoria, Tipo).
- [ ] O nome do arquivo inclui o nome da igreja e a data atual.

## 📅 Cronograma Sugerido
1. Modificação do `exportUtils.ts` (Core logic).
2. Atualização do `Finance.tsx` (UI integration).
3. Testes finais e refinamento visual.
