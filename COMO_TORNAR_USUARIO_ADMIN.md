# Como Tornar um Usuário Administrador

## ⚠️ SOLUÇÃO RÁPIDA PARA SEU CASO ⚠️

Você JÁ tem um usuário (`a.carnevalli@gmail.com`) na tabela `auth.users`, mas ele NÃO tem perfil na tabela `user_profiles`. Execute este script no SQL Editor do Supabase:

```sql
-- Criar perfil admin para usuário existente
INSERT INTO public.user_profiles (id, email, name, role, created_at, updated_at)
SELECT
  id,
  email,
  'Alex',  -- ALTERE AQUI para seu nome
  'admin',
  now(),
  now()
FROM auth.users
WHERE email = 'a.carnevalli@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = now();
```

**Após executar:**
1. Faça logout do sistema
2. Limpe o cache (Ctrl+Shift+Delete)
3. Faça login novamente
4. ✅ Pronto! Você será admin

---

## Método 1: Primeiro Usuário (Automático)

**O primeiro usuário cadastrado no sistema será automaticamente definido como admin.**

⚠️ Este método só funciona se:
- A tabela `user_profiles` estiver vazia
- O trigger `on_auth_user_created` estiver ativo

### Passos:
1. Certifique-se de que não há usuários cadastrados
2. Acesse o aplicativo
3. Faça o primeiro cadastro
4. Pronto! Você é admin automaticamente

---

## Método 2: Promover Usuário Existente via SQL

Se você já tem uma conta mas ela não é admin, use este método.

### Passos:

1. **Acesse o SQL Editor do Supabase:**
   - Vá para: `https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql/new`

2. **Abra o arquivo `promote_user_to_admin.sql`**

3. **Edite o email na linha 17:**
   ```sql
   v_user_email := 'seu@email.com';  -- ALTERE AQUI
   ```

4. **Execute o script**

5. **Faça logout e login novamente no aplicativo**

---

## Método 3: Criar Usuário Manualmente no Dashboard

### Passos:

1. **Acesse o Dashboard de Usuários:**
   - Vá para: `https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/auth/users`

2. **Clique em "Add user"**

3. **Escolha "Create new user"**

4. **Preencha:**
   - Email
   - Password
   - Marque "Auto Confirm User" (importante!)

5. **Após criar, use o Método 2** para promover o usuário a admin

---

## Verificar se Funcionou

### 1. No Console do Navegador (F12):
Procure por esta mensagem:
```
[AuthContext] ✅ Sessão ativa para seu@email.com (admin)
```
Se aparecer `(admin)` no final, está funcionando!

### 2. No Supabase Dashboard:
- Acesse: Table Editor > `user_profiles`
- Verifique se seu usuário aparece com `role = 'admin'`

### 3. No Sistema:
- O menu lateral deve mostrar a opção "Usuários" (visível apenas para admins)
- Você terá acesso completo a todas as funcionalidades

---

## Roles Disponíveis

- **admin**: Acesso total ao sistema, pode gerenciar usuários
- **manager**: Acesso a relatórios e gestão, sem gerenciar usuários
- **user**: Acesso básico ao sistema

---

## Solução de Problemas

### O sistema ainda me reconhece como 'user' após executar o script

1. Faça logout completo do aplicativo
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Faça login novamente
4. Verifique no console do navegador

### O script retorna erro "Usuário não encontrado"

- Verifique se o email está correto
- Certifique-se de que o usuário foi criado no Supabase
- Verifique a lista de usuários em: `https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/auth/users`

### O script retorna erro na tabela user_profiles

- A migração pode não ter sido aplicada
- Execute no SQL Editor do Supabase:

```sql
-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
);
```

Se retornar `false`, aplique a migração `create_user_profiles_with_roles` do diretório `supabase/migrations/`.

### O perfil existe mas o sistema não reconhece

1. Verifique as políticas RLS:
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

2. Teste se consegue ler o perfil:
```sql
SELECT * FROM user_profiles WHERE email = 'seu@email.com';
```

3. Se a query acima retornar vazio, as políticas RLS precisam ser corrigidas. Execute a migração `fix_user_profiles_rls_policies`.
