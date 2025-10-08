# Gerenciamento de Usuários e Papéis

## Sistema de Papéis

O sistema agora possui um gerenciamento completo de usuários com três níveis de permissão:

### Papéis Disponíveis

1. **Administrador (admin)**
   - Acesso total ao sistema
   - Pode gerenciar usuários (criar, editar, excluir)
   - Acesso à página de Configurações
   - Acesso à página de Usuários
   - Pode alterar papéis de outros usuários

2. **Gerente (manager)**
   - Acesso a relatórios e gestão
   - Pode gerenciar clientes, projetos, produtos e finanças
   - Sem acesso ao gerenciamento de usuários
   - Sem acesso às configurações do sistema

3. **Usuário (user)**
   - Acesso básico ao sistema
   - Pode visualizar e gerenciar dados operacionais
   - Sem acesso administrativo

## Estrutura do Banco de Dados

### Tabela: `user_profiles`

```sql
user_profiles
├── id (uuid) - Referência ao auth.users
├── email (text) - Email do usuário
├── name (text) - Nome completo do usuário
├── role (text) - Papel: 'admin', 'manager' ou 'user'
├── created_at (timestamptz) - Data de criação
└── updated_at (timestamptz) - Data da última atualização
```

### Políticas RLS (Row Level Security)

1. **Leitura**
   - Usuários podem ler seu próprio perfil
   - Administradores podem ler todos os perfis

2. **Atualização**
   - Usuários podem atualizar seu próprio nome (mas não o papel)
   - Administradores podem atualizar qualquer perfil, incluindo papéis

3. **Criação**
   - Perfis são criados automaticamente via trigger quando um usuário se registra
   - O primeiro usuário registrado recebe papel de administrador automaticamente

## Como Usar

### Acessar o Gerenciamento de Usuários

1. Faça login com uma conta de administrador
2. No menu lateral, clique em "Usuários"
3. Você verá a lista de todos os usuários cadastrados

### Editar um Usuário

1. Na página de Usuários, clique em "Editar" na linha do usuário desejado
2. Você pode alterar:
   - Nome do usuário
   - Papel (admin, manager ou user)
3. Clique em "Salvar" para confirmar as alterações

### Remover um Usuário

1. Na página de Usuários, clique no ícone de lixeira na linha do usuário
2. Confirme a exclusão
3. **Atenção:** Você não pode remover sua própria conta

### Buscar Usuários

Use a barra de pesquisa no topo da página para filtrar usuários por email ou nome.

## Primeiro Acesso

Quando você criar o primeiro usuário no sistema:

1. Registre-se normalmente através da tela de login
2. O primeiro usuário será automaticamente definido como **Administrador**
3. Use essa conta para gerenciar outros usuários

## Modificar Papéis pelo Banco de Dados

Se precisar modificar papéis diretamente pelo Supabase:

1. Acesse o Supabase Dashboard
2. Vá em "Table Editor"
3. Selecione a tabela `user_profiles`
4. Edite o campo `role` do usuário desejado
5. Valores permitidos: `admin`, `manager`, `user`

## Segurança

- As permissões são verificadas tanto no frontend quanto no backend (RLS)
- Usuários não podem alterar seus próprios papéis
- Apenas administradores podem modificar papéis de outros usuários
- Todas as operações são auditadas com timestamps

## Funcionalidades Restritas por Papel

### Apenas para Administradores
- Gerenciamento de Usuários
- Configurações do Sistema
- Dados da Empresa
- Configurações de PDF
- Configurações de Produtos
- Importar/Exportar dados

### Para Todos os Usuários
- Dashboard
- Clientes
- Projetos
- Produtos
- Estoque
- Finanças
