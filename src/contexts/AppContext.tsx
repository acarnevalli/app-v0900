import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { PDFSettings, defaultSettings } from '../components/PDFSettingsModal';

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

export interface Client {
  id: string;
  name: string;
  type: 'pf' | 'pj';
  cpf?: string;
  cnpj?: string;
  email: string;
  phone: string;
  mobile: string;
  razaosocial?: string;
  inscricaoestadual?: string;
  isentoicms?: boolean;
  numero?: string;
  complemento?: string;
  idempresa?: string;
  flativo: boolean;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  neighborhood: string;
  streettype: string;
  street: string;
  userid: string;
  createdat: string;
  updatedat: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'materialbruto' | 'parteproduto' | 'produtopronto';
  unit: string;
  components: ProductComponent[];
  costprice: number;
  saleprice?: number;
  currentstock: number;
  minstock: number;
  supplier?: string;
  userid: string;
  createdat: string;
  updatedat: string;
}

export interface ProductComponent {
  id?: string;
  productid: string;
  componentid: string;
  productname: string;
  quantity: number;
  unit: string;
  unitcost: number;
  totalcost: number;
}

export type ItemType = 'produto' | 'servico';

export interface ProjectProduct {
  id: string;
  productid: string | null;
  productname: string;
  quantity: number;
  unitprice: number;
  totalprice: number;
  itemtype: ItemType;
  itemdescription?: string;
  servicehours?: number;
  hourlyrate?: number;
}

export interface Project {
  id: string;
  ordernumber: string;
  number: number;
  clientid: string;
  clientname?: string;
  description: string;
  status: 'orcamento' | 'aprovado' | 'emproducao' | 'concluido' | 'entregue';
  type: 'orcamento' | 'venda';
  products: ProjectProduct[];
  budget: number;
  startdate: string;
  enddate: string;
  deliverydeadlinedays: number;
  materialscost?: number;
  laborcost?: number;
  profitmargin?: number;
  paymentterms?: PaymentTerms;
  userid: string;
  createdat: string;
  updatedat: string;
}

export interface PaymentTerms {
  installments: number;
  paymentmethod: 'dinheiro' | 'pix' | 'cartaocredito' | 'cartaodebito' | 'boleto' | 'transferencia';
  discountpercentage: number;
  installmentvalue?: number;
  totalwithdiscount?: number;
}

export interface Transaction {
  id: string;
  projectid?: string;
  projecttitle?: string;
  type: 'entrada' | 'saida';
  category: string;
  description: string;
  amount: number;
  date: string;
  userid: string;
  createdat: string;
}

export interface StockMovement {
  id: string;
  productid: string;
  productname: string;
  movementtype: 'entrada' | 'saida';
  quantity: number;
  unitprice?: number;
  totalvalue?: number;
  projectid?: string;
  projecttitle?: string;
  referencetype?: 'manual' | 'project' | 'adjustment';
  date: string;
  notes?: string;
  userid: string;
  createdat: string;
}

export interface Sale {
  id: string;
  date: string;
  clientid: string;
  clientname?: string;
  items: SaleItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentmethod?: string;
  notes?: string;
  userid: string;
  createdat: string;
  updatedat: string;
}

export interface SaleItem {
  id?: string;
  saleid?: string;
  productid: string;
  productname: string;
  quantity: number;
  unitprice: number;
  total: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplierid: string;
  suppliername?: string;
  items: PurchaseItem[];
  total: number;
  status: 'pending' | 'received' | 'cancelled';
  invoicenumber?: string;
  notes?: string;
  userid: string;
  createdat: string;
  updatedat: string;
}

export interface PurchaseItem {
  id?: string;
  purchaseid?: string;
  productid: string;
  productname: string;
  quantity: number;
  unitcost: number;
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
  userid?: string;
  createdat: string;
  updatedat: string;
}

export interface Category {
  id: string;
  name: string;
  userid?: string;
  isglobal?: boolean;
  createdat: string;
  updatedat: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  paidamount?: number;
  discount?: number;
  interest?: number;
  fine?: number;
  date: string;
  duedate: string;
  paymentdate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  paymentmethod?: 'dinheiro' | 'pix' | 'cartaocredito' | 'cartaodebito' | 'boleto' | 'transferencia' | 'cheque';
  installmentnumber?: number;
  totalinstallments?: number;
  referencetype?: 'sale' | 'purchase' | 'project' | 'manual' | 'recurring';
  referenceid?: string;
  referencenumber?: string;
  accountid?: string;
  accountname?: string;
  clientid?: string;
  clientname?: string;
  supplierid?: string;
  suppliername?: string;
  projectid?: string;
  projectnumber?: string;
  bankaccountid?: string;
  bankaccountname?: string;
  costcenterid?: string;
  costcentername?: string;
  notes?: string;
  attachments?: string[];
  userid: string;
  createdat: string;
  updatedat: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bankname?: string;
  accountnumber?: string;
  agency?: string;
  accounttype: 'checking' | 'savings' | 'cash' | 'investment';
  initialbalance: number;
  currentbalance: number;
  active: boolean;
  notes?: string;
  userid: string;
  createdat: string;
  updatedat: string;
}

export interface CostCenter {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parentid?: string;
  parentname?: string;
  active: boolean;
  userid: string;
  createdat: string;
  updatedat: string;
}

export interface PaymentInfo {
  paymentmethod: 'dinheiro' | 'pix' | 'cartaocredito' | 'cartaodebito' | 'boleto' | 'transferencia' | 'cheque';
  installments: number;
  installmentvalue: number;
  firstduedate: string;
  hasshipping?: boolean;
  shippingcost?: number;
  shippingtype?: string;
  paid?: boolean;
  paiddate?: string;
}

export type CreateFinancialTransactionData = Omit<
  FinancialTransaction,
  'id' | 'createdat' | 'updatedat' | 'userid' | 'clientname' | 'suppliername' | 'projectnumber' | 'bankaccountname' | 'costcentername'
>;

export type UpdateFinancialTransactionData = Partial<CreateFinancialTransactionData>;

export interface PayTransactionData {
  paymentdate: string;
  paidamount?: number;
  paymentmethod?: string;
  bankaccountid?: string;
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
  addClient: (data: Omit<Client, 'id' | 'userid' | 'createdat' | 'updatedat'>) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addProject: (data: Omit<Project, 'id' | 'ordernumber' | 'number' | 'userid' | 'createdat' | 'updatedat'>) => Promise<any>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'userid' | 'createdat'>) => Promise<void>;
  addFinancialTransaction: (data: CreateFinancialTransactionData) => Promise<any>;
  updateFinancialTransaction: (id: string, data: UpdateFinancialTransactionData) => Promise<void>;
  deleteFinancialTransaction: (id: string) => Promise<void>;
  payTransaction: (id: string, paymentData: PayTransactionData) => Promise<void>;
  getTransactionsByPeriod: (startDate: string, endDate: string) => FinancialTransaction[];
  getOverdueTransactions: () => FinancialTransaction[];
  addBankAccount: (data: Omit<BankAccount, 'id' | 'userid' | 'createdat' | 'updatedat'>) => Promise<void>;
  updateBankAccount: (id: string, data: Partial<BankAccount>) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;
  updateBankAccountBalance: (accountId: string, amount: number, operation: 'add' | 'subtract') => Promise<void>;
  addCostCenter: (data: Omit<CostCenter, 'id' | 'userid' | 'createdat' | 'updatedat'>) => Promise<void>;
  updateCostCenter: (id: string, data: Partial<CostCenter>) => Promise<void>;
  deleteCostCenter: (id: string) => Promise<void>;
  addProduct: (data: Omit<Product, 'id' | 'userid' | 'createdat' | 'updatedat'>) => Promise<void>;
  updateProduct: (data: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addStockMovement: (data: Omit<StockMovement, 'id' | 'userid' | 'createdat'>) => Promise<void>;
  processProjectStockMovement: (projectId: string, products: ProjectProduct[]) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'userid' | 'createdat' | 'updatedat'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'userid' | 'createdat' | 'updatedat'>) => Promise<void>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdat' | 'updatedat'>) => Promise<void>;
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
  reloadProject: (projectId: string) => Promise<any | null>;
  debugProject: (projectId: string) => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
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
  const [pdfSettings, setPdfSettings] = useState(defaultSettings);
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

  const loadCategories = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`userid.eq.${user.id},isglobal.eq.true`)
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
        .from('clients')
        .select('*', { count: 'exact' })
        .eq('userid', user.id)
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
      .from('products')
      .select('*')
      .eq('userid', user.id);
    if (prodErr) throw prodErr;
    const { data: componentsData, error: compErr } = await supabase
      .from('productcomponents')
      .select(`
        *,
        component:products!productcomponentscomponentidfkey(
          id, name, unit, costprice
        )
      `);
    if (compErr) throw compErr;
    const merged = validateArray(productsData).map((p) => ({
      ...p,
      components: validateArray(componentsData)
        .filter((c: any) => c.productid === p.id)
        .map((c: any) => ({
          id: c.id,
          productid: c.productid,
          componentid: c.componentid,
          productname: c.component?.name || '',
          quantity: c.quantity || 0,
          unit: c.component?.unit || '',
          unitcost: c.component?.costprice || 0,
          totalcost: ((c.component?.costprice || 0) * (c.quantity || 0)),
        })),
    }));
    setProducts(merged);
  }, [user]);

  const loadFinancialTransactions = useCallback(async () => {
    if (!user) return;
    try {
      console.log('📊 Carregando transações financeiras...');
      const { data, error } = await supabase
        .from('financialtransactions')
        .select(`
          *,
          clients!financialtransactionsclientidfkey(name),
          suppliers!financialtransactionssupplieridfkey(name),
          projects!financialtransactionsprojectidfkey(ordernumber),
          bankaccounts!financialtransactionsaccountidfkey(name),
          costcenters!financialtransactionscostcenteridfkey(name)
        `)
        .eq('userid', user.id)
        .order('duedate', { ascending: false });
      if (error) {
        console.error('❌ Erro ao buscar transações com relacionamentos:', error);
        const { data: simpleData, error: simpleError } = await supabase
          .from('financialtransactions')
          .select('*')
          .eq('userid', user.id)
          .order('duedate', { ascending: false });
        if (simpleError) throw simpleError;
        if (!simpleData || simpleData.length === 0) {
          console.log('ℹ️ Nenhuma transação cadastrada ainda.');
          setFinancialTransactions([]);
          return;
        }
        console.log(`✅ ${simpleData.length} transações financeiras carregadas (modo fallback)`);
        setFinancialTransactions(simpleData);
        return;
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
      const merged = validateArray(data).map((t: any) => ({
        ...t,
        clientname: t.clients?.name || null,
        suppliername: t.suppliers?.name || null,
        projectnumber: t.projects?.ordernumber || null,
        accountname: t.bankaccounts?.name || null,
        costcentername: t.costcenters?.name || null
      }));
      console.log(`✅ ${merged.length} transações financeiras carregadas com sucesso`);
      setFinancialTransactions(merged);
    } catch (error: any) {
      console.error('🔴 Erro crítico ao carregar transações financeiras:', error);
      setFinancialTransactions([]);
    }
  }, [user]);

  const loadBankAccounts = useCallback(async () => {
    if (!user) return;
    console.log('🏦 Carregando contas bancárias...');
    const { data, error } = await supabase
      .from('bankaccounts')
      .select('*')
      .eq('userid', user.id)
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
      .from('costcenters')
      .select(`*, parent:costcenters!parentid(name)`)
      .eq('userid', user.id)
      .order('name');
    if (error) {
      console.error('❌ Erro ao carregar centros de custo:', error);
      throw error;
    }
    const merged = validateArray(data).map((cc: any) => ({
      ...cc,
      parentname: cc.parent?.name
    }));
    console.log(`✅ ${merged.length} centros de custo carregados`);
    setCostCenters(merged);
  }, [user]);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    console.log('🔄 [AppContext] Carregando projetos...');
    const { data, error } = await supabase
      .from('projects')
      .select(`*, client:clients(name), products:projectproducts(*)`)
      .eq('userid', user.id)
      .order('createdat', { ascending: false });
    if (error) {
      console.error('❌ [AppContext] Erro ao carregar projetos:', error);
      throw error;
    }
    if (!data) {
      console.log('⚠️ [AppContext] Nenhum projeto encontrado');
      setProjects([]);
      return;
    }
    const merged = data.map((p: any) => {
      const productsArray = Array.isArray(p.products) ? p.products : [];
      const processedProducts: ProjectProduct[] = productsArray
        .filter((pp: any) => pp && typeof pp === 'object')
        .map((pp: any) => ({
          id: pp.id || `temp-${Date.now()}-${Math.random()}`,
          productid: pp.productid || null,
          productname: pp.productname || pp.name || 'Produto sem nome',
          quantity: Number(pp.quantity) || 1,
          unitprice: Number(pp.unitprice) || 0,
          totalprice: Number(pp.totalprice) || 0,
          itemtype: (pp.itemtype || 'produto') as ItemType,
          itemdescription: pp.itemdescription || pp.description || '',
          servicehours: pp.itemtype === 'servico' ? (Number(pp.servicehours) || undefined) : undefined,
          hourlyrate: pp.itemtype === 'servico' ? (Number(pp.hourlyrate) || undefined) : undefined,
        }));
      return {
        id: p.id,
        ordernumber: p.ordernumber || `P-${p.number || '000'}`,
        number: p.number || 0,
        clientid: p.clientid,
        clientname: p.client?.name || 'Cliente não encontrado',
        description: p.description || '',
        status: p.status || 'orcamento',
        type: p.type || 'orcamento',
        products: processedProducts,
        budget: Number(p.budget) || 0,
        startdate: p.startdate || new Date().toISOString().split('T')[0],
        enddate: p.enddate || new Date().toISOString().split('T')[0],
        deliverydeadlinedays: Number(p.deliverydeadlinedays) || 15,
        materialscost: p.materialscost ? Number(p.materialscost) : undefined,
        laborcost: p.laborcost ? Number(p.laborcost) : undefined,
        profitmargin: p.profitmargin ? Number(p.profitmargin) : undefined,
        paymentterms: p.paymentterms || undefined,
        userid: p.userid,
        createdat: p.createdat,
        updatedat: p.updatedat
      };
    });
    console.log(`✅ [AppContext] Total de projetos carregados: ${merged.length}`);
    setProjects(merged);
  }, [user]);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('userid', user.id)
      .order('date', { ascending: false });
    if (error) throw error;
    setTransactions(validateArray(data));
  }, [user]);

  const loadStockMovements = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('stockmovements')
      .select('*')
      .eq('userid', user.id)
      .order('date', { ascending: false });
    if (error) throw error;
    setStockMovements(validateArray(data));
  }, [user]);

  const loadSuppliers = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .or(`userid.eq.${user.id},userid.is.null`)
      .order('name');
    if (error) throw error;
    setSuppliers(validateArray(data));
  }, [user]);

  const loadSales = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('sales')
      .select(`*, client:clients(name), items:saleitems(*)`)
      .eq('userid', user.id)
      .order('date', { ascending: false });
    if (error) throw error;
    const merged = validateArray(data).map((sale: any) => ({
      ...sale,
      clientname: sale.client?.name,
      items: validateArray(sale.items).map((item: any) => ({
        id: item.id,
        saleid: item.saleid,
        productid: item.productid,
        productname: item.productname || '',
        quantity: item.quantity || 0,
        unitprice: item.unitprice || 0,
        total: item.total || 0,
      })),
    }));
    setSales(merged);
  }, [user]);

  const loadPurchases = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('purchases')
      .select(`*, supplier:suppliers(name), items:purchaseitems(*)`)
      .eq('userid', user.id)
      .order('date', { ascending: false });
    if (error) throw error;
    const merged = validateArray(data).map((purchase: any) => ({
      ...purchase,
      suppliername: purchase.supplier?.name,
      items: validateArray(purchase.items).map((item: any) => ({
        id: item.id,
        purchaseid: item.purchaseid,
        productid: item.productid,
        productname: item.productname || '',
        quantity: item.quantity || 0,
        unitcost: item.unitcost || 0,
        total: item.total || 0,
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
      safeLoad(loadClients, 'Clientes'),
      safeLoad(loadProducts, 'Produtos'),
      safeLoad(loadProjects, 'Projetos'),
      safeLoad(loadTransactions, 'Transações'),
      safeLoad(loadStockMovements, 'Estoque'),
      safeLoad(loadSuppliers, 'Fornecedores'),
      safeLoad(loadSales, 'Vendas'),
      safeLoad(loadPurchases, 'Compras'),
      safeLoad(loadCategories, 'Categorias'),
      safeLoad(loadFinancialTransactions, 'Transações Financeiras'),
      safeLoad(loadBankAccounts, 'Contas Bancárias'),
      safeLoad(loadCostCenters, 'Centros de Custo'),
    ]);
    const hasErrors = results.some(r => r.status === 'rejected');
    if (hasErrors) console.warn('Alguns dados não foram carregados completamente');
    setLoading(false);
  }, [user, loadClients, loadProducts, loadProjects, loadTransactions, loadStockMovements, loadSuppliers, loadSales, loadPurchases, loadCategories, loadFinancialTransactions, loadBankAccounts, loadCostCenters]);

  useEffect(() => {
    if (authLoading) return;
    const loadData = async () => {
      if (isAuthenticated && user) {
        await refreshData();
      } else {
        setLoading(false);
        setError(null);
      }
    };
    const savedSettings = localStorage.getItem('pdfSettings');
    if (savedSettings) {
      try {
        setPdfSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Erro ao carregar configurações do PDF:', e);
      }
    }
    loadData();
  }, [user, isAuthenticated, authLoading, refreshData]);

  const addCategory = useCallback(async (name: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    const cleanedName = name.trim();
    if (!cleanedName) throw new Error('Nome da categoria é obrigatório');
    const exists = categories.some(c => c.name.toLowerCase() === cleanedName.toLowerCase());
    if (exists) throw new Error('Categoria já existe');
    const { data, error } = await supabase
      .from('categories')
      .insert([cleanUndefined({ name: cleanedName, userid: user.id, isglobal: false })])
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new Error('Categoria já existe');
      throw error;
    }
    setCategories(prev => [...prev, data]);
  }, [user, categories]);

  const addClient = useCallback(async (data: Omit<Client, 'id' | 'userid' | 'createdat' | 'updatedat'>) => {
    ensureUser();
    const newClient = { ...data, userid: user!.id, createdat: new Date().toISOString(), updatedat: new Date().toISOString() };
    const { error } = await supabase.from('clients').insert([newClient]);
    if (error) throw error;
    await loadClients();
  }, [user, loadClients]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    ensureUser();
    const { error } = await supabase
      .from('clients')
      .update({ ...data, updatedat: new Date().toISOString() })
      .eq('id', id)
      .eq('userid', user!.id);
    if (error) throw error;
    await loadClients();
  }, [user, loadClients]);

  const deleteClient = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('clients').delete().eq('id', id).eq('userid', user!.id);
    if (error) throw error;
    await loadClients();
  }, [user, loadClients]);

  const addProduct = useCallback(async (data: Omit<Product, 'id' | 'userid' | 'createdat' | 'updatedat'>) => {
    ensureUser();
    const productData = {
      name: data.name.trim(),
      description: data.description?.trim(),
      category: data.category?.trim(),
      type: data.type,
      unit: data.unit,
      costprice: parseFloat(data.costprice.toString()) || 0,
      saleprice: data.saleprice ? parseFloat(data.saleprice.toString()) : undefined,
      currentstock: Math.max(0, parseInt(data.currentstock.toString()) || 0),
      minstock: Math.max(0, parseInt(data.minstock.toString()) || 0),
      supplier: data.supplier?.trim(),
      userid: user!.id,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };
    if (!productData.name) throw new Error('Nome do produto é obrigatório');
    const { data: insertedProduct, error } = await supabase
      .from('products')
      .insert([cleanUndefined(productData)])
      .select()
      .single();
    if (error) throw error;
    if (data.components && data.components.length > 0) {
      const components = data.components
        .map(c => ({ productid: insertedProduct.id, componentid: c.componentid, quantity: parseFloat(c.quantity.toString()) || 0 }))
        .filter(c => c.quantity > 0);
      const { error: compError } = await supabase.from('productcomponents').insert(components);
      if (compError) throw compError;
    }
    await loadProducts();
  }, [user, loadProducts]);

  const updateProduct = useCallback(async (data: Product) => {
    ensureUser();
    const { error: productError } = await supabase
      .from('products')
      .update(cleanUndefined({
        name: data.name,
        description: data.description,
        category: data.category,
        type: data.type,
        unit: data.unit,
        costprice: data.costprice,
        saleprice: data.saleprice,
        currentstock: data.currentstock,
        minstock: data.minstock,
        supplier: data.supplier,
        updatedat: new Date().toISOString()
      }))
      .eq('id', data.id)
      .eq('userid', user!.id);
    if (productError) throw productError;
    if (data.components) {
      await supabase.from('productcomponents').delete().eq('productid', data.id);
      if (data.components.length > 0) {
        const components = data.components.map(c => ({ productid: data.id, componentid: c.componentid, quantity: c.quantity }));
        const { error: compError } = await supabase.from('productcomponents').insert(components);
        if (compError) throw compError;
      }
    }
    await loadProducts();
  }, [user, loadProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('products').delete().eq('id', id).eq('userid', user!.id);
    if (error) throw error;
    await loadProducts();
  }, [user, loadProducts]);

  const updateBankAccountBalance = useCallback(async (accountId: string, amount: number, operation: 'add' | 'subtract') => {
    ensureUser();
    const { data: account, error: fetchError } = await supabase
      .from('bankaccounts')
      .select('currentbalance')
      .eq('id', accountId)
      .eq('userid', user!.id)
      .single();
    if (fetchError || !account) return;
    const newBalance = operation === 'add' ? account.currentbalance + amount : account.currentbalance - amount;
    const { error } = await supabase
      .from('bankaccounts')
      .update({ currentbalance: newBalance, updatedat: new Date().toISOString() })
      .eq('id', accountId)
      .eq('userid', user!.id);
    if (error) throw error;
    await loadBankAccounts();
  }, [user, loadBankAccounts]);

  const addBankAccount = useCallback(async (data: Omit<BankAccount, 'id' | 'userid' | 'createdat' | 'updatedat'>) => {
    ensureUser();
    const newAccount = {
      ...cleanUndefined(data),
      currentbalance: data.initialbalance,
      userid: user!.id,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };
    const { error } = await supabase.from('bankaccounts').insert([newAccount]);
    if (error) throw error;
    await loadBankAccounts();
  }, [user, loadBankAccounts]);

  const updateBankAccount = useCallback(async (id: string, data: Partial<BankAccount>) => {
    ensureUser();
    const { error } = await supabase
      .from('bankaccounts')
      .update({ ...cleanUndefined(data), updatedat: new Date().toISOString() })
      .eq('id', id)
      .eq('userid', user!.id);
    if (error) throw error;
    await loadBankAccounts();
  }, [user, loadBankAccounts]);

  const deleteBankAccount = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('bankaccounts').delete().eq('id', id).eq('userid', user!.id);
    if (error) throw error;
    await loadBankAccounts();
  }, [user, loadBankAccounts]);

  const addFinancialTransaction = useCallback(async (data: CreateFinancialTransactionData): Promise<any> => {
    ensureUser();
    if (!data.type || !['income', 'expense'].includes(data.type)) throw new Error('Tipo inválido');
    if (!data.category?.trim()) throw new Error('Categoria é obrigatória');
    if (!data.amount || data.amount <= 0) throw new Error('Valor deve ser maior que zero');
    if (!data.accountid) throw new Error('Conta bancária é obrigatória');
    const accountExists = bankAccounts.find(acc => acc.id === data.accountid);
    if (!accountExists) throw new Error('Conta bancária não encontrada');
    const transactionDate = data.paymentdate || data.duedate || new Date().toISOString().split('T')[0];
    const newTransaction = {
      type: data.type,
      category: data.category.trim(),
      amount: Number(data.amount),
      date: transactionDate,
      accountid: data.accountid,
      description: data.description?.trim() || null,
      duedate: data.duedate || null,
      status: data.status || 'pending',
      paymentmethod: data.paymentmethod || null,
      referenceid: data.referenceid || null,
      referencetype: data.referencetype || null,
      clientid: data.clientid || null,
      supplierid: data.supplierid || null,
      installmentnumber: data.installmentnumber || null,
      totalinstallments: data.totalinstallments || null,
      userid: user!.id
    };
    const { data: inserted, error } = await supabase
      .from('financialtransactions')
      .insert([newTransaction])
      .select()
      .single();
    if (error) throw error;
    if (data.status === 'paid' || !data.duedate || data.paymentdate) {
      const operation = data.type === 'income' ? 'add' : 'subtract';
      await updateBankAccountBalance(data.accountid, Number(data.amount), operation);
    }
    await loadFinancialTransactions();
    return inserted;
  }, [user, loadFinancialTransactions, bankAccounts, updateBankAccountBalance]);

  const updateFinancialTransaction = useCallback(async (id: string, data: UpdateFinancialTransactionData) => {
    ensureUser();
    const updateData: any = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) {
      if (!data.category?.trim()) throw new Error('Categoria não pode ser vazia');
      updateData.category = data.category.trim();
    }
    if (data.amount !== undefined) {
      if (data.amount <= 0) throw new Error('Valor inválido');
      updateData.amount = Number(data.amount);
    }
    if (data.paymentdate !== undefined) updateData.date = data.paymentdate;
    if (data.duedate !== undefined) updateData.duedate = data.duedate;
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.paymentmethod !== undefined) updateData.paymentmethod = data.paymentmethod;
    if (data.referenceid !== undefined) updateData.referenceid = data.referenceid;
    if (data.referencetype !== undefined) updateData.referencetype = data.referencetype;
    if (data.clientid !== undefined) updateData.clientid = data.clientid;
    if (data.supplierid !== undefined) updateData.supplierid = data.supplierid;
    if (data.installmentnumber !== undefined) updateData.installmentnumber = data.installmentnumber;
    if (data.totalinstallments !== undefined) updateData.totalinstallments = data.totalinstallments;
    const { error } = await supabase.from('financialtransactions').update(updateData).eq('id', id);
    if (error) throw error;
    await loadFinancialTransactions();
  }, [user, loadFinancialTransactions]);

  const deleteFinancialTransaction = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('financialtransactions').delete().eq('id', id);
    if (error) throw error;
    await loadFinancialTransactions();
  }, [user, loadFinancialTransactions]);

  const payTransaction = useCallback(async (id: string, paymentData: PayTransactionData) => {
    ensureUser();
    const { data: transaction, error: fetchError } = await supabase
      .from('financialtransactions')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !transaction) throw new Error('Transação não encontrada');
    const updateData = {
      status: 'paid' as const,
      date: paymentData.paymentdate,
      paymentmethod: paymentData.paymentmethod || transaction.paymentmethod,
      description: paymentData.notes ? `${transaction.description || ''}\n${paymentData.notes}`.trim() : transaction.description
    };
    const { error } = await supabase.from('financialtransactions').update(updateData).eq('id', id);
    if (error) throw error;
    await loadFinancialTransactions();
  }, [user, loadFinancialTransactions]);

  const addCostCenter = useCallback(async (data: Omit<CostCenter, 'id' | 'userid' | 'createdat' | 'updatedat'>) => {
    ensureUser();
    const newCostCenter = {
      ...cleanUndefined(data),
      userid: user!.id,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };
    const { error } = await supabase.from('costcenters').insert([newCostCenter]);
    if (error) throw error;
    await loadCostCenters();
  }, [user, loadCostCenters]);

  const updateCostCenter = useCallback(async (id: string, data: Partial<CostCenter>) => {
    ensureUser();
    const { error } = await supabase
      .from('costcenters')
      .update({ ...cleanUndefined(data), updatedat: new Date().toISOString() })
      .eq('id', id)
      .eq('userid', user!.id);
    if (error) throw error;
    await loadCostCenters();
  }, [user, loadCostCenters]);

  const deleteCostCenter = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('costcenters').delete().eq('id', id).eq('userid', user!.id);
    if (error) throw error;
    await loadCostCenters();
  }, [user, loadCostCenters]);

  const createTransactionsFromSale = useCallback(async (saleId: string, saleData: Sale) => {
    ensureUser();
    const defaultAccount = bankAccounts.find(acc => acc.active) || bankAccounts[0];
    if (!defaultAccount) throw new Error('Configure uma conta bancária antes de registrar transações');
    const client = clients.find(c => c.id === saleData.clientid);
    if (saleData.status === 'completed') {
      const transaction: CreateFinancialTransactionData = {
        type: 'income',
        category: 'Vendas',
        description: `Venda #${saleId.substring(0, 8)} - ${client?.name || 'Cliente'}`,
        amount: saleData.total,
        date: saleData.date,
        duedate: saleData.date,
        paymentdate: saleData.date,
        status: 'paid',
        paymentmethod: (saleData.paymentmethod as any) || 'dinheiro',
        referencetype: 'sale',
        referenceid: saleId,
        clientid: saleData.clientid,
        notes: saleData.notes,
        accountid: defaultAccount.id
      };
      await addFinancialTransaction(transaction);
    }
  }, [user, clients, addFinancialTransaction, bankAccounts]);

  const createTransactionsFromPurchase = useCallback(async (purchaseId: string, purchaseData: Purchase) => {
    ensureUser();
    const defaultAccount = bankAccounts.find(acc => acc.active) || bankAccounts[0];
    if (!defaultAccount) throw new Error('Configure uma conta bancária antes de registrar transações');
    const supplier = suppliers.find(s => s.id === purchaseData.supplierid);
    const paymentInfo = (purchaseData as any).paymentinfo;
    if (!paymentInfo) return;
    const installments = paymentInfo.installments || 1;
    const installmentValue = paymentInfo.installmentvalue || (purchaseData.total / installments);
    const firstDueDate = new Date(paymentInfo.firstduedate || purchaseData.date);
    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      const transaction: CreateFinancialTransactionData = {
        type: 'expense',
        category: 'Compras',
        description: `Compra NF ${purchaseData.invoicenumber || purchaseId.substring(0, 8)} - ${supplier?.name || 'Fornecedor'} - Parcela ${i + 1}/${installments}`,
        amount: installmentValue,
        date: purchaseData.date,
        duedate: dueDate.toISOString().split('T')[0],
        status: paymentInfo.paid ? 'paid' : 'pending',
        paymentdate: paymentInfo.paid ? paymentInfo.paiddate : undefined,
        paymentmethod: paymentInfo.paymentmethod,
        installmentnumber: i + 1,
        totalinstallments: installments,
        referencetype: 'purchase',
        referenceid: purchaseId,
        referencenumber: purchaseData.invoicenumber,
        supplierid: purchaseData.supplierid,
        notes: purchaseData.notes,
        accountid: defaultAccount.id
      };
      await addFinancialTransaction(transaction);
    }
    if (paymentInfo.hasshipping && paymentInfo.shippingcost > 0) {
      const shippingTransaction: CreateFinancialTransactionData = {
        type: 'expense',
        category: 'Frete',
        description: `Frete - Compra NF ${purchaseData.invoicenumber || purchaseId.substring(0, 8)} - ${paymentInfo.shippingtype || 'Entrega'}`,
        amount: paymentInfo.shippingcost,
        date: purchaseData.date,
        duedate: paymentInfo.firstduedate || purchaseData.date,
        status: paymentInfo.paid ? 'paid' : 'pending',
        paymentdate: paymentInfo.paid ? paymentInfo.paiddate : undefined,
        paymentmethod: paymentInfo.paymentmethod,
        referencetype: 'purchase',
        referenceid: purchaseId,
        supplierid: purchaseData.supplierid,
        accountid: defaultAccount.id
      };
      await addFinancialTransaction(shippingTransaction);
    }
  }, [user, suppliers, addFinancialTransaction, bankAccounts]);

  const createTransactionsFromProject = useCallback(async (projectId: string, projectData: any) => {
    if (projectData.type !== 'venda') return;
    const client = clients.find(c => c.id === projectData.clientid);
    const { paymentterms } = projectData;
    if (!paymentterms) return;
    const defaultAccount = bankAccounts.find(acc => acc.active) || bankAccounts[0];
    if (!defaultAccount) {
      console.error('❌ Nenhuma conta bancária ativa encontrada');
      return;
    }
    try {
      for (let i = 0; i < paymentterms.installments; i++) {
        const dueDate = new Date(projectData.startdate);
        dueDate.setMonth(dueDate.getMonth() + i);
        const transaction: CreateFinancialTransactionData = {
          type: 'income',
          category: 'Vendas',
          description: `${projectData.ordernumber || 'Venda'} - ${client?.name || 'Cliente'} - Parcela ${i + 1}/${paymentterms.installments}`,
          amount: paymentterms.installmentvalue || 0,
          date: projectData.startdate,
          duedate: dueDate.toISOString().split('T')[0],
          status: 'pending',
          paymentmethod: paymentterms.paymentmethod,
          referencetype: 'project',
          referenceid: projectId,
          clientid: projectData.clientid,
          accountid: defaultAccount.id,
          installmentnumber: i + 1,
          totalinstallments: paymentterms.installments
        };
        await addFinancialTransaction(transaction);
      }
      console.log(`✅ ${paymentterms.installments} transações financeiras criadas para venda ${projectData.ordernumber}`);
    } catch (error) {
      console.error('❌ Erro ao criar transações financeiras:', error);
      throw error;
    }
  }, [clients, bankAccounts, addFinancialTransaction]);

  const addStockMovement = useCallback(async (data: Omit<StockMovement, 'id' | 'userid' | 'createdat'>) => {
    ensureUser();
    const product = products.find(p => p.id === data.productid);
    if (!product) throw new Error(`Produto não encontrado`);
    const newStock = data.movementtype === 'entrada' ? product.currentstock + data.quantity : product.currentstock - data.quantity;
    if (newStock < 0) throw new Error(`Estoque insuficiente`);
    const movementData = { ...data, userid: user!.id, createdat: new Date().toISOString() };
    const { error } = await supabase.from('stockmovements').insert([movementData]);
    if (error) throw error;
    await updateProduct({ ...product, currentstock: newStock });
    await loadStockMovements();
  }, [user, products, updateProduct, loadStockMovements]);

  const processProjectStockMovement = useCallback(async (projectId: string, products: ProjectProduct[]) => {
    ensureUser();
    if (!products || products.length === 0) return;
    const movementPromises = products.map(item =>
      addStockMovement({
        productid: item.productid!,
        productname: item.productname,
        movementtype: 'saida',
        quantity: item.quantity,
        unitprice: item.unitprice,
        totalvalue: item.totalprice,
        projectid: projectId,
        referencetype: 'project',
        date: new Date().toISOString(),
        notes: `Saída para projeto`
      })
    );
    await Promise.all(movementPromises);
  }, [addStockMovement]);

  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'userid' | 'createdat'>) => {
    ensureUser();
    const newTransaction = { ...data, userid: user!.id, createdat: new Date().toISOString() };
    const { error } = await supabase.from('transactions').insert([newTransaction]);
    if (error) throw error;
    await loadTransactions();
  }, [user, loadTransactions]);

  const addSale = useCallback(async (sale: Omit<Sale, 'id' | 'userid' | 'createdat' | 'updatedat'>) => {
    ensureUser();
    const newSale = {
      date: sale.date,
      clientid: sale.clientid,
      total: sale.total,
      status: sale.status,
      paymentmethod: sale.paymentmethod,
      notes: sale.notes,
      userid: user!.id,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };
    const { data: insertedSale, error: saleError } = await supabase
      .from('sales')
      .insert([newSale])
      .select()
      .single();
    if (saleError) throw saleError;
    if (sale.items && sale.items.length > 0) {
      const saleItems = sale.items
        .map(item => ({
          saleid: insertedSale.id,
          productid: item.productid,
          productname: item.productname,
          quantity: item.quantity,
          unitprice: item.unitprice,
          total: item.total
        }))
        .filter(item => item.quantity > 0);
      const { error: itemsError } = await supabase.from('saleitems').insert(saleItems);
      if (itemsError) throw itemsError;
    }
    if (sale.items && sale.status === 'completed') await processProjectStockMovement(insertedSale.id, sale.items);
    if (sale.status === 'completed')
      await addTransaction({
        type: 'entrada',
        category: 'venda',
        description: `Venda`,
        amount: sale.total,
        date: sale.date
      });
    await refreshData();
  }, [user, processProjectStockMovement, addTransaction, refreshData]);

  const updateSale = useCallback(async (id: string, sale: Partial<Sale>) => {
    ensureUser();
    const { error } = await supabase
      .from('sales')
      .update({ ...sale, updatedat: new Date().toISOString() })
      .eq('id', id)
      .eq('userid', user!.id);
    if (error) throw error;
    await loadSales();
  }, [user, loadSales]);

  const deleteSale = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('sales').delete().eq('id', id).eq('userid', user!.id);
    if (error) throw error;
    await loadSales();
  }, [user, loadSales]);

  const addPurchase = useCallback(async (purchase: Omit<Purchase, 'id' | 'userid' | 'createdat' | 'updatedat'>) => {
    ensureUser();
    const newPurchase = {
      date: purchase.date,
      supplierid: purchase.supplierid,
      total: purchase.total,
      status: purchase.status,
      invoicenumber: purchase.invoicenumber,
      notes: purchase.notes,
      userid: user!.id,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };
    const { data: insertedPurchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert([newPurchase])
      .select()
      .single();
    if (purchaseError) throw purchaseError;
    if (purchase.items && purchase.items.length > 0) {
      const purchaseItems = purchase.items
        .map(item => ({
          purchaseid: insertedPurchase.id,
          productid: item.productid,
          productname: item.productname,
          quantity: item.quantity,
          unitcost: item.unitcost,
          total: item.total
        }))
        .filter(item => item.quantity > 0);
      const { error: itemsError } = await supabase.from('purchaseitems').insert(purchaseItems);
      if (itemsError) throw itemsError;
    }
    if (purchase.status === 'received') {
      const movements =
        purchase.items?.map(item =>
          addStockMovement({
            productid: item.productid,
            productname: item.productname,
            movementtype: 'entrada',
            quantity: item.quantity,
            unitprice: item.unitcost,
            totalvalue: item.total,
            referencetype: 'manual',
            date: purchase.date,
            notes: `Compra`
          })
        ) || [];
      await Promise.all(movements);
      await addTransaction({
        type: 'saida',
        category: 'compra',
        description: `Compra`,
        amount: purchase.total,
        date: purchase.date
      });
    }
    if (insertedPurchase && insertedPurchase.id)
      await createTransactionsFromPurchase(insertedPurchase.id, purchase as Purchase);
    await refreshData();
  }, [user, addStockMovement, addTransaction, refreshData, createTransactionsFromPurchase]);

  const updatePurchase = useCallback(async (id: string, purchase: Partial<Purchase>) => {
    ensureUser();
    const { error } = await supabase
      .from('purchases')
      .update({ ...purchase, updatedat: new Date().toISOString() })
      .eq('id', id)
      .eq('userid', user!.id);
    if (error) throw error;
    await loadPurchases();
  }, [user, loadPurchases]);

  const deletePurchase = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('purchases').delete().eq('id', id).eq('userid', user!.id);
    if (error) throw error;
    await loadPurchases();
  }, [user, loadPurchases]);

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'createdat' | 'updatedat'>) => {
    ensureUser();
    const newSupplier = { ...supplier, userid: user!.id, createdat: new Date().toISOString(), updatedat: new Date().toISOString() };
    const { error } = await supabase.from('suppliers').insert([newSupplier]);
    if (error) throw error;
    await loadSuppliers();
  }, [user, loadSuppliers]);

  const updateSupplier = useCallback(async (id: string, supplier: Partial<Supplier>) => {
    ensureUser();
    const { error } = await supabase
      .from('suppliers')
      .update({ ...supplier, updatedat: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await loadSuppliers();
  }, [user, loadSuppliers]);

  const deleteSupplier = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    await loadSuppliers();
  }, [user, loadSuppliers]);

  const addProject = useCallback(async (data: Omit<Project, 'id' | 'ordernumber' | 'number' | 'userid' | 'createdat' | 'updatedat'>): Promise<any> => {
    ensureUser();
    if (!data.description || data.description.trim() === '') throw new Error('Descrição é obrigatória');
    if (!data.clientid) throw new Error('Cliente é obrigatório');
    if (!data.products || data.products.length === 0) throw new Error('Adicione pelo menos um produto ou serviço');
    const deliveryDeadlineDays = data.deliverydeadlinedays || 15;
    const startDate = new Date(data.startdate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + deliveryDeadlineDays);
    const newProject = {
      clientid: data.clientid,
      description: data.description.trim(),
      status: data.status,
      type: data.type,
      budget: data.budget,
      startdate: data.startdate,
      enddate: data.enddate || endDate.toISOString().split('T')[0],
      deliverydeadlinedays: deliveryDeadlineDays,
      materialscost: data.materialscost,
      laborcost: data.laborcost,
      profitmargin: data.profitmargin,
      paymentterms: data.paymentterms,
      number: 0,
      userid: user!.id,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };
    const { data: insertedProject, error } = await supabase
      .from('projects')
      .insert([cleanUndefined(newProject)])
      .select()
      .single();
    if (error) throw error;
    if (data.products && data.products.length > 0) {
      const projectProducts = data.products
        .map(p => {
          if (p.itemtype === 'servico') {
            if (!p.servicehours || p.servicehours <= 0) throw new Error(`Serviço precisa ter horas`);
            if (!p.hourlyrate || p.hourlyrate <= 0) throw new Error(`Serviço precisa ter valor por hora`);
          }
          return {
            projectid: insertedProject.id,
            productid: p.productid || null,
            productname: p.productname,
            quantity: p.quantity,
            unitprice: p.unitprice,
            totalprice: p.totalprice,
            itemtype: p.itemtype || 'produto',
            itemdescription: p.itemdescription,
            servicehours: p.itemtype === 'servico' ? p.servicehours : null,
            hourlyrate: p.itemtype === 'servico' ? p.hourlyrate : null,
            userid: user!.id
          };
        })
        .filter(p => p.quantity > 0);
      if (projectProducts.length > 0) {
        const { error: prodError } = await supabase.from('projectproducts').insert(projectProducts).select();
        if (prodError) {
          alert(`Erro ao salvar produtos: ${prodError.message}`);
          throw prodError;
        }
      }
    }
    if (insertedProject && insertedProject.id && data.type === 'venda') {
      try {
        await createTransactionsFromProject(insertedProject.id, {
          ...data,
          id: insertedProject.id,
          ordernumber: insertedProject.ordernumber
        } as Project);
      } catch (error) {
        console.error('Erro ao criar transações:', error);
      }
    }
    await loadProjects();
    return insertedProject;
  }, [user, loadProjects, createTransactionsFromProject]);

  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    ensureUser();
    if (data.deliverydeadlinedays && data.startdate) {
      const startDate = new Date(data.startdate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + data.deliverydeadlinedays);
      data.enddate = endDate.toISOString().split('T')[0];
    }
    const { error } = await supabase
      .from('projects')
      .update({ ...cleanUndefined(data), updatedat: new Date().toISOString() })
      .eq('id', id)
      .eq('userid', user!.id);
    if (error) throw error;
    if (data.products !== undefined) {
      const { error: deleteError } = await supabase.from('projectproducts').delete().eq('projectid', id);
      if (deleteError) throw deleteError;
      if (data.products && data.products.length > 0) {
        const projectProducts = data.products
          .map(p => {
            if (p.itemtype === 'servico') {
              if (!p.servicehours || p.servicehours <= 0) throw new Error(`Serviço precisa ter horas`);
              if (!p.hourlyrate || p.hourlyrate <= 0) throw new Error(`Serviço precisa ter valor por hora`);
            }
            return {
              projectid: id,
              productid: p.productid || null,
              productname: p.productname || 'Produto sem nome',
              quantity: Number(p.quantity) || 1,
              unitprice: Number(p.unitprice) || 0,
              totalprice: Number(p.totalprice) || 0,
              itemtype: p.itemtype || 'produto',
              itemdescription: p.itemdescription || '',
              servicehours: p.itemtype === 'servico' ? Number(p.servicehours) : null,
              hourlyrate: p.itemtype === 'servico' ? Number(p.hourlyrate) : null,
              userid: user!.id
            };
          })
          .filter(p => p.quantity > 0);
        if (projectProducts.length > 0) {
          const { error: prodError } = await supabase.from('projectproducts').insert(projectProducts).select();
          if (prodError) {
            alert(`Erro ao salvar produtos: ${prodError.message}`);
            throw prodError;
          }
        }
      }
    }
    await loadProjects();
  }, [user, loadProjects]);

  const deleteProject = useCallback(async (id: string) => {
    ensureUser();
    const { error } = await supabase.from('projects').delete().eq('id', id).eq('userid', user!.id);
    if (error) throw error;
    await loadProjects();
  }, [user, loadProjects]);

  const getTransactionsByPeriod = useCallback(
    (startDate: string, endDate: string) => {
      return financialTransactions.filter(t => t.date >= startDate && t.date <= endDate);
    },
    [financialTransactions]
  );

  const getOverdueTransactions = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return financialTransactions.filter(t => t.status === 'pending' && t.duedate < today);
  }, [financialTransactions]);

  const getFinancialSummary = useCallback(
    (startDate: string, endDate: string) => {
      const transactions = getTransactionsByPeriod(startDate, endDate);
      const totalIncome = transactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
      const pendingIncome = transactions.filter(t => t.type === 'income' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
      const pendingExpense = transactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
      return { totalIncome, totalExpense, balance: totalIncome - totalExpense, pendingIncome, pendingExpense };
    },
    [getTransactionsByPeriod]
  );

  const getCashFlow = useCallback(
    (months: number) => {
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
    },
    [financialTransactions]
  );

  const getExpensesByCategory = useCallback(
    (startDate: string, endDate: string) => {
      const transactions = getTransactionsByPeriod(startDate, endDate).filter(t => t.type === 'expense');
      const total = transactions.reduce((sum, t) => sum + t.amount, 0);
      const byCategory: { [key: string]: number } = {};
      transactions.forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      });
      return Object.entries(byCategory).map(([category, amount]) => ({
        category,
        total: amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      }));
    },
    [getTransactionsByPeriod]
  );

  const calculateProductCost = useCallback(
    async (productId: string): Promise<number> => {
      const visited = new Set<string>();
      const calculate = async (id: string): Promise<number> => {
        if (visited.has(id)) return 0;
        visited.add(id);
        const product = products.find(p => p.id === id);
        if (!product) return 0;
        if (product.type === 'materialbruto') return product.costprice;
        let total = 0;
        for (const comp of product.components) {
          const componentCost = await calculate(comp.componentid);
          total += componentCost * comp.quantity;
        }
        return total;
      };
      return await calculate(productId);
    },
    [products]
  );

  const getAvailableComponents = useCallback(() => validateArray(products), [products]);

  const getDashboardStats = useCallback(() => {
    const totalClients = clients.length;
    const activeProjects = projects.filter(p => ['emproducao', 'aprovado'].includes(p.status || '')).length;
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthlySalesRevenue = (sales || [])
      .filter(s => {
        const saleDate = new Date(s.date);
        return s.status === 'completed' && saleDate >= firstDayOfMonth && saleDate <= lastDayOfMonth;
      })
      .reduce((sum, s) => sum + (s.total || 0), 0);
    const monthlyTransactionRevenue = (transactions || [])
      .filter(t => {
        const transDate = new Date(t.date);
        return t.type === 'entrada' && transDate >= firstDayOfMonth && transDate <= lastDayOfMonth;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const monthlyRevenue = monthlySalesRevenue + monthlyTransactionRevenue;
    const pendingSales = (sales || []).filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.total || 0), 0);
    const pendingProjects = (projects || [])
      .filter(p => ['concluido', 'entregue'].includes(p.status || ''))
      .reduce((sum, p) => sum + ((p.budget || 0) * 0.5), 0);
    const pendingPayments = pendingSales + pendingProjects;
    const lowStockItems = (products || []).filter(p => p.currentstock <= p.minstock).length;
    const recentActivity = [
      ...(projects || []).slice(-3).map(p => ({ type: 'project', message: `Novo projeto ${p.ordernumber}`, date: p.createdat })),
      ...(sales || []).slice(-3).map(s => ({ type: 'sale', message: `Venda R$ ${s.total}`, date: s.createdat })),
      ...(purchases || []).slice(-3).map(p => ({ type: 'purchase', message: `Compra R$ ${p.total}`, date: p.createdat }))
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    return { totalClients, activeProjects, monthlyRevenue, pendingPayments, lowStockItems, recentActivity };
  }, [clients, projects, sales, purchases, transactions, products]);

  const debugProject = useCallback(
    async (projectId: string) => {
      if (!user) return {};
      const { data, error } = await supabase.from('projects').select('*, products:projectproducts(*)').eq('id', projectId).single();
      if (error) throw error;
      return data;
    },
    [user]
  );

  const reloadProject = useCallback(
    async (projectId: string) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:clients(name), products:projectproducts(*)')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },
    [user]
  );

  return (
    <AppContext.Provider
      value={{
        clients,
        projects,
        transactions,
        products,
        stockMovements,
        sales,
        purchases,
        suppliers,
        categories,
        financialTransactions,
        bankAccounts,
        costCenters,
        loading,
        error,
        addClient,
        updateClient,
        deleteClient,
        addProject,
        updateProject,
        deleteProject,
        addTransaction,
        addFinancialTransaction,
        updateFinancialTransaction,
        deleteFinancialTransaction,
        payTransaction,
        getTransactionsByPeriod,
        getOverdueTransactions,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        updateBankAccountBalance,
        addCostCenter,
        updateCostCenter,
        deleteCostCenter,
        addProduct,
        updateProduct,
        deleteProduct,
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
        refreshData,
        createTransactionsFromSale,
        createTransactionsFromPurchase,
        createTransactionsFromProject,
        getFinancialSummary,
        getCashFlow,
        getExpensesByCategory,
        reloadProject,
        debugProject
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          <p className="ml-4 text-gray-600">Carregando dados...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <button onClick={refreshData} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">
            Tentar novamente
          </button>
        </div>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
};

export default AppProvider;
