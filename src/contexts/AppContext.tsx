import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
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

// Remove campos undefined/null de um objeto
function sanitizeData<T extends Record<string, any>>(data: T): Partial<T> {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

// ---------------------------------------------------------------
// Interfaces
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
  user_id?: string;
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
  created_at: string;
  updated_at: string;
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
  loading: boolean;
  error: string | null;

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
  const [error, setError] = useState<string | null>(null);

  // ✅ Melhoria: Função de carregamento seguro que não limpa dados em caso de erro
  const safeLoad = async (fn: () => Promise<void>, name: string) => {
    try {
      await fn();
    } catch (err: any) {
      console.error(`[AppContext] ❌ Falha ao carregar ${name}:`, err);
      // ✅ Não limpa dados existentes, apenas registra o erro
      setError(`Erro ao carregar ${name}: ${err.message || 'Erro desconhecido'}`);
    }
  };

  // --- Carregar categorias ---
  const loadCategories = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao carregar categorias:', error);
      throw error;
    }
    
    setCategories(validateArray(data));
  }, [user]);

  const addCategory = async (name: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const cleanedName = name.trim();
    if (!cleanedName) throw new Error('Nome da categoria é obrigatório');

    // Verifica duplicatas
    const exists = categories.some(c => c.name.toLowerCase() === cleanedName.toLowerCase());
    if (exists) {
      throw new Error('Categoria já existe');
    }

    const categoryData = sanitizeData({
      name: cleanedName,
      user_id: user.id 
    });

    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Categoria já existe');
      }
      throw error;
    }

    setCategories(prev => [...prev, data]);
  };

  const loadClients = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order('name');
      
    if (error) throw error;
    setClients(validateArray(data));
  }, [user]);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    
    const { data: productsData, error: prodErr } = await supabase
      .from("products")
      .select("*");
    if (prodErr) throw prodErr;

    const { data: componentsData, error: compErr } = await supabase
      .from("product_components")
      .select(`
        *,
        component:products!product_components_component_id_fkey(id, name, unit, cost_price)
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
          total_cost: (c.component?.cost_price || 0) * (c.quantity || 0),
        })),
    }));

    setProducts(merged);
  }, [user]);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    
    const { data: projectsData, error: projErr } = await supabase
      .from("projects")
      .select("*, client:clients(name)")
      .eq("user_id", user.id);
    if (projErr) throw projErr;

    const { data: projProds, error: projProdErr } = await supabase
      .from("project_products")
      .select("*")
      .eq("user_id", user.id);
    if (projProdErr) throw projProdErr;

    const merged = validateArray(projectsData).map((p: any) => ({
      ...p,
      client_name: p.client?.name,
      products: validateArray(projProds)
        .filter((pp: any) => pp.project_id === p.id)
        .map((pp: any) => ({
          id: pp.id,
          product_id: pp.product_id,
          product_name: pp.product_name || "",
          quantity: pp.quantity || 0,
          unit_price: pp.unit_price || 0,
          total_price: pp.total_price || 0,
        })),
    }));
    
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
      .order('name');
      
    if (error) throw error;
    setSuppliers(validateArray(data));
  }, [user]);

  const loadSales = useCallback(async () => {
    if (!user) return;
    
    const { data: salesData, error: salesErr } = await supabase
      .from("sales")
      .select(`
        *,
        client:clients(name),
        items:sale_items(*)
      `)
      .eq("user_id", user.id)
      .order('date', { ascending: false });
      
    if (salesErr) throw salesErr;

    const merged = validateArray(salesData).map((sale: any) => ({
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
    
    const { data: purchasesData, error: purchasesErr } = await supabase
      .from("purchases")
      .select(`
        *,
        supplier:suppliers(name),
        items:purchase_items(*)
      `)
      .eq("user_id", user.id)
      .order('date', { ascending: false });
      
    if (purchasesErr) throw purchasesErr;

    const merged = validateArray(purchasesData).map((purchase: any) => ({
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

  const refreshData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    await Promise.all([
      safeLoad(loadClients, "Clientes"),
      safeLoad(loadProducts, "Produtos"),
      safeLoad(loadProjects, "Projetos"),
      safeLoad(loadTransactions, "Transações"),
      safeLoad(loadStockMovements, "Movimentações de estoque"),
      safeLoad(loadSuppliers, "Fornecedores"),
      safeLoad(loadSales, "Vendas"),
      safeLoad(loadPurchases, "Compras"),
      safeLoad(loadCategories, "Categorias"),
    ]);

    setLoading(false);
  }, [user, loadClients, loadProducts, loadProjects, loadTransactions, loadStockMovements, loadSuppliers, loadSales, loadPurchases, loadCategories]);

  useEffect(() => {
    let cancelled = false;

    const initializeData = async () => {
      if (authLoading) return;
      
      if (!isAuthenticated || !user) {
        setClients([]);
        setProjects([]);
        setTransactions([]);
        setProducts([]);
        setStockMovements([]);
        setSales([]);
        setPurchases([]);
        setSuppliers([]);
        setCategories([]);
        setLoading(false);
        setError(null);
        return;
      }

      if (!cancelled) {
        await refreshData();
      }
    };

    initializeData();

    return () => {
      cancelled = true;
    };
  }, [user, isAuthenticated, authLoading, refreshData]);

  // ✅ Melhoria: Sanitiza dados antes de inserir
  const addClient = async (data: Omit<Client, "id" | "created_at" | "updated_at" | "user_id">) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const newClient = sanitizeData({
      ...data,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    const { error } = await supabase.from("clients").insert([newClient]);
    if (error) throw error;
    await loadClients();
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const updateData = sanitizeData({
      ...data,
      updated_at: new Date().toISOString()
    });
    
    const { error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id);
      
    if (error) throw error;
    await loadClients();
  };

  const deleteClient = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
      
    if (error) throw error;
    await loadClients();
  };

  const addProject = async (data: Omit<Project, "id" | "created_at" | "updated_at" | "number" | "user_id">) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const maxNumber = projects.reduce((max, p) => Math.max(max, p.number || 0), 0);
    
    const projectData = sanitizeData({
      client_id: data.client_id,
      title: data.title,
      description: data.description,
      status: data.status,
      type: data.type,
      budget: data.budget,
      start_date: data.start_date,
      end_date: data.end_date,
      materials_cost: data.materials_cost,
      labor_cost: data.labor_cost,
      profit_margin: data.profit_margin,
      payment_terms: data.payment_terms,
      number: maxNumber + 1,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    const { data: insertedProject, error } = await supabase
      .from("projects")
      .insert([projectData])
      .select()
      .single();
      
    if (error) throw error;

    // ✅ Melhoria: Valida existência de items antes do loop
    if (Array.isArray(data.products) && data.products.length > 0) {
      const projectProducts = data.products.map(p => sanitizeData({
        project_id: insertedProject.id,
        product_id: p.product_id,
        product_name: p.product_name,
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
    if (!user) throw new Error('Usuário não autenticado');
    
    const updateData = sanitizeData({
      ...data,
      updated_at: new Date().toISOString()
    });
    
    const { error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id);
      
    if (error) throw error;
    await loadProjects();
  };

  const deleteProject = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
      
    if (error) throw error;
    await loadProjects();
  };

  const addProduct = async (data: Omit<Product, "id" | "created_at" | "updated_at" | "user_id">) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const productData = sanitizeData({
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    const { data: insertedProduct, error } = await supabase
      .from("products")
      .insert([productData])
      .select()
      .single();
      
    if (error) throw error;

    // ✅ Melhoria: Valida existência de components
    if (Array.isArray(data.components) && data.components.length > 0) {
      const components = data.components.map(c => sanitizeData({
        product_id: insertedProduct.id,
        component_id: c.component_id,
        quantity: c.quantity,
      }));
      
      const { error: compError } = await supabase
        .from("product_components")
        .insert(components);
        
      if (compError) throw compError;
    }

    await loadProducts();
  };

  // ✅ Melhoria: Atualiza também os componentes do produto
  const updateProduct = async (data: Product) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const productData = sanitizeData({
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
    });
    
    const { error } = await supabase
      .from("products")
      .update(productData)
      .eq("id", data.id);
      
    if (error) throw error;

    // ✅ Atualiza componentes do produto
    if (Array.isArray(data.components)) {
      // Remove componentes antigos
      await supabase
        .from("product_components")
        .delete()
        .eq("product_id", data.id);

      // Insere novos componentes
      if (data.components.length > 0) {
        const components = data.components.map(c => sanitizeData({
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
  };

  const deleteProduct = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);
      
    if (error) throw error;
    await loadProducts();
  };

  const addTransaction = async (data: Omit<Transaction, "id" | "created_at" | "user_id">) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const transactionData = sanitizeData({
      ...data,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });
    
    const { error } = await supabase.from("transactions").insert([transactionData]);
    if (error) throw error;
    await loadTransactions();
  };

  const addStockMovement = async (data: Omit<StockMovement, "id" | "created_at" | "user_id">) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const product = products.find(p => p.id === data.product_id);
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    const newStock = data.movement_type === 'entrada'
      ? product.current_stock + data.quantity
      : product.current_stock - data.quantity;

    if (newStock < 0) {
      throw new Error(`Estoque insuficiente. Disponível: ${product.current_stock}, Solicitado: ${data.quantity}`);
    }

    const movementData = sanitizeData({
      ...data,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });
    
    const { error } = await supabase.from("stock_movements").insert([movementData]);
    if (error) throw error;

    await updateProduct({
      ...product,
      current_stock: newStock,
    });

    await loadStockMovements();
  };

  // ✅ Melhoria: Usa Promise.all para paralelizar inserções
  const processProjectStockMovement = async (projectId: string, projectProducts: ProjectProduct[]) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (!Array.isArray(projectProducts) || projectProducts.length === 0) return;
    
    await Promise.all(
      projectProducts.map(item =>
        addStockMovement({
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
        })
      )
    );
  };

  const addSale = async (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (!Array.isArray(sale.items) || sale.items.length === 0) {
      throw new Error('A venda deve conter pelo menos um item');
    }
    
    const saleData = sanitizeData({
      date: sale.date,
      client_id: sale.client_id,
      total: sale.total,
      status: sale.status,
      payment_method: sale.payment_method,
      notes: sale.notes,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    const { data: insertedSale, error } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();
      
    if (error) throw error;

    const saleItems = sale.items.map(item => sanitizeData({
      sale_id: insertedSale.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }));
    
    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);
      
    if (itemsError) throw itemsError;

    // ✅ Melhoria: Paraleliza movimentações de estoque
    await Promise.all(
      sale.items.map(item =>
        addStockMovement({
          product_id: item.product_id,
          product_name: item.product_name,
          movement_type: 'saida',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_value: item.total,
          reference_type: 'manual',
          date: sale.date,
          notes: `Venda #${insertedSale.id}`,
        })
      )
    );

    if (sale.status === 'completed') {
      await addTransaction({
        type: 'entrada',
        category: 'venda',
        description: `Venda para ${sale.client_name || 'cliente'}`,
        amount: sale.total,
        date: sale.date,
      });
    }

    await refreshData();
  };

  const updateSale = async (id: string, sale: Partial<Sale>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const updateData = sanitizeData({
      ...sale,
      updated_at: new Date().toISOString()
    });
    
    const { error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
    await loadSales();
  };

  const deleteSale = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
    await loadSales();
  };

  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (!Array.isArray(purchase.items) || purchase.items.length === 0) {
      throw new Error('A compra deve conter pelo menos um item');
    }
    
    const purchaseData = sanitizeData({
      date: purchase.date,
      supplier_id: purchase.supplier_id,
      total: purchase.total,
      status: purchase.status,
      invoice_number: purchase.invoice_number,
      notes: purchase.notes,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    const { data: insertedPurchase, error } = await supabase
      .from('purchases')
      .insert([purchaseData])
      .select()
      .single();
      
    if (error) throw error;

    const purchaseItems = purchase.items.map(item => sanitizeData({
      purchase_id: insertedPurchase.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      total: item.total,
    }));
    
    const { error: itemsError } = await supabase
      .from('purchase_items')
      .insert(purchaseItems);
      
    if (itemsError) throw itemsError;

    if (purchase.status === 'received') {
      // ✅ Melhoria: Paraleliza movimentações
      await Promise.all(
        purchase.items.map(item =>
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
        )
      );

      await addTransaction({
        type: 'saida',
        category: 'compra',
        description: `Compra de ${purchase.supplier_name || 'fornecedor'}`,
        amount: purchase.total,
        date: purchase.date,
      });
    }

    await refreshData();
  };

  const updatePurchase = async (id: string, purchase: Partial<Purchase>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const updateData = sanitizeData({
      ...purchase,
      updated_at: new Date().toISOString()
    });
    
    const { error } = await supabase
      .from('purchases')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
    await loadPurchases();
  };

  const deletePurchase = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
    await loadPurchases();
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const supplierData = sanitizeData({
      ...supplier,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    const { error } = await supabase.from('suppliers').insert([supplierData]);
    if (error) throw error;
    await loadSuppliers();
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const updateData = sanitizeData({
      ...supplier,
      updated_at: new Date().toISOString()
    });
    
    const { error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id);
      
    if (error) throw error;
    await loadSuppliers();
  };

  const deleteSupplier = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    await loadSuppliers();
  };

  // ✅ Melhoria: Cada chamada inicia com um Set novo
  const calculateProductCost = useCallback(async (productId: string): Promise<number> => {
    const visited = new Set<string>();
    
    const calculate = async (id: string): Promise<number> => {
      if (visited.has(id)) {
        console.warn(`⚠️ Dependência circular detectada no produto: ${id}`);
        return 0;
      }

      visited.add(id);
      const product = products.find(p => p.id === id);
      
      if (!product) {
        console.warn(`⚠️ Produto não encontrado: ${id}`);
        return 0;
      }

      if (product.type === "material_bruto") {
        return product.cost_price || 0;
      }

      let total = 0;
      for (const comp of product.components || []) {
        const componentCost = await calculate(comp.component_id);
        total += componentCost * (comp.quantity || 0);
      }
      
      return total;
    };

    return calculate(productId);
  }, [products]);

  const getAvailableComponents = useCallback(() => products, [products]);

  // ✅ Melhoria: Memoiza cálculos do dashboard
  const getDashboardStats = useMemo(() => {
    return () => {
      const totalClients = clients.length;
      const activeProjects = projects.filter(p => 
        ["em_producao", "aprovado"].includes(p.status)
      ).length;

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const monthlySalesRevenue = sales
        .filter(s => {
          const saleDate = new Date(s.date);
          return s.status === 'completed' &&
                 saleDate >= firstDayOfMonth &&
                 saleDate <= lastDayOfMonth;
        })
        .reduce((sum, s) => sum + (s.total || 0), 0);

      const monthlyTransactionRevenue = transactions
        .filter(t => {
          const transDate = new Date(t.date);
          return t.type === "entrada" &&
                 transDate >= firstDayOfMonth &&
                 transDate <= lastDayOfMonth;
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const monthlyRevenue = monthlySalesRevenue + monthlyTransactionRevenue;

      const pendingSales = sales
        .filter(s => s.status === 'pending')
        .reduce((sum, s) => sum + (s.total || 0), 0);

      const pendingProjects = projects
        .filter(p => ["concluido", "entregue"].includes(p.status))
        .reduce((sum, p) => sum + ((p.budget || 0) * 0.5), 0);

      const pendingPayments = pendingSales + pendingProjects;

      const lowStockItems = products.filter(p => 
        p.current_stock <= p.min_stock
      ).length;

      const recentActivity = [
        ...projects.slice(-3).map(p => ({
          type: "project",
          message: `Novo projeto #${p.number}: ${p.title}`,
          date: p.created_at,
        })),
        ...sales.slice(-3).map(s => ({
          type: "sale",
          message: `Venda para ${s.client_name || 'Cliente'}: R$ ${(s.total || 0).toFixed(2)}`,
          date: s.created_at,
        })),
        ...purchases.slice(-3).map(p => ({
          type: "purchase",
          message: `Compra de ${p.supplier_name || 'Fornecedor'}: R$ ${(p.total || 0).toFixed(2)}`,
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
  }, [clients, projects, sales, purchases, transactions, products]);

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
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
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
