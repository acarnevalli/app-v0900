import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Calendar, 
  Search, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  Check,
  AlertCircle,
  Loader,
  DollarSign,
  CreditCard,
  Truck,
  Receipt
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import ClientModal from '../components/ClientModal';

// ====== INTERFACES ======

interface PaymentInfo {
  payment_method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia' | 'cheque';
  installments: number;
  installment_value: number;
  first_due_date: string;
  has_shipping: boolean;
  shipping_cost: number;
  shipping_type?: string;
  received: boolean;
  received_date?: string;
}

interface FormData {
  client_id: string;
  date: string;
  delivery_date: string;
  status: 'pending' | 'in_production' | 'completed' | 'delivered' | 'cancelled';
  notes: string;
  payment_info: PaymentInfo;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const Sales: React.FC = () => {
  const { 
    orders = [], 
    clients = [], 
    products = [], 
    addOrder, 
    updateOrder,
    deleteOrder,
    addFinancialTransaction // ✅ Para integrar com financeiro
  } = useApp();

  // ====== ESTADOS ======
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Função para obter data atual com timezone correto
  const getCurrentDate = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Estado do formulário
  const [formData, setFormData] = useState<FormData>({
    client_id: '',
    date: getCurrentDate(),
    delivery_date: '',
    status: 'pending',
    notes: '',
    payment_info: {
      payment_method: 'pix',
      installments: 1,
      installment_value: 0,
      first_due_date: getCurrentDate(),
      has_shipping: false,
      shipping_cost: 0,
      shipping_type: '',
      received: false
    }
  });

  // Estado dos itens do pedido
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // ✅ Gerador de ID único
  const generateUniqueId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // ====== CÁLCULOS E MEMOS ======
  
  // Cálculo de estatísticas
  const stats = useMemo(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlyOrders = orders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate >= firstDayOfMonth && orderDate <= lastDayOfMonth;
    });

    const monthlyRevenue = monthlyOrders.reduce((sum, o) => {
      const orderTotal = o.total || 0;
      const shipping = o.payment_info?.shipping_cost || 0;
      return sum + orderTotal + shipping;
    }, 0);

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const inProductionOrders = orders.filter(o => o.status === 'in_production').length;
    const completedThisMonth = monthlyOrders.filter(o => 
      o.status === 'completed' || o.status === 'delivered'
    ).length;

    return {
      monthlyRevenue,
      pendingOrders,
      inProductionOrders,
      completedThisMonth
    };
  }, [orders]);

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    
    const search = searchTerm.toLowerCase();
    return orders.filter(o => 
      o.client_name?.toLowerCase().includes(search) ||
      o.items?.some(item => item.product_name?.toLowerCase().includes(search))
    );
  }, [orders, searchTerm]);

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    
    const search = productSearch.toLowerCase();
    return products.filter(p => 
      p.name?.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search) ||
      p.category?.toLowerCase().includes(search)
    );
  }, [products, productSearch]);

  // ✅ Calcular subtotal (sem frete)
  const orderSubtotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [orderItems]);

  // ✅ Calcular total (com frete)
  const orderTotal = useMemo(() => {
    const shipping = formData.payment_info.has_shipping ? formData.payment_info.shipping_cost : 0;
    return orderSubtotal + shipping;
  }, [orderSubtotal, formData.payment_info.has_shipping, formData.payment_info.shipping_cost]);

  // ✅ Atualizar valor das parcelas quando total muda
  useEffect(() => {
    if (formData.payment_info.installments > 0) {
      const installmentValue = orderTotal / formData.payment_info.installments;
      setFormData(prev => ({
        ...prev,
        payment_info: {
          ...prev.payment_info,
          installment_value: installmentValue
        }
      }));
    }
  }, [orderTotal, formData.payment_info.installments]);

  // ====== VALIDAÇÃO ======
  
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) {
      newErrors.client_id = 'Selecione um cliente';
    }
    
    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }
    
    if (orderItems.length === 0) {
      newErrors.items = 'Adicione pelo menos um produto';
    }

    // Validação de itens com valores inválidos
    const hasInvalidItems = orderItems.some(
      item => item.quantity <= 0 || item.unit_price < 0
    );
    if (hasInvalidItems) {
      newErrors.items = 'Verifique as quantidades e preços dos produtos';
    }

    // ✅ Validação de pagamento
    if (formData.payment_info.installments < 1) {
      newErrors.installments = 'Número de parcelas deve ser maior que zero';
    }

    if (!formData.payment_info.first_due_date) {
      newErrors.first_due_date = 'Data de vencimento é obrigatória';
    }

    if (formData.payment_info.has_shipping && formData.payment_info.shipping_cost < 0) {
      newErrors.shipping_cost = 'Valor do frete inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, orderItems]);

  // ====== MANIPULAÇÃO DE ITENS ======
  
  // Adicionar produto ao pedido
  const addProductToOrder = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.error('Produto não encontrado');
      return;
    }
    
    const existingItem = orderItems.find(item => item.product_id === productId);
    
    if (existingItem) {
      setOrderItems(prev => prev.map(item => 
        item.product_id === productId 
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              total: (item.quantity + 1) * item.unit_price 
            }
          : item
      ));
    } else {
      const unitPrice = product.price || 0;
      setOrderItems(prev => [...prev, {
        id: generateUniqueId(),
        product_id: productId,
        product_name: product.name,
        quantity: 1,
        unit_price: unitPrice,
        total: unitPrice
      }]);
    }
    
    setShowProductSearch(false);
    setProductSearch('');
    
    setErrors(prev => {
      const { items, ...rest } = prev;
      return rest;
    });
  }, [products, orderItems, generateUniqueId]);

  // Atualizar quantidade com incremento/decremento
  const updateItemQuantity = useCallback((itemId: string, delta: number) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.unit_price
        };
      }
      return item;
    }));
  }, []);

  // ✅ NOVO: Atualizar quantidade diretamente (digitação)
  const updateItemQuantityDirect = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      newQuantity = 1;
    }
    
    setOrderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.unit_price
        };
      }
      return item;
    }));
  }, []);

  // Atualizar preço unitário
  const updateItemPrice = useCallback((itemId: string, newPrice: number) => {
    if (newPrice < 0) {
      console.warn('Preço não pode ser negativo');
      return;
    }

    setOrderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          unit_price: newPrice,
          total: item.quantity * newPrice
        };
      }
      return item;
    }));
  }, []);

  // Remover item
  const removeItem = useCallback((itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Limpar formulário
  const resetForm = useCallback(() => {
    setFormData({
      client_id: '',
      date: getCurrentDate(),
      delivery_date: '',
      status: 'pending',
      notes: '',
      payment_info: {
        payment_method: 'pix',
        installments: 1,
        installment_value: 0,
        first_due_date: getCurrentDate(),
        has_shipping: false,
        shipping_cost: 0,
        shipping_type: '',
        received: false
      }
    });
    setOrderItems([]);
    setErrors({});
  }, [getCurrentDate]);

  // ====== HANDLERS DE SUBMIT E DELETE ======
  
  // ✅ NOVO: Função para criar transações financeiras (contas a receber)
  const createFinancialTransactions = useCallback(async (orderId: string, orderData: any) => {
    const client = clients.find(c => c.id === orderData.client_id);
    const { payment_info } = orderData;
    
    // Criar uma transação para cada parcela
    const transactions = [];
    
    for (let i = 0; i < payment_info.installments; i++) {
      // Calcular data de vencimento de cada parcela
      const dueDate = new Date(payment_info.first_due_date);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const transaction = {
        type: 'income' as const, // Venda = Receita (A RECEBER)
        category: 'vendas',
        description: `Venda #${orderId.substring(0, 8)} - ${client?.name || 'Cliente'} - Parcela ${i + 1}/${payment_info.installments}`,
        amount: payment_info.installment_value,
        date: dueDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        status: payment_info.received ? 'received' : 'pending',
        payment_method: payment_info.payment_method,
        reference_id: orderId,
        reference_type: 'sale',
        client_id: orderData.client_id,
        client_name: client?.name,
        installment_number: i + 1,
        total_installments: payment_info.installments
      };
      
      transactions.push(transaction);
    }
    
    // Adicionar frete como transação separada se houver
    if (payment_info.has_shipping && payment_info.shipping_cost > 0) {
      const shippingTransaction = {
        type: 'income' as const,
        category: 'frete',
        description: `Frete - Venda #${orderId.substring(0, 8)} - ${payment_info.shipping_type || 'Entrega'}`,
        amount: payment_info.shipping_cost,
        date: orderData.date,
        due_date: payment_info.first_due_date,
        status: payment_info.received ? 'received' : 'pending',
        payment_method: payment_info.payment_method,
        reference_id: orderId,
        reference_type: 'sale_shipping',
        client_id: orderData.client_id,
        client_name: client?.name
      };
      
      transactions.push(shippingTransaction);
    }
    
    // Salvar todas as transações
    for (const transaction of transactions) {
      try {
        await addFinancialTransaction(transaction);
      } catch (error) {
        console.error('Erro ao criar transação financeira:', error);
      }
    }
  }, [clients, addFinancialTransaction]);

  // Handler para submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const client = clients.find(c => c.id === formData.client_id);
      
      const orderData = {
        date: formData.date,
        delivery_date: formData.delivery_date,
        client_id: formData.client_id,
        client_name: client?.name || '',
        items: orderItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total
        })),
        total: orderTotal,
        status: formData.status,
        notes: formData.notes,
        payment_info: formData.payment_info
      };

      // Adicionar pedido
      const newOrder = await addOrder(orderData);
      
      // ✅ NOVO: Criar transações financeiras (contas a receber)
      if (newOrder && newOrder.id) {
        await createFinancialTransactions(newOrder.id, orderData);
      }

      // Limpar formulário e voltar para lista
      resetForm();
      setActiveTab('list');
    } catch (error: any) {
      console.error('Erro ao salvar pedido:', error);
      setErrors({ submit: error.message || 'Erro ao salvar pedido' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para deletar pedido
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido? As transações financeiras associadas também serão removidas.')) return;
    
    setDeletingId(orderId);
    try {
      await deleteOrder(orderId);
    } catch (error: any) {
      console.error('Erro ao excluir pedido:', error);
      
      const message = error.message || 'Erro ao excluir pedido. Tente novamente.';
      setErrors(prev => ({ ...prev, delete: message }));
      
      setTimeout(() => {
        setErrors(prev => {
          const { delete: _, ...rest } = prev;
          return rest;
        });
      }, 5000);
    } finally {
      setDeletingId(null);
    }
  };
    // ====== RENDER - COMPONENTE PRINCIPAL ======
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Vendas</h1>
        <p className="text-gray-600">Gerencie seus pedidos de venda e controle financeiro</p>
      </div>

      {/* Mostrar erro de delete se existir */}
      {errors.delete && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{errors.delete}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'list'
              ? 'bg-white text-amber-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Lista de Vendas
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'new'
              ? 'bg-white text-amber-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Nova Venda
        </button>
      </div>

      {/* ====== TAB: LISTA DE VENDAS ====== */}
      {activeTab === 'list' && (
        <div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Receita do Mês</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(stats.monthlyRevenue)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pedidos Pendentes</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.pendingOrders}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Em Produção</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.inProductionOrders}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Concluídos (Mês)</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.completedThisMonth}</p>
                </div>
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por cliente, produto ou informações do pedido..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Pedidos Recentes</h3>
              
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhum pedido encontrado' : 'Nenhum pedido registrado'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setActiveTab('new')}
                      className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Criar Primeiro Pedido
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Data</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Cliente</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Itens</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Pagamento</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Entrega</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-mono text-gray-600">
                            #{order.id.substring(0, 8)}
                          </td>
                          <td className="py-3 px-4 text-sm">{formatDate(order.date)}</td>
                          <td className="py-3 px-4 text-sm">{order.client_name || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm">
                            {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">{formatCurrency(order.total)}</td>
                          <td className="py-3 px-4 text-sm">
                            {order.payment_info ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-600">
                                  {order.payment_info.installments}x de {formatCurrency(order.payment_info.installment_value)}
                                </span>
                                <span className="text-xs text-gray-500 capitalize">
                                  {order.payment_info.payment_method.replace('_', ' ')}
                                </span>
                                {order.payment_info.received && (
                                  <span className="text-xs text-green-600 font-medium mt-1">
                                    ✓ Recebido
                                  </span>
                                )}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {order.delivery_date ? formatDate(order.delivery_date) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              order.status === 'delivered' 
                                ? 'bg-green-100 text-green-800' 
                                : order.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'in_production'
                                ? 'bg-purple-100 text-purple-800'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status === 'delivered' ? 'Entregue' : 
                               order.status === 'completed' ? 'Concluído' : 
                               order.status === 'in_production' ? 'Em Produção' :
                               order.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  // Função para editar pedido (você pode implementar)
                                  console.log('Editar pedido:', order.id);
                                }}
                                className="text-gray-600 hover:text-amber-600 transition-colors"
                                title="Editar pedido"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                disabled={deletingId === order.id}
                                className="text-gray-600 hover:text-red-600 disabled:opacity-50 transition-colors"
                                title="Excluir pedido"
                              >
                                {deletingId === order.id ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== TAB: NOVA VENDA ====== */}
      {activeTab === 'new' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Nova Venda</h3>
          
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <div className="flex space-x-2">
                  <select 
                    value={formData.client_id}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, client_id: e.target.value }));
                      if (errors.client_id) {
                        setErrors(prev => {
                          const { client_id, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      errors.client_id ? 'border-red-300' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.filter(c => c.fl_ativo).map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Novo cliente"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {errors.client_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Pedido *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, date: e.target.value }));
                    if (errors.date) {
                      setErrors(prev => {
                        const { date, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.date ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Entrega Prevista
                </label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status do Pedido
                </label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    status: e.target.value as any
                  }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="pending">Pendente</option>
                  <option value="in_production">Em Produção</option>
                  <option value="completed">Concluído</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
                        {/* Produtos */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Produtos *
                </label>
                {errors.items && (
                  <span className="text-sm text-red-600">{errors.items}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowProductSearch(true)}
                className={`w-full px-4 py-2 border-2 border-dashed rounded-lg hover:border-amber-500 hover:text-amber-600 flex items-center justify-center space-x-2 transition-colors ${
                  errors.items ? 'border-red-300 text-red-600' : 'border-gray-300 text-gray-600'
                }`}
              >
                <Plus className="h-5 w-5" />
                <span>Adicionar Produto</span>
              </button>
              
              {/* ✅ Lista de produtos com input direto de quantidade */}
              {orderItems.length > 0 && (
                <div className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantidade
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Preço Unit.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orderItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                              {item.product_name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                              <div className="flex items-center space-x-2">
                                <button 
                                  type="button"
                                  onClick={() => updateItemQuantity(item.id, -1)}
                                  disabled={item.quantity <= 1}
                                  className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Diminuir"
                                >
                                  -
                                </button>
                                {/* ✅ NOVO: Input direto para quantidade */}
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQty = parseInt(e.target.value) || 1;
                                    updateItemQuantityDirect(item.id, newQty);
                                  }}
                                  className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                                <button 
                                  type="button"
                                  onClick={() => updateItemQuantity(item.id, 1)}
                                  className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                  title="Aumentar"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                              <div className="flex items-center">
                                <span className="mr-1">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unit_price}
                                  onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                  className="w-24 px-2 py-1 border border-gray-200 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                              {formatCurrency(item.total)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Remover item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                            Subtotal:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">
                            {formatCurrency(orderSubtotal)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* ✅ NOVO: Seção de Informações de Pagamento */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 text-amber-600 mr-2" />
                Informações de Pagamento
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Forma de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento *
                  </label>
                  <select
                    value={formData.payment_info.payment_method}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      payment_info: {
                        ...prev.payment_info,
                        payment_method: e.target.value as any
                      }
                    }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="boleto">Boleto</option>
                    <option value="transferencia">Transferência</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                {/* Número de Parcelas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Parcelas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.payment_info.installments}
                    onChange={(e) => {
                      const installments = parseInt(e.target.value) || 1;
                      setFormData(prev => ({
                        ...prev,
                        payment_info: {
                          ...prev.payment_info,
                          installments
                        }
                      }));
                      if (errors.installments) {
                        setErrors(prev => {
                          const { installments, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      errors.installments ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.installments && (
                    <p className="mt-1 text-sm text-red-600">{errors.installments}</p>
                  )}
                </div>

                {/* Valor da Parcela (calculado automaticamente) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor de Cada Parcela
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(formData.payment_info.installment_value)}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Calculado automaticamente com base no total
                  </p>
                </div>

                {/* Data do Primeiro Vencimento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data do Primeiro Vencimento *
                  </label>
                  <input
                    type="date"
                    value={formData.payment_info.first_due_date}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        payment_info: {
                          ...prev.payment_info,
                          first_due_date: e.target.value
                        }
                      }));
                      if (errors.first_due_date) {
                        setErrors(prev => {
                          const { first_due_date, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      errors.first_due_date ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.first_due_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_due_date}</p>
                  )}
                  {formData.payment_info.installments > 1 && (
                    <p className="mt-1 text-xs text-gray-500">
                      As demais parcelas vencerão mensalmente
                    </p>
                  )}
                </div>

                {/* Checkbox de Pagamento Já Recebido */}
                <div className="flex items-center md:col-span-2">
                  <input
                    type="checkbox"
                    checked={formData.payment_info.received}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      payment_info: {
                        ...prev.payment_info,
                        received: e.target.checked,
                        received_date: e.target.checked ? getCurrentDate() : undefined
                      }
                    }))}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Pagamento já foi recebido (todas as parcelas)
                  </label>
                </div>
              </div>

              {/* ✅ Seção de Frete */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h5 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                  <Truck className="h-4 w-4 text-amber-600 mr-2" />
                  Informações de Frete/Entrega
                </h5>

                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={formData.payment_info.has_shipping}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      payment_info: {
                        ...prev.payment_info,
                        has_shipping: e.target.checked,
                        shipping_cost: e.target.checked ? prev.payment_info.shipping_cost : 0
                      }
                    }))}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Esta venda possui custo de frete/entrega
                  </label>
                </div>

                {formData.payment_info.has_shipping && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor do Frete *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.payment_info.shipping_cost}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              payment_info: {
                                ...prev.payment_info,
                                shipping_cost: parseFloat(e.target.value) || 0
                              }
                            }));
                            if (errors.shipping_cost) {
                              setErrors(prev => {
                                const { shipping_cost, ...rest } = prev;
                                return rest;
                              });
                            }
                          }}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                            errors.shipping_cost ? 'border-red-300' : 'border-gray-200'
                          }`}
                        />
                      </div>
                      {errors.shipping_cost && (
                        <p className="mt-1 text-sm text-red-600">{errors.shipping_cost}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Entrega
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Entrega própria, Transportadora, Correios"
                        value={formData.payment_info.shipping_type || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          payment_info: {
                            ...prev.payment_info,
                            shipping_type: e.target.value
                          }
                        }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Resumo Financeiro */}
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Resumo Financeiro
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal dos Produtos:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(orderSubtotal)}</span>
                  </div>
                  {formData.payment_info.has_shipping && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Frete/Entrega:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(formData.payment_info.shipping_cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-green-300">
                    <span className="font-semibold text-gray-900">Total da Venda:</span>
                    <span className="font-bold text-green-900 text-lg">{formatCurrency(orderTotal)}</span>
                  </div>
                  {formData.payment_info.installments > 1 && (
                    <div className="flex justify-between text-xs text-gray-600 pt-2">
                      <span>Parcelamento:</span>
                      <span>
                        {formData.payment_info.installments}x de {formatCurrency(formData.payment_info.installment_value)}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-green-300">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Status do Pagamento:</span>
                      <span className={`font-medium ${formData.payment_info.received ? 'text-green-700' : 'text-orange-700'}`}>
                        {formData.payment_info.received ? '✓ Pagamento Recebido' : '⏳ A Receber'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Observações adicionais sobre o pedido..."
              />
            </div>
            
            {/* Botões de Ação */}
            <div className="pt-4 border-t border-gray-200 flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    <span>Registrar Venda</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Limpar
              </button>
            </div>
          </form>
        </div>
      )}
            {/* ====== MODAL DE BUSCA DE PRODUTOS ====== */}
      {showProductSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Adicionar Produto</h3>
              <button
                onClick={() => {
                  setShowProductSearch(false);
                  setProductSearch('');
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              
              <div className="overflow-y-auto max-h-[50vh]">
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProductToOrder(product.id)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{product.name}</h4>
                          {product.description && (
                            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Categoria: {product.category || 'Sem categoria'}</span>
                            <span>Estoque: {product.current_stock} {product.unit}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium text-green-600">{formatCurrency(product.price || 0)}</p>
                          <p className="text-xs text-gray-500 mt-1">Preço de venda</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Nenhum produto encontrado</p>
                      {productSearch && (
                        <p className="text-sm text-gray-400 mt-1">
                          Tente buscar por outro termo
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL DE CLIENTE ====== */}
      {showClientModal && (
        <ClientModal
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
          client={null}
        />
      )}
    </div>
  );
};

export default Sales;
