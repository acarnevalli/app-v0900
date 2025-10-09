-- Script para promover um usuário existente a administrador
--
-- INSTRUÇÕES:
-- 1. Substitua 'SEU_EMAIL_AQUI@exemplo.com' pelo email do usuário que deseja promover
-- 2. Execute este script no SQL Editor do Supabase
--
-- Este script procura o usuário pelo email e atualiza seu role para 'admin'

DO $$
DECLARE
  v_user_id uuid;
  v_user_email text;
BEGIN
  -- ALTERE O EMAIL AQUI:
  v_user_email := 'SEU_EMAIL_AQUI@exemplo.com';

  -- Buscar o ID do usuário pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;

  -- Verificar se o usuário existe
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', v_user_email;
  END IF;

  -- Verificar se o perfil já existe
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = v_user_id) THEN
    -- Atualizar o role do perfil existente
    UPDATE public.user_profiles
    SET role = 'admin', updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE '✅ Usuário % promovido a ADMIN com sucesso!', v_user_email;
  ELSE
    -- Criar o perfil como admin
    INSERT INTO public.user_profiles (id, email, name, role, created_at, updated_at)
    VALUES (
      v_user_id,
      v_user_email,
      COALESCE((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = v_user_id), ''),
      'admin',
      now(),
      now()
    );

    RAISE NOTICE '✅ Perfil criado e usuário % definido como ADMIN!', v_user_email;
  END IF;

  RAISE NOTICE '🔑 ID do usuário: %', v_user_id;
  RAISE NOTICE '📧 Email: %', v_user_email;
  RAISE NOTICE '👤 Role: admin';
END $$;
