# Como Tornar um Usuário Administrador

## Problema Resolvido

O sistema agora possui uma tabela `user_profiles` que gerencia as permissões (roles) dos usuários. Por padrão, novos usuários recebem o role `user`, mas você pode promovê-los a `admin` ou `manager`.

## Método 1: Primeiro Usuário (Automático) ⭐ RECOMENDADO

**O primeiro usuário cadastrado no sistema será automaticamente definido como admin.**

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

Após fazer login, abra o console do navegador (F12) e procure por:

```
[AuthContext] ✅ Sessão ativa para seu@email.com (admin)
```

Se aparecer `(admin)` no final, está funcionando!

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
- Execute a migração mais recente: `20251009171917_create_user_profiles_table.sql`
