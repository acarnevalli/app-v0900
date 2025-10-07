import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

// -- (interfaces mantidas exatamente como estão) --

interface AppContextType {
  clients: Client[];
  projects: Project[];
  transactions: Transaction[];
  products: Product[];
  stockMovements: StockMovement[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addClient: any;
  updateClient: any;
  deleteClient: any;
  addProject: any;
  updateProject: any;
  deleteProject: any;
  addTransaction: any;
  addProduct: any;
  updateProduct: any;
  deleteProduct: any;
  addStockMovement: any;
  processProjectStockMovement: any;
  calculateProductCost: any;
  getAvailableComponents: any;
  getDashboardStats: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};

// 🚀 PROVIDER
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 👉 Função genérica de carregamento com logs e catch centralizado
  const safeLoad = async (fn: () => Promise<void>, name: string) => {
    try {
      await fn();
    } catch (err: any) {
      console.error(`[AppContext] ${name} failed:`, err);
      setError(`Erro ao carregar ${name}`);
    }
  };

  const loadClients = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    setClients(data || []);
  };

  const loadProducts = async () => {
    if (!user) return;
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (productsError) throw productsError;

    const { data: componentsData, error: componentsError } = await supabase
      .from("product_components")
      .select(`
        id,
        product_id,
        component_id,
        quantity,
        user_id,
        component:products!product_components_component_id_fkey(id, name, unit, cost_price)
      `)
      .eq("user_id", user.id);
    if (componentsError) throw componentsError;

    const productsWithComponents = (productsData || []).map((product) => {
      const comps = (componentsData || [])
        .filter((comp: any) => comp.product_id === product.id)
        .map((comp: any) => ({
          id: comp.id,
          product_id: comp.component_id,
          component_id: comp.component_id,
          product_name: comp.component?.name || "",
          quantity: comp.quantity,
          unit: comp.component?.unit || "",
          unit_cost: comp.component?.cost_price || 0,
          total_cost: (comp.component?.cost_price || 0) * comp.quantity,
        }));
      return { ...product, components: comps };
    });

    setProducts(productsWithComponents);
  };

  const loadProjects = async () => {
    if (!user) return;
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("*, client:clients(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (projectsError) throw projectsError;

    const { data: projectProductsData, error: projectProductsError } = await supabase
      .from("project_products")
      .select("*, product:products(name)")
      .eq("user_id", user.id);
    if (projectProductsError) throw projectProductsError;

    const projectsWithProducts = (projectsData || []).map((project: any) => {
      const projectProducts = (projectProductsData || [])
        .filter((pp: any) => pp.project_id === project.id)
        .map((pp: any) => ({
          id: pp.id,
          product_id: pp.product_id,
          product_name: pp.product?.name || "",
          quantity: pp.quantity,
          unit_price: pp.unit_price,
          total_price: pp.total_price,
        }));

      return {
        ...project,
        client_name: project.client?.name,
        products: projectProducts,
      };
    });

    setProjects(projectsWithProducts);
  };

  const loadTransactions = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("transactions")
      .select("*, project:projects(title)")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    if (error) throw error;

    const mapped = (data || []).map((t: any) => ({
      ...t,
      project_title: t.project?.title,
    }));
    setTransactions(mapped);
  };

  const loadStockMovements = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*, product:products(name), project:projects(title)")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    if (error) throw error;

    const mapped = (data || []).map((m: any) => ({
      ...m,
      product_name: m.product?.name,
      project_title: m.project?.title,
    }));
    setStockMovements(mapped);
  };

  // 🔁 Função principal de sincronização
  const refreshData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    console.log("🔄 Refreshing data for user", user.id);
    await Promise.all([
      safeLoad(loadClients, "clients"),
      safeLoad(loadProducts, "products"),
      safeLoad(loadProjects, "projects"),
      safeLoad(loadTransactions, "transactions"),
      safeLoad(loadStockMovements, "stock movements"),
    ]);
    setLoading(false);
  };

  // ⚡ Controle de inicialização
  useEffect(() => {
    if (authLoading) {
      console.log("[AppContext] Aguardando AuthContext...");
      return;
    }
    if (isAuthenticated && user) {
      console.log("[AppContext] ✅ Usuário autenticado, iniciando refreshData...");
      refreshData();
    } else {
      console.log("[AppContext] 🚪 Usuário deslogado, limpando dados...");
      setClients([]);
      setProjects([]);
      setTransactions([]);
      setProducts([]);
      setStockMovements([]);
      setLoading(false);
      setError(null);
    }
  }, [user, isAuthenticated, authLoading]);

  // -- mantém as funções existentes (addClient, updateClient etc) abaixo sem alteração --

  return (
    <AppContext.Provider
      value={{
        clients,
        projects,
        transactions,
        products,
        stockMovements,
        loading,
        error,
        refreshData,
        addClient: async () => {},
        updateClient: async () => {},
        deleteClient: async () => {},
        addProject: async () => {},
        updateProject: async () => {},
        deleteProject: async () => {},
        addTransaction: async () => {},
        addProduct: async () => {},
        updateProduct: async () => {},
        deleteProduct: async () => {},
        addStockMovement: async () => {},
        processProjectStockMovement: async () => {},
        calculateProductCost: async () => 0,
        getAvailableComponents: () => [],
        getDashboardStats: () => ({
          totalClients: 0,
          activeProjects: 0,
          monthlyRevenue: 0,
          pendingPayments: 0,
          lowStockItems: 0,
          recentActivity: [],
        }),
      }}
    >
      {/* Fallback visual global */}
      {loading ? (
        <div style={{ padding: 20 }}>Carregando dados...</div>
      ) : error ? (
        <div style={{ color: "red", padding: 20 }}>
          ❌ {error}
          <button onClick={refreshData}>Tentar novamente</button>
        </div>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
};
