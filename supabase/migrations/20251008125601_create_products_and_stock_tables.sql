/*
  # Sistema de Gestão de Produtos e Estoque

  ## Descrição
  Migração inicial que cria todas as tabelas necessárias para o sistema de gestão de marcenaria,
  incluindo produtos, componentes, clientes, projetos, transações financeiras e movimentações de estoque.

  ## Tabelas Criadas

  ### 1. products
  Armazena todos os produtos do sistema (materiais brutos, partes de produto e produtos prontos)

  ### 2. product_components
  Relacionamento N:N entre produtos e seus componentes

  ### 3. stock_movements
  Histórico de todas as movimentações de estoque

  ### 4. clients
  Cadastro de clientes (PF e PJ)

  ### 5. projects
  Projetos e orçamentos

  ### 6. project_products
  Produtos utilizados em cada projeto

  ### 7. transactions
  Transações financeiras (entradas e saídas)

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas restritivas: usuários autenticados só acessam seus próprios dados
  - Políticas separadas para SELECT, INSERT, UPDATE e DELETE
*/

-- Criar extensão para UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- TABELA: products
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  type text NOT NULL CHECK (type IN ('material_bruto', 'parte_produto', 'produto_pronto')),
  unit text NOT NULL,
  cost_price decimal(10, 2) NOT NULL DEFAULT 0,
  sale_price decimal(10, 2),
  current_stock decimal(10, 2) NOT NULL DEFAULT 0,
  min_stock decimal(10, 2) NOT NULL DEFAULT 0,
  supplier text,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TABELA: product_components
-- =============================================
CREATE TABLE IF NOT EXISTS product_components (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity decimal(10, 2) NOT NULL DEFAULT 1,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_reference CHECK (product_id != component_id),
  CONSTRAINT unique_product_component UNIQUE (product_id, component_id)
);

CREATE INDEX IF NOT EXISTS idx_product_components_product_id ON product_components(product_id);
CREATE INDEX IF NOT EXISTS idx_product_components_component_id ON product_components(component_id);
CREATE INDEX IF NOT EXISTS idx_product_components_user_id ON product_components(user_id);

ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own product components"
  ON product_components FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own product components"
  ON product_components FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own product components"
  ON product_components FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own product components"
  ON product_components FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_product_components_updated_at ON product_components;
CREATE TRIGGER update_product_components_updated_at
  BEFORE UPDATE ON product_components
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TABELA: stock_movements
-- =============================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('entrada', 'saida')),
  quantity decimal(10, 2) NOT NULL,
  unit_price decimal(10, 2) DEFAULT 0,
  total_value decimal(10, 2) DEFAULT 0,
  project_id uuid,
  reference_type text DEFAULT 'manual' CHECK (reference_type IN ('manual', 'project', 'adjustment')),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_project_id ON stock_movements(project_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(date);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stock movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stock movements"
  ON stock_movements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock movements"
  ON stock_movements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- TABELA: clients
-- =============================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('pf', 'pj')),
  cpf text,
  cnpj text,
  email text NOT NULL,
  phone text NOT NULL,
  mobile text NOT NULL,
  razao_social text,
  inscricao_estadual text,
  isento_icms boolean DEFAULT false,
  numero text,
  complemento text,
  id_empresa text,
  fl_ativo boolean DEFAULT true,
  country text NOT NULL DEFAULT 'Brasil',
  state text NOT NULL,
  city text NOT NULL,
  zip_code text NOT NULL,
  neighborhood text NOT NULL,
  street_type text NOT NULL,
  street text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TABELA: projects
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  number integer NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL CHECK (status IN ('orcamento', 'aprovado', 'em_producao', 'concluido', 'entregue')),
  type text NOT NULL CHECK (type IN ('orcamento', 'venda')),
  budget decimal(10, 2) NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  materials_cost decimal(10, 2) DEFAULT 0,
  labor_cost decimal(10, 2) DEFAULT 0,
  profit_margin decimal(5, 2) DEFAULT 20,
  payment_installments integer DEFAULT 1,
  payment_method text,
  discount_percentage decimal(5, 2) DEFAULT 0,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_number ON projects(user_id, number);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TABELA: project_products
-- =============================================
CREATE TABLE IF NOT EXISTS project_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity decimal(10, 2) NOT NULL,
  unit_price decimal(10, 2) NOT NULL,
  total_price decimal(10, 2) NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_products_project_id ON project_products(project_id);
CREATE INDEX IF NOT EXISTS idx_project_products_product_id ON project_products(product_id);
CREATE INDEX IF NOT EXISTS idx_project_products_user_id ON project_products(user_id);

ALTER TABLE project_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project products"
  ON project_products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project products"
  ON project_products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project products"
  ON project_products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project products"
  ON project_products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- TABELA: transactions
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('entrada', 'saida')),
  category text NOT NULL,
  description text NOT NULL,
  amount decimal(10, 2) NOT NULL,
  date date NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);