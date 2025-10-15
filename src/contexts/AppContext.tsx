import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

  const safeLoad = async (fn: () => Promise<void>, name: string) => {
    try {
      await fn();
    } catch (err: any) {
      console.error(`[AppContext] ❌ Falha ao carregar ${name}:`, err);
      setError(`Erro ao carregar ${name}`);
    }
  };

  // --- Carregar categorias ---
  const loadCategories = async () => {
    if (!user) return;
    
    // Carrega categorias globais ou do usuário (dependendo da sua lógica de negócio)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao carregar categorias:', error);
      throw error;
    } else {
      setCategories(data || []);
    }
  };

  const addCategory = async (name: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const cleanedName = name.trim();
    if (!cleanedName) throw new Error('Nome da categoria é obrigatório');

    // Verifica duplicatas
    const exists = categories.some(c => c.name.toLowerCase() === cleanedName.toLowerCase());
    if (exists) {
      throw new Error('Categoria já existe');
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ 
        name: cleanedName,
        user_id: user.id 
      }])
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

  const loadClients = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order('name');
    if (error) throw error;
    setClients(data || []);
  };

  const loadProducts = async () => {
    if (!user) return;
    
    // ✅ Corrigido: Agora filtra por user_id
    const { data: productsData, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id);
    if (prodErr) throw prodErr;

    const { data: componentsData, error: compErr } = await supabase
      .from("product_components")
      .select(`
        *,
        component:products!product_components_component_id_fkey(id, name, unit, cost_price)
      `);
    if (compErr) throw compErr;

    const merged = (productsData || []).map((p) => ({
      ...p,
      components: (componentsData || [])
        .filter((c: any) => c.product_id === p.id)
        .map((c: any) => ({
          id: c.id,
          product_id: c.product_id,
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
    
    // ✅ Melhorado: Usa join do Supabase
    const { data: projectsData, error: projErr } = await supabase
      .from("projects")
      .select(`
        *,
        client:clients(name),
        products:project_products(*)
      `)
      .eq("user_id", user.id);
    if (projErr) throw projErr;

    const merged = (projectsData || []).map((p: any) => ({
      ...p,
      client_name: p.client?.name,
      products: (p.products || []).map((pp: any) => ({
        id: pp.id,
        product_id: pp.product_id,
        product_name: pp.product_name || "",
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
      .select("*")
      .eq("user_id", user.id)
      .order('date', { ascending: false });
    if (error) throw error;
    setTransactions(data || []);
  };

  const loadStockMovements = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("user_id", user.id)
      .order('date', { ascending: false });
    if (error) throw error;
    setStockMovements(data || []);
  };

  const loadSuppliers = async () => {
    if (!user) return;
    
    // ✅ Agora filtra por user_id (ou remove o filtro se for global)
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("user_id", user.id)
      .order('name');
    if (error) throw error;
    setSuppliers(data || []);
  };

  const loadSales = async () => {
    if (!user) return;
    try {
      // ✅ Melhorado: Usa join do Supabase
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

      const merged = (salesData || []).map((sale: any) => ({
        ...sale,
        client_name: sale.client?.name,
        items: (sale.items || []).map((item: any) => ({
          id: item.id,
          sale_id: item.sale_id,
          product_id: item.product_id,
          product_name: item.product_name || "",
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })),
      }));
      setSales(merged);
    } catch (error) {
      console.error('[AppContext] Erro ao carregar vendas:', error);
      setSales([]);
    }
  };

  const loadPurchases = async () => {
    if (!user) return;
    try {
      // ✅ Melhorado: Usa join do Supabase
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

      const merged = (purchasesData || []).map((purchase: any) => ({
        ...purchase,
        supplier_name: purchase.supplier?.name,
        items: (purchase.items || []).map((item: any) => ({
          id: item.id,
          purchase_id: item.purchase_id,
          product_id: item.product_id,
          product_name: item.product_name || "",
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total: item.total,
        })),
      }));
      setPurchases(merged);
    } catch (error) {
      console.error('[AppContext] Erro ao carregar compras:', error);
      setPurchases([]);
    }
  };

  const refreshData = async () => {
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
  };

  // ✅ Corrigido: Adicionado cleanup
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
  }, [user, isAuthenticated, authLoading]);

  const addClient = async (data: Omit<Client, "id" | "created_at" | "updated_at" | "user_id">) => {
    if (!user) throw new Error('Usuário não autenticado');
    
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
    if (!user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from("clients")
      .update({ ...data, updated_at: new Date().toISOString() })
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

    if (data.products && data.products.length > 0) {
      const projectProducts = data.products.map(p => ({
        project_id: insertedProject.id,
        product_id: p.product_id,
        product_name: p.product_name,
        quantity: p.quantity,
        unit_price: p.unit_price,
        total_price: p.total_price,
        user_id: user.id,
      }));
      const projectProducts = data.products.map(p => ({
        project_id: insertedProject.id,
        product_id: p.product_id,
        product_name: p.product_name,
        quantity: p.quantity,
        unit_price: p.unit_price,
        total_price: p.total_price,
        user_id: user.id,
      }));
      const { error: prodError } = await supabase.from("project_products").insert(projectProducts);
      if (prodError) throw prodError;
    }

    await loadProjects();
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from("projects")
      .update({ ...data, updated_at: new Date().toISOString() })
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
    
    const newProduct = {
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

    if (data.components && data.components.length > 0) {
      const components = data.components.map(c => ({
        product_id: insertedProduct.id,
        component_id: c.component_id,
        quantity: c.quantity,
      }));
      const { error: compError } = await supabase.from("product_components").insert(components);
      if (compError) throw compError;
    }

    await loadProducts();
  };

  const updateProduct = async (data: Product) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from("products")
      .update({ 
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
      })
      .eq("id", data.id)
      .eq("user_id", user.id);
    if (error) throw error;
    await loadProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await loadProducts();
  };

  const addTransaction = async (data: Omit<Transaction, "id" | "created_at" | "user_id">) => {
    if (!user) throw new Error('Usuário não autenticado');
    
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
    if (!user) throw new Error('Usuário não autenticado');
    
    const product = products.find(p => p.id === data.product_id);
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    // ✅ Corrigido: Validação de estoque
    const newStock = data.movement_type === 'entrada'
      ? product.current_stock + data.quantity
      : product.current_stock - data.quantity;

    if (newStock < 0) {
      throw new Error(`Estoque insuficiente. Disponível: ${product.current_stock}, Solicitado: ${data.quantity}`);
    }

    const newMovement = {
      ...data,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("stock_movements").insert([newMovement]);
    if (error) throw error;

    // Atualiza o estoque do produto
    await updateProduct({
      ...product,
      current_stock: newStock,
    });

    await loadStockMovements();
  };

  const processProjectStockMovement = async (projectId: string, products: ProjectProduct[]) => {
    if (!user) throw new Error('Usuário não autenticado');
    
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

  const addSale = async (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
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

    if (sale.items && sale.items.length > 0) {
      const saleItems = sale.items.map(item => ({
        sale_id: insertedSale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));
      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;
    }

    // ✅ Corrigido: Movimentação de estoque com reference_type correto
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

    // ✅ Corrigido: Só cria transação se venda foi concluída
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
    
    const { error } = await supabase
      .from('sales')
      .update({ ...sale, updated_at: new Date().toISOString() })
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

    if (purchase.items && purchase.items.length > 0) {
      const purchaseItems = purchase.items.map(item => ({
        purchase_id: insertedPurchase.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total: item.total,
      }));
      const { error: itemsError } = await supabase.from('purchase_items').insert(purchaseItems);
      if (itemsError) throw itemsError;
    }

    // ✅ Corrigido: Só movimenta estoque se compra foi recebida
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

      // ✅ Corrigido: Só cria transação se compra foi recebida
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
    
    const { error } = await supabase
      .from('purchases')
      .update({ ...purchase, updated_at: new Date().toISOString() })
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
    
    const newSupplier = {
      ...supplier,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('suppliers').insert([newSupplier]);
    if (error) throw error;
    await loadSuppliers();
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from('suppliers')
      .update({ ...supplier, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    await loadSuppliers();
  };

  const deleteSupplier = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    await loadSuppliers();
  };

  // ✅ Corrigido: Proteção contra recursão infinita
  const calculateProductCost = async (productId: string, visited = new Set<string>()): Promise<number> => {
    if (visited.has(productId)) {
      console.warn(`⚠️ Dependência circular detectada no produto: ${productId}`);
      return 0;
    }

    visited.add(productId);
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.warn(`⚠️ Produto não encontrado: ${productId}`);
      return 0;
    }

    if (product.type === "material_bruto") {
      return product.cost_price || 0;
    }

    let total = 0;
    for (const comp of product.components) {
      const componentCost = await calculateProductCost(comp.component_id, visited);
      total += componentCost * comp.quantity;
    }
    return total;
  };

  const getAvailableComponents = () => products;

  const getDashboardStats = () => {
    const totalClients = clients.length || 0;
    const activeProjects = projects.filter(p => ["em_producao", "aprovado"].includes(p.status || "")).length || 0;

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

    const lowStockItems = products.filter(p => p.current_stock <= p.min_stock).length || 0;

    const recentActivity = [
      ...projects.slice(-3).map(p => ({
        type: "project",
        message: `Novo projeto #${p.number}: ${p.title}`,
        date: p.created_at,
      })),
      ...sales.slice(-3).map(s => ({
        type: "sale",
        message: `Venda para ${s.client_name || 'Cliente'}: R$ ${(s.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        date: s.created_at,
      })),
      ...purchases.slice(-3).map(p => ({
        type: "purchase",
        message: `Compra de ${p.supplier_name || 'Fornecedor'}: R$ ${(p.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
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

export default AppProvider;
