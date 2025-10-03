# Como Usar o Sistema com Supabase

## Sistema Migrado para Supabase

O sistema agora está **100% integrado com Supabase**! Todos os dados são salvos na nuvem e sincronizados automaticamente entre todos os seus dispositivos.

## Primeiros Passos

### 1. Criar Usuário no Supabase

Existem duas formas de criar um usuário:

#### Opção A: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione seu projeto
4. No menu lateral, clique em **Authentication** > **Users**
5. Clique no botão **"Add user"**
6. Escolha **"Create new user"**
7. Preencha:
   - **Email**: seu@email.com
   - **Password**: sua senha segura
8. Clique em **"Create user"**

#### Opção B: Via SQL

Você também pode criar usuários diretamente no SQL Editor do Supabase:

```sql
-- Criar usuário via SQL
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  'seu@email.com',
  crypt('sua_senha', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

### 2. Fazer Login no Sistema

1. Acesse o sistema em seu navegador
2. Use o email e senha que você criou no Supabase
3. Clique em "Entrar no Sistema"

## Funcionalidades Principais

### ✅ Sincronização Automática

- Todos os dados são salvos instantaneamente no Supabase
- Acesse de qualquer dispositivo com o mesmo usuário
- Seus projetos, clientes e produtos aparecem em tempo real

### ✅ Isolamento de Dados

- Cada usuário vê apenas seus próprios dados
- Sistema de RLS (Row Level Security) ativo
- Segurança garantida pelo Supabase

### ✅ Sem LocalStorage

- Dados não ficam mais presos no navegador
- Limpar cache do navegador não perde nada
- Backup automático na nuvem

## Módulos Disponíveis

### 📊 Dashboard
- Visão geral dos negócios
- Estatísticas em tempo real
- Atividades recentes

### 👥 Clientes
- Cadastro de clientes PF e PJ
- Informações completas de contato
- Histórico de projetos

### 📁 Projetos
- Orçamentos e vendas
- Gerenciamento de status
- Produtos vinculados

### 📦 Produtos
- Materiais brutos
- Partes de produtos
- Produtos prontos com componentes

### 📈 Estoque
- Movimentações de entrada/saída
- Controle de estoque mínimo
- Vinculação com projetos

### 💰 Financeiro
- Transações de entrada e saída
- Categorização de despesas
- Relatórios financeiros

### ⚙️ Configurações
- Dados da empresa
- Configurações de PDF
- Categorias de produtos
- Importar/Exportar dados

## Estrutura do Banco de Dados

### Tabelas Principais

- **clients**: Clientes (PF e PJ)
- **products**: Produtos e materiais
- **product_components**: Componentes de produtos
- **projects**: Projetos e orçamentos
- **project_products**: Produtos usados em projetos
- **transactions**: Transações financeiras
- **stock_movements**: Movimentações de estoque

### Segurança (RLS)

Todas as tabelas têm políticas RLS que garantem:
- Usuários só veem seus próprios dados
- Inserções sempre vinculadas ao usuário autenticado
- Atualizações e exclusões apenas dos próprios registros

## Solução de Problemas

### Não Consigo Fazer Login

1. Verifique se o usuário foi criado no Supabase
2. Confirme email e senha corretos
3. Verifique se o email foi confirmado (pode fazer isso no Dashboard)

### Dados Não Aparecem

1. Certifique-se que está logado com o usuário correto
2. Verifique a conexão com internet
3. Abra o console do navegador (F12) e procure por erros

### Erro de Permissão

1. As políticas RLS estão ativas
2. Cada registro deve ter `user_id` = seu ID de usuário
3. Verifique no Dashboard > SQL Editor se as políticas estão corretas

## Suporte

Se precisar de ajuda:
1. Verifique os logs no console do navegador (F12)
2. Verifique os logs no Supabase Dashboard
3. Confirme que as migrações foram aplicadas corretamente

## Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Estilização**: Tailwind CSS
- **Deploy**: Vercel

---

**Sistema pronto para uso multi-dispositivo! 🚀**


