# LEIA AQUI PRIMEIRO - Solução do Problema Admin

## Seu Problema

Você está vendo este erro no console:
```
[AuthContext] Erro ao buscar perfil: Object
```

E o sistema reconhece você como `user` em vez de `admin`.

## Por que isso acontece?

Seu usuário (`a.carnevalli@gmail.com`) existe na tabela `auth.users` do Supabase, mas **NÃO existe** na tabela `user_profiles`. O sistema precisa dos dois para funcionar corretamente.

## Solução Rápida (5 minutos)

### Passo 1: Abra o SQL Editor do Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em "SQL Editor"
4. Clique em "New query"

### Passo 2: Execute este Script

Cole e execute o script abaixo (ALTERE o email e nome antes):

```sql
-- Criar perfil admin para seu usuário
INSERT INTO public.user_profiles (id, email, name, role, created_at, updated_at)
SELECT
  id,
  email,
  'Alex',  -- ← ALTERE AQUI para seu nome
  'admin',
  now(),
  now()
FROM auth.users
WHERE email = 'a.carnevalli@gmail.com'  -- ← ALTERE AQUI para seu email
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  name = EXCLUDED.name,
  updated_at = now();

-- Verificar resultado
SELECT
  '✅ Perfil criado com sucesso!' as status,
  id,
  email,
  name,
  role
FROM public.user_profiles
WHERE email = 'a.carnevalli@gmail.com';  -- ← ALTERE AQUI também
```

### Passo 3: Limpe o Cache e Faça Login Novamente

1. Faça **logout** do sistema
2. Abra as ferramentas do desenvolvedor (F12)
3. Na aba "Application" (Chrome) ou "Storage" (Firefox):
   - Clique em "Clear site data" / "Limpar dados do site"
4. Ou simplesmente pressione: **Ctrl+Shift+Delete** e limpe o cache
5. Feche e abra o navegador novamente
6. Faça **login** novamente

### Passo 4: Verifique se Funcionou

Após fazer login, pressione F12 e procure no console:
```
[AuthContext] ✅ Sessão ativa para a.carnevalli@gmail.com (admin)
```

Se aparecer `(admin)`, pronto! Funcionou!

---

## Alternativa: Use o Script Pronto

Se preferir, use o arquivo `FIX_CRIAR_PERFIL_ADMIN.sql`:
1. Abra o arquivo
2. Altere o email e nome nas linhas indicadas
3. Cole no SQL Editor do Supabase
4. Execute
5. Faça logout e login novamente

---

## Ainda não funcionou?

### Problema 1: Tabela user_profiles não existe

Execute este script para verificar:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
);
```

Se retornar `false`, você precisa aplicar a migração:
1. Abra: `supabase/migrations/20251009224501_create_user_profiles_with_roles.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute
5. Depois execute o script de criação de perfil novamente

### Problema 2: Políticas RLS bloqueando acesso

Execute este script para corrigir as políticas:
1. Abra o SQL Editor
2. Cole e execute:

```sql
-- Simplificar política de leitura
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

CREATE POLICY "Authenticated users can read profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);
```

3. Tente fazer login novamente

---

## Precisa de Ajuda?

1. Verifique os logs do console (F12) para erros específicos
2. Confira se as variáveis de ambiente `.env` estão corretas:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Verifique se está conectado ao projeto correto no Supabase

---

## Documentos Relacionados

- `COMO_TORNAR_USUARIO_ADMIN.md` - Guia completo
- `FIX_CRIAR_PERFIL_ADMIN.sql` - Script de correção
- `promote_user_to_admin.sql` - Script alternativo
