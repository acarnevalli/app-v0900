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

export type ItemType = 'produto' | 'servico';

export interface ProjectProduct {
  id: string;
  product_id: string | null;  // ✅ Pode ser NULL para serviços
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_type: ItemType;  // ✅ NOVO
  item_description?: string;  // ✅ NOVO
  service_hours?: number;  // ✅ NOVO (para serviços)
  hourly_rate?: number;  // ✅ NOVO (para serviços)
}

export interface Project {
  id: string;
  order_number: string;  // ✅ NOVO: formato #2024-0001
  number: number;  // ⚠️ Depreciado, manter por compatibilidade
  client_id: string;
  client_name?: string;
  // title REMOVIDO ❌
  description: string;  // ✅ Agora é obrigatório
  status: 'orcamento' | 'aprovado' | 'em_producao' | 'concluido' | 'entregue';
  type: 'orcamento' | 'venda';
  products: ProjectProduct[];
  budget: number;
  start_date: string;
  end_date: string;
  delivery_deadline_days: number;  // ✅ NOVO: prazo em dias
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

  // ✅ Melhor tratamento de erros
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

  // ✅ Utilitários de validação
  const ensureUser = () => {
    if (!user) throw new Error('Usuário não autenticado');
  };

  // ✅ Load functions
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

  // ✅ FUNÇÃO loadClients ATUALIZADA COM PAGINAÇÃO
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
      
      // Verifica se há mais registros para buscar
      hasMore = data && data.length === pageSize;
      page++;
      
      // Verificação adicional usando o count
      if (count && allClients.length >= count) {
        hasMore = false;
      }
    }
    
    console.log(`Total de clientes carregados: ${allClients.length}`);
    setClients(validateArray(allClients));
  }, [user]);

// Função Carregar Projetos 
  
  const loadProjects = useCallback(async () => {
  if (!user) return;
  
  console.log('🔄 [AppContext] Carregando projetos...');
  
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      client:clients(name),
      products:project_products(*)
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
      raw_products: p.products
    });
    
    const processedProducts = validateArray(p.products).map((pp: any) => {
      const processed = {
        id: pp.id,
        product_id: pp.product_id || null,
        product_name: pp.product_name || "",
        quantity: pp.quantity || 0,
        unit_price: pp.unit_price || 0,
        total_price: pp.total_price || 0,
        item_type: pp.item_type || 'produto',
        item_description: pp.item_description,
        service_hours: pp.service_hours,
        hourly_rate: pp.hourly_rate,
      };
      
      console.log(`  ➡️ Produto processado:`, processed);
      return processed;
    });
    
    console.log(`✅ [AppContext] Projeto ${p.id} processado com ${processedProducts.length} produtos`);
    
    return {
      ...p,
      client_name: p.client?.name,
      products: processedProducts
    };
  });
  
  console.log(`✅ [AppContext] Total de projetos carregados: ${merged.length}`);
  setProjects(merged);
}, [user]);

// Carregando Transações Financeiras 
  
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

  // ✅ Refresh controlado
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
    loadCategories
  ]);

  // ✅ Efeito com cleanup e validação
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

  // ✅ Proteção contra recursão infinita
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

  // ✅ Category functions
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
    // ✅ Client functions
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

  // ✅ Product functions

  // ====== FUNÇÃO ADD PAYMENTS ======

const createFinancialTransactionsFromProject = useCallback(async (
  projectId: string, 
  projectData: any
) => {
  // Só criar transações se for uma VENDA (não orçamento)
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
    // Criar uma transação para cada parcela
    for (let i = 0; i < payment_terms.installments; i++) {
      // Calcular data de vencimento de cada parcela
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

     // ✅ ADICIONAR AQUI: Criar transações financeiras
  if (data.type === 'venda') {
    try {
      await createFinancialTransactionsFromProject(insertedProject.id, {
        ...data,
        order_number: insertedProject.order_number
      });
    } catch (error) {
      console.error('Erro ao criar transações, mas projeto foi salvo:', error);
      // Não dar throw aqui para não reverter o projeto
    }
  }


    await loadProducts();
  }, [user, loadProducts]);

  // ✅ ÚNICA declaração de updateProduct
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

  // ✅ Project functions
  // ✅ FUNÇÃO addProject ATUALIZADA
const addProject = useCallback(async (data: Omit<Project, "id" | "created_at" | "updated_at" | "number" | "order_number" | "user_id">) => {
  ensureUser();
  
  // ✅ Validações
  if (!data.description || data.description.trim() === '') {
    throw new Error('Descrição é obrigatória');
  }
  
  if (!data.client_id) {
    throw new Error('Cliente é obrigatório');
  }
  
  if (!data.products || data.products.length === 0) {
    throw new Error('Adicione pelo menos um produto ou serviço');
  }
  
  // ✅ Calcular data de entrega baseada no prazo
  const deliveryDeadlineDays = data.delivery_deadline_days || 15;
  const startDate = new Date(data.start_date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + deliveryDeadlineDays);
  
  // ✅ Preparar dados do projeto (order_number será gerado pelo trigger)
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
    number: 0,  // Será depreciado, mas manter por compatibilidade
    user_id: user!.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  // ✅ Inserir projeto
  const { data: insertedProject, error } = await supabase
    .from("projects")
    .insert([cleanUndefined(newProject)])
    .select()
    .single();
    
  if (error) throw error;

  // ✅ Inserir produtos/serviços
  if (data.products && data.products.length > 0) {
    const projectProducts = data.products.map(p => {
      // ✅ Validar serviços
      if (p.item_type === 'servico') {
        if (!p.service_hours || p.service_hours <= 0) {
          throw new Error(`Serviço "${p.product_name}" precisa ter horas definidas`);
        }
        if (!p.hourly_rate || p.hourly_rate <= 0) {
          throw new Error(`Serviço "${p.product_name}" precisa ter valor por hora definido`);
        }
      }
      
      return {
        project_id: insertedProject.id,
        product_id: p.product_id || null,  // ✅ Pode ser NULL para serviços
        product_name: p.product_name,
        quantity: p.quantity,
        unit_price: p.unit_price,
        total_price: p.total_price,
        item_type: p.item_type || 'produto',  // ✅ NOVO
        item_description: p.item_description,  // ✅ NOVO
        service_hours: p.item_type === 'servico' ? p.service_hours : null,  // ✅ NOVO
        hourly_rate: p.item_type === 'servico' ? p.hourly_rate : null,  // ✅ NOVO
        user_id: user!.id,
      };
    }).filter(p => p.quantity > 0);

    const { error: prodError } = await supabase
      .from("project_products")
      .insert(projectProducts);
      
    if (prodError) throw prodError;
  }

  await loadProjects();
  return insertedProject;  // ✅ Retornar projeto criado
}, [user, loadProjects]);
    
  // ✅ FUNÇÃO updateProject ATUALIZADA
const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
  ensureUser();
  
  // ✅ Calcular end_date se delivery_deadline_days mudou
  if (data.delivery_deadline_days && data.start_date) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + data.delivery_deadline_days);
    data.end_date = endDate.toISOString().split('T')[0];
  }
  
  // ✅ Atualizar projeto
  const { error } = await supabase
    .from("projects")
    .update({ 
      ...cleanUndefined(data), 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .eq("user_id", user!.id);
    
  if (error) throw error;

  // ✅ Atualizar produtos se fornecidos
  if (data.products) {
    // Remover produtos antigos
    await supabase
      .from("project_products")
      .delete()
      .eq("project_id", id);

    // Inserir novos produtos
    if (data.products.length > 0) {
      const projectProducts = data.products.map(p => ({
        project_id: id,
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
      }));

      const { error: prodError } = await supabase
        .from("project_products")
        .insert(projectProducts);
        
      if (prodError) throw prodError;
    }
  }

  await loadProjects();
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

  // ✅ Transaction functions
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

  // ✅ Stock Movement functions
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
    );

    await Promise.all(movementPromises);
  }, [addStockMovement]);
   // ✅ Sale functions
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

  // ✅ Purchase functions
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

  // ✅ Supplier functions
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

  // ✅ Utility functions
  const getAvailableComponents = useCallback(() => {
    return validateArray(products);
  }, [products]);

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

    const recentActivity = [
      ...(projects || []).slice(-3).map(p => ({
        type: "project",
        message: `Novo projeto #${p.number}: ${p.title}`,
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
  // ✅ Provider return
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
        loading,
        error,

        // Funções principais
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
