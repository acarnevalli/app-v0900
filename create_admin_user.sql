-- Script para criar usuário administrador
-- Execute este script no SQL Editor do Supabase

DO $$
DECLARE
  v_user_id uuid;
  v_encrypted_pw text;
BEGIN
  -- Gerar ID único para o usuário
  v_user_id := gen_random_uuid();

  -- Criar hash da senha usando crypt (senha: admin123)
  v_encrypted_pw := crypt('admin123', gen_salt('bf'));

  -- Inserir usuário na tabela auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@sistema.com',
    v_encrypted_pw,
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Administrador"}',
    'authenticated',
    'authenticated'
  )
  ON CONFLICT (email) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = now();

  -- Buscar o ID do usuário (caso já exista)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@sistema.com';

  -- Criar identity para o usuário
  INSERT INTO auth.identities (
    provider_id,
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id::text,
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', 'admin@sistema.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider_id, provider) DO NOTHING;

  -- Criar perfil do usuário na tabela user_profiles
  INSERT INTO public.user_profiles (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'admin@sistema.com',
    'Administrador',
    'admin',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = now();

  RAISE NOTICE '✅ Usuário admin criado com sucesso!';
  RAISE NOTICE '📧 Email: admin@sistema.com';
  RAISE NOTICE '🔑 Senha: admin123';
  RAISE NOTICE '🆔 ID: %', v_user_id;
END $$;
