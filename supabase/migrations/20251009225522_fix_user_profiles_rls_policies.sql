/*
  # Correção das Políticas RLS da tabela user_profiles

  1. Problema Identificado
    - As políticas RLS estavam muito restritivas e impediam usuários de ler seus próprios perfis
    - Políticas com subqueries causavam deadlock ao buscar o próprio perfil

  2. Solução
    - Simplificar política de leitura: usuários autenticados podem ler qualquer perfil
    - Manter restrições apenas para UPDATE e INSERT
    - Garantir que o sistema funcione corretamente

  3. Segurança
    - Mantém RLS habilitado
    - Permite leitura de perfis (necessário para verificar roles)
    - Mantém UPDATE restrito (apenas próprio perfil ou admin)
*/

-- Remover todas as políticas antigas
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own name" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;

-- NOVA POLÍTICA: Usuários autenticados podem ler qualquer perfil
-- (necessário para que o sistema possa verificar roles e exibir lista de usuários)
CREATE POLICY "Authenticated users can read profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuários podem atualizar seu próprio perfil (apenas nome, não o role)
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- Política: Admins podem atualizar qualquer perfil
CREATE POLICY "Admins can update any profile"
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
  WITH CHECK (true);

-- Política: Permitir inserção de perfil (necessário para o trigger)
CREATE POLICY "Allow profile creation"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política: Admins podem deletar perfis (se necessário no futuro)
CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );