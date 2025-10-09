-- =========================================================================
-- SCRIPT PARA CRIAR PERFIL ADMIN PARA USUÁRIO EXISTENTE
-- =========================================================================
--
-- PROBLEMA: Você tem um usuário em auth.users mas não tem perfil em user_profiles
-- SOLUÇÃO: Este script cria o perfil admin para seu usuário existente
--
-- INSTRUÇÕES:
-- 1. Vá para: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql/new
-- 2. Cole este script
-- 3. ALTERE o email na linha 22 para seu email
-- 4. ALTERE o nome na linha 23 (opcional)
-- 5. Clique em "Run" ou pressione Ctrl+Enter
-- 6. Faça logout e login novamente no sistema
--
-- =========================================================================

-- Criar perfil admin para usuário existente
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

-- Verificar se funcionou
SELECT
  'Perfil criado com sucesso!' as mensagem,
  id,
  email,
  name,
  role
FROM public.user_profiles
WHERE email = 'a.carnevalli@gmail.com';  -- ← ALTERE AQUI também
