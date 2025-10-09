/*
  # Tabela de Perfis de Usuários com Sistema de Papéis

  1. Nova Tabela
    - `user_profiles`
      - `id` (uuid, chave primária, referência ao auth.users)
      - `email` (text, email do usuário)
      - `name` (text, nome completo do usuário)
      - `role` (text, papel do usuário: 'admin', 'manager', 'user')
      - `created_at` (timestamptz, data de criação)
      - `updated_at` (timestamptz, data de atualização)

  2. Segurança
    - Habilita RLS na tabela `user_profiles`
    - Política para usuários autenticados lerem seu próprio perfil
    - Política para administradores lerem todos os perfis
    - Política para administradores atualizarem perfis
    - Política para criação automática de perfil no registro

  3. Funções
    - Trigger para criar perfil automaticamente quando usuário é criado
    - Trigger para atualizar campo `updated_at` automaticamente

  4. Papéis Disponíveis
    - `admin`: Acesso total ao sistema, pode gerenciar usuários e todas as configurações
    - `manager`: Acesso a relatórios e gestão, mas sem gerenciar usuários
    - `user`: Acesso básico ao sistema
*/

-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Criar índice no email para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Criar índice no role para filtros
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ler seu próprio perfil
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política: administradores podem ler todos os perfis
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
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
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
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
DROP POLICY IF EXISTS "Users can update own name" ON user_profiles;
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
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;
CREATE POLICY "Allow profile creation"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

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