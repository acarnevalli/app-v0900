-- =============================================
-- SCRIPT DE CRIAÇÃO DE USUÁRIOS
-- Sistema de Gestão de Marcenaria
-- =============================================
--
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Copie e cole todo este script
-- 4. EDITE os dados do usuário (email, senha, nome)
-- 5. Execute (RUN)
--
-- IMPORTANTE: Este script cria usuários diretamente no banco
-- sem necessidade de SMTP ou convites por email.
-- =============================================

-- =============================================
-- CRIAR USUÁRIO
-- =============================================
-- EDITE OS VALORES ABAIXO:

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'carnevalli.esquadrias@gmail.com'; -- ⚠️ EDITE AQUI
  v_password text := 'SenhaSegura123!'; -- ⚠️ EDITE AQUI
  v_full_name text := 'Usuario Teste'; -- ⚠️ EDITE AQUI (opcional)
BEGIN
  -- Verificar se usuário já existe
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  Usuário com email % já existe (ID: %)', v_email, v_user_id;
  ELSE
    -- Criar novo usuário
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')), -- Hash da senha
      now(), -- Email confirmado imediatamente
      now(),
      '',
      now(),
      '',
      now(),
      '',
      '',
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', v_full_name),
      false,
      now(),
      now(),
      null,
      null,
      '',
      '',
      now(),
      '',
      0,
      null,
      '',
      now(),
      false,
      null
    )
    RETURNING id INTO v_user_id;

    -- Criar identity para o usuário
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email
      ),
      'email',
      now(),
      now(),
      now()
    );

    RAISE NOTICE '✅ Usuário criado com sucesso!';
    RAISE NOTICE '📧 Email: %', v_email;
    RAISE NOTICE '🆔 ID: %', v_user_id;
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Credenciais de acesso:';
    RAISE NOTICE '   Email: %', v_email;
    RAISE NOTICE '   Senha: (a que você definiu)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Próximo passo:';
    RAISE NOTICE '   Faça login no sistema usando essas credenciais';
  END IF;
END $$;

-- =============================================
-- VERIFICAR USUÁRIOS CADASTRADOS
-- =============================================
-- Descomente as linhas abaixo para ver todos os usuários:

-- SELECT
--   id,
--   email,
--   raw_user_meta_data->>'full_name' as nome,
--   email_confirmed_at,
--   created_at
-- FROM auth.users
-- ORDER BY created_at DESC;
