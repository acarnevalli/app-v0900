import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from 'uuid';

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
  //
