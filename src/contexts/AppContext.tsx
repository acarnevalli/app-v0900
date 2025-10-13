import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ReactNode } from 'react'
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from 'uuid';
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, handleAuthError } from '../lib/supabase-client'

// ---------------------------------------------------------------
// Funções de auth
// ---------------------------------------------------------------

const AppContext = createContext({})

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUser()
    fetchProducts()
    
    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token renovado com sucesso')
        }
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProducts([])
        }
        if (session) {
          setUser(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        await handleAuthError(error)
        return
      }
      
      if (session?.user) {
        setUser(session.user)
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erro ao buscar produtos:', error)
        
        // Se for erro de autenticação, trata especificamente
        if (error.message?.includes('JWT')) {
          await handleAuthError(error)
          return
        }
        
        setError('Erro ao carregar produtos. Tente novamente mais tarde.')
        return
      }
      
      setProducts(data || [])
    } catch (error) {
      console.error('Erro inesperado:', error)
      setError('Erro ao conectar com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppContext.Provider value={{ 
      products, 
      loading, 
      error, 
      user, 
      fetchProducts,
      checkUser 
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider')
  }
  return context
}

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

// ---------------------------------------------------------------
// Interfaces originais
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

export interface ProjectProduct {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Project {
  id: string;
  number: number;
  client_id: string;
  client_name?: string;
  title: string;
  description: string;
  status: "orcamento" | "aprovado" | "em_producao" | "concluido" | "entregue";
  type: "orcamento" | "venda";
  products: ProjectProduct[];
  budget: number;
  start_date: string;
  end_date: string;
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

// ---------------------------------------------------------------
// NOVAS INTERFACES PARA VENDAS E COMPRAS
// ---------------------------------------------------------------

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
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------
// Contexto
// ---------------------------------------------------------------

interface AppContextType {
  // Estados existentes
  clients: Client[];
  projects: Project[];
  transactions: Transaction[];
  products: Product[];
  stockMovements: StockMovement[];
  loading: boolean;
  error: string | null;

  // NOVOS estados
  sales: Sale[];
  purchases: Purchase[];
  suppliers: Supplier[];

  // Métodos existentes
  addClient: (data: Omit<Client, "id" | "created_at" | "updated_at" | "user_id">) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addProject: (data: Omit<Project, "id" | "created_at" | "updated_at" | "number" | "user_id">) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addTransaction: (data: Omit<Transaction, "id" | "created_at" | "user_id">) => Promise<void>;

  addProduct: (data: Omit<Product, "id" | "created_at" | "updated_at" | "user_id">) => Promise<void>;
  updateProduct: (data: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addStockMovement: (data: Omit<StockMovement, "id" | "created_at" | "user_id">) => Promise<void>;
  processProjectStockMovement: (projectId: string, products: ProjectProduct[]) => Promise<void>;

  // NOVOS métodos
  addSale: (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  addPurchase: (purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  // Métodos auxiliares
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
}

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

  // Estados existentes
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NOVOS estados
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // ---------------------------------------------------------------
  // Função auxiliar segura
  // ---------------------------------------------------------------

  const safeLoad = async (fn: () => Promise<void>, name: string) => {
    try {
      await fn();
    } catch (err: any) {
      console.error(`[AppContext] ❌ Falha ao carregar ${name}:`, err);
      setError(`Erro ao carregar ${name}`);
    }
  };

  // ---------------------------------------------------------------
  // Loaders principais (existentes)
  // ---------------------------------------------------------------

  const loadClients = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("clients").select("*").eq("user_id", user.id);
    if (error) throw error;
    setClients(data || []);
  };

  const loadProducts = async () => {
    if (!user) return;
    const { data: productsData, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id);
    if (prodErr) throw prodErr;

    const { data: componentsData, error: compErr } = await supabase
      .from("product_components")
      .select(`*, component:products!product_components_component_id_fkey(id, name, unit, cost_price)`)
      .eq("user_id", user.id);
    if (compErr) throw compErr;

    const merged = (productsData || []).map((p) => ({
      ...p,
      components: (componentsData || [])
        .filter((c: any) => c.product_id === p.id)
        .map((c: any) => ({
          id: c.id,
          product_id: c.component_id,
          component_id: c.component_id,
          product_name: c.component?.name || "",
          quantity: c.quantity,
          unit: c.component?.unit || "",
          unit_cost: c.component?.cost_price || 0,
          total_cost: (c.component?.cost_price || 0) * c.quantity,
        })),
    }));

    setProducts(merged);
  };

  const loadProjects = async () => {
    if (!user) return;
    const { data: projectsData, error: projErr } = await supabase
      .from("projects")
      .select("*, client:clients(name)")
      .eq("user_id", user.id);
    if (projErr) throw projErr;

    const { data: projProds, error: projProdErr } = await supabase
      .from("project_products")
      .select("*, product:products(name)")
      .eq("user_id", user.id);
    if (projProdErr) throw projProdErr;

    const merged = (projectsData || []).map((p: any) => ({
      ...p,
      client_name: p.client?.name,
      products: (projProds || [])
        .filter((pp: any) => pp.project_id === p.id)
        .map((pp: any) => ({
          id: pp.id,
          product_id: pp.product_id,
          product_name: pp.product?.name || "",
          quantity: pp.quantity,
          unit_price: pp.unit_price,
          total_price: pp.total_price,
        })),
    }));
    setProjects(merged);
  };

  const loadTransactions = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("transactions")
      .select("*, project:projects(title)")
      .eq("user_id", user.id);
    if (error) throw error;
    const mapped = (data || []).map((t: any) => ({ ...t, project_title: t.project?.title }));
    setTransactions(mapped);
  };

  const loadStockMovements = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*, product:products(name), project:projects(title)")
      .eq("user_id", user.id);
    if (error) throw error;
    const mapped = (data || []).map((m: any) => ({
      ...m,
      product_name: m.product?.name,
      project_title: m.project?.title,
    }));
    setStockMovements(mapped);
  };

  // ---------------------------------------------------------------
  // NOVOS Loaders para Vendas e Compras
  // ---------------------------------------------------------------

  const loadSuppliers = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order('name');
    if (error) throw error;
    setSuppliers(data || []);
  };

  const loadSales = async () => {
  if (!user) return;
  try {
    const { data: salesData, error: salesErr } = await supabase
      .from("sales")
      .select("*, client:clients(name)")
      .eq("user_id", user.id)
      .order('date', { ascending: false });
    
    if (salesErr) {
      console.error('[AppContext] Erro ao buscar sales:', salesErr);
      throw salesErr;
    }

    const { data: saleItems, error: itemsErr } = await supabase
      .from("sale_items")
      .select("*, product:products(name)");
    
    if (itemsErr) {
      console.error('[AppContext] Erro ao buscar sale_items:', itemsErr);
      // Se a tabela não existir, continua sem items
      setSales(salesData?.map((sale: any) => ({ 
        ...sale,
        client_name: sale.client?.name,
        items: [] 
      })) || []);
      return;
    }

    const merged = (salesData || []).map((sale: any) => ({
      ...sale,
      client_name: sale.client?.name,
      items: (saleItems || [])
        .filter((item: any) => item.sale_id === sale.id)
        .map((item: any) => ({
          id: item.id,
          sale_id: item.sale_id,
          product_id: item.product_id,
          product_name: item.product?.name || "",
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })),
    }));
    setSales(merged);
  } catch (error) {
    console.error('[AppContext] Erro em loadSales:', error);
    setSales([]); // Define array vazio em caso de erro
  }
};

  const loadPurchases = async () => {
  if (!user) return;
  try {
    const { data: purchasesData, error: purchasesErr } = await supabase
      .from("purchases")
      .select("*, supplier:suppliers(name)")
      .eq("user_id", user.id)
      .order('date', { ascending: false });
    
    if (purchasesErr) {
      console.error('[AppContext] Erro ao buscar purchases:', purchasesErr);
      throw purchasesErr;
    }

    const { data: purchaseItems, error: itemsErr } = await supabase
      .from("purchase_items")
      .select("*, product:products(name)");
    
    if (itemsErr) {
      console.error('[AppContext] Erro ao buscar purchase_items:', itemsErr);
      // Se a tabela não existir, continua sem items
      setPurchases(purchasesData?.map((purchase: any) => ({ 
        ...purchase,
        supplier_name: purchase.supplier?.name,
        items: [] 
      })) || []);
      return;
    }

    const merged = (purchasesData || []).map((purchase: any) => ({
      ...purchase,
      supplier_name: purchase.supplier?.name,
      items: (purchaseItems || [])
        .filter((item: any) => item.purchase_id === purchase.id)
        .map((item: any) => ({
          id: item.id,
          purchase_id: item.purchase_id,
          product_id: item.product_id,
          product_name: item.product?.name || "",
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total: item.total,
        })),
    }));
    setPurchases(merged);
  } catch (error) {
    console.error('[AppContext] Erro em loadPurchases:', error);
    setPurchases([]); // Define array vazio em caso de erro
  }
};
  
  // ---------------------------------------------------------------
  // Refresh principal (sincroniza tudo)
  // ---------------------------------------------------------------

  const refreshData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    console.log(`[AppContext] 🔄 Atualizando dados para usuário ${user.id}`);

    await Promise.all([
      safeLoad(loadClients, "Clientes"),
      safeLoad(loadProducts, "Produtos"),
      safeLoad(loadProjects, "Projetos"),
      safeLoad(loadTransactions, "Transações"),
      safeLoad(loadStockMovements, "Movimentações de estoque"),
      safeLoad(loadSuppliers, "Fornecedores"),
      safeLoad(loadSales, "Vendas"),
      safeLoad(loadPurchases, "Compras"),
    ]);

    setLoading(false);
  };

  // ---------------------------------------------------------------
  // Inicialização
  // ---------------------------------------------------------------

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && user) {
      refreshData();
    } else {
      setClients([]);
      setProjects([]);
      setTransactions([]);
      setProducts([]);
      setStockMovements([]);
      setSales([]);
      setPurchases([]);
      setSuppliers([]);
      setLoading(false);
      setError(null);
    }
  }, [user, isAuthenticated, authLoading]);

  // ---------------------------------------------------------------
  // CRUD de Clientes
  // ---------------------------------------------------------------

  const addClient = async (data: Omit<Client, "id" | "created_at" | "updated_at" | "user_id">) => {
    if (!user) return;
    const newClient = {
      ...data,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { error } = await supabase.from("clients").insert([newClient]);
    if (error) throw error;
    await loadClients();
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    if (!user) return;
    const { error } = await supabase
      .from("clients")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await loadClients();
  };

  const deleteClient = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await loadClients();
  };

  // ---------------------------------------------------------------
  // CRUD de Projetos
  // ---------------------------------------------------------------

  const addProject = async (data: Omit<Project, "id" | "created_at" | "updated_at" | "number" | "user_id">) => {
    if (!user) return;
    
    // Gerar próximo número
    const maxNumber = projects.reduce((max, p) => Math.max(max, p.number), 0);
    
    const newProject = {
      ...data,
      number: maxNumber + 1,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: insertedProject, error } = await supabase
      .from("projects")
      .insert([newProject])
      .select()
      .single();
    
    if (error) throw error;
    
    // Inserir produtos do projeto
    if (data.products && data.products.length > 0) {
      const projectProducts = data.products.map(p => ({
        project_id: insertedProject.id,
        product_id: p.product_id,
        quantity: p.quantity,
        unit_price: p.unit_price,
        total_price: p.total_price,
        user_id: user.id,
      }));
      
      const { error: prodError } = await supabase
        .from("project_products")
        .insert(projectProducts);
      
      if (prodError) throw prodError;
    }
    
    await loadProjects();
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    if (!user) return;
    const { error } = await supabase
      .from("projects")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await loadProjects();
  };

  const deleteProject = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await loadProjects();
  };

  // ---------------------------------------------------------------
  // CRUD de Produtos
  // ---------------------------------------------------------------

  const addProduct = async (data: Omit<Product, "id" | "created_at" | "updated_at" | "user_id">) => {
    if (!user) return;
    const newProduct = {
      ...data,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: insertedProduct, error } = await supabase
      .from("products")
      .insert([newProduct])
      .select()
      .single();
    
    if (error) throw error;
    
    // Inserir componentes se houver
    if (data.components && data.components.length > 0) {
      const components = data.components.map(c => ({
        product_id: insertedProduct.id,
        component_id: c.component_id,
        quantity: c.quantity,
        user_id: user.id,
      }));
      
      const { error: compError } = await supabase
        .from("product_components")
        .insert(components);
      
      if (compError) throw compError;
    }
    
    await loadProducts();
  };

  const updateProduct = async (data: Product) => {
    if (!user) return;
    const { error } = await supabase
      .from("products")
      .update({ 
        ...data, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", data.id)
      .eq("user_id", user.id);
    if (error) throw error;
    await loadProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await loadProducts();
  };

  // ---------------------------------------------------------------
  // Transações e Estoque
  // ---------------------------------------------------------------

  const addTransaction = async (data: Omit<Transaction, "id" | "created_at" | "user_id">) => {
    if (!user) return;
    const newTransaction = {
      ...data,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    
    const { error } = await supabase.from("transactions").insert([newTransaction]);
    if (error) throw error;
    await loadTransactions();
  };

  const addStockMovement = async (data: Omit<StockMovement, "id" | "created_at" | "user_id">) => {
    if (!user) return;
    const newMovement = {
      ...data,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    
    const { error } = await supabase.from("stock_movements").insert([newMovement]);
    if (error) throw error;
    
    // Atualizar estoque do produto
    const product = products.find(p => p.id === data.product_id);
    if (product) {
      const newStock = data.movement_type === 'entrada' 
        ? product.current_stock + data.quantity
        : product.current_stock - data.quantity;
      
      await updateProduct({
        ...product,
        current_stock: Math.max(0, newStock),
      });
    }
    
    await loadStockMovements();
  };

  const processProjectStockMovement = async (projectId: string, products: ProjectProduct[]) => {
    for (const item of products) {
      await addStockMovement({
        product_id: item.product_id,
        product_name: item.product_name,
        movement_type: 'saida',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_value: item.total_price,
        project_id: projectId,
        reference_type: 'project',
        date: new Date().toISOString(),
        notes: `Saída para projeto #${projectId}`,
      });
    }
  };

  // ---------------------------------------------------------------
  // NOVOS MÉTODOS - Vendas
  // ---------------------------------------------------------------

  const addSale = async (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;
    
    const newSale = {
      date: sale.date,
      client_id: sale.client_id,
      total: sale.total,
      status: sale.status,
      payment_method: sale.payment_method,
      notes: sale.notes,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedSale, error } = await supabase
      .from('sales')
      .insert([newSale])
      .select()
      .single();

    if (error) throw error;

    // Inserir itens da venda
    if (sale.items && sale.items.length > 0) {
      const saleItems = sale.items.map(item => ({
        sale_id: insertedSale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;
    }

    // Atualizar estoque (diminuir quantidade)
    for (const item of sale.items) {
      await addStockMovement({
        product_id: item.product_id,
        product_name: item.product_name,
        movement_type: 'saida',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_value: item.total,
        reference_type: 'manual',
        date: sale.date,
        notes: `Venda #${insertedSale.id}`,
      });
    }

    // Criar transação financeira
    if (sale.status === 'completed') {
      await addTransaction({
        type: 'entrada',
        category: 'venda',
        description: `Venda para cliente`,
        amount: sale.total,
        date: sale.date,
      });
    }

    await refreshData();
  };

  const updateSale = async (id: string, sale: Partial<Sale>) => {
    if (!user) return;
    const { error } = await supabase
      .from('sales')
      .update({ ...sale, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    await loadSales();
  };

  const deleteSale = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    await loadSales();
  };

  // ---------------------------------------------------------------
  // NOVOS MÉTODOS - Compras
  // ---------------------------------------------------------------

  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;
    
    const newPurchase = {
      date: purchase.date,
      supplier_id: purchase.supplier_id,
      total: purchase.total,
      status: purchase.status,
      invoice_number: purchase.invoice_number,
      notes: purchase.notes,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedPurchase, error } = await supabase
      .from('purchases')
      .insert([newPurchase])
      .select()
      .single();

    if (error) throw error;

    // Inserir itens da compra
    if (purchase.items && purchase.items.length > 0) {
      const purchaseItems = purchase.items.map(item => ({
        purchase_id: insertedPurchase.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems);

      if (itemsError) throw itemsError;
    }

    // Atualizar estoque (aumentar quantidade) se compra foi recebida
    if (purchase.status === 'received') {
      for (const item of purchase.items) {
        await addStockMovement({
          product_id: item.product_id,
          product_name: item.product_name,
          movement_type: 'entrada',
          quantity: item.quantity,
          unit_price: item.unit_cost,
          total_value: item.total,
          reference_type: 'manual',
          date: purchase.date,
          notes: `Compra #${insertedPurchase.id}`,
        });
      }
    }

    // Criar transação financeira
    await addTransaction({
      type: 'saida',
      category: 'compra',
      description: `Compra de fornecedor`,
      amount: purchase.total,
      date: purchase.date,
    });

    await refreshData();
  };

  const updatePurchase = async (id: string, purchase: Partial<Purchase>) => {
    if (!user) return;
    const { error } = await supabase
      .from('purchases')
      .update({ ...purchase, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    await loadPurchases();
  };

  const deletePurchase = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    await loadPurchases();
  };

  // ---------------------------------------------------------------
  // NOVOS MÉTODOS - Fornecedores
  // ---------------------------------------------------------------

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    const newSupplier = {
      ...supplier,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('suppliers').insert([newSupplier]);
    if (error) throw error;
    await loadSuppliers();
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    const { error } = await supabase
      .from('suppliers')
      .update({ ...supplier, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await loadSuppliers();
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await loadSuppliers();
  };

  // ---------------------------------------------------------------
  // Métodos auxiliares
  // ---------------------------------------------------------------

  const calculateProductCost = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return 0;

    if (product.type === "material_bruto") return product.cost_price;

    let total = 0;
    for (const comp of product.components)
      total += (await calculateProductCost(comp.component_id)) * comp.quantity;
    return total;
  };

  const getAvailableComponents = () => products;

  const getDashboardStats = () => {
    const totalClients = clients?.length || 0;
    const activeProjects = projects?.filter((p) => ["em_producao", "aprovado"].includes(p.status || ""))?.length || 0;
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Receitas do mês (vendas + transações de entrada)
    const monthlySalesRevenue = sales
      .filter(s => {
        const saleDate = new Date(s.date);
        return s.status === 'completed' && 
               saleDate >= firstDayOfMonth && 
               saleDate <= lastDayOfMonth;
      })
      .reduce((sum, s) => sum + s.total, 0);

    const monthlyTransactionRevenue = transactions
      .filter(t => {
        const transDate = new Date(t.date);
        return t.type === "entrada" && 
               transDate >= firstDayOfMonth && 
               transDate <= lastDayOfMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyRevenue = monthlySalesRevenue + monthlyTransactionRevenue;

    // Pagamentos pendentes (vendas pendentes)
    const pendingSales = sales
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + s.total, 0);

    const pendingProjects = projects
      .filter(p => ["concluido", "entregue"].includes(p.status))
      .reduce((sum, p) => sum + p.budget * 0.5, 0);

    const pendingPayments = pendingSales + pendingProjects;

    // Itens com estoque baixo
    const lowStockItems = products?.filter((p) => p.current_stock <= p.min_stock)?.length || 0;

    // Atividades recentes
    const recentActivity = [
      ...projects.slice(-3).map((p) => ({
        type: "project",
        message: `Novo projeto #${p.number}: ${p.title}`,
        date: p.created_at,
      })),
      ...sales.slice(-3).map((s) => ({
        type: "sale",
        message: `Venda para ${s.client_name || 'Cliente'}: R$ ${s.total.toLocaleString('pt-BR')}`,
        date: s.created_at,
      })),
      ...purchases.slice(-3).map((p) => ({
        type: "purchase",
        message: `Compra de ${p.supplier_name || 'Fornecedor'}: R$ ${p.total.toLocaleString('pt-BR')}`,
        date: p.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return { 
      totalClients, 
      activeProjects, 
      monthlyRevenue, 
      pendingPayments, 
      lowStockItems, 
      recentActivity 
    };
  };

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------

  return (
    <AppContext.Provider
      value={{
        // Estados
        clients,
        projects,
        transactions,
        products,
        stockMovements,
        sales,
        purchases,
        suppliers,
        loading,
        error,
        
        // Métodos de clientes
        addClient,
        updateClient,
        deleteClient,
        
        // Métodos de projetos
        addProject,
        updateProject,
        deleteProject,
        
        // Métodos de produtos
        addProduct,
        updateProduct,
        deleteProduct,
        
        // Métodos de transações e estoque
        addTransaction,
        addStockMovement,
        processProjectStockMovement,
        
        // Métodos de vendas
        addSale,
        updateSale,
        deleteSale,
        
        // Métodos de compras
        addPurchase,
        updatePurchase,
        deletePurchase,
        
        // Métodos de fornecedores
        addSupplier,
        updateSupplier,
        deleteSupplier,
        
        // Métodos auxiliares
        calculateProductCost,
        getAvailableComponents,
        getDashboardStats,
        refreshData,
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
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
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
