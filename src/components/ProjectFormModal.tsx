import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Briefcase,
  FileText,
  User,
  Calendar,
  DollarSign,
  Package,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  Check,
  Wrench,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useApp, Project, ProjectProduct, ItemType } from '../contexts/AppContext';
import ClientModal from './ClientModal';

interface ProjectFormModalProps {
  project?: Project | null;
  onClose: () => void;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ project, onClose }) => {
  const { clients, products, addProject, updateProject, loading, refreshData } = useApp();

  const hasLoadedData = useRef(false);
  const isInitialized = useRef(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    client_id: '',
    description: '',
    status: 'orcamento' as 'orcamento' | 'aprovado' | 'em_producao' | 'concluido' | 'entregue',
    type: 'orcamento' as 'orcamento' | 'venda',
    start_date: new Date().toISOString().split('T')[0],
    delivery_deadline_days: 15,
    end_date: '',
    materials_cost: '',
    labor_cost: '',
    profit_margin: '20'
  });

  const [projectProducts, setProjectProducts] = useState<ProjectProduct[]>([]);
  const [paymentTerms, setPaymentTerms] = useState({
    installments: 1,
    payment_method: 'pix' as 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia',
    discount_percentage: 0,
    installment_interval: 30 // NOVO: Intervalo em dias entre parcelas
  });

  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [itemTypeToAdd, setItemTypeToAdd] = useState<ItemType>('produto');
  const [showClientModal, setShowClientModal] = useState(false); // NOVO: Estado do modal de cliente

  // Carrega dados do projeto ao editar
  useEffect(() => {
    if (loading || !clients.length || !products.length) return;

    if (!project) {
      resetForm();
      isInitialized.current = true;
      return;
    }

    if (typeof project !== 'object' || !project.id) return;

    loadProjectData(project);
    isInitialized.current = true;
  }, [project, clients, products, loading]);

  const resetForm = () => {
    setFormData({
      client_id: '',
      description: '',
      status: 'orcamento',
      type: 'orcamento',
      start_date: new Date().toISOString().split('T')[0],
      delivery_deadline_days: 15,
      end_date: '',
      materials_cost: '',
      labor_cost: '',
      profit_margin: '20'
    });
    setProjectProducts([]);
    setPaymentTerms({
      installments: 1,
      payment_method: 'pix',
      discount_percentage: 0,
      installment_interval: 30
    });
    setClientSearch('');
    setSelectedClientName('');
    hasLoadedData.current = false;
  };

  const loadProjectData = (project: Project) => {
    console.log('📥 Iniciando carregamento dos dados do projeto...');
  
  try {
    console.log('📋 Carregando dados básicos...');
    
    // Função auxiliar para formatar data
    const formatDate = (dateString: string | undefined): string => {
      if (!dateString) return new Date().toISOString().split('T')[0];
      // Remove tudo após 'T' e mantém apenas yyyy-MM-dd
      return dateString.split('T')[0];
    };
    setFormData({
      client_id: project.client_id || '',
      description: project.description || '',
      status: project.status || 'orcamento',
      type: project.type || 'orcamento',
      start_date: project.start_date || new Date().toISOString().split('T')[0],
      delivery_deadline_days: project.delivery_deadline_days || 15,
      end_date: project.end_date || '',
      materials_cost: project.materials_cost?.toString() || '',
      labor_cost: project.labor_cost?.toString() || '',
      profit_margin: project.profit_margin?.toString() || '20'
    });

    const safeProducts = Array.isArray(project.products) ? project.products : [];
    if (safeProducts.length > 0) {
      const validatedProducts: ProjectProduct[] = safeProducts
        .filter(p => p && typeof p === 'object')
        .map((p) => ({
          id: p.id || `temp-${Date.now()}-${Math.random()}`,
          product_id: p.product_id || null,
          product_name: p.product_name || p.name || 'Produto sem nome',
          quantity: Number(p.quantity) || 1,
          unit_price: Number(p.unit_price) || 0,
          total_price: Number(p.total_price) || 0,
          item_type: (p.item_type || 'produto') as ItemType,
          item_description: p.item_description || p.description || '',
          service_hours: p.item_type === 'servico' ? (Number(p.service_hours) || 0) : undefined,
          hourly_rate: p.item_type === 'servico' ? (Number(p.hourly_rate) || 0) : undefined
        }));
      
      setTimeout(() => {
        setProjectProducts(validatedProducts);
      }, 0);
    } else {
      setProjectProducts([]);
    }

    if (project.payment_terms) {
      setPaymentTerms({
        installments: project.payment_terms.installments || 1,
        payment_method: project.payment_terms.payment_method || 'pix',
        discount_percentage: project.payment_terms.discount_percentage || 0,
        installment_interval: (project.payment_terms as any).installment_interval || 30
      });
    }

    const client = clients.find(c => c.id === project.client_id);
    if (client) {
      setSelectedClientName(client.name);
      setClientSearch(client.name);
    }

     hasLoadedData.current = true;
    } catch (error) {
      console.error('❌ Erro ao carregar dados do projeto:', error);
    }
  };
  
  // Calcula data de entrega automaticamente
  useEffect(() => {
    if (formData.start_date && formData.delivery_deadline_days) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(startDate);
      
      // ✅ IMPORTANTE: Converter para número para evitar concatenação de strings
      const daysToAdd = Number(formData.delivery_deadline_days);
      
      // ✅ Validar se é um número válido
      if (!isNaN(daysToAdd) && daysToAdd > 0) {
        endDate.setDate(endDate.getDate() + daysToAdd);
        
        const calculatedEndDate = endDate.toISOString().split('T')[0];
        
        // ✅ Só atualiza se a data calculada for diferente da atual
        if (calculatedEndDate !== formData.end_date) {
          setFormData(prev => ({
            ...prev,
            end_date: calculatedEndDate
          }));
        }
      }
    }
  }, [formData.start_date, formData.delivery_deadline_days]); // Mantém as dependências

  const calculateBudget = () => {
     const productsTotal = projectProducts.reduce((sum, p) => {
      const totalPrice = Number(p.total_price) || 0;
      return sum + totalPrice;
    }, 0);
    const materialsCost = parseFloat(formData.materials_cost) || 0;
    const laborCost = parseFloat(formData.labor_cost) || 0;
    const profitMargin = parseFloat(formData.profit_margin) || 0;
    
    const totalCosts = productsTotal + materialsCost + laborCost;
    const budget = totalCosts * (1 + profitMargin / 100);
    return budget;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

      console.log('🚀 [ProjectFormModal] handleSubmit chamado!');
      console.log('📋 [ProjectFormModal] formData:', formData);
      console.log('📦 [ProjectFormModal] projectProducts:', projectProducts);
      console.log('💳 [ProjectFormModal] paymentTerms:', paymentTerms);
    
      if (!formData.client_id) {
        console.error('❌ [ProjectFormModal] Cliente não selecionado!');
        alert('Por favor, selecione um cliente');
        return;
      }
    
      if (!formData.description.trim()) {
        console.error('❌ [ProjectFormModal] Descrição vazia!');
        alert('Por favor, adicione uma descrição');
        return;
      }
    
      if (projectProducts.length === 0) {
        console.error('❌ [ProjectFormModal] Nenhum produto adicionado!');
        alert('Por favor, adicione pelo menos um produto ou serviço');
        return;
      }
    
    console.log('✅ [ProjectFormModal] Validações iniciais passaram!');

    const budget = calculateBudget();
       console.log('💰 [ProjectFormModal] Budget calculado:', budget);

    const discountAmount = budget * (paymentTerms.discount_percentage / 100);
    const finalValue = budget - discountAmount;
    const installmentValue = finalValue / paymentTerms.installments;

    const validatedProducts = projectProducts.map(p => ({
      ...p,
      quantity: Number(p.quantity) || 1,
      unit_price: Number(p.unit_price) || 0,
      total_price: Number(p.total_price) || 0
    }));

    const projectData = {
      client_id: formData.client_id,
      description: formData.description,
      status: formData.status,
      type: formData.type,
      products: validatedProducts,
      budget,
      start_date: formData.start_date,
      end_date: formData.end_date,
      delivery_deadline_days: formData.delivery_deadline_days,
      materials_cost: parseFloat(formData.materials_cost) || 0,
      labor_cost: parseFloat(formData.labor_cost) || 0,
      profit_margin: parseFloat(formData.profit_margin) || 20,
      payment_terms: {
        installments: paymentTerms.installments,
        payment_method: paymentTerms.payment_method,
        discount_percentage: paymentTerms.discount_percentage,
        installment_value: installmentValue,
        total_with_discount: finalValue,
        installment_interval: paymentTerms.installment_interval // NOVO: Salva intervalo
      }
    };

       console.log('📤 [ProjectFormModal] Dados finais para enviar:', projectData);

     try {
        if (project) {
          console.log('🔄 [ProjectFormModal] Atualizando projeto:', project.id);
          await updateProject(project.id, projectData);
          console.log('✅ [ProjectFormModal] Projeto atualizado!');
        } else {
          console.log('➕ [ProjectFormModal] Criando novo projeto...');
          await addProject(projectData);
          console.log('✅ [ProjectFormModal] Projeto criado!');
        }
        
        console.log('🎉 [ProjectFormModal] Fechando modal...');

       console.log('🔄 [ProjectFormModal] Recarregando dados...');
        await refreshData();
        console.log('✅ [ProjectFormModal] Dados recarregados!');
       
        onClose();
      } catch (error) {
        console.error('💥 [ProjectFormModal] Erro ao salvar:', error);
        console.error('💥 [ProjectFormModal] Stack:', error.stack);
        alert('Erro ao salvar pedido/venda: ' + (error as any)?.message);
      }
    };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPaymentTerms(prev => ({
      ...prev,
      [name]: name === 'installments' || name === 'discount_percentage' || name === 'installment_interval' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (client.cpf && client.cpf.includes(clientSearch)) ||
    (client.cnpj && client.cnpj.includes(clientSearch))
  );

  const handleClientSelect = (client: any) => {
    setFormData(prev => ({ ...prev, client_id: client.id }));
    setSelectedClientName(client.name);
    setClientSearch(client.name);
    setShowClientDropdown(false);
  };

  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClientSearch(value);
    setShowClientDropdown(true);
    const exactMatch = clients.find(c => c.name.toLowerCase() === value.toLowerCase());
    if (!exactMatch) {
      setFormData(prev => ({ ...prev, client_id: '' }));
      setSelectedClientName('');
    }
  };

  const addProductToProject = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setProjectProducts(prev => {
      const existingProduct = prev.find(p => p.product_id === productId);
      if (existingProduct) {
        return prev.map(p => 
          p.product_id === productId 
            ? { ...p, quantity: p.quantity + 1, total_price: (p.quantity + 1) * p.unit_price }
            : p
        );
      } else {
        const unitPrice = product.sale_price || product.cost_price * 1.5;
        const newProduct: ProjectProduct = {
          id: `new-${Date.now()}-${Math.random()}`,
          product_id: productId,
          product_name: product.name,
          quantity: 1,
          unit_price: unitPrice,
          total_price: unitPrice,
          item_type: 'produto',
          item_description: product.description || ''
        };
        return [...prev, newProduct];
      }
    });

    setShowProductSearch(false);
    setProductSearch('');
  };

  const addServiceToProject = () => {
    const newService: ProjectProduct = {
      id: `service-${Date.now()}-${Math.random()}`,
      product_id: null,
      product_name: 'Novo Serviço',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      item_type: 'servico',
      service_hours: 1,
      hourly_rate: 50,
      item_description: ''
    };
    setProjectProducts(prev => [...prev, newService]);
  };

  const updateProductQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(itemId);
      return;
    }
    setProjectProducts(prev => prev.map(p => {
      if (p.id === itemId) {
        const newQuantity = Math.max(1, quantity);
        let newTotal = newQuantity * p.unit_price;
        if (p.item_type === 'servico' && p.service_hours && p.hourly_rate) {
          newTotal = (p.service_hours * p.hourly_rate) * newQuantity;
        }
        return { ...p, quantity: newQuantity, total_price: newTotal };
      }
      return p;
    }));
  };

  const updateProductPrice = (itemId: string, unitPrice: number) => {
    setProjectProducts(prev => prev.map(p => {
      if (p.id === itemId) {
        const newPrice = Math.max(0, unitPrice);
        const newTotal = p.quantity * newPrice;
        return { ...p, unit_price: newPrice, total_price: newTotal };
      }
      return p;
    }));
  };

  const updateServiceHours = (itemId: string, hours: number) => {
    setProjectProducts(prev => prev.map(p => {
      if (p.id === itemId && p.item_type === 'servico') {
        const newHours = Math.max(0, hours);
        const hourlyRate = p.hourly_rate || 0;
        const unitPrice = newHours * hourlyRate;
        return {
          ...p,
          service_hours: newHours,
          unit_price: unitPrice,
          total_price: unitPrice * p.quantity
        };
      }
      return p;
    }));
  };

  const updateHourlyRate = (itemId: string, rate: number) => {
    setProjectProducts(prev => prev.map(p => {
      if (p.id === itemId && p.item_type === 'servico') {
        const newRate = Math.max(0, rate);
        const hours = p.service_hours || 0;
        const unitPrice = hours * newRate;
        return {
          ...p,
          hourly_rate: newRate,
          unit_price: unitPrice,
          total_price: unitPrice * p.quantity
        };
      }
      return p;
    }));
  };

  const updateItemName = (itemId: string, name: string) => {
    setProjectProducts(prev => prev.map(p =>
      p.id === itemId ? { ...p, product_name: name } : p
    ));
  };

  const updateItemDescription = (itemId: string, description: string) => {
    setProjectProducts(prev => prev.map(p =>
      p.id === itemId ? { ...p, item_description: description } : p
    ));
  };

  const removeProduct = (itemId: string) => {
    setProjectProducts(prev => prev.filter(p => p.id !== itemId));
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.description.toLowerCase().includes(productSearch.toLowerCase())
  );

  const budget = calculateBudget();
  const discountAmount = budget * (paymentTerms.discount_percentage / 100);
  const finalValue = budget - discountAmount;

  if (loading || !isInitialized.current) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-xl sticky top-0 z-10">
          <h2 className="text-2xl font-bold">
            {project ? 'Editar Pedido/Orçamento' : 'Novo Pedido/Orçamento'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* SEÇÃO DE CLIENTE COM BOTÃO DE ADICIONAR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 inline mr-2 text-amber-600" />
                  Cliente *
                </label>
                <button
                  type="button"
                  onClick={() => setShowClientModal(true)}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Novo Cliente</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={clientSearch}
                  onChange={handleClientSearchChange}
                  onFocus={() => setShowClientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  placeholder="Digite para buscar cliente..."
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                {formData.client_id && (
                  <Check className="absolute right-10 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
              
              {showClientDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleClientSelect(client)}
                        className={`w-full text-left px-4 py-3 hover:bg-amber-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                          formData.client_id === client.id ? 'bg-amber-50 text-amber-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-gray-500">
                              {client.email} • {client.mobile}
                            </div>
                          </div>
                          {formData.client_id === client.id && <Check className="h-5 w-5 text-amber-600" />}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum cliente encontrado</p>
                    </div>
                  )}
                </div>
              )}
              
              {!formData.client_id && clientSearch && (
                <p className="mt-1 text-sm text-red-600">Por favor, selecione um cliente da lista</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="orcamento">📋 Orçamento</option>
                <option value="venda">✅ Venda</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2 text-amber-600" />
              Descrição do Pedido *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Descreva o pedido/orçamento..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="orcamento">Orçamento</option>
              <option value="aprovado">Aprovado</option>
              <option value="em_producao">Em Produção</option>
              <option value="concluido">Concluído</option>
              <option value="entregue">Entregue</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2 text-amber-600" />
                Data de Início *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-2 text-orange-600" />
                Prazo de Entrega (dias) *
              </label>
              <input
                type="number"
                name="delivery_deadline_days"
                value={formData.delivery_deadline_days}
                onChange={handleChange}
                min="1"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2 text-green-600" />
                Data de Entrega *
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50"
                readOnly
              />
            </div>
          </div>

          {/* PRODUTOS E SERVIÇOS */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Produtos e Serviços
                {projectProducts.length > 0 && (
                  <span className="ml-2 text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    {projectProducts.length} {projectProducts.length === 1 ? 'item' : 'itens'}
                  </span>
                )}
              </h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setItemTypeToAdd('produto');
                    setShowProductSearch(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Package className="h-4 w-4" />
                  <span>Adicionar Produto</span>
                </button>
                
                <button
                  type="button"
                  onClick={addServiceToProject}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                >
                  <Wrench className="h-4 w-4" />
                  <span>Adicionar Serviço</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {projectProducts.map((item, index) => (
                <div 
                  key={`${item.id}-${index}`}
                  className={`bg-white p-4 rounded-lg border-2 ${
                    item.item_type === 'servico' 
                      ? 'border-orange-200 bg-orange-50' 
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {item.item_type === 'servico' ? (
                        <>
                          <Wrench className="h-5 w-5 text-orange-600" />
                          <span className="text-sm font-medium text-orange-700">SERVIÇO #{index + 1}</span>
                        </>
                      ) : (
                        <>
                          <Package className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">PRODUTO #{index + 1}</span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Nome do {item.item_type === 'servico' ? 'Serviço' : 'Produto'}
                    </label>
                    {item.item_type === 'servico' ? (
                      <input
                        type="text"
                        value={item.product_name}
                        onChange={(e) => updateItemName(item.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Ex: Instalação de móveis"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-800 bg-gray-100 px-3 py-2 rounded-lg">
                        {item.product_name}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                    <textarea
                      value={item.item_description || ''}
                      onChange={(e) => updateItemDescription(item.id, e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      placeholder="Descrição detalhada do item..."
                    />
                  </div>

                  {item.item_type === 'produto' ? (
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateProductQuantity(item.id, parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Preço Unit. (R$)</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateProductPrice(item.id, parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                        <div className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg text-sm font-bold text-blue-900">
                          R$ {(item.total_price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Horas *</label>
                          <input
                            type="number"
                            value={item.service_hours || 0}
                            onChange={(e) => updateServiceHours(item.id, parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="6.0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Valor/Hora (R$) *</label>
                          <input
                            type="number"
                            value={item.hourly_rate || 0}
                            onChange={(e) => updateHourlyRate(item.id, parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="50.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateProductQuantity(item.id, parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-orange-700">
                            <span className="font-medium">Cálculo: </span>
                            {item.service_hours || 0}h × R$ {(item.hourly_rate || 0).toFixed(2)}/h 
                            {item.quantity > 1 && ` × ${item.quantity}`}
                          </div>
                          <div className="text-sm font-bold text-orange-900">
                            Total: R$ {(item.total_price || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {projectProducts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="flex justify-center space-x-4 mb-4">
                  <Package className="h-12 w-12 text-gray-300" />
                  <Wrench className="h-12 w-12 text-gray-300" />
                </div>
                <p className="text-gray-500 mb-2">Nenhum item adicionado</p>
                <p className="text-sm text-gray-400">
                  Adicione produtos do catálogo ou serviços personalizados
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-2 text-green-600" />
                Custo de Materiais (R$)
              </label>
              <input
                type="number"
                name="materials_cost"
                value={formData.materials_cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custo de Mão de Obra (R$)
              </label>
              <input
                type="number"
                name="labor_cost"
                value={formData.labor_cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margem de Lucro (%)
              </label>
              <input
                type="number"
                name="profit_margin"
                value={formData.profit_margin}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="20"
              />
            </div>
          </div>

          {/* CONDIÇÕES DE PAGAMENTO COM INTERVALO */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Condições de Pagamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <select
                  name="payment_method"
                  value={paymentTerms.payment_method}
                  onChange={handlePaymentChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="boleto">Boleto</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Parcelas
                </label>
                <input
                  type="number"
                  name="installments"
                  value={paymentTerms.installments}
                  onChange={handlePaymentChange}
                  min="1"
                  max="12"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* NOVO: INTERVALO ENTRE PARCELAS */}
              {paymentTerms.installments > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo entre Parcelas (dias)
                  </label>
                  <select
                    name="installment_interval"
                    value={paymentTerms.installment_interval}
                    onChange={handlePaymentChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="7">Semanal (7 dias)</option>
                    <option value="15">Quinzenal (15 dias)</option>
                    <option value="30">Mensal (30 dias)</option>
                    <option value="60">Bimestral (60 dias)</option>
                    <option value="90">Trimestral (90 dias)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    📅 Próximas parcelas: {Array.from({ length: Math.min(3, paymentTerms.installments - 1) }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() + (paymentTerms.installment_interval * (i + 1)));
                      return date.toLocaleDateString('pt-BR');
                    }).join(', ')}
                    {paymentTerms.installments > 4 && '...'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desconto (%)
                </label>
                <input
                  type="number"
                  name="discount_percentage"
                  value={paymentTerms.discount_percentage}
                  onChange={handlePaymentChange}
                  min="0"
                  max="50"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Resumo Financeiro</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Valor Bruto:</span>
                <p className="font-bold text-green-800">R$ {budget.toFixed(2)}</p>
              </div>
              {paymentTerms.discount_percentage > 0 && (
                <div>
                  <span className="text-gray-600">Desconto:</span>
                  <p className="font-bold text-red-600">R$ {discountAmount.toFixed(2)}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Valor Final:</span>
                <p className="font-bold text-green-800">R$ {finalValue.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-600">Parcela:</span>
                <p className="font-bold text-green-800">R$ {(finalValue / paymentTerms.installments).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
                onClick={(e) => {
                  console.log('🖱️ [ProjectFormModal] Botão "Criar Pedido" clicado!');
                }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {project ? 'Atualizar' : 'Criar'} Pedido
            </button>
          </div>
        </form>

        {/* MODAL DE BUSCA DE PRODUTOS */}
        {showProductSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Selecionar Produto</h3>
                  <button
                    onClick={() => {
                      setShowProductSearch(false);
                      setProductSearch('');
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto p-4">
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProductToProject(product.id)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.description}</p>
                          <p className="text-xs text-gray-500">Categoria: {product.category}</p>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-green-600">
                            R$ {(product.sale_price || product.cost_price).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">Estoque: {product.current_stock}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE NOVO CLIENTE */}
        {showClientModal && (
          <ClientModal
            isOpen={showClientModal}
            onClose={() => setShowClientModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectFormModal;
