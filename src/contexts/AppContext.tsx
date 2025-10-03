import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Client {
  id: string;
  name: string;
  type: 'pf' | 'pj';
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
  type: 'material_bruto' | 'parte_produto' | 'produto_pronto';
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
  status: 'orcamento' | 'aprovado' | 'em_producao' | 'concluido' | 'entregue';
  type: 'orcamento' | 'venda';
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
  payment_method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia';
  discount_percentage: number;
  installment_value?: number;
  total_with_discount?: number;
}

export interface Transaction {
  id: string;
  project_id?: string;
  project_title?: string;
  type: 'entrada' | 'saida';
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
  movement_type: 'entrada' | 'saida';
  quantity: number;
  unit_price?: number;
  total_value?: number;
  project_id?: string;
  project_title?: string;
  reference_type?: 'manual' | 'project' | 'adjustment';
  date: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

interface AppContextType {
  clients: Client[];
  projects: Project[];
  transactions: Transaction[];
  products: Product[];
  stockMovements: StockMovement[];
  loading: boolean;
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'number' | 'user_id'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  processProjectStockMovement: (projectId: string, products: ProjectProduct[]) => Promise<void>;
  calculateProductCost: (productId: string) => Promise<number>;
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
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClients = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('[AppContext] Error loading clients:', error);
    }
  };

  const loadProducts = async () => {
    if (!user) return;

    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const { data: componentsData, error: componentsError } = await supabase
        .from('product_components')
        .select(`
          id,
          product_id,
          component_id,
          quantity,
          user_id,
          component:products!product_components_component_id_fkey(id, name, unit, cost_price)
        `)
        .eq('user_id', user.id);

      if (componentsError) throw componentsError;

      const productsWithComponents = (productsData || []).map(product => {
        const productComponents = (componentsData || [])
          .filter((comp: any) => comp.product_id === product.id)
          .map((comp: any) => ({
            id: comp.id,
            product_id: comp.component_id,
            component_id: comp.component_id,
            product_name: comp.component?.name || '',
            quantity: comp.quantity,
            unit: comp.component?.unit || '',
            unit_cost: comp.component?.cost_price || 0,
            total_cost: (comp.component?.cost_price || 0) * comp.quantity
          }));

        return {
          ...product,
          components: productComponents
        };
      });

      setProducts(productsWithComponents);
    } catch (error) {
      console.error('[AppContext] Error loading products:', error);
    }
  };

  const loadProjects = async () => {
    if (!user) return;

    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const { data: projectProductsData, error: projectProductsError } = await supabase
        .from('project_products')
        .select(`
          *,
          product:products(name)
        `)
        .eq('user_id', user.id);

      if (projectProductsError) throw projectProductsError;

      const projectsWithProducts = (projectsData || []).map((project: any) => {
        const projectProducts = (projectProductsData || [])
          .filter((pp: any) => pp.project_id === project.id)
          .map((pp: any) => ({
            id: pp.id,
            product_id: pp.product_id,
            product_name: pp.product?.name || '',
            quantity: pp.quantity,
            unit_price: pp.unit_price,
            total_price: pp.total_price
          }));

        return {
          ...project,
          client_name: project.client?.name,
          products: projectProducts
        };
      });

      setProjects(projectsWithProducts);
    } catch (error) {
      console.error('[AppContext] Error loading projects:', error);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          project:projects(title)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const transactionsWithProjects = (data || []).map((transaction: any) => ({
        ...transaction,
        project_title: transaction.project?.title
      }));

      setTransactions(transactionsWithProjects);
    } catch (error) {
      console.error('[AppContext] Error loading transactions:', error);
    }
  };

  const loadStockMovements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(name),
          project:projects(title)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const movementsWithNames = (data || []).map((movement: any) => ({
        ...movement,
        product_name: movement.product?.name,
        project_title: movement.project?.title
      }));

      setStockMovements(movementsWithNames);
    } catch (error) {
      console.error('[AppContext] Error loading stock movements:', error);
    }
  };

  const refreshData = async () => {
    if (!user) return;

    setLoading(true);
    await Promise.all([
      loadClients(),
      loadProducts(),
      loadProjects(),
      loadTransactions(),
      loadStockMovements()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      refreshData();
    } else if (!authLoading && !isAuthenticated) {
      setClients([]);
      setProjects([]);
      setTransactions([]);
      setProducts([]);
      setStockMovements([]);
      setLoading(false);
    }
  }, [user, isAuthenticated, authLoading]);

  const addClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...clientData,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    setClients(prev => [data, ...prev]);
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setClients(prev => prev.map(client => client.id === id ? data : client));
  };

  const deleteClient = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    setClients(prev => prev.filter(client => client.id !== id));
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    const { components, ...productWithoutComponents } = productData;

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        ...productWithoutComponents,
        user_id: user.id
      })
      .select()
      .single();

    if (productError) throw productError;

    if (components && components.length > 0) {
      const componentsToInsert = components.map(comp => ({
        product_id: product.id,
        component_id: comp.component_id,
        quantity: comp.quantity,
        user_id: user.id
      }));

      const { error: componentsError } = await supabase
        .from('product_components')
        .insert(componentsToInsert);

      if (componentsError) throw componentsError;
    }

    await loadProducts();
  };

  const updateProduct = async (product: Product) => {
    if (!user) throw new Error('User not authenticated');

    const { components, ...productWithoutComponents } = product;

    const { error: productError } = await supabase
      .from('products')
      .update(productWithoutComponents)
      .eq('id', product.id)
      .eq('user_id', user.id);

    if (productError) throw productError;

    const { error: deleteError } = await supabase
      .from('product_components')
      .delete()
      .eq('product_id', product.id)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    if (components && components.length > 0) {
      const componentsToInsert = components.map(comp => ({
        product_id: product.id,
        component_id: comp.component_id,
        quantity: comp.quantity,
        user_id: user.id
      }));

      const { error: componentsError } = await supabase
        .from('product_components')
        .insert(componentsToInsert);

      if (componentsError) throw componentsError;
    }

    await loadProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const addProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'number' | 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data: maxNumberData } = await supabase
      .from('projects')
      .select('number')
      .eq('user_id', user.id)
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const projectNumber = (maxNumberData?.number || 0) + 1;

    const { products: projectProducts, payment_terms, ...projectWithoutProducts } = projectData;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        ...projectWithoutProducts,
        number: projectNumber,
        payment_installments: payment_terms?.installments || 1,
        payment_method: payment_terms?.payment_method || null,
        discount_percentage: payment_terms?.discount_percentage || 0,
        user_id: user.id
      })
      .select()
      .single();

    if (projectError) throw projectError;

    if (projectProducts && projectProducts.length > 0) {
      const productsToInsert = projectProducts.map(pp => ({
        project_id: project.id,
        product_id: pp.product_id,
        quantity: pp.quantity,
        unit_price: pp.unit_price,
        total_price: pp.total_price,
        user_id: user.id
      }));

      const { error: productsError } = await supabase
        .from('project_products')
        .insert(productsToInsert);

      if (productsError) throw productsError;
    }

    await loadProjects();
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!user) throw new Error('User not authenticated');

    const { products: projectProducts, payment_terms, ...projectWithoutProducts } = updates;

    const updateData: any = { ...projectWithoutProducts };

    if (payment_terms) {
      updateData.payment_installments = payment_terms.installments;
      updateData.payment_method = payment_terms.payment_method;
      updateData.discount_percentage = payment_terms.discount_percentage;
    }

    const { error: projectError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (projectError) throw projectError;

    if (projectProducts) {
      const { error: deleteError } = await supabase
        .from('project_products')
        .delete()
        .eq('project_id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      if (projectProducts.length > 0) {
        const productsToInsert = projectProducts.map(pp => ({
          project_id: id,
          product_id: pp.product_id,
          quantity: pp.quantity,
          unit_price: pp.unit_price,
          total_price: pp.total_price,
          user_id: user.id
        }));

        const { error: productsError } = await supabase
          .from('project_products')
          .insert(productsToInsert);

        if (productsError) throw productsError;
      }
    }

    await loadProjects();
  };

  const deleteProject = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transactionData,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    await loadTransactions();
  };

  const addStockMovement = async (movementData: Omit<StockMovement, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        product_id: movementData.product_id,
        movement_type: movementData.movement_type,
        quantity: movementData.quantity,
        unit_price: movementData.unit_price || 0,
        total_value: movementData.total_value || 0,
        project_id: movementData.project_id || null,
        reference_type: movementData.reference_type || 'manual',
        date: movementData.date,
        notes: movementData.notes || null,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    const product = products.find(p => p.id === movementData.product_id);
    if (product) {
      const newStock = movementData.movement_type === 'entrada'
        ? product.current_stock + movementData.quantity
        : product.current_stock - movementData.quantity;

      await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', movementData.product_id)
        .eq('user_id', user.id);

      await loadProducts();
    }

    await loadStockMovements();
  };

  const processProjectStockMovement = async (projectId: string, projectProducts: ProjectProduct[]) => {
    for (const projectProduct of projectProducts) {
      const product = products.find(p => p.id === projectProduct.product_id);
      if (product) {
        await addStockMovement({
          product_id: product.id,
          product_name: product.name,
          movement_type: 'saida',
          quantity: projectProduct.quantity,
          unit_price: projectProduct.unit_price,
          total_value: projectProduct.total_price,
          project_id: projectId,
          date: new Date().toISOString().split('T')[0]
        });

        if (product.type !== 'material_bruto' && product.components) {
          for (const component of product.components) {
            const totalQuantity = component.quantity * projectProduct.quantity;
            await addStockMovement({
              product_id: component.component_id,
              product_name: component.product_name,
              movement_type: 'saida',
              quantity: totalQuantity,
              unit_price: component.unit_cost,
              total_value: component.total_cost * projectProduct.quantity,
              project_id: projectId,
              date: new Date().toISOString().split('T')[0]
            });
          }
        }
      }
    }
  };

  const calculateProductCost = async (productId: string): Promise<number> => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;

    if (product.type === 'material_bruto') {
      return product.cost_price;
    }

    let totalCost = 0;
    for (const component of product.components) {
      const componentCost = await calculateProductCost(component.component_id);
      totalCost += componentCost * component.quantity;
    }

    return totalCost;
  };

  const getAvailableComponents = (): Product[] => {
    return products;
  };

  const getDashboardStats = () => {
    const totalClients = clients.length;
    const activeProjects = projects.filter(p =>
      p.status === 'em_producao' || p.status === 'aprovado'
    ).length;

    const currentMonth = new Date().getMonth();
    const monthlyRevenue = transactions
      .filter(t =>
        t.type === 'entrada' &&
        new Date(t.date).getMonth() === currentMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingPayments = projects
      .filter(p => p.status === 'concluido' || p.status === 'entregue')
      .reduce((sum, p) => sum + (p.budget * 0.5), 0);

    const lowStockItems = products.filter(p => p.current_stock <= p.min_stock).length;

    const recentActivity = [
      ...projects.slice(-3).map(p => ({
        type: 'project',
        message: `Novo projeto #${p.number}: ${p.title}`,
        date: p.created_at
      })),
      ...transactions.slice(-3).map(t => ({
        type: 'transaction',
        message: `${t.type === 'entrada' ? 'Recebimento' : 'Pagamento'}: R$ ${t.amount.toLocaleString()}`,
        date: t.created_at
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

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
    <AppContext.Provider value={{
      clients,
      projects,
      transactions,
      products,
      stockMovements,
      loading,
      addClient,
      updateClient,
      deleteClient,
      addProject,
      updateProject,
      deleteProject,
      addTransaction,
      addProduct,
      updateProduct,
      deleteProduct,
      addStockMovement,
      processProjectStockMovement,
      calculateProductCost,
      getAvailableComponents,
      getDashboardStats,
      refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};
