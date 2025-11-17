import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { PDFSettings, defaultSettings } from '../components/PDFSettingsModal';

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
// Interfaces (mantidas como estavam - não listando todas por espaço)
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

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  paid_amount?: number;
  discount?: number;
  interest?: number;
  fine?: number;
  date: string;
  due_date: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  payment_method?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia' | 'cheque';
  installment_number?: number;
  total_installments?: number;
  reference_type?: 'sale' | 'purchase' | 'project' | 'manual' | 'recurring';
  reference_id?: string;
  reference_number?: string;
  account_id?: string;
  account_name?: string;
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
  notes?: string;
  attachments?: string[];
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

export type CreateFinancialTransactionData = Omit<
  FinancialTransaction, 
  'id' | 'created_at' | 'updated_at' | 'user_id' | 'client_name' | 'supplier_name' | 'project_number' | 'bank_account_name' | 'cost_center_name'
>;

export type UpdateFinancialTransactionData = Partial<CreateFinancialTransactionData>;

export interface PayTransactionData {
  payment_date: string;
  paid_amount?: number;
  payment_method?: string;
  bank_account_id?: string;
  notes?: string;
}

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
  addProject: (data: Omit<Project, "id" | "created_at" | "updated_at" | "number" | "user_id">) => Promise<any>;
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
  createTransactionsFromSale: (saleId: string, saleData: Sale) => Promise<void>;
  createTransactionsFromPurchase: (purchaseId: string, purchaseData: Purchase) => Promise<void>;
  createTransactionsFromProject: (projectId: string, projectData: Project) => Promise<void>;
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
  reloadProject: (projectId: string) => Promise<any>;
  debugProject: (projectId: string) => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [pdfSettings, setPdfSettings] = useState<PDFSettings>(defaultSettings);
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
  
  //Parte 2 //  

    // ---------------------------------------------------------------
  // FUNÇÕES DE CARREGAMENTO (FUNÇÕES DE CONTEXTO) 
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

  // 🔧 CORRIGIDO: loadFinancialTransactions
  const loadFinancialTransactions = useCallback(async () => {
    if (!user) return;

    try {
      console.log('📊 Carregando transações financeiras...');

      // ✅ CORREÇÃO 1: Especificar relacionamentos únicos
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          clients!financial_transactions_client_id_fkey(name),
          suppliers!financial_transactions_supplier_id_fkey(name),
          projects!financial_transactions_project_id_fkey(order_number),
          bank_accounts!financial_transactions_account_id_fkey(name),
          cost_centers!financial_transactions_cost_center_id_fkey(name)
        `)
        .eq('created_by', user.id)
        .order('due_date', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar transações com relacionamentos:', error);

        const errorCode = error.code || '';
        const errorMessage = error.message?.toLowerCase() || '';
        
        const isRelationshipError = 
          errorCode === 'PGRST201' || 
          errorMessage.includes('relationship') ||
          errorMessage.includes('foreign key');

        if (isRelationshipError) {
          console.warn('⚠️ Erro de relacionamento detectado. Carregando sem JOINs...');
          
          // ✅ CORREÇÃO 2: Usar created_by
          const { data: simpleData, error: simpleError } = await supabase
            .from('financial_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('due_date', { ascending: false });

          if (simpleError) {
            console.error('❌ Erro na consulta simples:', simpleError);
            
            if (simpleError.code === '42P01') {
              console.warn('⚠️ Tabela financial_transactions não existe. Inicializando vazia.');
              setFinancialTransactions([]);
              return;
            }
            
            throw simpleError;
          }

          if (!simpleData || simpleData.length === 0) {
            console.log('ℹ️ Nenhuma transação cadastrada ainda.');
            setFinancialTransactions([]);
            return;
          }

          const enrichedData = await enrichTransactionsWithNames(simpleData);
          
          console.log(`✅ ${enrichedData.length} transações financeiras carregadas (modo fallback)`);
          setFinancialTransactions(enrichedData);
          return;
        }

        throw error;
      }

      if (!data) {
        console.warn('⚠️ Nenhuma transação encontrada no banco.');
        setFinancialTransactions([]);
        return;
      }

      if (Array.isArray(data) && data.length === 0) {
        console.log('ℹ️ Nenhuma transação cadastrada ainda.');
        setFinancialTransactions([]);
        return;
      }

      // ✅ CORREÇÃO 3: Mapear corretamente
      const merged = validateArray(data).map((t: any) => ({
        ...t,
        client_name: t.clients?.name || null,
        supplier_name: t.suppliers?.name || null,
        project_number: t.projects?.order_number || null,
        account_name: t.bank_accounts?.name || null,
        cost_center_name: t.cost_centers?.name || null
      }));

      console.log(`✅ ${merged.length} transações financeiras carregadas com sucesso`);
      setFinancialTransactions(merged);
      
    } catch (error: any) {
      console.error('🔴 Erro crítico ao carregar transações financeiras:', error);
      setFinancialTransactions([]);
    }
  }, [user]);

  const enrichTransactionsWithNames = async (transactions: any[]) => {
    try {
      const clientIds = [...new Set(transactions.map(t => t.client_id).filter(Boolean))];
      const supplierIds = [...new Set(transactions.map(t => t.supplier_id).filter(Boolean))];
      const projectIds = [...new Set(transactions.map(t => t.project_id).filter(Boolean))];
      const accountIds = [...new Set(transactions.map(t => t.account_id).filter(Boolean))];
      const costCenterIds = [...new Set(transactions.map(t => t.cost_center_id).filter(Boolean))];

      const [clientsRes, suppliersRes, projectsRes, accountsRes, costCentersRes] = await Promise.allSettled([
        clientIds.length > 0 ? supabase.from('clients').select('id, name').in('id', clientIds) : Promise.resolve({ data: [] }),
        supplierIds.length > 0 ? supabase.from('suppliers').select('id, name').in('id', supplierIds) : Promise.resolve({ data: [] }),
        projectIds.length > 0 ? supabase.from('projects').select('id, order_number').in('id', projectIds) : Promise.resolve({ data: [] }),
        accountIds.length > 0 ? supabase.from('bank_accounts').select('id, name').in('id', accountIds) : Promise.resolve({ data: [] }),
        costCenterIds.length > 0 ? supabase.from('cost_centers').select('id, name').in('id', costCenterIds) : Promise.resolve({ data: [] })
      ]);

      const clientsMap = new Map((clientsRes.status === 'fulfilled' && clientsRes.value.data || []).map((c: any) => [c.id, c.name]));
      const suppliersMap = new Map((suppliersRes.status === 'fulfilled' && suppliersRes.value.data || []).map((s: any) => [s.id, s.name]));
      const projectsMap = new Map((projectsRes.status === 'fulfilled' && projectsRes.value.data || []).map((p: any) => [p.id, p.order_number]));
      const accountsMap = new Map((accountsRes.status === 'fulfilled' && accountsRes.value.data || []).map((a: any) => [a.id, a.name]));
      const costCentersMap = new Map((costCentersRes.status === 'fulfilled' && costCentersRes.value.data || []).map((cc: any) => [cc.id, cc.name]));

      return transactions.map(t => ({
        ...t,
        client_name: t.client_id ? clientsMap.get(t.client_id) : null,
        supplier_name: t.supplier_id ? suppliersMap.get(t.supplier_id) : null,
        project_number: t.project_id ? projectsMap.get(t.project_id) : null,
        account_name: t.account_id ? accountsMap.get(t.account_id) : null,
        cost_center_name: t.cost_center_id ? costCentersMap.get(t.cost_center_id) : null
      }));
    } catch (error) {
      console.error('Erro ao enriquecer transações:', error);
      return transactions.map(t => ({ ...t, client_name: null, supplier_name: null, project_number: null, account_name: null, cost_center_name: null }));
    }
  };
    
  const loadBankAccounts = useCallback(async () => {
    if (!user) return;
    console.log('🏦 Carregando contas bancárias...');
    const { data, error } = await supabase.from('bank_accounts').select('*').eq('user_id', user.id).order('name');
    if (error) { console.error('❌ Erro ao carregar contas bancárias:', error); throw error; }
    console.log(`✅ ${validateArray(data).length} contas bancárias carregadas`);
    setBankAccounts(validateArray(data));
  }, [user]);

  const loadCostCenters = useCallback(async () => {
    if (!user) return;
    console.log('🎯 Carregando centros de custo...');
    const { data, error } = await supabase.from('cost_centers').select(`*, parent:cost_centers!parent_id(name)`).eq('user_id', user.id).order('name');
    if (error) { console.error('❌ Erro ao carregar centros de custo:', error); throw error; }
    const merged = validateArray(data).map((cc: any) => ({ ...cc, parent_name: cc.parent?.name }));
    console.log(`✅ ${merged.length} centros de custo carregados`);
    setCostCenters(merged);
  }, [user]);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    console.log('🔄 [AppContext] Carregando projetos...');
    const { data, error } = await supabase.from("projects").select(`*, client:clients(name), products:project_products(*)`).eq("user_id", user.id).order('created_at', { ascending: false });
    if (error) { console.error('❌ [AppContext] Erro ao carregar projetos:', error); throw error; }
    if (!data) { console.log('⚠️ [AppContext] Nenhum projeto encontrado'); setProjects([]); return; }
    const merged = data.map((p: any) => {
      const productsArray = Array.isArray(p.products) ? p.products : [];
      const processedProducts: ProjectProduct[] = productsArray.filter((pp: any) => pp && typeof pp === 'object').map((pp: any) => ({
        id: pp.id || `temp-${Date.now()}-${Math.random()}`, product_id: pp.product_id || null, product_name: pp.product_name || pp.name || 'Produto sem nome',
        quantity: Number(pp.quantity) || 1, unit_price: Number(pp.unit_price) || 0, total_price: Number(pp.total_price) || 0,
        item_type: (pp.item_type || 'produto') as ItemType, item_description: pp.item_description || pp.description || '',
        service_hours: pp.item_type === 'servico' ? (Number(pp.service_hours) || undefined) : undefined,
        hourly_rate: pp.item_type === 'servico' ? (Number(pp.hourly_rate) || undefined) : undefined,
      }));
      return { id: p.id, order_number: p.order_number || `P-${p.number || '000'}`, number: p.number || 0, client_id: p.client_id,
        client_name: p.client?.name || 'Cliente não encontrado', description: p.description || '', status: p.status || 'orcamento',
        type: p.type || 'orcamento', products: processedProducts, budget: Number(p.budget) || 0,
        start_date: p.start_date || new Date().toISOString().split('T')[0], end_date: p.end_date || new Date().toISOString().split('T')[0],
        delivery_deadline_days: Number(p.delivery_deadline_days) || 15, materials_cost: p.materials_cost ? Number(p.materials_cost) : undefined,
        labor_cost: p.labor_cost ? Number(p.labor_cost) : undefined, profit_margin: p.profit_margin ? Number(p.profit_margin) : undefined,
        payment_terms: p.payment_terms || undefined, user_id: p.user_id, created_at: p.created_at, updated_at: p.updated_at };
    });
    console.log(`✅ [AppContext] Total de projetos carregados: ${merged.length}`);
    setProjects(merged);
  }, [user]);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("transactions").select("*").eq("user_id", user.id).order('date', { ascending: false });
    if (error) throw error;
    setTransactions(validateArray(data));
  }, [user]);

  const loadStockMovements = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("stock_movements").select("*").eq("user_id", user.id).order('date', { ascending: false });
    if (error) throw error;
    setStockMovements(validateArray(data));
  }, [user]);

  const loadSuppliers = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("suppliers").select("*").or(`user_id.eq.${user.id},user_id.is.null`).order('name');
    if (error) throw error;
    setSuppliers(validateArray(data));
  }, [user]);

  const loadSales = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("sales").select(`*, client:clients(name), items:sale_items(*)`).eq("user_id", user.id).order('date', { ascending: false });
    if (error) throw error;
    const merged = validateArray(data).map((sale: any) => ({
      ...sale, client_name: sale.client?.name,
      items: validateArray(sale.items).map((item: any) => ({
        id: item.id, sale_id: item.sale_id, product_id: item.product_id, product_name: item.product_name || "",
        quantity: item.quantity || 0, unit_price: item.unit_price || 0, total: item.total || 0,
      })),
    }));
    setSales(merged);
  }, [user]);

  const loadPurchases = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("purchases").select(`*, supplier:suppliers(name), items:purchase_items(*)`).eq("user_id", user.id).order('date', { ascending: false });
    if (error) throw error;
    const merged = validateArray(data).map((purchase: any) => ({
      ...purchase, supplier_name: purchase.supplier?.name,
      items: validateArray(purchase.items).map((item: any) => ({
        id: item.id, purchase_id: item.purchase_id, product_id: item.product_id, product_name: item.product_name || "",
        quantity: item.quantity || 0, unit_cost: item.unit_cost || 0, total: item.total || 0,
      })),
    }));
    setPurchases(merged);
  }, [user]);

const updatePDFSettings = (settings: PDFSettings) => {
  setPdfSettings(settings);
  localStorage.setItem('pdfSettings', JSON.stringify(settings));
};

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
    safeLoad(loadFinancialTransactions, "Transações Financeiras"),
    safeLoad(loadBankAccounts, "Contas Bancárias"),
    safeLoad(loadCostCenters, "Centros de Custo"),
  ]);
  const hasErrors = results.some(r => r.status === 'rejected');
  if (hasErrors) console.warn('Alguns dados não foram carregados completamente');
  setLoading(false);
}, [user, loadClients, loadProducts, loadProjects, loadTransactions, loadStockMovements, loadSuppliers, loadSales, loadPurchases, loadCategories, loadFinancialTransactions, loadBankAccounts, loadCostCenters]);

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
  
  // Carregar configurações do PDF do localStorage
  const savedSettings = localStorage.getItem('pdfSettings');
  if (savedSettings) {
    try {
      setPdfSettings(JSON.parse(savedSettings));
    } catch (e) {
      console.error('Erro ao carregar configurações do PDF:', e);
    }
  }
  
  // Executar carregamento de dados
  loadData();
  
  return () => {
    isMounted = false;
  };
}, [user, isAuthenticated, authLoading, refreshData]);

  // PARTE 3A/3 //

  // ============================================
  // MÉTODOS CRUD - CLIENTES, PRODUTOS, CATEGORIAS
  // ============================================

  const addCategory = useCallback(async (name: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    const cleanedName = name.trim();
    if (!cleanedName) throw new Error('Nome da categoria é obrigatório');
    const exists = categories.some(c => c.name.toLowerCase() === cleanedName.toLowerCase());
    if (exists) throw new Error('Categoria já existe');
    const { data, error } = await supabase.from('categories').insert([cleanUndefined({ name: cleanedName, user_id: user.id, is_global: false })]).select().single();
    if (error) { if (error.code === '23505') throw new Error('Categoria já existe'); throw error; }
    setCategories(prev => [...prev, data]);
  }, [user, categories]);

  const addClient = useCallback(async (data: Omit<Client, "id" | "created_at" | "updated_at" | "user_id">) => {
    ensureUser();
    const newClient = { ...data, user_id: user!.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { error } = await supabase.from("clients").insert([newClient]);
    if (error) throw error;
    await loadClients();
  }, [user, loadClients]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    ensureUser();
    const { error } = await supabase.from("clients").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user!.id);
    if (error) throw error;
    await loadClients();
  }, [user, loadClients]);

  const deleteClient = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from("clients").delete().eq("id", id).eq("user_id", user!.id);
    if (error) throw error;
    await loadClients();
  }, [user, loadClients]);

  const addProduct = useCallback(async (data: Omit<Product, "id" | "created_at" | "updated_at" | "user_id">) => {
    ensureUser();
    const productData = { name: data.name.trim(), description: data.description?.trim(), category: data.category?.trim(), type: data.type, unit: data.unit,
      cost_price: parseFloat(data.cost_price.toString()) || 0, sale_price: data.sale_price ? parseFloat(data.sale_price.toString()) : undefined,
      current_stock: Math.max(0, parseInt(data.current_stock.toString()) || 0), min_stock: Math.max(0, parseInt(data.min_stock.toString()) || 0),
      supplier: data.supplier?.trim(), user_id: user!.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (!productData.name) throw new Error('Nome do produto é obrigatório');
    const { data: insertedProduct, error } = await supabase.from("products").insert([cleanUndefined(productData)]).select().single();
    if (error) throw error;
    if (data.components && data.components.length > 0) {
      const components = data.components.map(c => ({ product_id: insertedProduct.id, component_id: c.component_id, quantity: parseFloat(c.quantity.toString()) || 0 })).filter(c => c.quantity > 0);
      const { error: compError } = await supabase.from("product_components").insert(components);
      if (compError) throw compError;
    }
    await loadProducts();
  }, [user, loadProducts]);

  const updateProduct = useCallback(async (data: Product) => {
    ensureUser();
    const { error: productError } = await supabase.from("products").update(cleanUndefined({ name: data.name, description: data.description, category: data.category,
      type: data.type, unit: data.unit, cost_price: data.cost_price, sale_price: data.sale_price, current_stock: data.current_stock, min_stock: data.min_stock,
      supplier: data.supplier, updated_at: new Date().toISOString() })).eq("id", data.id).eq("user_id", user!.id);
    if (productError) throw productError;
    if (data.components) {
      await supabase.from("product_components").delete().eq("product_id", data.id);
      if (data.components.length > 0) {
        const components = data.components.map(c => ({ product_id: data.id, component_id: c.component_id, quantity: c.quantity }));
        const { error: compError } = await supabase.from("product_components").insert(components);
        if (compError) throw compError;
      }
    }
    await loadProducts();
  }, [user, loadProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from("products").delete().eq("id", id).eq("user_id", user!.id);
    if (error) throw error;
    await loadProducts();
  }, [user, loadProducts]);

  // ============================================
  // CONTAS BANCÁRIAS
  // ============================================

  const updateBankAccountBalance = useCallback(async (accountId: string, amount: number, operation: 'add' | 'subtract') => {
    ensureUser();
    const { data: account, error: fetchError } = await supabase.from('bank_accounts').select('current_balance').eq('id', accountId).eq('user_id', user!.id).single();
    if (fetchError || !account) return;
    const newBalance = operation === 'add' ? account.current_balance + amount : account.current_balance - amount;
    const { error } = await supabase.from('bank_accounts').update({ current_balance: newBalance, updated_at: new Date().toISOString() }).eq('id', accountId).eq('user_id', user!.id);
    if (error) throw error;
    await loadBankAccounts();
  }, [user, loadBankAccounts]);

  const addBankAccount = useCallback(async (data: Omit<BankAccount, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'current_balance'>) => {
    ensureUser();
    const newAccount = { ...cleanUndefined(data), current_balance: data.initial_balance, user_id: user!.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { error } = await supabase.from('bank_accounts').insert([newAccount]);
    if (error) throw error;
    await loadBankAccounts();
  }, [user, loadBankAccounts]);

  const updateBankAccount = useCallback(async (id: string, data: Partial<BankAccount>) => {
    ensureUser();
    const { error } = await supabase.from('bank_accounts').update({ ...cleanUndefined(data), updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user!.id);
    if (error) throw error;
    await loadBankAccounts();
  }, [user, loadBankAccounts]);

  const deleteBankAccount = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id).eq('user_id', user!.id);
    if (error) throw error;
    await loadBankAccounts();
  }, [user, loadBankAccounts]);

  // ============================================
  // TRANSAÇÕES FINANCEIRAS (CORRIGIDAS)
  // ============================================

  const addFinancialTransaction = useCallback(async (data: CreateFinancialTransactionData): Promise<FinancialTransaction> => {
    ensureUser();
    if (!data.type || !['income', 'expense'].includes(data.type)) throw new Error('Tipo inválido');
    if (!data.category?.trim()) throw new Error('Categoria é obrigatória');
    if (!data.amount || data.amount <= 0) throw new Error('Valor deve ser maior que zero');
    if (!data.account_id) throw new Error('Conta bancária é obrigatória');
    const accountExists = bankAccounts.find(acc => acc.id === data.account_id);
    if (!accountExists) throw new Error('Conta bancária não encontrada');
    const transactionDate = data.payment_date || data.due_date || new Date().toISOString().split('T')[0];
    const newTransaction = { type: data.type, category: data.category.trim(), amount: Number(data.amount), date: transactionDate, account_id: data.account_id,
      description: data.description?.trim() || null, due_date: data.due_date || null, status: data.status || 'pending', payment_method: data.payment_method || null,
      reference_id: data.reference_id || null, reference_type: data.reference_type || null, client_id: data.client_id || null, 
      supplier_id: data.supplier_id || null, installment_number: data.installment_number || null, total_installments: data.total_installments || null,
      created_by: user!.id };
    const { data: inserted, error } = await supabase.from('financial_transactions').insert([newTransaction]).select().single();
    if (error) throw error;
    if (data.status === 'paid' || !data.due_date || data.payment_date) {
      const operation = data.type === 'income' ? 'add' : 'subtract';
      await updateBankAccountBalance(data.account_id, Number(data.amount), operation);
    }
    await loadFinancialTransactions();
    return inserted;
  }, [user, loadFinancialTransactions, bankAccounts, updateBankAccountBalance]);

  const updateFinancialTransaction = useCallback(async (id: string, data: UpdateFinancialTransactionData) => {
    ensureUser();
    const updateData: any = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) { if (!data.category?.trim()) throw new Error('Categoria não pode ser vazia'); updateData.category = data.category.trim(); }
    if (data.amount !== undefined) { if (data.amount <= 0) throw new Error('Valor inválido'); updateData.amount = Number(data.amount); }
    if (data.payment_date !== undefined) updateData.date = data.payment_date;
    if (data.due_date !== undefined) updateData.due_date = data.due_date;
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.payment_method !== undefined) updateData.payment_method = data.payment_method;
    if (data.reference_id !== undefined) updateData.reference_id = data.reference_id;
    if (data.reference_type !== undefined) updateData.reference_type = data.reference_type;
    if (data.client_id !== undefined) updateData.client_id = data.client_id;
    if (data.supplier_id !== undefined) updateData.supplier_id = data.supplier_id;
    if (data.installment_number !== undefined) updateData.installment_number = data.installment_number;
    if (data.total_installments !== undefined) updateData.total_installments = data.total_installments;
    const { error } = await supabase.from('financial_transactions').update(updateData).eq('id', id);
    if (error) throw error;
    await loadFinancialTransactions();
  }, [user, loadFinancialTransactions]);

  const deleteFinancialTransaction = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
    if (error) throw error;
    await loadFinancialTransactions();
  }, [user, loadFinancialTransactions]);

  const payTransaction = useCallback(async (id: string, paymentData: PayTransactionData) => {
    ensureUser();
    const { data: transaction, error: fetchError } = await supabase.from('financial_transactions').select('*').eq('id', id).single();
    if (fetchError || !transaction) throw new Error('Transação não encontrada');
    const updateData = { status: 'paid' as const, date: paymentData.payment_date, payment_method: paymentData.payment_method || transaction.payment_method,
      description: paymentData.notes ? `${transaction.description || ''}\n${paymentData.notes}`.trim() : transaction.description };
    const { error } = await supabase.from('financial_transactions').update(updateData).eq('id', id);
    if (error) throw error;
    await loadFinancialTransactions();
  }, [user, loadFinancialTransactions]);

  // ============================================
  // CENTROS DE CUSTO
  // ============================================

  const addCostCenter = useCallback(async (data: Omit<CostCenter, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'parent_name'>) => {
    ensureUser();
    const newCostCenter = { ...cleanUndefined(data), user_id: user!.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { error } = await supabase.from('cost_centers').insert([newCostCenter]);
    if (error) throw error;
    await loadCostCenters();
  }, [user, loadCostCenters]);

  const updateCostCenter = useCallback(async (id: string, data: Partial<CostCenter>) => {
    ensureUser();
    const { error } = await supabase.from('cost_centers').update({ ...cleanUndefined(data), updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user!.id);
    if (error) throw error;
    await loadCostCenters();
  }, [user, loadCostCenters]);

  const deleteCostCenter = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('cost_centers').delete().eq('id', id).eq('user_id', user!.id);
    if (error) throw error;
    await loadCostCenters();
  }, [user, loadCostCenters]);

  
  // PARTE 3B1/3 //

  // ============================================
  // INTEGRAÇÕES AUTOMÁTICAS (CORRIGIDAS)
  // ============================================

  const createTransactionsFromSale = useCallback(async (saleId: string, saleData: Sale) => {
    ensureUser();
    const defaultAccount = bankAccounts.find(acc => acc.active) || bankAccounts[0];
    if (!defaultAccount) throw new Error('Configure uma conta bancária antes de registrar transações');
    const client = clients.find(c => c.id === saleData.client_id);
    if (saleData.status === 'completed') {
      const transaction: CreateFinancialTransactionData = { type: 'income', category: 'Vendas',
        description: `Venda #${saleId.substring(0, 8)} - ${client?.name || 'Cliente'}`, amount: saleData.total, date: saleData.date,
        due_date: saleData.date, payment_date: saleData.date, status: 'paid', payment_method: (saleData.payment_method as any) || 'dinheiro',
        reference_type: 'sale', reference_id: saleId, client_id: saleData.client_id, notes: saleData.notes, account_id: defaultAccount.id };
      await addFinancialTransaction(transaction);
    }
  }, [user, clients, addFinancialTransaction, bankAccounts]);

  const createTransactionsFromPurchase = useCallback(async (purchaseId: string, purchaseData: Purchase) => {
    ensureUser();
    const defaultAccount = bankAccounts.find(acc => acc.active) || bankAccounts[0];
    if (!defaultAccount) throw new Error('Configure uma conta bancária antes de registrar transações');
    const supplier = suppliers.find(s => s.id === purchaseData.supplier_id);
    const paymentInfo = (purchaseData as any).payment_info;
    if (!paymentInfo) return;
    const installments = paymentInfo.installments || 1;
    const installmentValue = paymentInfo.installment_value || (purchaseData.total / installments);
    const firstDueDate = new Date(paymentInfo.first_due_date || purchaseData.date);
    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      const transaction: CreateFinancialTransactionData = { type: 'expense', category: 'Compras',
        description: `Compra NF ${purchaseData.invoice_number || purchaseId.substring(0, 8)} - ${supplier?.name || 'Fornecedor'} - Parcela ${i + 1}/${installments}`,
        amount: installmentValue, date: purchaseData.date, due_date: dueDate.toISOString().split('T')[0], status: paymentInfo.paid ? 'paid' : 'pending',
        payment_date: paymentInfo.paid ? paymentInfo.paid_date : undefined, payment_method: paymentInfo.payment_method, installment_number: i + 1,
        total_installments: installments, reference_type: 'purchase', reference_id: purchaseId, reference_number: purchaseData.invoice_number,
        supplier_id: purchaseData.supplier_id, notes: purchaseData.notes, account_id: defaultAccount.id };
      await addFinancialTransaction(transaction);
    }
    if (paymentInfo.has_shipping && paymentInfo.shipping_cost > 0) {
      const shippingTransaction: CreateFinancialTransactionData = { type: 'expense', category: 'Frete',
        description: `Frete - Compra NF ${purchaseData.invoice_number || purchaseId.substring(0, 8)} - ${paymentInfo.shipping_type || 'Entrega'}`,
        amount: paymentInfo.shipping_cost, date: purchaseData.date, due_date: paymentInfo.first_due_date || purchaseData.date,
        status: paymentInfo.paid ? 'paid' : 'pending', payment_date: paymentInfo.paid ? paymentInfo.paid_date : undefined,
        payment_method: paymentInfo.payment_method, reference_type: 'purchase', reference_id: purchaseId,
        supplier_id: purchaseData.supplier_id, account_id: defaultAccount.id };
      await addFinancialTransaction(shippingTransaction);
    }
  }, [user, suppliers, addFinancialTransaction, bankAccounts]);
  
  const createTransactionsFromProject = useCallback(async (projectId: string, projectData: any) => {
    if (projectData.type !== 'venda') return;
    const client = clients.find(c => c.id === projectData.client_id);
    const { payment_terms } = projectData;
    if (!payment_terms) return;
      const defaultAccount = bankAccounts.find(acc => acc.active) || bankAccounts[0];
      if (!defaultAccount) {
        console.error('❌ Nenhuma conta bancária ativa encontrada');
        return;
      }
    try {
      // Criar uma transação para cada parcela
      for (let i = 0; i < payment_terms.installments; i++) {
        const dueDate = new Date(projectData.start_date);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        const transaction: CreateFinancialTransactionData = {
          type: 'income', // Venda = Receita (A RECEBER)
          category: 'Vendas',
          description: `${projectData.order_number || 'Venda'} - ${client?.name || 'Cliente'} - Parcela ${i + 1}/${payment_terms.installments}`,
          amount: payment_terms.installment_value || 0,
          date: projectData.start_date,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pending',
          payment_method: payment_terms.payment_method,
          reference_type: 'project',
          reference_id: projectId,
          client_id: projectData.client_id,
          account_id: defaultAccount.id, // ✅ OBRIGATÓRIO
          installment_number: i + 1,
          total_installments: payment_terms.installments
        }; 
        await addFinancialTransaction(transaction);
      }
    console.log(`✅ ${payment_terms.installments} transações financeiras criadas para venda ${projectData.order_number}`);
    } catch (error) {
    console.error('❌ Erro ao criar transações financeiras:', error);
    throw error;
  }
}, [clients, bankAccounts, addFinancialTransaction]);
  
  // ============================================
  // ESTOQUE E TRANSAÇÕES SIMPLES
  // ============================================
  
  const addStockMovement = useCallback(async (data: Omit<StockMovement, "id" | "created_at" | "user_id">) => {
    ensureUser();
    const product = products.find(p => p.id === data.product_id);
    if (!product) throw new Error(`Produto não encontrado`);
    const newStock = data.movement_type === 'entrada' ? product.current_stock + data.quantity : product.current_stock - data.quantity;
    if (newStock < 0) throw new Error(`Estoque insuficiente`);
    const movementData = { ...data, user_id: user!.id, created_at: new Date().toISOString() };
    const { error } = await supabase.from("stock_movements").insert([movementData]);
    if (error) throw error;
    await updateProduct({ ...product, current_stock: newStock });
    await loadStockMovements();
  }, [user, products, updateProduct, loadStockMovements]);

  const processProjectStockMovement = useCallback(async (projectId: string, products: ProjectProduct[]) => {
    ensureUser();
    if (!products || products.length === 0) return;
    const movementPromises = products.map(item => 
      addStockMovement({ product_id: item.product_id!, product_name: item.product_name, movement_type: 'saida', quantity: item.quantity,
        unit_price: item.unit_price, total_value: item.total_price, project_id: projectId, reference_type: 'project',
        date: new Date().toISOString(), notes: `Saída para projeto` })
    );
    await Promise.all(movementPromises);
  }, [addStockMovement]);

  const addTransaction = useCallback(async (data: Omit<Transaction, "id" | "created_at" | "user_id">) => {
    ensureUser();
    const newTransaction = { ...data, user_id: user!.id, created_at: new Date().toISOString() };
    const { error } = await supabase.from("transactions").insert([newTransaction]);
    if (error) throw error;
    await loadTransactions();
  }, [user, loadTransactions]);

  // ============================================
  // SALES
  // ============================================

  const addSale = useCallback(async (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    ensureUser();
    const newSale = { date: sale.date, client_id: sale.client_id, total: sale.total, status: sale.status, payment_method: sale.payment_method,
      notes: sale.notes, user_id: user!.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { data: insertedSale, error: saleError } = await supabase.from('sales').insert([newSale]).select().single();
    if (saleError) throw saleError;
    if (sale.items && sale.items.length > 0) {
      const saleItems = sale.items.map(item => ({ sale_id: insertedSale.id, product_id: item.product_id, product_name: item.product_name,
        quantity: item.quantity, unit_price: item.unit_price, total: item.total })).filter(item => item.quantity > 0);
      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;
    }
    if (sale.items && sale.status === 'completed') await processProjectStockMovement(insertedSale.id, sale.items);
    if (sale.status === 'completed') await addTransaction({ type: 'entrada', category: 'venda', description: `Venda`, amount: sale.total, date: sale.date });
    await refreshData();
  }, [user, processProjectStockMovement, addTransaction, refreshData]);

  const updateSale = useCallback(async (id: string, sale: Partial<Sale>) => {
    ensureUser();
    const { error } = await supabase.from('sales').update({ ...sale, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user!.id);
    if (error) throw error;
    await loadSales();
  }, [user, loadSales]);

  const deleteSale = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('sales').delete().eq('id', id).eq('user_id', user!.id);
    if (error) throw error;
    await loadSales();
  }, [user, loadSales]);

  // ============================================
  // PURCHASES
  // ============================================

  const addPurchase = useCallback(async (purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    ensureUser();
    const newPurchase = { date: purchase.date, supplier_id: purchase.supplier_id, total: purchase.total, status: purchase.status,
      invoice_number: purchase.invoice_number, notes: purchase.notes, user_id: user!.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { data: insertedPurchase, error: purchaseError } = await supabase.from('purchases').insert([newPurchase]).select().single();
    if (purchaseError) throw purchaseError;
    if (purchase.items && purchase.items.length > 0) {
      const purchaseItems = purchase.items.map(item => ({ purchase_id: insertedPurchase.id, product_id: item.product_id, product_name: item.product_name,
        quantity: item.quantity, unit_cost: item.unit_cost, total: item.total })).filter(item => item.quantity > 0);
      const { error: itemsError } = await supabase.from('purchase_items').insert(purchaseItems);
      if (itemsError) throw itemsError;
    }
    if (purchase.status === 'received') {
      const movements = purchase.items?.map(item => 
        addStockMovement({ product_id: item.product_id, product_name: item.product_name, movement_type: 'entrada', quantity: item.quantity,
          unit_price: item.unit_cost, total_value: item.total, reference_type: 'manual', date: purchase.date, notes: `Compra` })
      ) || [];
      await Promise.all(movements);
      await addTransaction({ type: 'saida', category: 'compra', description: `Compra`, amount: purchase.total, date: purchase.date });
    }
    if (insertedPurchase && insertedPurchase.id) await createTransactionsFromPurchase(insertedPurchase.id, purchase as Purchase);
    await refreshData();
  }, [user, addStockMovement, addTransaction, refreshData, createTransactionsFromPurchase]);

  const updatePurchase = useCallback(async (id: string, purchase: Partial<Purchase>) => {
    ensureUser();
    const { error } = await supabase.from('purchases').update({ ...purchase, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user!.id);
    if (error) throw error;
    await loadPurchases();
  }, [user, loadPurchases]);

  const deletePurchase = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('purchases').delete().eq('id', id).eq('user_id', user!.id);
    if (error) throw error;
    await loadPurchases();
  }, [user, loadPurchases]);

  // ============================================
  // SUPPLIERS
  // ============================================

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    ensureUser();
    const newSupplier = { ...supplier, user_id: user!.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { error } = await supabase.from('suppliers').insert([newSupplier]);
    if (error) throw error;
    await loadSuppliers();
  }, [user, loadSuppliers]);

  const updateSupplier = useCallback(async (id: string, supplier: Partial<Supplier>) => {
    ensureUser();
    const { error } = await supabase.from('suppliers').update({ ...supplier, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    await loadSuppliers();
  }, [user, loadSuppliers]);

  const deleteSupplier = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    await loadSuppliers();
  }, [user, loadSuppliers]);

  
  // PARTE 3B2/3 //

  // ============================================
  // CRUD - PROJECTS
  // ============================================

  const addProject = useCallback(async (data: Omit<Project, "id" | "created_at" | "updated_at" | "number" | "order_number" | "user_id">): Promise<any> => {
  ensureUser();
  
  console.log('📥 [addProject] Dados recebidos:', data);
  console.log('📥 [addProject] budget:', data.budget);
    console.log('🔥 CHECKPOINT 1: Antes do insert no Supabase'); // ← ADICIONE ESTE LOG
      
  console.log('📥 [addProject] products:', data.products?.length);
  
  if (!data.description || data.description.trim() === '') {
    throw new Error('Descrição é obrigatória');
  }
  
  if (!data.client_id) {
    throw new Error('Cliente é obrigatório');
  }
  
  if (!data.products || data.products.length === 0) {
    throw new Error('Adicione pelo menos um produto ou serviço');
  }

  // ✅ CRÍTICO: Validar budget ANTES de enviar
  if (!data.budget || data.budget <= 0 || isNaN(data.budget)) {
    console.error('❌ [addProject] Budget inválido:', data.budget);
    throw new Error('O valor do orçamento deve ser maior que zero');
  }

  const deliveryDeadlineDays = data.delivery_deadline_days || 15;
  const startDate = new Date(data.start_date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + deliveryDeadlineDays);

  // ✅ GARANTIR que budget seja um número válido
  const budgetValue = Number(data.budget);
  if (isNaN(budgetValue) || budgetValue <= 0) {
    throw new Error('Valor do orçamento inválido');
  }

  const newProject = {
    client_id: data.client_id,
    description: data.description.trim(),
    status: data.status,
    type: data.type,
    budget: budgetValue, // ✅ Usar o valor convertido
    start_date: data.start_date,
    end_date: data.end_date || endDate.toISOString().split('T')[0],
    delivery_deadline_days: deliveryDeadlineDays,
    materials_cost: data.materials_cost || 0,
    labor_cost: data.labor_cost || 0,
    profit_margin: data.profit_margin || 0,
    payment_terms: data.payment_terms,
    number: 0,
    user_id: user!.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('💾 [addProject] Dados para Supabase:', newProject);
  console.log('💾 [addProject] budget final:', newProject.budget);

  const { data: insertedProject, error } = await supabase
    .from("projects")
    .insert([cleanUndefined(newProject)])
    .select()
    .single();

    console.log('🔥 CHECKPOINT 2: Depois do insert, error:', error); // ← ADICIONE ESTE LOG
    
  if (error) {
    console.error('❌ [addProject] Erro do Supabase:', error);
    throw error;
  }

    // Inserir os produtos do projeto
  if (data.products && data.products.length > 0) {
    const project_Products = data.products.map(p => ({
      project_id: insertedProject.id,
      product_id: p.productid || null,
      product_name: p.productname || 'Produto sem nome',
      quantity: Number(p.quantity) || 1,
      unit_price: Number(p.unitprice) || 0,
      total_price: Number(p.totalprice) || 0,
      item_type: p.itemtype || 'produto',
      item_description: p.itemdescription || '',
      service_hours: p.itemtype === 'servico' ? Number(p.servicehours) || null : null,
      hourly_rate: p.itemtype === 'servico' ? Number(p.hourlyrate) || null : null,
      user_id: user!.id
    }));

    console.log('[addProject] Inserindo produtos:', project_Products);

    const { error: productsError } = await supabase
      .from('project_products')
      .insert(project_Products);

    if (productsError) {
      console.error('[addProject] Erro ao inserir produtos:', productsError);
      // Opcional: deletar o projeto se falhar ao inserir produtos
      await supabase.from('projects').delete().eq('id', insertedProject.id);
      throw new Error('Erro ao salvar produtos do projeto');
    }

    console.log('[addProject] Produtos inseridos com sucesso!');
  }

  // Criar transações financeiras se for venda
  if (insertedProject.type === 'venda') {
    await createTransactionsFromProject(insertedProject.id, {
      ...insertedProject,
      paymentterms: data.paymentterms
    });
  }

  console.log('✅ [addProject] Projeto inserido:', insertedProject);
    
    await loadProjects();
    return insertedProject;
  }, [user, loadProjects, createTransactionsFromProject]);
      
  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    ensureUser();
    if (data.delivery_deadline_days && data.start_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + data.delivery_deadline_days);
      data.end_date = endDate.toISOString().split('T')[0];
    }
    const { error } = await supabase.from("projects").update({ ...cleanUndefined(data), updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user!.id);
    if (error) throw error;
    if (data.products !== undefined) {
      const { error: deleteError } = await supabase.from("project_products").delete().eq("project_id", id);
      if (deleteError) throw deleteError;
      if (data.products && data.products.length > 0) {
        const project_Products = data.products.map(p => {
          if (p.item_type === 'servico') {
            if (!p.service_hours || p.service_hours <= 0) throw new Error(`Serviço precisa ter horas`);
            if (!p.hourly_rate || p.hourly_rate <= 0) throw new Error(`Serviço precisa ter valor por hora`);
          }
          return { project_id: id, product_id: p.product_id || null, product_name: p.product_name || 'Produto sem nome',
            quantity: Number(p.quantity) || 1, unit_price: Number(p.unit_price) || 0, total_price: Number(p.total_price) || 0,
            item_type: p.item_type || 'produto', item_description: p.item_description || '',
            service_hours: p.item_type === 'servico' ? Number(p.service_hours) : null,
            hourly_rate: p.item_type === 'servico' ? Number(p.hourly_rate) : null, user_id: user!.id };
        }).filter(p => p.quantity > 0);
        if (project_Products.length > 0) {
          const { error: prodError } = await supabase.from("project_products").insert(project_Products).select();
          if (prodError) { alert(`Erro ao salvar produtos: ${prodError.message}`); throw prodError; }
        }
      }
    }
    await loadProjects();
  }, [user, loadProjects]);

  const deleteProject = useCallback(async (id: string) => {
  ensureUser();
  
  try {
    // 1. Buscar o projeto para verificar se é uma venda
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('type, order_number')
      .eq('id', id)
      .eq('user_id', user!.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // 2. Se for uma venda, deletar as transações financeiras associadas
    if (project && project.type === 'venda') {
      console.log(`🗑️ Deletando transações financeiras do projeto ${project.order_number}...`);
      
      const { error: transError } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('reference_type', 'project')
        .eq('reference_id', id);
      
      if (transError) {
        console.error('Erro ao deletar transações:', transError);
        // Não bloqueia a exclusão do projeto
      } else {
        console.log('✅ Transações financeiras deletadas com sucesso');
      }
    }
    
    // 3. Deletar os produtos do projeto
    const { error: productsError } = await supabase
      .from('project_products')
      .delete()
      .eq('project_id', id);
    
    if (productsError) {
      console.error('Erro ao deletar produtos do projeto:', productsError);
    }
    
    // 4. Deletar o projeto
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id);
    
    if (error) throw error;
    
    console.log('✅ Projeto deletado com sucesso');
    
    // 5. Recarregar dados
    await loadProjects();
    await loadFinancialTransactions();
    
  } catch (error: any) {
    console.error('❌ Erro ao deletar projeto:', error);
    throw error;
  }
}, [user, loadProjects, loadFinancialTransactions]);

  // ============================================
  // MÉTODOS DE RELATÓRIOS E UTILITÁRIOS
  // ============================================

  const getTransactionsByPeriod = useCallback((startDate: string, endDate: string) => {
    return financialTransactions.filter(t => t.date >= startDate && t.date <= endDate);
  }, [financialTransactions]);

  const getOverdueTransactions = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return financialTransactions.filter(t => t.status === 'pending' && t.due_date < today);
  }, [financialTransactions]);

  const getFinancialSummary = useCallback((startDate: string, endDate: string) => {
    const transactions = getTransactionsByPeriod(startDate, endDate);
    const totalIncome = transactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
    const pendingIncome = transactions.filter(t => t.type === 'income' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
    const pendingExpense = transactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense, pendingIncome, pendingExpense };
  }, [getTransactionsByPeriod]);

  const getCashFlow = useCallback((months: number) => {
    const result = [];
    const today = new Date();
    for (let i = 0; i < months; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = month.toISOString().substring(0, 7);
      const transactions = financialTransactions.filter(t => t.date.startsWith(monthStr));
      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      result.push({ month: monthStr, income, expense, balance: income - expense });
    }
    return result.reverse();
  }, [financialTransactions]);

  const getExpensesByCategory = useCallback((startDate: string, endDate: string) => {
    const transactions = getTransactionsByPeriod(startDate, endDate).filter(t => t.type === 'expense');
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const byCategory: { [key: string]: number } = {};
    transactions.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });
    return Object.entries(byCategory).map(([category, amount]) => ({ category, total: amount, percentage: total > 0 ? (amount / total) * 100 : 0 }));
  }, [getTransactionsByPeriod]);

  const calculateProductCost = useCallback(async (productId: string): Promise<number> => {
    const visited = new Set<string>();
    const calculate = async (id: string): Promise<number> => {
      if (visited.has(id)) return 0;
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

  const getAvailableComponents = useCallback(() => validateArray(products), [products]);

  const getDashboardStats = useCallback(() => {
    const totalClients = clients.length;
    const activeProjects = projects.filter(p => ["em_producao", "aprovado"].includes(p.status || "")).length;
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthlySalesRevenue = (sales || []).filter(s => {
      const saleDate = new Date(s.date);
      return s.status === 'completed' && saleDate >= firstDayOfMonth && saleDate <= lastDayOfMonth;
    }).reduce((sum, s) => sum + (s.total || 0), 0);
    const monthlyTransactionRevenue = (transactions || []).filter(t => {
      const transDate = new Date(t.date);
      return t.type === "entrada" && transDate >= firstDayOfMonth && transDate <= lastDayOfMonth;
    }).reduce((sum, t) => sum + (t.amount || 0), 0);
    const monthlyRevenue = monthlySalesRevenue + monthlyTransactionRevenue;
    const pendingSales = (sales || []).filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.total || 0), 0);
    const pendingProjects = (projects || []).filter(p => ["concluido", "entregue"].includes(p.status || "")).reduce((sum, p) => sum + ((p.budget || 0) * 0.5), 0);
    const pendingPayments = pendingSales + pendingProjects;
    const lowStockItems = (products || []).filter(p => p.current_stock <= p.min_stock).length;
    const recentActivity = [...(projects || []).slice(-3).map(p => ({ type: "project", message: `Novo projeto ${p.order_number}`, date: p.created_at })),
      ...(sales || []).slice(-3).map(s => ({ type: "sale", message: `Venda R$ ${s.total}`, date: s.created_at })),
      ...(purchases || []).slice(-3).map(p => ({ type: "purchase", message: `Compra R$ ${p.total}`, date: p.created_at }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    return { totalClients, activeProjects, monthlyRevenue, pendingPayments, lowStockItems, recentActivity };
  }, [clients, projects, sales, purchases, transactions, products]);

  const debugProject = useCallback(async (projectId: string) => {
    if (!user) return {};
    const { data, error } = await supabase.from("projects").select("*, products:project_products(*)").eq("id", projectId).single();
    if (error) throw error;
    return data;
  }, [user]);

  const reloadProject = useCallback(async (projectId: string) => {
    if (!user) return null;
    const { data, error } = await supabase.from("projects").select("*, client:clients(name), products:project_products(*)").eq("id", projectId).single();
    if (error) throw error;
    return data;
  }, [user]);

  // ============================================
  // PROVIDER
  // ============================================

  return (
    <AppContext.Provider value={{
      clients, projects, transactions, products, stockMovements, sales, purchases, suppliers, categories,
      financialTransactions, bankAccounts, costCenters, loading, error,
      addClient, updateClient, deleteClient, addProject, updateProject, deleteProject,
      addTransaction, addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction,
      payTransaction, getTransactionsByPeriod, getOverdueTransactions,
      addBankAccount, updateBankAccount, deleteBankAccount, updateBankAccountBalance,
      addCostCenter, updateCostCenter, deleteCostCenter,
      addProduct, updateProduct, deleteProduct,
      addStockMovement, processProjectStockMovement,
      addSale, updateSale, deleteSale,
      addPurchase, updatePurchase, deletePurchase,
      addSupplier, updateSupplier, deleteSupplier,
      addCategory, loadCategories,
      calculateProductCost, getAvailableComponents, getDashboardStats,
      refreshData,
      createTransactionsFromSale, createTransactionsFromPurchase, createTransactionsFromProject,
      getFinancialSummary, getCashFlow, getExpensesByCategory,
      reloadProject, debugProject,
      pdfSettings,
      updatePDFSettings,
    }}>
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
            <button onClick={refreshData} disabled={loading} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50">
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
