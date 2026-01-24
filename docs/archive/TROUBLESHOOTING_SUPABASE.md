# SOLUÇÃO DE PROBLEMAS - Tipos de Culto

## 🔴 Erro Atual: "supabase is not defined"

### ✅ Passos para Resolver:

#### 1. **Reiniciar o Servidor de Desenvolvimento**
O erro pode estar acontecendo porque o servidor precisa ser reiniciado.

**Ação:**
1. Pare o servidor (Ctrl+C no terminal)
2. Execute novamente: `npm run dev`

#### 2. **Verificar Variáveis de Ambiente**
As variáveis estão corretas no `.env`, mas certifique-se de que o arquivo está na raiz do projeto.

**Localização:** `c:\projects\thronus_v5\.env`

#### 3. **Limpar Cache do Navegador**
Às vezes o cache do navegador pode causar problemas.

**Ação:**
1. Abra DevTools (F12)
2. Clique com botão direito no ícone de recarregar
3. Selecione "Limpar cache e recarregar forçadamente"

#### 4. **Verificar se as Migrações foram Executadas**
Certifique-se de que executou todos os arquivos SQL:

- ✅ `20241205_add_service_types.sql` (ou ignorar se deu erro)
- ✅ `20241205_add_default_start_time.sql` (adiciona coluna)
- ✅ `20241205_service_types_rls.sql` (permissões)

#### 5. **Testar Conexão com Supabase**
No console do navegador (F12 → Console), execute:

```javascript
// Teste 1: Verificar se supabase está definido
console.log('Supabase:', window.supabase);

// Teste 2: Verificar usuário logado
const { data } = await supabase.auth.getUser();
console.log('User:', data.user);

// Teste 3: Verificar church_id
const { data: userData } = await supabase
  .from('users')
  .select('church_id')
  .eq('id', data.user.id)
  .single();
console.log('Church ID:', userData?.church_id);
```

### 🎯 Solução Rápida:

**Execute estes comandos em ordem:**

1. **Pare o servidor** (Ctrl+C)
2. **Limpe o cache do build:**
   ```bash
   rm -rf node_modules/.vite
   ```
3. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```
4. **Limpe o cache do navegador** (Ctrl+Shift+R ou Ctrl+F5)

### 📋 Checklist de Verificação:

- [ ] Servidor reiniciado
- [ ] Cache do navegador limpo
- [ ] Todas as migrações SQL executadas
- [ ] Usuário está logado
- [ ] Church ID está presente
- [ ] Permissões RLS configuradas

### 🔍 Se o Erro Persistir:

Compartilhe:
1. O resultado dos testes do console (acima)
2. Qualquer erro que aparecer no terminal onde o `npm run dev` está rodando
3. Screenshot do Network tab mostrando as requisições falhando

---

**Nota:** O erro "supabase is not defined" geralmente é resolvido reiniciando o servidor de desenvolvimento.
