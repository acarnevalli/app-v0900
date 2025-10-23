import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

// ---------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------

function validateArray<T>(arr: T[] | undefined | null): T[] {
  if (!Array.isArray(arr)) {
    console.warn('Invalid array data received:', arr);
    return [];
  }
  return arr;
}

// Remove campos undefined de um objeto
function cleanUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

// ---------------------------------------------------------------
// Interfaces (todas as interfaces permanecem iguais)
// ---------------------------------------------------------------

export interface Client {
  id: string;
  name: string;
  type: "pf" | "pj";
  cpf?: string;
  cnpj?: string;
  email: string;
  phone: string;
  mobile: string;
  razao_social?: string;
  inscricao_estadual?: string;
  isento_icms?: boolean;
  numero?: string;
  complemento?: string;
  id_empresa?: string;
  fl_ativo: boolean;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  neighborhood: string;
  street_type: string;
  street: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "material_bruto" | "parte_produto" | "produto_pronto";
  unit: string;
  components: ProductComponent[];
  cost_price: number;
  sale_price?: number;
  current_stock: number;
  min_stock: number;
  supplier?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductComponent {
  id?: string;
  product_id: string;
  component_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
}

export type ItemType = 'produto' | 'servico';

export interface ProjectProduct {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_type: ItemType;
  item_description?: string;
  service_hours?: number;
  hourly_rate?: number;
}

export interface Project {
  id: string;
  order_number: string;
  number: number;
  client_id: string;
  client_name?: string;
  description: string;
  status: 'orcamento' | 'aprovado' | 'em_producao' | 'concluido' | 'entregue';
  type: 'orcamento' | 'venda';
  products: ProjectProduct[];
  budget: number;
  start_date: string;
  end_date: string;
  delivery_deadline_days: number;
  materials_cost?: number;
  labor_cost?: number;
  profit_margin?: number;
  payment_terms?: PaymentTerms;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTerms {
  installments: number;
  payment_method:
    | "dinheiro"
    | "pix"
    | "cartao_credito"
    | "cartao_debito"
    | "boleto"
    | "transferencia";
  discount_percentage: number;
  installment_value?: number;
  total_with_discount?: number;
}

export interface Transaction {
  id: string;
  project_id?: string;
  project_title?: string;
  type: "entrada" | "saida";
  category: string;
  description: string;
  amount: number;
  date: string;
  user_id: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: "entrada" | "saida";
  quantity: number;
  unit_price?: number;
  total_value?: number;
  project_id?: string;
  project_title?: string;
  reference_type?: "manual" | "project" | "adjustment";
  date: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export interface Sale {
  id: string;
  date: string;
  client_id: string;
  client_name?: string;
  items: SaleItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method?: string;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplier_id: string;
  supplier_name?: string;
  items: PurchaseItem[];
  total: number;
  status: 'pending' | 'received' | 'cancelled';
  invoice_number?: string;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id?: string;
  purchase_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  user_id?: string;
  is_global?: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// INTERFACES FINANCEIRAS
// ============================================

export interface FinancialTransaction {
  id: string;
  
  // Tipo e categoria
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  description: string;
  
  // Valores
  amount: number;
  paid_amount?: number;
  discount?: number;
  interest?: number;
  fine?: number;
  
  // Datas
  date: string;
  due_date: string;
  payment_date?: string;
  
  // Status e pagamento
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  payment_method?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia' | 'cheque';
  
  // Parcelamento
  installment_number?: number;
  total_installments?: number;
  
  // Referências
  reference_type?: 'sale' | 'purchase' | 'project' | 'manual' | 'recurring';
  reference_id?: string;
  reference_number?: string;
  
  // Relacionamentos (IDs e nomes)
  client_id?: string;
  client_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  project_id?: string;
  project_number?: string;
  bank_account_id?: string;
  bank_account_name?: string;
  cost_center_id?: string;
  cost_center_name?: string;
  
  // Observações
  notes?: string;
  attachments?: string[];
  
  // Metadados
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bank_name?: string;
  account_number?: string;
  agency?: string;
  account_type: 'checking' | 'savings' | 'cash' | 'investment';
  initial_balance: number;
  current_balance: number;
  active: boolean;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CostCenter {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parent_id?: string;
  parent_name?: string;
  active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Estrutura de informações de pagamento (usada em Purchase e Project)
export interface PaymentInfo {
  payment_method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia' | 'cheque';
  installments: number;
  installment_value: number;
  first_due_date: string;
  has_shipping?: boolean;
  shipping_cost?: number;
  shipping_type?: string;
  paid?: boolean;
  paid_date?: string;
}

// Dados para criar transação financeira
export type CreateFinancialTransactionData = Omit<
  FinancialTransaction, 
  'id' | 'created_at' | 'updated_at' | 'user_id' | 'client_name' | 'supplier_name' | 'project_number' | 'bank_account_name' | 'cost_center_name'
>;

// Dados para atualizar transação financeira
export type UpdateFinancialTransactionData = Partial<CreateFinancialTransactionData>;

// Dados para pagamento de transação
export interface PayTransactionData {
  payment_date: string;
  paid_amount?: number;
  payment_method?: string;
  bank_account_id?: string;
  notes?: string;
}

// ---------------------------------------------------------------
// Contexto
// ---------------------------------------------------------------

interface AppContextType {
  clients: Client[];
  projects: Project[];
  transactions: Transaction[];
  products: Product[];
  stockMovements: StockMovement[];
  sales: Sale[];
  purchases: Purchase[];
  suppliers: Supplier[];
  categories: Category[];
  financialTransactions: FinancialTransaction[];
  bankAccounts: BankAccount[];
  costCenters: CostCenter[];
  loading: boolean;
  error: string | null;

  addClient: (data: Omit<Client, "id" | "created_at" | "updated_at" | "user_id">) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addProject: (data: Omit<Project, "id" | "created_at" | "updated_at" | "number" | "user_id">) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addTransaction: (data: Omit<Transaction, "id" | "created_at" | "user_id">) => Promise<void>;
  addFinancialTransaction: (data: CreateFinancialTransactionData) => Promise<FinancialTransaction>;
  updateFinancialTransaction: (id: string, data: UpdateFinancialTransactionData) => Promise<void>;
  deleteFinancialTransaction: (id: string) => Promise<void>;
  payTransaction: (id: string, paymentData: PayTransactionData) => Promise<void>;
  getTransactionsByPeriod: (startDate: string, endDate: string) => FinancialTransaction[];
  getOverdueTransactions: () => FinancialTransaction[];

  addBankAccount: (data: Omit<BankAccount, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'current_balance'>) => Promise<void>;
  updateBankAccount: (id: string, data: Partial<BankAccount>) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;
  updateBankAccountBalance: (accountId: string, amount: number, operation: 'add' | 'subtract') => Promise<void>;

  addCostCenter: (data: Omit<CostCenter, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'parent_name'>) => Promise<void>;
  updateCostCenter: (id: string, data: Partial<CostCenter>) => Promise<void>;
  deleteCostCenter: (id: string) => Promise<void>;
  
  addProduct: (data: Omit<Product, "id" | "created_at" | "updated_at" | "user_id">) => Promise<void>;
  updateProduct: (data: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addStockMovement: (data: Omit<StockMovement, "id" | "created_at" | "user_id">) => Promise<void>;
  processProjectStockMovement: (projectId: string, products: ProjectProduct[]) => Promise<void>;

  addSale: (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  addPurchase: (purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  addCategory: (name: string) => Promise<void>;
  loadCategories: () => Promise<void>;

  calculateProductCost: (id: string) => Promise<number>;
  getAvailableComponents: () => Product[];
  getDashboardStats: () => {
    totalClients: number;
    activeProjects: number;
    monthlyRevenue: number;
    pendingPayments: number;
    lowStockItems: number;
    recentActivity: any[];
  };

  refreshData: () => Promise<void>;

  // ============================================
  // MÉTODOS DE INTEGRAÇÃO AUTOMÁTICA
  // ============================================
  
  // Criar transações a partir de vendas/compras/projetos
  createTransactionsFromSale: (saleId: string, saleData: Sale) => Promise<void>;
  createTransactionsFromPurchase: (purchaseId: string, purchaseData: Purchase) => Promise<void>;
  createTransactionsFromProject: (projectId: string, projectData: Project) => Promise<void>;
  
  // ============================================
  // MÉTODOS DE RELATÓRIOS
  // ============================================
  
  getFinancialSummary: (startDate: string, endDate: string) => {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    pendingIncome: number;
    pendingExpense: number;
  };
  
  getCashFlow: (months: number) => Array<{
    month: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  
  getExpensesByCategory: (startDate: string, endDate: string) => Array<{
    category: string;
    total: number;
    percentage: number;
  }>;
}

   // ============================================
  // ✅ NOVOS MÉTODOS PARA DEBUG
 // ============================================
  reloadProject: (projectId: string) => Promise<any>;
  debugProject: (projectId: string) => Promise<any>;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};

// ---------------------------------------------------------------
// Provider
// ---------------------------------------------------------------

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

  const [error, setError] = useState<string | null>(null);

  const safeLoad = async (fn: () => Promise<void>, name: string) => {
    try {
      await fn();
      return true;
    } catch (err: any) {
      console.error(`[AppContext] ❌ Falha ao carregar ${name}:`, err);
      setError(`Erro ao carregar ${name}: ${err.message || 'Erro desconhecido'}`);
      return false;
    }
  };

  const ensureUser = () => {
    if (!user) throw new Error('Usuário não autenticado');
  };
    // ---------------------------------------------------------------
  // FUNÇÕES DE CARREGAMENTO (load*)
  // ---------------------------------------------------------------

  const loadCategories = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},is_global.eq.true`)
      .order('name');

    if (error) {
      console.error('Erro ao carregar categorias:', error);
      throw error;
    }
    setCategories(validateArray(data));
  }, [user]);

  const loadClients = useCallback(async () => {
    if (!user) return;
    
    let allClients: Client[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    console.log('Iniciando carregamento de clientes com paginação...');
    
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await supabase
        .from("clients")
        .select("*", { count: 'exact' })
        .eq("user_id", user.id)
        .order('name')
        .range(from, to);
      
      if (error) {
        console.error('Erro ao carregar clientes:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        allClients = [...allClients, ...data];
        console.log(`Página ${page + 1}: ${data.length} clientes carregados. Total até agora: ${allClients.length}`);
      }
      
      hasMore = data && data.length === pageSize;
      page++;
      
      if (count && allClients.length >= count) {
        hasMore = false;
      }
    }
    
    console.log(`Total de clientes carregados: ${allClients.length}`);
    setClients(validateArray(allClients));
  }, [user]);
  
  const loadProducts = useCallback(async () => {
    if (!user) return;
    
    const { data: productsData, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id);
    if (prodErr) throw prodErr;

    const { data: componentsData, error: compErr } = await supabase
      .from("product_components")
      .select(`
        *,
        component:products!product_components_component_id_fkey(
          id, name, unit, cost_price
        )
      `);
    if (compErr) throw compErr;

    const merged = validateArray(productsData).map((p) => ({
      ...p,
      components: validateArray(componentsData)
        .filter((c: any) => c.product_id === p.id)
        .map((c: any) => ({
          id: c.id,
          product_id: c.product_id,
          component_id: c.component_id,
          product_name: c.component?.name || "",
          quantity: c.quantity || 0,
          unit: c.component?.unit || "",
          unit_cost: c.component?.cost_price || 0,
          total_cost: ((c.component?.cost_price || 0) * (c.quantity || 0)),
        })),
    }));

    setProducts(merged);
  }, [user]);

  // ============================================
// FUNÇÕES DE CARREGAMENTO - FINANCEIRO
// ============================================

const loadFinancialTransactions = useCallback(async () => {
  if (!user) return;
  
  console.log('📊 Carregando transações financeiras...');
  
  const { data, error } = await supabase
    .from('financial_transactions')
    .select(`
      *,
      client:clients!client_id(name),
      supplier:suppliers!supplier_id(name),
      project:projects!project_id(order_number),
      bank_account:bank_accounts!bank_account_id(name),
      cost_center:cost_centers!cost_center_id(name)
    `)
    .eq('user_id', user.id)
    .order('due_date', { ascending: false });
  
  if (error) {
    console.error('❌ Erro ao carregar transações financeiras:', error);
    throw error;
  }
  
  // Processar dados com joins
  const merged = validateArray(data).map((t: any) => ({
    ...t,
    client_name: t.client?.name,
    supplier_name: t.supplier?.name,
    project_number: t.project?.order_number,
    bank_account_name: t.bank_account?.name,
    cost_center_name: t.cost_center?.name
  }));
  
  console.log(`✅ ${merged.length} transações financeiras carregadas`);
  setFinancialTransactions(merged);
}, [user]);

const loadBankAccounts = useCallback(async () => {
  if (!user) return;
  
  console.log('🏦 Carregando contas bancárias...');
  
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('name');
  
  if (error) {
    console.error('❌ Erro ao carregar contas bancárias:', error);
    throw error;
  }
  
  console.log(`✅ ${validateArray(data).length} contas bancárias carregadas`);
  setBankAccounts(validateArray(data));
}, [user]);

const loadCostCenters = useCallback(async () => {
  if (!user) return;
  
  console.log('🎯 Carregando centros de custo...');
  
  const { data, error } = await supabase
    .from('cost_centers')
    .select(`
      *,
      parent:cost_centers!parent_id(name)
    `)
    .eq('user_id', user.id)
    .order('name');
  
  if (error) {
    console.error('❌ Erro ao carregar centros de custo:', error);
    throw error;
  }
  
  // Processar dados com parent
  const merged = validateArray(data).map((cc: any) => ({
    ...cc,
    parent_name: cc.parent?.name
  }));
  
  console.log(`✅ ${merged.length} centros de custo carregados`);
  setCostCenters(merged);
}, [user]);

  // ============================================
  // ✅ CORREÇÃO CRÍTICA: loadProjects melhorada
  // ============================================
  const loadProjects = useCallback(async () => {
    if (!user) return;
    
    console.log('🔄 [AppContext] Carregando projetos...');
    
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        client:clients(name),
        products:project_products(
          id,
          project_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price,
          item_type,
          item_description,
          service_hours,
          hourly_rate
        )
      `)
      .eq("user_id", user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ [AppContext] Erro ao carregar projetos:', error);
      throw error;
    }

    console.log('🔍 [AppContext] Dados brutos do Supabase:', data);
    
    if (!data || data.length === 0) {
      console.log('⚠️ [AppContext] Nenhum projeto encontrado');
      setProjects([]);
      return;
    }

    const merged = validateArray(data).map((p: any) => {
      console.log(`📋 [AppContext] Processando projeto ${p.id}:`, {
        order_number: p.order_number,
        description: p.description,
        raw_products: p.products,
        products_length: Array.isArray(p.products) ? p.products.length : 'não é array'
      });
      
      let processedProducts: ProjectProduct[] = [];
      
      if (p.products && Array.isArray(p.products)) {
        processedProducts = p.products
          .filter((pp: any) => pp && typeof pp === 'object')
          .map((pp: any) => {
            const processed = {
              id: pp.id || `temp-${Date.now()}-${Math.random()}`,
              product_id: pp.product_id || null,
              product_name: pp.product_name || pp.name || 'Produto sem nome',
              quantity: Number(pp.quantity) || 1,
              unit_price: Number(pp.unit_price) || 0,
              total_price: Number(pp.total_price) || 0,
              item_type: (pp.item_type || 'produto') as ItemType,
              item_description: pp.item_description || pp.description || '',
              service_hours: pp.item_type === 'servico' ? (Number(pp.service_hours) || undefined) : undefined,
              hourly_rate: pp.item_type === 'servico' ? (Number(pp.hourly_rate) || undefined) : undefined,
            };
            
            console.log(`  ➡️ Produto processado:`, processed);
            return processed;
          });
      } else {
        console.log(`  ⚠️ Produtos inválidos ou ausentes para projeto ${p.id}:`, p.products);
      }
      
      console.log(`✅ [AppContext] Projeto ${p.id} processado com ${processedProducts.length} produtos`);
      
      return {
        id: p.id,
        order_number: p.order_number || `P-${p.number || '000'}`,
        number: p.number || 0,
        client_id: p.client_id,
        client_name: p.client?.name || 'Cliente não encontrado',
        description: p.description || '',
        status: p.status || 'orcamento',
        type: p.type || 'orcamento',
        products: processedProducts,
        budget: Number(p.budget) || 0,
        start_date: p.start_date || new Date().toISOString().split('T')[0],
        end_date: p.end_date || new Date().toISOString().split('T')[0],
        delivery_deadline_days: Number(p.delivery_deadline_days) || 15,
        materials_cost: p.materials_cost ? Number(p.materials_cost) : undefined,
        labor_cost: p.labor_cost ? Number(p.labor_cost) : undefined,
        profit_margin: p.profit_margin ? Number(p.profit_margin) : undefined,
        payment_terms: p.payment_terms || undefined,
        user_id: p.user_id,
        created_at: p.created_at,
        updated_at: p.updated_at
      };
    });
    
    console.log(`✅ [AppContext] Total de projetos carregados: ${merged.length}`);
    console.log('🔍 [AppContext] Projetos processados:', merged.map(p => ({
      id: p.id,
      order_number: p.order_number,
      products_count: p.products?.length || 0
    })));
    
    setProjects(merged);
  }, [user]);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order('date', { ascending: false });
    
    if (error) throw error;
    setTransactions(validateArray(data));
  }, [user]);

  const loadStockMovements = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("user_id", user.id)
      .order('date', { ascending: false });
    
    if (error) throw error;
    setStockMovements(validateArray(data));
  }, [user]);

  const loadSuppliers = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('name');
    
    if (error) throw error;
    setSuppliers(validateArray(data));
  }, [user]);

  const loadSales = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        client:clients(name),
        items:sale_items(*)
      `)
      .eq("user_id", user.id)
      .order('date', { ascending: false });
    
    if (error) throw error;

    const merged = validateArray(data).map((sale: any) => ({
      ...sale,
      client_name: sale.client?.name,
      items: validateArray(sale.items).map((item: any) => ({
        id: item.id,
        sale_id: item.sale_id,
        product_id: item.product_id,
        product_name: item.product_name || "",
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        total: item.total || 0,
      })),
    }));
    setSales(merged);
  }, [user]);

  const loadPurchases = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("purchases")
      .select(`
        *,
        supplier:suppliers(name),
        items:purchase_items(*)
      `)
      .eq("user_id", user.id)
      .order('date', { ascending: false });
    
    if (error) throw error;

    const merged = validateArray(data).map((purchase: any) => ({
      ...purchase,
      supplier_name: purchase.supplier?.name,
      items: validateArray(purchase.items).map((item: any) => ({
        id: item.id,
        purchase_id: item.purchase_id,
        product_id: item.product_id,
        product_name: item.product_name || "",
        quantity: item.quantity || 0,
        unit_cost: item.unit_cost || 0,
        total: item.total || 0,
      })),
    }));
    setPurchases(merged);
  }, [user]);

  // ✅ NOVO: Método para debug de projeto específico
  const debugProject = useCallback(async (projectId: string) => {
    if (!user) return;
    
    console.log('🐛 [AppContext] DEBUG - Investigando projeto:', projectId);
    
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
      
    console.log('🐛 [AppContext] Dados básicos do projeto:', projectData, projectError);
    
    const { data: productsData, error: productsError } = await supabase
      .from("project_products")
      .select("*")
      .eq("project_id", projectId);
      
    console.log('🐛 [AppContext] Produtos do projeto:', productsData, productsError);
    
    const { data: joinData, error: joinError } = await supabase
      .from("projects")
      .select(`
        *,
        client:clients(name),
        products:project_products(*)
      `)
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
      
    console.log('🐛 [AppContext] Join completo:', joinData, joinError);
    
    return {
      project: projectData,
      products: productsData,
      joined: joinData,
      errors: { projectError, productsError, joinError }
    };
  }, [user]);

  // ============================================
// MÉTODOS CRUD - TRANSAÇÕES FINANCEIRAS
// ============================================

const addFinancialTransaction = useCallback(async (
  data: CreateFinancialTransactionData
): Promise<FinancialTransaction> => {
  ensureUser();
  
  console.log('💰 Criando transação financeira:', data);
  
  const newTransaction = {
    ...cleanUndefined(data),
    user_id: user!.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const { data: inserted, error } = await supabase
    .from('financial_transactions')
    .insert([newTransaction])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro ao criar transação:', error);
    throw error;
  }
  
  console.log('✅ Transação criada:', inserted);
  
  // ✅ Atualizar saldo da conta bancária se especificado
  if (data.bank_account_id && data.status === 'paid') {
    await updateBankAccountBalance(
      data.bank_account_id,
      data.paid_amount || data.amount,
      data.type === 'income' ? 'add' : 'subtract'
    );
  }
  
  await loadFinancialTransactions();
  return inserted;
}, [user, loadFinancialTransactions]);

const updateFinancialTransaction = useCallback(async (
  id: string,
  data: UpdateFinancialTransactionData
) => {
  ensureUser();
  
  console.log('💰 Atualizando transação:', id, data);
  
  const { error } = await supabase
    .from('financial_transactions')
    .update({
      ...cleanUndefined(data),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user!.id);
  
  if (error) {
    console.error('❌ Erro ao atualizar transação:', error);
    throw error;
  }
  
  console.log('✅ Transação atualizada');
  await loadFinancialTransactions();
}, [user, loadFinancialTransactions]);

const deleteFinancialTransaction = useCallback(async (id: string) => {
  ensureUser();
  
  console.log('🗑️ Deletando transação:', id);
  
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user!.id);
  
  if (error) {
    console.error('❌ Erro ao deletar transação:', error);
    throw error;
  }
  
  console.log('✅ Transação deletada');
  await loadFinancialTransactions();
}, [user, loadFinancialTransactions]);

const payTransaction = useCallback(async (
  id: string,
  paymentData: PayTransactionData
) => {
  ensureUser();
  
  console.log('💳 Marcando transação como paga:', id, paymentData);
  
  // Buscar transação atual
  const { data: transaction, error: fetchError } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single();
  
  if (fetchError || !transaction) {
    console.error('❌ Transação não encontrada');
    throw new Error('Transação não encontrada');
  }
  
  // Atualizar transação
  const { error } = await supabase
    .from('financial_transactions')
    .update({
      status: 'paid',
      payment_date: paymentData.payment_date,
      paid_amount: paymentData.paid_amount || transaction.amount,
      payment_method: paymentData.payment_method || transaction.payment_method,
      bank_account_id: paymentData.bank_account_id || transaction.bank_account_id,
      notes: paymentData.notes ? `${transaction.notes || ''}\n${paymentData.notes}` : transaction.notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user!.id);
  
  if (error) {
    console.error('❌ Erro ao pagar transação:', error);
    throw error;
  }
  
  // Atualizar saldo da conta bancária
  if (paymentData.bank_account_id) {
    await updateBankAccountBalance(
      paymentData.bank_account_id,
      paymentData.paid_amount || transaction.amount,
      transaction.type === 'income' ? 'add' : 'subtract'
    );
  }
  
  console.log('✅ Transação paga com sucesso');
  await loadFinancialTransactions();
}, [user, loadFinancialTransactions]);

const getTransactionsByPeriod = useCallback((
  startDate: string,
  endDate: string
): FinancialTransaction[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return financialTransactions.filter(t => {
    const transDate = new Date(t.date);
    return transDate >= start && transDate <= end;
  });
}, [financialTransactions]);

const getOverdueTransactions = useCallback((): FinancialTransaction[] => {
  const today = new Date();
  
  return financialTransactions.filter(t => {
    const dueDate = new Date(t.due_date);
    return t.status === 'pending' && dueDate < today;
  });
}, [financialTransactions]);

// ============================================
// MÉTODOS CRUD - CONTAS BANCÁRIAS
// ============================================

const addBankAccount = useCallback(async (
  data: Omit<BankAccount, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'current_balance'>
) => {
  ensureUser();
  
  console.log('🏦 Criando conta bancária:', data);
  
  const newAccount = {
    ...cleanUndefined(data),
    current_balance: data.initial_balance,
    user_id: user!.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const { error } = await supabase
    .from('bank_accounts')
    .insert([newAccount]);
  
  if (error) {
    console.error('❌ Erro ao criar conta:', error);
    throw error;
  }
  
  console.log('✅ Conta bancária criada');
  await loadBankAccounts();
}, [user, loadBankAccounts]);

const updateBankAccount = useCallback(async (
  id: string,
  data: Partial<BankAccount>
) => {
  ensureUser();
  
  console.log('🏦 Atualizando conta bancária:', id, data);
  
  const { error } = await supabase
    .from('bank_accounts')
    .update({
      ...cleanUndefined(data),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user!.id);
  
  if (error) {
    console.error('❌ Erro ao atualizar conta:', error);
    throw error;
  }
  
  console.log('✅ Conta bancária atualizada');
  await loadBankAccounts();
}, [user, loadBankAccounts]);

const deleteBankAccount = useCallback(async (id: string) => {
  ensureUser();
  
  console.log('🗑️ Deletando conta bancária:', id);
  
  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user!.id);
  
  if (error) {
    console.error('❌ Erro ao deletar conta:', error);
    throw error;
  }
  
  console.log('✅ Conta bancária deletada');
  await loadBankAccounts();
}, [user, loadBankAccounts]);

const updateBankAccountBalance = useCallback(async (
  accountId: string,
  amount: number,
  operation: 'add' | 'subtract'
) => {
  ensureUser();
  
  console.log('💰 Atualizando saldo da conta:', accountId, amount, operation);
  
  // Buscar conta atual
  const { data: account, error: fetchError } = await supabase
    .from('bank_accounts')
    .select('current_balance')
    .eq('id', accountId)
    .eq('user_id', user!.id)
    .single();
  
  if (fetchError || !account) {
    console.error('❌ Conta não encontrada');
    return;
  }
  
  const newBalance = operation === 'add'
    ? account.current_balance + amount
    : account.current_balance - amount;
  
  const { error } = await supabase
    .from('bank_accounts')
    .update({
      current_balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId)
    .eq('user_id', user!.id);
  
  if (error) {
    console.error('❌ Erro ao atualizar saldo:', error);
    throw error;
  }
  
  console.log('✅ Saldo atualizado:', newBalance);
  await loadBankAccounts();
}, [user, loadBankAccounts]);

// ============================================
// MÉTODOS CRUD - CENTROS DE CUSTO
// ============================================

const addCostCenter = useCallback(async (
  data: Omit<CostCenter, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'parent_name'>
) => {
  ensureUser();
  
  console.log('🎯 Criando centro de custo:', data);
  
  const newCostCenter = {
    ...cleanUndefined(data),
    user_id: user!.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const { error } = await supabase
    .from('cost_centers')
    .insert([newCostCenter]);
  
  if (error) {
    console.error('❌ Erro ao criar centro de custo:', error);
    throw error;
  }
  
  console.log('✅ Centro de custo criado');
  await loadCostCenters();
}, [user, loadCostCenters]);

const updateCostCenter = useCallback(async (
  id: string,
  data: Partial<CostCenter>
) => {
  ensureUser();
  
  console.log('🎯 Atualizando centro de custo:', id, data);
  
  const { error } = await supabase
    .from('cost_centers')
    .update({
      ...cleanUndefined(data),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user!.id);
  
  if (error) {
    console.error('❌ Erro ao atualizar centro de custo:', error);
    throw error;
  }
  
  console.log('✅ Centro de custo atualizado');
  await loadCostCenters();
}, [user, loadCostCenters]);

const deleteCostCenter = useCallback(async (id: string) => {
  ensureUser();
  
  console.log('🗑️ Deletando centro de custo:', id);
  
  const { error } = await supabase
    .from('cost_centers')
    .delete()
    .eq('id', id)
    .eq('user_id', user!.id);
  
  if (error) {
    console.error('❌ Erro ao deletar centro de custo:', error);
    throw error;
  }
  
  console.log('✅ Centro de custo deletado');
  await loadCostCenters();
}, [user, loadCostCenters]);


  const reloadProject = useCallback(async (projectId: string) => {
    if (!user) return null;
    
    console.log('🔄 [AppContext] Recarregando projeto específico:', projectId);
    
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        client:clients(name),
        products:project_products(
          id,
          project_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price,
          item_type,
          item_description,
          service_hours,
          hourly_rate
        )
      `)
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
      
    if (error) {
      console.error('❌ [AppContext] Erro ao recarregar projeto:', error);
      return null;
    }

    console.log('🔍 [AppContext] Projeto recarregado:', data);
    return data;
  }, [user]);

  const refreshData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    const results = await Promise.allSettled([
      safeLoad(loadClients, "Clientes"),
      safeLoad(loadProducts, "Produtos"),
      safeLoad(loadProjects, "Projetos"),
      safeLoad(loadTransactions, "Transações"),
      safeLoad(loadStockMovements, "Estoque"),
      safeLoad(loadSuppliers, "Fornecedores"),
      safeLoad(loadSales, "Vendas"),
      safeLoad(loadPurchases, "Compras"),
      safeLoad(loadCategories, "Categorias"),
      //safeLoad(loadFinancialTransactions, "Transações Financeiras"),
    safeLoad(loadBankAccounts, "Contas Bancárias"),
    safeLoad(loadCostCenters, "Centros de Custo"),
    ]);

    const hasErrors = results.some(r => r.status === 'rejected');
    if (hasErrors) {
      console.warn('Alguns dados não foram carregados completamente');
    }

    setLoading(false);
  }, [
    user,
    loadClients,
    loadProducts,
    loadProjects,
    loadTransactions,
    loadStockMovements,
    loadSuppliers,
    loadSales,
    loadPurchases,
    loadCategories,
    //loadFinancialTransactions,
    loadBankAccounts,
    loadCostCenters
  ]);

  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    const loadData = async () => {
      if (isAuthenticated && user) {
        await refreshData();
      } else {
        setLoading(false);
        setError(null);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, isAuthenticated, authLoading, refreshData]);

  const calculateProductCost = useCallback(async (productId: string): Promise<number> => {
    const visited = new Set<string>();

    const calculate = async (id: string): Promise<number> => {
      if (visited.has(id)) {
        console.warn(`Dependência circular detectada: ${id}`);
        return 0;
      }

      visited.add(id);
      const product = products.find(p => p.id === id);
      if (!product) return 0;

      if (product.type === "material_bruto") return product.cost_price;

      let total = 0;
      for (const comp of product.components) {
        const componentCost = await calculate(comp.component_id);
        total += componentCost * comp.quantity;
      }
      return total;
    };

    return await calculate(productId);
  }, [products]);

  const addCategory = useCallback(async (name: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const cleanedName = name.trim();
    if (!cleanedName) throw new Error('Nome da categoria é obrigatório');

    const exists = categories.some(
      c => c.name.toLowerCase() === cleanedName.toLowerCase()
    );
    if (exists) throw new Error('Categoria já existe');

    const { data, error } = await supabase
      .from('categories')
      .insert([cleanUndefined({ 
        name: cleanedName,
        user_id: user.id,
        is_global: false
      })])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('Categoria já existe');
      throw error;
    }

    setCategories(prev => [...prev, data]);
  }, [user, categories]);

  const addClient = useCallback(async (data: Omit<Client, "id" | "created_at" | "updated_at" | "user_id">) => {
    ensureUser();
    const newClient = {
      ...data,
      user_id: user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("clients").insert([newClient]);
    if (error) throw error;
    await loadClients();
  }, [user, loadClients]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    ensureUser();
    const { error } = await supabase
      .from("clients")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user!.id);
    if (error) throw error;
    await loadClients();
  }, [user, loadClients]);

  const deleteClient = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", user!.id);
    if (error) throw error;
    await loadClients();
  }, [user, loadClients]);

  const createFinancialTransactionsFromProject = useCallback(async (
    projectId: string, 
    projectData: any
  ) => {
    if (projectData.type !== 'venda') {
      return;
    }

    const client = clients.find(c => c.id === projectData.client_id);
    const { payment_terms } = projectData;

    if (!payment_terms) {
      console.warn('Projeto sem termos de pagamento');
      return;
    }

    try {
      for (let i = 0; i < payment_terms.installments; i++) {
        const dueDate = new Date(projectData.start_date);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        const transaction = {
          type: 'entrada' as const,
          category: 'Vendas',
          description: `${projectData.order_number || 'Venda'} - ${client?.name || 'Cliente'} - Parcela ${i + 1}/${payment_terms.installments}`,
          amount: payment_terms.installment_value || 0,
          date: dueDate.toISOString().split('T')[0],
          project_id: projectId,
          project_title: projectData.description || 'Sem descrição',
          user_id: user!.id,
          created_at: new Date().toISOString()
        };
        
        await supabase
          .from('transactions')
          .insert([transaction]);
      }

      console.log(`✅ ${payment_terms.installments} transação(ões) criada(s) para o projeto ${projectData.order_number}`);
    } catch (error) {
            console.error('❌ Erro ao criar transações financeiras:', error);
      throw error;
    }
  }, [user, clients]);
  
  const addProduct = useCallback(async (data: Omit<Product, "id" | "created_at" | "updated_at" | "user_id">) => {
    ensureUser();
    
    const productData = {
      name: data.name.trim(),
      description: data.description?.trim(),
      category: data.category?.trim(),
      type: data.type,
      unit: data.unit,
      cost_price: parseFloat(data.cost_price.toString()) || 0,
      sale_price: data.sale_price ? parseFloat(data.sale_price.toString()) : undefined,
      current_stock: Math.max(0, parseInt(data.current_stock.toString()) || 0),
      min_stock: Math.max(0, parseInt(data.min_stock.toString()) || 0),
      supplier: data.supplier?.trim(),
      user_id: user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!productData.name) {
      throw new Error('Nome do produto é obrigatório');
    }

    const { data: insertedProduct, error } = await supabase
      .from("products")
      .insert([cleanUndefined(productData)])
      .select()
      .single();

    if (error) throw error;

    if (data.components && data.components.length > 0) {
      const components = data.components.map(c => ({
        product_id: insertedProduct.id,
        component_id: c.component_id,
        quantity: parseFloat(c.quantity.toString()) || 0,
      })).filter(c => c.quantity > 0);

      const { error: compError } = await supabase
        .from("product_components")
        .insert(components);
      
      if (compError) throw compError;
    }

    await loadProducts();
  }, [user, loadProducts]);

  const updateProduct = useCallback(async (data: Product) => {
    ensureUser();

    const { error: productError } = await supabase
      .from("products")
      .update(cleanUndefined({
        name: data.name,
        description: data.description,
        category: data.category,
        type: data.type,
        unit: data.unit,
        cost_price: data.cost_price,
        sale_price: data.sale_price,
        current_stock: data.current_stock,
        min_stock: data.min_stock,
        supplier: data.supplier,
        updated_at: new Date().toISOString()
      }))
      .eq("id", data.id)
      .eq("user_id", user!.id);

    if (productError) throw productError;

    if (data.components) {
      await supabase
        .from("product_components")
        .delete()
        .eq("product_id", data.id);

      if (data.components.length > 0) {
        const components = data.components.map(c => ({
          product_id: data.id,
          component_id: c.component_id,
          quantity: c.quantity,
        }));

        const { error: compError } = await supabase
          .from("product_components")
          .insert(components);

        if (compError) throw compError;
      }
    }

    await loadProducts();
  }, [user, loadProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("user_id", user!.id);
    if (error) throw error;
    await loadProducts();
  }, [user, loadProducts]);

  // ✅ FUNÇÃO addProject CORRIGIDA
  const addProject = useCallback(async (data: Omit<Project, "id" | "created_at" | "updated_at" | "number" | "order_number" | "user_id">) => {
    ensureUser();
    
    console.log('🆕 [AppContext] Criando novo projeto...');
    console.log('🆕 [AppContext] Dados recebidos:', data);
    
    if (!data.description || data.description.trim() === '') {
      throw new Error('Descrição é obrigatória');
    }
    
    if (!data.client_id) {
      throw new Error('Cliente é obrigatório');
    }
    
    if (!data.products || data.products.length === 0) {
      throw new Error('Adicione pelo menos um produto ou serviço');
    }
    
    const deliveryDeadlineDays = data.delivery_deadline_days || 15;
    const startDate = new Date(data.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + deliveryDeadlineDays);
    
    const newProject = {
      client_id: data.client_id,
      description: data.description.trim(),
      status: data.status,
      type: data.type,
      budget: data.budget,
      start_date: data.start_date,
      end_date: data.end_date || endDate.toISOString().split('T')[0],
      delivery_deadline_days: deliveryDeadlineDays,
      materials_cost: data.materials_cost,
      labor_cost: data.labor_cost,
      profit_margin: data.profit_margin,
      payment_terms: data.payment_terms,
      number: 0,
      user_id: user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('🆕 [AppContext] Criando projeto no banco...');
    const { data: insertedProject, error } = await supabase
      .from("projects")
      .insert([cleanUndefined(newProject)])
      .select()
      .single();
      
    if (error) {
      console.error('❌ [AppContext] Erro ao criar projeto:', error);
      throw error;
    }
    
    console.log('✅ [AppContext] Projeto criado com ID:', insertedProject.id);

    if (data.products && data.products.length > 0) {
      console.log('🆕 [AppContext] Preparando produtos para inserção...');
      
      const projectProducts = data.products.map(p => {
        if (p.item_type === 'servico') {
          if (!p.service_hours || p.service_hours <= 0) {
            throw new Error(`Serviço "${p.product_name}" precisa ter horas definidas`);
          }
          if (!p.hourly_rate || p.hourly_rate <= 0) {
            throw new Error(`Serviço "${p.product_name}" precisa ter valor por hora definido`);
          }
        }
        
        const processedProduct = {
          project_id: insertedProject.id,
          product_id: p.product_id || null,
          product_name: p.product_name,
          quantity: p.quantity,
          unit_price: p.unit_price,
          total_price: p.total_price,
          item_type: p.item_type || 'produto',
          item_description: p.item_description,
          service_hours: p.item_type === 'servico' ? p.service_hours : null,
          hourly_rate: p.item_type === 'servico' ? p.hourly_rate : null,
          user_id: user!.id,
        };
        
        console.log('🆕 [AppContext] Produto processado:', processedProduct);
        return processedProduct;
      }).filter(p => p.quantity > 0);

      if (projectProducts.length > 0) {
        console.log(`🆕 [AppContext] Inserindo ${projectProducts.length} produtos...`);

        // ✅ CORREÇÃO APLICADA:
        const { error: prodError, data: insertedProducts } = await supabase
          .from("project_products")
          .insert(projectProducts)
          .select();
        
        if (prodError) {
          console.error('❌ [AppContext] ERRO DETALHADO ao inserir produtos (addProject):', {
            error: prodError,
            code: prodError.code,
            message: prodError.message,
            details: prodError.details,
            hint: prodError.hint,
            products: projectProducts,
            projectId: insertedProject.id
          });
          
          alert(`Erro ao salvar produtos no novo projeto: ${prodError.message}`);
          throw prodError;
        }
        
        console.log('✅ [AppContext] Produtos inseridos no novo projeto:', insertedProducts);
        console.log(`🎉 [AppContext] ${projectProducts.length} produtos inseridos no banco`);
      }
    }

    // ✅ Criar transações financeiras se for venda
    if (data.type === 'venda') {
      try {
        await createFinancialTransactionsFromProject(insertedProject.id, {
          ...data,
          order_number: insertedProject.order_number
        });
      } catch (error) {
        console.error('Erro ao criar transações, mas projeto foi salvo:', error);
      }
    }

    await loadProjects();
    return insertedProject;
  }, [user, loadProjects, createFinancialTransactionsFromProject]);
    
  // ✅ FUNÇÃO updateProject CORRIGIDA
  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    ensureUser();
    
    console.log('💾 [AppContext] Atualizando projeto:', { id, data });
    console.log('💾 [AppContext] Produtos recebidos:', data.products);
    
    // ✅ Calcular end_date se necessário
    if (data.delivery_deadline_days && data.start_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + data.delivery_deadline_days);
      data.end_date = endDate.toISOString().split('T')[0];
    }
    
    // ✅ Atualizar dados básicos do projeto
    console.log('💾 [AppContext] Atualizando dados básicos...');
    const { error } = await supabase
      .from("projects")
      .update({ 
        ...cleanUndefined(data), 
        updated_at: new Date().toISOString() 
      })
      .eq("id", id)
      .eq("user_id", user!.id);
      
    if (error) {
      console.error('❌ [AppContext] Erro ao atualizar projeto:', error);
      throw error;
    }
    console.log('✅ [AppContext] Dados básicos atualizados');

    // ✅ CORREÇÃO: Melhor gerenciamento dos produtos
    if (data.products !== undefined) {
      console.log('🔄 [AppContext] Atualizando produtos do projeto...');
      console.log('📦 [AppContext] Novos produtos:', data.products);
      
      // ✅ 1. Remover produtos existentes
      console.log('🗑️ [AppContext] Removendo produtos antigos...');
      const { error: deleteError } = await supabase
        .from("project_products")
        .delete()
        .eq("project_id", id);
        
      if (deleteError) {
        console.error('❌ [AppContext] Erro ao remover produtos antigos:', deleteError);
        throw deleteError;
      }
      console.log('✅ [AppContext] Produtos antigos removidos');

      // ✅ 2. Inserir novos produtos (se houver)
      if (data.products && data.products.length > 0) {
        console.log('📋 [AppContext] Preparando inserção de produtos...');
        
        const projectProducts = data.products.map(p => {
          console.log('📋 [AppContext] Processando produto para inserção:', p);
          
          // ✅ Validações para serviços
          if (p.item_type === 'servico') {
            if (!p.service_hours || p.service_hours <= 0) {
              throw new Error(`Serviço "${p.product_name}" precisa ter horas definidas`);
            }
            if (!p.hourly_rate || p.hourly_rate <= 0) {
              throw new Error(`Serviço "${p.product_name}" precisa ter valor por hora definido`);
            }
          }
          
          const processedProduct = {
            project_id: id,
            product_id: p.product_id || null,
            product_name: p.product_name || 'Produto sem nome',
            quantity: Number(p.quantity) || 1,
            unit_price: Number(p.unit_price) || 0,
            total_price: Number(p.total_price) || 0,
            item_type: p.item_type || 'produto',
            item_description: p.item_description || '',
            service_hours: p.item_type === 'servico' ? Number(p.service_hours) : null,
            hourly_rate: p.item_type === 'servico' ? Number(p.hourly_rate) : null,
            user_id: user!.id,
          };
          
          console.log('✅ [AppContext] Produto processado:', processedProduct);
          return processedProduct;
        }).filter(p => p.quantity > 0);

        console.log('📦 [AppContext] Produtos finais para inserção:', projectProducts);

        if (projectProducts.length > 0) {
          console.log(`🔄 [AppContext] Inserindo ${projectProducts.length} produtos...`);
          
          // ✅ CORREÇÃO APLICADA:
          const { error: prodError, data: insertedProducts } = await supabase
            .from("project_products")
            .insert(projectProducts)
            .select();
            
          if (prodError) {
            console.error('❌ [AppContext] ERRO DETALHADO ao inserir produtos (updateProject):', {
              error: prodError,
              code: prodError.code,
              message: prodError.message,
              details: prodError.details,
              hint: prodError.hint,
              products: projectProducts,
              projectId: id
            });
            
            alert(`Erro ao salvar produtos no projeto: ${prodError.message}`);
            throw prodError;
          }
          
          console.log('✅ [AppContext] Produtos atualizados com sucesso:', insertedProducts);
          console.log(`🎉 [AppContext] ${projectProducts.length} produtos inseridos no banco`);
        } else {
          console.log('⚠️ [AppContext] Nenhum produto válido para inserir');
        }
      } else {
        console.log('ℹ️ [AppContext] Nenhum produto para inserir (array vazio)');
      }
    } else {
      console.log('ℹ️ [AppContext] products não foi enviado, pulando atualização de produtos');
    }

    // ✅ 3. Recarregar projetos
    console.log('🔄 [AppContext] Recarregando projetos...');
    await loadProjects();
    
    console.log('🎉 [AppContext] Projeto atualizado com sucesso');
  }, [user, loadProjects]);

  const deleteProject = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user!.id);
    if (error) throw error;
    await loadProjects();
  }, [user, loadProjects]);

  const addTransaction = useCallback(async (data: Omit<Transaction, "id" | "created_at" | "user_id">) => {
    ensureUser();
    const newTransaction = {
      ...data,
      user_id: user!.id,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("transactions").insert([newTransaction]);
    if (error) throw error;
    await loadTransactions();
  }, [user, loadTransactions]);

  const addStockMovement = useCallback(async (data: Omit<StockMovement, "id" | "created_at" | "user_id">) => {
    ensureUser();

    const product = products.find(p => p.id === data.product_id);
    if (!product) throw new Error(`Produto não encontrado: ${data.product_id}`);

    const newStock = data.movement_type === 'entrada'
      ? product.current_stock + data.quantity
      : product.current_stock - data.quantity;

    if (newStock < 0) {
      throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${product.current_stock}, Solicitado: ${data.quantity}`);
    }

    const movementData = {
      ...data,
      user_id: user!.id,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("stock_movements").insert([movementData]);
    if (error) throw error;

    await updateProduct({
      ...product,
      current_stock: newStock,
    });

    await loadStockMovements();
  }, [user, products, updateProduct, loadStockMovements]);

  const processProjectStockMovement = useCallback(async (projectId: string, products: ProjectProduct[]) => {
    ensureUser();

    if (!products || products.length === 0) return;

    const movementPromises = products.map(item => 
      addStockMovement({
        product_id: item.product_id!,
        product_name: item.product_name,
        movement_type: 'saida',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_value: item.total_price,
        project_id: projectId,
        reference_type: 'project',
        date: new Date().toISOString(),
        notes: `Saída para projeto #${projectId}`,
      })
    );

    await Promise.all(movementPromises);
  }, [addStockMovement]);

  const addSale = useCallback(async (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    ensureUser();

    const newSale = {
      date: sale.date,
      client_id: sale.client_id,
      total: sale.total,
      status: sale.status,
      payment_method: sale.payment_method,
      notes: sale.notes,
      user_id: user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedSale, error: saleError } = await supabase
      .from('sales')
      .insert([newSale])
      .select()
      .single();

    if (saleError) throw saleError;

    if (sale.items && sale.items.length > 0) {
      const saleItems = sale.items.map(item => ({
        sale_id: insertedSale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      })).filter(item => item.quantity > 0);

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;
    }

    if (sale.items && sale.status === 'completed') {
      await processProjectStockMovement(insertedSale.id, sale.items);
    }

    if (sale.status === 'completed') {
      await addTransaction({
        type: 'entrada',
        category: 'venda',
        description: `Venda para cliente #${sale.client_id}`,
        amount: sale.total,
        date: sale.date,
      });
    }

    await refreshData();
  }, [user, processProjectStockMovement, addTransaction, refreshData]);

  const updateSale = useCallback(async (id: string, sale: Partial<Sale>) => {
    ensureUser();
    const { error } = await supabase
      .from('sales')
      .update({ ...sale, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user!.id);
    if (error) throw error;
    await loadSales();
  }, [user, loadSales]);

  const deleteSale = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id);
    if (error) throw error;
    await loadSales();
  }, [user, loadSales]);

    const addPurchase = useCallback(async (purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    ensureUser();

    const newPurchase = {
      date: purchase.date,
      supplier_id: purchase.supplier_id,
      total: purchase.total,
      status: purchase.status,
      invoice_number: purchase.invoice_number,
      notes: purchase.notes,
      user_id: user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedPurchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert([newPurchase])
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    if (purchase.items && purchase.items.length > 0) {
      const purchaseItems = purchase.items.map(item => ({
        purchase_id: insertedPurchase.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total: item.total,
      })).filter(item => item.quantity > 0);

      const { error: itemsError } = await supabase.from('purchase_items').insert(purchaseItems);
      if (itemsError) throw itemsError;
    }

    if (purchase.status === 'received') {
      const movements = purchase.items?.map(item => 
        addStockMovement({
          product_id: item.product_id,
          product_name: item.product_name,
          movement_type: 'entrada',
          quantity: item.quantity,
          unit_price: item.unit_cost,
          total_value: item.total,
          reference_type: 'manual',
          date: purchase.date,
          notes: `Compra #${insertedPurchase.id}`,
        })
      ) || [];

      await Promise.all(movements);

      await addTransaction({
        type: 'saida',
        category: 'compra',
        description: `Compra do fornecedor #${purchase.supplier_id}`,
        amount: purchase.total,
        date: purchase.date,
      });
    }

    await refreshData();
  }, [user, addStockMovement, addTransaction, refreshData]);

  const updatePurchase = useCallback(async (id: string, purchase: Partial<Purchase>) => {
    ensureUser();
    const { error } = await supabase
      .from('purchases')
      .update({ ...purchase, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user!.id);
    if (error) throw error;
    await loadPurchases();
  }, [user, loadPurchases]);

  const deletePurchase = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id);
    if (error) throw error;
    await loadPurchases();
  }, [user, loadPurchases]);

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    ensureUser();
    const newSupplier = {
      ...supplier,
      user_id: user!.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('suppliers').insert([newSupplier]);
    if (error) throw error;
    await loadSuppliers();
  }, [user, loadSuppliers]);

  const updateSupplier = useCallback(async (id: string, supplier: Partial<Supplier>) => {
    ensureUser();
    const { error } = await supabase
      .from('suppliers')
      .update({ ...supplier, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await loadSuppliers();
  }, [user, loadSuppliers]);

  const deleteSupplier = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await loadSuppliers();
  }, [user, loadSuppliers]);

  const getAvailableComponents = useCallback(() => {
    return validateArray(products);
  }, [products]);

  // ✅ CORREÇÃO: getDashboardStats sem campo 'title'
  const getDashboardStats = useCallback(() => {
    const totalClients = clients.length;
    const activeProjects = projects.filter(p => 
      ["em_producao", "aprovado"].includes(p.status || "")
    ).length;

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlySalesRevenue = (sales || []).filter(s => {
      const saleDate = new Date(s.date);
      return s.status === 'completed' &&
             saleDate >= firstDayOfMonth &&
             saleDate <= lastDayOfMonth;
    }).reduce((sum, s) => sum + (s.total || 0), 0);

    const monthlyTransactionRevenue = (transactions || []).filter(t => {
      const transDate = new Date(t.date);
      return t.type === "entrada" &&
             transDate >= firstDayOfMonth &&
             transDate <= lastDayOfMonth;
    }).reduce((sum, t) => sum + (t.amount || 0), 0);

    const monthlyRevenue = monthlySalesRevenue + monthlyTransactionRevenue;

    const pendingSales = (sales || []).filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + (s.total || 0), 0);

    const pendingProjects = (projects || []).filter(p => 
      ["concluido", "entregue"].includes(p.status || "")
    ).reduce((sum, p) => sum + ((p.budget || 0) * 0.5), 0);

    const pendingPayments = pendingSales + pendingProjects;

    const lowStockItems = (products || []).filter(p => 
      p.current_stock <= p.min_stock
    ).length;

    // ✅ CORREÇÃO: Usando description em vez de title
    const recentActivity = [
      ...(projects || []).slice(-3).map(p => ({
        type: "project",
        message: `Novo projeto ${p.order_number}: ${p.description.substring(0, 50)}${p.description.length > 50 ? '...' : ''}`,
        date: p.created_at,
      })),
      ...(sales || []).slice(-3).map(s => ({
        type: "sale",
        message: `Venda para ${s.client_name || 'Cliente'}: R$ ${(s.total || 0).toLocaleString('pt-BR', { 
          minimumFractionDigits: 2 
        })}`,
        date: s.created_at,
      })),
      ...(purchases || []).slice(-3).map(p => ({
        type: "purchase",
        message: `Compra de ${p.supplier_name || 'Fornecedor'}: R$ ${(p.total || 0).toLocaleString('pt-BR', { 
          minimumFractionDigits: 2 
        })}`,
        date: p.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      totalClients: Number(totalClients) || 0,
      activeProjects: Number(activeProjects) || 0,
      monthlyRevenue: Number(monthlyRevenue) || 0,
      pendingPayments: Number(pendingPayments) || 0,
      lowStockItems: Number(lowStockItems) || 0,
      recentActivity: Array.isArray(recentActivity) ? recentActivity : [],
    };
  }, [clients, projects, sales, purchases, transactions, products]);

  return (
    <AppContext.Provider
      value={{
        clients: validateArray(clients),
        projects: validateArray(projects),
        transactions: validateArray(transactions),
        products: validateArray(products),
        stockMovements: validateArray(stockMovements),
        sales: validateArray(sales),
        purchases: validateArray(purchases),
        suppliers: validateArray(suppliers),
        categories: validateArray(categories),
        financialTransactions: validateArray(financialTransactions),
        bankAccounts: validateArray(bankAccounts),
        costCenters: validateArray(costCenters),
        loading,
        error,

        addClient,
        updateClient,
        deleteClient,

        addProject,
        updateProject,
        deleteProject,

        addProduct,
        updateProduct,
        deleteProduct,

        addTransaction,
        addStockMovement,
        processProjectStockMovement,

        addSale,
        updateSale,
        deleteSale,

        addPurchase,
        updatePurchase,
        deletePurchase,

        addSupplier,
        updateSupplier,
        deleteSupplier,

        addCategory,
        loadCategories,

        calculateProductCost,
        getAvailableComponents,
        getDashboardStats,

        addFinancialTransaction,
        updateFinancialTransaction,
        deleteFinancialTransaction,
        payTransaction,
        getTransactionsByPeriod:,
        getOverdueTransactions:,
      
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        updateBankAccountBalance,
      
        addCostCenter,
        updateCostCenter,
        deleteCostCenter,
      
        createTransactionsFromSale,
        createTransactionsFromPurchase,
        createTransactionsFromProject,
      
        getFinancialSummary: () => ({ totalIncome: 0, totalExpense: 0, balance: 0, pendingIncome: 0, pendingExpense: 0 }),
        getCashFlow: () => [],
        getExpensesByCategory: () => [],
        
        refreshData,
        reloadProject,
        debugProject,

        
      }}
    >
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <div className="text-center">
            <p className="text-red-600 mb-4">❌ {error}</p>
            <button
              onClick={refreshData}
              disabled={loading}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
};

export default AppProvider;
