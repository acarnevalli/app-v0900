-- ============================================================================
-- SCRIPT DE CONFIGURAÇÃO DO SISTEMA DE GERENCIAMENTO DE USUÁRIOS
-- Execute este script no SQL Editor do Supabase
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CRIAR TABELA DE PERFIS DE USUÁRIOS
-- ----------------------------------------------------------------------------

-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- ----------------------------------------------------------------------------
-- 2. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own name" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;

-- Política: usuários podem ler seu próprio perfil
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política: administradores podem ler todos os perfis
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Política: administradores podem atualizar perfis
CREATE POLICY "Admins can update profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Política: usuários podem atualizar seu próprio nome (mas não o role)
CREATE POLICY "Users can update own name"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- Política: permitir inserção de perfil (para o trigger)
CREATE POLICY "Allow profile creation"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 3. CRIAR FUNÇÕES E TRIGGERS
-- ----------------------------------------------------------------------------

-- Função para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    CASE
      -- O primeiro usuário será admin
      WHEN (SELECT COUNT(*) FROM public.user_profiles) = 0 THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 4. CRIAR PERFIS PARA USUÁRIOS EXISTENTES (SE HOUVER)
-- ----------------------------------------------------------------------------

-- Inserir perfis para usuários que já existem mas não têm perfil
INSERT INTO user_profiles (id, email, name, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', ''),
  CASE
    -- Se não há nenhum perfil ainda, o primeiro usuário vira admin
    WHEN (SELECT COUNT(*) FROM user_profiles) = 0 THEN 'admin'
    ELSE 'user'
  END
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = au.id
)
ORDER BY au.created_at ASC;

-- ----------------------------------------------------------------------------
-- 5. VERIFICAÇÃO E RESUMO
-- ----------------------------------------------------------------------------

-- Mostrar todos os perfis criados
SELECT
  email,
  name,
  role,
  created_at,
  'Perfil criado com sucesso' as status
FROM user_profiles
ORDER BY created_at ASC;

-- Contar usuários por papel
SELECT
  role,
  COUNT(*) as total
FROM user_profiles
GROUP BY role
ORDER BY
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'user' THEN 3
  END;

-- ============================================================================
-- SCRIPT CONCLUÍDO
-- ============================================================================
--
-- PRÓXIMOS PASSOS:
-- 1. Verifique os resultados das queries acima
-- 2. Certifique-se de que existe pelo menos 1 administrador
-- 3. Se necessário, promova um usuário a admin manualmente:
--    UPDATE user_profiles SET role = 'admin' WHERE email = 'seu-email@exemplo.com';
--
-- ============================================================================
