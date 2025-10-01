import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const MOCK_USER_ID = 'local-user-1';

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
  address: {
    country: string;
    state: string;
    city: string;
    zipCode: string;
    neighborhood: string;
    streetType: string;
    street: string;
  };
  created_at: string;
  total_projects?: number;
  total_value?: number;
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
  created_at: string;
}

export interface ProductComponent {
  product_id: string;
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
  created_at: string;
  materials_cost?: number;
  labor_cost?: number;
  profit_margin?: number;
  payment_terms?: PaymentTerms;
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
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  type: 'entrada' | 'saida';
  quantity: number;
  unit_price?: number;
  total_value?: number;
  project_id?: string;
  project_title?: string;
  date: string;
  created_at: string;
}

interface AppContextType {
  clients: Client[];
  projects: Project[];
  transactions: Transaction[];
  products: Product[];
  stockMovements: StockMovement[];
  loading: boolean;
  addClient: (client: Omit<Client, 'id' | 'created_at'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'number'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'created_at'>) => Promise<void>;
  processProjectStockMovement: (projectId: string, products: ProjectProduct[]) => Promise<void>;
  calculateProductCost: (productId: string) => Promise<number>;
  getAvailableComponents: () => Product[];
  exportClientsCSV: () => void;
  exportProductsCSV: () => void;
  exportProjectsCSV: () => void;
  exportTransactionsCSV: () => void;
  importClientsCSV: (file: File) => Promise<void>;
  importProductsCSV: (file: File) => Promise<void>;
  importProjectsCSV: (file: File) => Promise<void>;
  importTransactionsCSV: (file: File) => Promise<void>;
  getDashboardStats: () => {
    totalClients: number;
    activeProjects: number;
    monthlyRevenue: number;
    pendingPayments: number;
    lowStockItems: number;
    recentActivity: any[];
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AppContext] Loading data from localStorage...');

    const loadedClients = loadFromStorage('clients', []);
    const loadedProjects = loadFromStorage('projects', []);
    const loadedTransactions = loadFromStorage('transactions', []);
    const loadedProducts = loadFromStorage('products', []);
    const loadedStockMovements = loadFromStorage('stockMovements', []);

    const isFirstTime = loadedClients.length === 0 &&
                        loadedProjects.length === 0 &&
                        loadedProducts.length === 0;

    if (isFirstTime) {
      console.log('[AppContext] First time setup - adding demo data...');

      const demoClient: Client = {
        id: generateId(),
        name: 'João Silva',
        type: 'pf',
        cpf: '123.456.789-00',
        email: 'joao@email.com',
        phone: '(11) 3333-4444',
        mobile: '(11) 98888-7777',
        fl_ativo: true,
        address: {
          country: 'Brasil',
          state: 'SP',
          city: 'São Paulo',
          zipCode: '01310-100',
          neighborhood: 'Centro',
          streetType: 'Rua',
          street: 'Exemplo'
        },
        created_at: new Date().toISOString(),
        total_projects: 0,
        total_value: 0
      };

      const demoProduct: Product = {
        id: generateId(),
        name: 'Madeira Compensada',
        description: 'Compensado 15mm',
        category: 'Madeiras',
        type: 'material_bruto',
        unit: 'M²',
        components: [],
        cost_price: 120.00,
        sale_price: 180.00,
        current_stock: 50,
        min_stock: 10,
        created_at: new Date().toISOString()
      };

      setClients([demoClient]);
      setProducts([demoProduct]);
      setProjects([]);
      setTransactions([]);
      setStockMovements([]);

      saveToStorage('clients', [demoClient]);
      saveToStorage('products', [demoProduct]);
      saveToStorage('projects', []);
      saveToStorage('transactions', []);
      saveToStorage('stockMovements', []);
    } else {
      setClients(loadedClients);
      setProjects(loadedProjects);
      setTransactions(loadedTransactions);
      setProducts(loadedProducts);
      setStockMovements(loadedStockMovements);
    }

    setLoading(false);
    console.log('[AppContext] Data loaded successfully');
  }, []);

  useEffect(() => {
    if (!loading) {
      saveToStorage('clients', clients);
    }
  }, [clients, loading]);

  useEffect(() => {
    if (!loading) {
      saveToStorage('projects', projects);
    }
  }, [projects, loading]);

  useEffect(() => {
    if (!loading) {
      saveToStorage('transactions', transactions);
    }
  }, [transactions, loading]);

  useEffect(() => {
    if (!loading) {
      saveToStorage('products', products);
    }
  }, [products, loading]);

  useEffect(() => {
    if (!loading) {
      saveToStorage('stockMovements', stockMovements);
    }
  }, [stockMovements, loading]);

  const addClient = async (clientData: Omit<Client, 'id' | 'created_at'>) => {
    const newClient: Client = {
      ...clientData,
      id: generateId(),
      created_at: new Date().toISOString()
    };
    setClients(prev => [newClient, ...prev]);
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(client =>
      client.id === id ? { ...client, ...updates } : client
    ));
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
  };

  const addProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'number'>) => {
    const projectNumber = projects.length > 0
      ? Math.max(...projects.map(p => p.number)) + 1
      : 1;

    const newProject: Project = {
      ...projectData,
      id: generateId(),
      number: projectNumber,
      created_at: new Date().toISOString()
    };

    setProjects(prev => [newProject, ...prev]);

    if (projectData.type === 'venda' && projectData.status !== 'orcamento') {
      const signalAmount = projectData.budget * 0.5;
      await addTransaction({
        project_id: newProject.id,
        project_title: projectData.title,
        type: 'entrada',
        category: 'Sinal',
        description: `Sinal do projeto #${projectNumber} - ${projectData.title}`,
        amount: signalAmount,
        date: new Date().toISOString().split('T')[0]
      });

      if (projectData.products && projectData.products.length > 0) {
        await processProjectStockMovement(newProject.id, projectData.products);
      }
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const project = projects.find(p => p.id === id);

    setProjects(prev => prev.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ));

    if (updates.status === 'concluido' && project && project.status !== 'concluido') {
      const remainingAmount = project.budget * 0.5;
      await addTransaction({
        project_id: id,
        project_title: project.title,
        type: 'entrada',
        category: 'Pagamento Final',
        description: `Pagamento final - Projeto #${project.number}`,
        amount: remainingAmount,
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
    setTransactions(prev => prev.filter(t => t.project_id !== id));
    setStockMovements(prev => prev.filter(sm => sm.project_id !== id));
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: generateId(),
      created_at: new Date().toISOString()
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const checkCircularReference = (productId: string, componentId: string): boolean => {
    if (productId === componentId) return true;

    const product = products.find(p => p.id === componentId);
    if (!product || !product.components) return false;

    for (const comp of product.components) {
      if (checkCircularReference(productId, comp.product_id)) {
        return true;
      }
    }

    return false;
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at'>) => {
    if (productData.components && productData.components.length > 0) {
      const tempId = generateId();
      for (const component of productData.components) {
        if (checkCircularReference(tempId, component.product_id)) {
          throw new Error('Referência circular detectada: um produto não pode usar a si mesmo como componente.');
        }
      }
    }

    const newProduct: Product = {
      ...productData,
      id: generateId(),
      created_at: new Date().toISOString()
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = async (product: Product) => {
    if (product.components && product.components.length > 0) {
      for (const component of product.components) {
        if (checkCircularReference(product.id, component.product_id)) {
          throw new Error('Referência circular detectada: um produto não pode usar a si mesmo como componente.');
        }
      }
    }

    setProducts(prev => prev.map(p =>
      p.id === product.id ? product : p
    ));
  };

  const deleteProduct = async (id: string) => {
    const usedIn = products.some(p =>
      p.components && p.components.some(c => c.product_id === id)
    );

    if (usedIn) {
      throw new Error('Este produto é usado como componente em outros produtos e não pode ser excluído.');
    }

    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const addStockMovement = async (movementData: Omit<StockMovement, 'id' | 'created_at'>) => {
    const newMovement: StockMovement = {
      ...movementData,
      id: generateId(),
      created_at: new Date().toISOString()
    };
    setStockMovements(prev => [newMovement, ...prev]);

    setProducts(prev => prev.map(p => {
      if (p.id === movementData.product_id) {
        const newStock = movementData.type === 'entrada'
          ? p.current_stock + movementData.quantity
          : p.current_stock - movementData.quantity;
        return { ...p, current_stock: newStock };
      }
      return p;
    }));
  };

  const processProjectStockMovement = async (projectId: string, projectProducts: ProjectProduct[]) => {
    for (const projectProduct of projectProducts) {
      const product = products.find(p => p.id === projectProduct.product_id);
      if (product) {
        await addStockMovement({
          product_id: product.id,
          product_name: product.name,
          type: 'saida',
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
              product_id: component.product_id,
              product_name: component.product_name,
              type: 'saida',
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
      const componentCost = await calculateProductCost(component.product_id);
      totalCost += componentCost * component.quantity;
    }

    return totalCost;
  };

  const getAvailableComponents = (): Product[] => {
    return products;
  };

  const exportClientsCSV = () => {
    const headers = [
      'tipo', 'nome', 'endereco', 'tipopessoa', 'fone_comercial', 'fone_celular',
      'cep', 'cidade', 'email', 'cpf_cnpj', 'inscricao_estadual', 'bairro',
      'complemento', 'numero', 'isento_icms', 'razao_social', 'id_empresa', 'fl_ativo'
    ];

    const csvContent = [
      headers.join(','),
      ...clients.map(client => [
        'Cliente',
        `"${client.name}"`,
        `"${client.address.streetType} ${client.address.street}"`,
        client.type === 'pj' ? 'J' : 'F',
        `"${client.phone}"`,
        `"${client.mobile}"`,
        `"${client.address.zipCode}"`,
        `"${client.address.city}"`,
        `"${client.email}"`,
        `"${client.type === 'pj' ? client.cnpj : client.cpf}"`,
        `"${client.inscricao_estadual || ''}"`,
        `"${client.address.neighborhood}"`,
        `"${client.complemento || ''}"`,
        `"${client.numero || ''}"`,
        client.isento_icms ? 'true' : 'false',
        `"${client.razao_social || ''}"`,
        `"${client.id_empresa || ''}"`,
        client.fl_ativo ? 'true' : 'false'
      ].join(','))
    ].join('\n');

    downloadCSV(csvContent, 'clientes.csv');
  };

  const exportProductsCSV = () => {
    const headers = ['id', 'nome', 'descricao', 'categoria', 'tipo', 'unidade', 'custo', 'preco_venda', 'estoque_atual', 'estoque_minimo', 'componentes'];

    const csvContent = [
      headers.join(','),
      ...products.map(product => [
        `"${product.id}"`,
        `"${product.name}"`,
        `"${product.description}"`,
        `"${product.category}"`,
        `"${product.type}"`,
        `"${product.unit}"`,
        product.cost_price,
        product.sale_price || 0,
        product.current_stock,
        product.min_stock,
        `"${product.components.map(c => `${c.product_name}:${c.quantity}`).join(';')}"`
      ].join(','))
    ].join('\n');

    downloadCSV(csvContent, 'produtos.csv');
  };

  const exportProjectsCSV = () => {
    const headers = [
      'numero', 'cliente', 'titulo', 'descricao', 'status', 'tipo', 'orcamento',
      'data_inicio', 'data_fim', 'custo_materiais', 'custo_mao_obra', 'margem_lucro'
    ];

    const csvContent = [
      headers.join(','),
      ...projects.map(project => [
        project.number,
        `"${project.client_name}"`,
        `"${project.title}"`,
        `"${project.description}"`,
        `"${project.status}"`,
        `"${project.type}"`,
        project.budget,
        `"${project.start_date}"`,
        `"${project.end_date}"`,
        project.materials_cost || 0,
        project.labor_cost || 0,
        project.profit_margin || 0
      ].join(','))
    ].join('\n');

    downloadCSV(csvContent, 'projetos.csv');
  };

  const exportTransactionsCSV = () => {
    const headers = ['tipo', 'categoria', 'descricao', 'valor', 'data', 'projeto'];

    const csvContent = [
      headers.join(','),
      ...transactions.map(transaction => [
        `"${transaction.type}"`,
        `"${transaction.category}"`,
        `"${transaction.description}"`,
        transaction.amount,
        `"${transaction.date}"`,
        `"${transaction.project_title || ''}"`
      ].join(','))
    ].join('\n');

    downloadCSV(csvContent, 'transacoes.csv');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const importClientsCSV = async (file: File): Promise<void> => {
    const text = await file.text();
    const lines = text.split('\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      if (values.length < 10) continue;

      const clientData: Omit<Client, 'id' | 'created_at'> = {
        name: values[1] || '',
        type: values[3] === 'J' ? 'pj' : 'pf',
        cpf: values[3] === 'F' ? values[9] : undefined,
        cnpj: values[3] === 'J' ? values[9] : undefined,
        email: values[8] || '',
        phone: values[4] || '',
        mobile: values[5] || '',
        razao_social: values[15] || undefined,
        inscricao_estadual: values[10] || undefined,
        isento_icms: values[14] === 'true',
        numero: values[13] || undefined,
        complemento: values[12] || undefined,
        id_empresa: values[16] || undefined,
        fl_ativo: values[17] !== 'false',
        address: {
          country: 'Brasil',
          state: '',
          city: values[7] || '',
          zipCode: values[6] || '',
          neighborhood: values[11] || '',
          streetType: 'Rua',
          street: values[2] || ''
        },
        total_projects: 0,
        total_value: 0
      };

      await addClient(clientData);
    }
  };

  const importProductsCSV = async (file: File): Promise<void> => {
    const text = await file.text();
    const lines = text.split('\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      if (values.length < 10) continue;

      const productData: Omit<Product, 'id' | 'created_at'> = {
        name: values[1] || '',
        description: values[2] || '',
        category: values[3] || '',
        type: (values[4] as any) || 'material_bruto',
        unit: values[5] || 'UN',
        cost_price: parseFloat(values[6]) || 0,
        sale_price: parseFloat(values[7]) || undefined,
        current_stock: parseFloat(values[8]) || 0,
        min_stock: parseFloat(values[9]) || 0,
        components: []
      };

      await addProduct(productData);
    }
  };

  const importProjectsCSV = async (file: File): Promise<void> => {
    const text = await file.text();
    const lines = text.split('\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      if (values.length < 8) continue;

      const client = clients.find(c => c.name === values[1]);
      if (!client) continue;

      const projectData: Omit<Project, 'id' | 'created_at' | 'number'> = {
        client_id: client.id,
        client_name: values[1],
        title: values[2] || '',
        description: values[3] || '',
        status: (values[4] as any) || 'orcamento',
        type: (values[5] as any) || 'orcamento',
        products: [],
        budget: parseFloat(values[6]) || 0,
        start_date: values[7] || new Date().toISOString().split('T')[0],
        end_date: values[8] || new Date().toISOString().split('T')[0],
        materials_cost: parseFloat(values[9]) || 0,
        labor_cost: parseFloat(values[10]) || 0,
        profit_margin: parseFloat(values[11]) || 20
      };

      await addProject(projectData);
    }
  };

  const importTransactionsCSV = async (file: File): Promise<void> => {
    const text = await file.text();
    const lines = text.split('\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      if (values.length < 5) continue;

      const transactionData: Omit<Transaction, 'id' | 'created_at'> = {
        type: (values[0] as any) || 'entrada',
        category: values[1] || '',
        description: values[2] || '',
        amount: parseFloat(values[3]) || 0,
        date: values[4] || new Date().toISOString().split('T')[0],
        project_title: values[5] || undefined
      };

      await addTransaction(transactionData);
    }
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
      exportClientsCSV,
      exportProductsCSV,
      exportProjectsCSV,
      exportTransactionsCSV,
      importClientsCSV,
      importProductsCSV,
      importProjectsCSV,
      importTransactionsCSV,
      getDashboardStats
    }}>
      {children}
    </AppContext.Provider>
  );
};
