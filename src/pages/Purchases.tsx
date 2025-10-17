import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ShoppingBag, 
  Package, 
  TrendingDown, 
  Calendar, 
  Search, 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  Check,
  AlertCircle,
  Loader,
  DollarSign,
  CreditCard,
  Receipt
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import SupplierModal from '../components/SupplierModal';

// ====== INTERFACES ======

interface PaymentInfo {
  payment_method: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia' | 'cheque';
  installments: number;
  installment_value: number;
  first_due_date: string;
  has_shipping: boolean;
  shipping_cost: number;
  shipping_type?: string;
  paid: boolean;
  paid_date?: string;
}

interface FormData {
  supplier_id: string;
  date: string;
  invoice_number: string;
  status: 'pending' | 'received' | 'cancelled';
  notes: string;
  payment_info: PaymentInfo;
}

interface PurchaseItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

const Purchases: React.FC = () => {
  const { 
    purchases = [], 
    suppliers = [], 
    products = [], 
    addPurchase, 
    updatePurchase,
    deletePurchase,
    deleteSupplier,
    addFinancialTransaction // ✅ Novo: para integrar com financeiro
  } = useApp();

  // ====== ESTADOS ======
  const [activeTab, setActiveTab] = useState<'list' | 'new' | 'suppliers' | 'stock'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
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
    supplier_id: '',
    date: getCurrentDate(),
    invoice_number: '',
    status: 'pending',
    notes: '',
    payment_info: {
      payment_method: 'boleto',
      installments: 1,
      installment_value: 0,
      first_due_date: getCurrentDate(),
      has_shipping: false,
      shipping_cost: 0,
      shipping_type: '',
      paid: false
    }
  });

  // Estado dos itens da compra
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);

  // ✅ Resetar estado do modal quando fecha
  useEffect(() => {
    if (!showSupplierModal) {
      setEditingSupplier(null);
    }
  }, [showSupplierModal]);

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

    const monthlyPurchases = purchases.filter(p => {
      const purchaseDate = new Date(p.date);
      return purchaseDate >= firstDayOfMonth && 
             purchaseDate <= lastDayOfMonth &&
             p.status === 'received';
    });

    const monthlyTotal = monthlyPurchases.reduce((sum, p) => {
      const purchaseTotal = p.total || 0;
      const shipping = p.payment_info?.shipping_cost || 0;
      return sum + purchaseTotal + shipping;
    }, 0);

    const pendingPurchases = purchases.filter(p => p.status === 'pending').length;
    const activeSuppliers = suppliers.filter(s => s.active).length;
    const lowStockItems = products.filter(p => p.current_stock <= p.min_stock).length;

    return {
      monthlyTotal,
      pendingPurchases,
      activeSuppliers,
      lowStockItems
    };
  }, [purchases, suppliers, products]);

  // Filtrar compras
  const filteredPurchases = useMemo(() => {
    if (!searchTerm.trim()) return purchases;
    
    const search = searchTerm.toLowerCase();
    return purchases.filter(p => 
      p.supplier_name?.toLowerCase().includes(search) ||
      p.invoice_number?.toLowerCase().includes(search) ||
      p.items?.some(item => item.product_name?.toLowerCase().includes(search))
    );
  }, [purchases, searchTerm]);

  // Filtrar produtos com base na pesquisa
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
  const purchaseSubtotal = useMemo(() => {
    return purchaseItems.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [purchaseItems]);

  // ✅ Calcular total (com frete)
  const purchaseTotal = useMemo(() => {
    const shipping = formData.payment_info.has_shipping ? formData.payment_info.shipping_cost : 0;
    return purchaseSubtotal + shipping;
  }, [purchaseSubtotal, formData.payment_info.has_shipping, formData.payment_info.shipping_cost]);

  // ✅ Atualizar valor das parcelas quando total muda
  useEffect(() => {
    if (formData.payment_info.installments > 0) {
      const installmentValue = purchaseTotal / formData.payment_info.installments;
      setFormData(prev => ({
        ...prev,
        payment_info: {
          ...prev.payment_info,
          installment_value: installmentValue
        }
      }));
    }
  }, [purchaseTotal, formData.payment_info.installments]);

  // ====== VALIDAÇÃO ======
  
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Selecione um fornecedor';
    }
    
    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }
    
    if (purchaseItems.length === 0) {
      newErrors.items = 'Adicione pelo menos um produto';
    }
    
    if (!formData.invoice_number || formData.invoice_number.trim() === '') {
      newErrors.invoice_number = 'Número da NF é obrigatório';
    }

    // Validação de itens com valores inválidos
    const hasInvalidItems = purchaseItems.some(
      item => item.quantity <= 0 || item.unit_cost < 0
    );
    if (hasInvalidItems) {
      newErrors.items = 'Verifique as quantidades e custos dos produtos';
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
  }, [formData, purchaseItems]);

  // ====== MANIPULAÇÃO DE ITENS ======
  
  const addProductToPurchase = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.error('Produto não encontrado');
      return;
    }
    
    const existingItem = purchaseItems.find(item => item.product_id === productId);
    
    if (existingItem) {
      setPurchaseItems(prev => prev.map(item => 
        item.product_id === productId 
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              total: (item.quantity + 1) * item.unit_cost 
            }
          : item
      ));
    } else {
      const unitCost = product.cost_price || 0;
      setPurchaseItems(prev => [...prev, {
        id: generateUniqueId(),
        product_id: productId,
        product_name: product.name,
        quantity: 1,
        unit_cost: unitCost,
        total: unitCost
      }]);
    }
    
    setShowProductSearch(false);
    setProductSearch('');
    
    setErrors(prev => {
      const { items, ...rest } = prev;
      return rest;
    });
  }, [products, purchaseItems, generateUniqueId]);

  // Atualizar quantidade com incremento/decremento
  const updateItemQuantity = useCallback((itemId: string, delta: number) => {
    setPurchaseItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.unit_cost
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
    
    setPurchaseItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.unit_cost
        };
      }
      return item;
    }));
  }, []);

  // Atualizar custo unitário
  const updateItemCost = useCallback((itemId: string, newCost: number) => {
    if (newCost < 0) {
      console.warn('Custo não pode ser negativo');
      return;
    }

    setPurchaseItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          unit_cost: newCost,
          total: item.quantity * newCost
        };
      }
      return item;
    }));
  }, []);

  // Remover item
  const removeItem = useCallback((itemId: string) => {
    setPurchaseItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Limpar formulário
  const resetForm = useCallback(() => {
    setFormData({
      supplier_id: '',
      date: getCurrentDate(),
      invoice_number: '',
      status: 'pending',
      notes: '',
      payment_info: {
        payment_method: 'boleto',
        installments: 1,
        installment_value: 0,
        first_due_date: getCurrentDate(),
        has_shipping: false,
        shipping_cost: 0,
        shipping_type: '',
        paid: false
      }
    });
    setPurchaseItems([]);
    setErrors({});
  }, [getCurrentDate]);
    // ====== HANDLERS DE SUBMIT E DELETE ======
  
  // ✅ NOVO: Função para criar transações financeiras (contas a pagar)
  const createFinancialTransactions = useCallback(async (purchaseId: string, purchaseData: any) => {
    const supplier = suppliers.find(s => s.id === purchaseData.supplier_id);
    const { payment_info } = purchaseData;
    
    // Criar uma transação para cada parcela
    const transactions = [];
    
    for (let i = 0; i < payment_info.installments; i++) {
      // Calcular data de vencimento de cada parcela
      const dueDate = new Date(payment_info.first_due_date);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const transaction = {
        type: 'expense' as const, // Compra = Despesa (A PAGAR)
        category: 'compras',
        description: `Compra NF ${purchaseData.invoice_number} - ${supplier?.name || 'Fornecedor'} - Parcela ${i + 1}/${payment_info.installments}`,
        amount: payment_info.installment_value,
        date: dueDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        status: payment_info.paid ? 'paid' : 'pending',
        payment_method: payment_info.payment_method,
        reference_id: purchaseId,
        reference_type: 'purchase',
        supplier_id: purchaseData.supplier_id,
        supplier_name: supplier?.name,
        installment_number: i + 1,
        total_installments: payment_info.installments
      };
      
      transactions.push(transaction);
    }
    
    // Adicionar frete como transação separada se houver
    if (payment_info.has_shipping && payment_info.shipping_cost > 0) {
      const shippingTransaction = {
        type: 'expense' as const,
        category: 'frete',
        description: `Frete - Compra NF ${purchaseData.invoice_number} - ${payment_info.shipping_type || 'Entrega'}`,
        amount: payment_info.shipping_cost,
        date: purchaseData.date,
        due_date: payment_info.first_due_date,
        status: payment_info.paid ? 'paid' : 'pending',
        payment_method: payment_info.payment_method,
        reference_id: purchaseId,
        reference_type: 'purchase_shipping',
        supplier_id: purchaseData.supplier_id,
        supplier_name: supplier?.name
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
  }, [suppliers, addFinancialTransaction]);

  // Handler para submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const supplier = suppliers.find(s => s.id === formData.supplier_id);
      
      const purchaseData = {
        date: formData.date,
        supplier_id: formData.supplier_id,
        supplier_name: supplier?.name || '',
        items: purchaseItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total: item.total
        })),
        total: purchaseTotal,
        status: formData.status,
        invoice_number: formData.invoice_number,
        notes: formData.notes,
        payment_info: formData.payment_info
      };

      // Adicionar compra
      const newPurchase = await addPurchase(purchaseData);
      
      // ✅ NOVO: Criar transações financeiras (contas a pagar)
      if (newPurchase && newPurchase.id) {
        await createFinancialTransactions(newPurchase.id, purchaseData);
      }

      // Limpar formulário e voltar para lista
      resetForm();
      setActiveTab('list');
    } catch (error: any) {
      console.error('Erro ao salvar compra:', error);
      setErrors({ submit: error.message || 'Erro ao salvar compra' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para deletar compra
  const handleDeletePurchase = async (purchaseId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta compra? As transações financeiras associadas também serão removidas.')) return;
    
    setDeletingId(purchaseId);
    try {
      await deletePurchase(purchaseId);
      // Nota: Você pode querer adicionar lógica para deletar as transações financeiras relacionadas
    } catch (error: any) {
      console.error('Erro ao excluir compra:', error);
      
      const message = error.message || 'Erro ao excluir compra. Tente novamente.';
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

  // Handler para deletar fornecedor
  const handleDeleteSupplier = async (supplierId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return;
    
    try {
      await deleteSupplier(supplierId);
    } catch (error: any) {
      console.error('Erro ao excluir fornecedor:', error);
      const message = error.message || 'Erro ao excluir fornecedor';
      alert(message);
    }
  };

  // Handler para editar fornecedor
  const handleEditSupplier = useCallback((supplier: any) => {
    setEditingSupplier(supplier);
    setShowSupplierModal(true);
  }, []);

  // Fechar modal de fornecedor
  const handleCloseSupplierModal = useCallback(() => {
    setShowSupplierModal(false);
    setEditingSupplier(null);
  }, []);

  // ====== RENDER - COMPONENTE PRINCIPAL ======
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Compras</h1>
        <p className="text-gray-600">Gerencie suas compras, fornecedores e controle financeiro</p>
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
          Listar Compras
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'new'
              ? 'bg-white text-amber-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Nova Compra
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'suppliers'
              ? 'bg-white text-amber-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Fornecedores
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'stock'
              ? 'bg-white text-amber-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Estoque
        </button>
      </div>

      {/* ====== TAB: LISTA DE COMPRAS ====== */}
      {activeTab === 'list' && (
        <div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Compras (Mês)</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(stats.monthlyTotal)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Compras Pendentes</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.pendingPurchases}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fornecedores Ativos</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.activeSuppliers}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Itens em Falta</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.lowStockItems}</p>
                </div>
                <Package className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por fornecedor, produto ou número da compra..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Purchases List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Compras Recentes</h3>
              
              {filteredPurchases.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Nenhuma compra encontrada' : 'Nenhuma compra registrada'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setActiveTab('new')}
                      className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Registrar Primeira Compra
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">NF</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Data</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fornecedor</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Itens</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Pagamento</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.map((purchase) => (
                        <tr key={purchase.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{purchase.invoice_number || '-'}</td>
                          <td className="py-3 px-4 text-sm">{formatDate(purchase.date)}</td>
                          <td className="py-3 px-4 text-sm">{purchase.supplier_name || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm">
                            {purchase.items?.length || 0} {purchase.items?.length === 1 ? 'item' : 'itens'}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">{formatCurrency(purchase.total)}</td>
                          <td className="py-3 px-4 text-sm">
                            {purchase.payment_info ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-600">
                                  {purchase.payment_info.installments}x de {formatCurrency(purchase.payment_info.installment_value)}
                                </span>
                                <span className="text-xs text-gray-500 capitalize">
                                  {purchase.payment_info.payment_method.replace('_', ' ')}
                                </span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              purchase.status === 'received' 
                                ? 'bg-green-100 text-green-800' 
                                : purchase.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {purchase.status === 'received' ? 'Recebido' : purchase.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDeletePurchase(purchase.id)}
                                disabled={deletingId === purchase.id}
                                className="text-gray-600 hover:text-red-600 disabled:opacity-50 transition-colors"
                                title="Excluir compra"
                              >
                                {deletingId === purchase.id ? (
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
            {/* ====== TAB: NOVA COMPRA ====== */}
      {activeTab === 'new' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Nova Compra</h3>
          
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
                  Fornecedor *
                </label>
                <select 
                  value={formData.supplier_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, supplier_id: e.target.value }));
                    if (errors.supplier_id) {
                      setErrors(prev => {
                        const { supplier_id, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.supplier_id ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers.filter(s => s.active).map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
                {errors.supplier_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Compra *
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
                  Número da NF *
                </label>
                <input
                  type="text"
                  placeholder="Número da nota fiscal"
                  value={formData.invoice_number}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, invoice_number: e.target.value }));
                    if (errors.invoice_number) {
                      setErrors(prev => {
                        const { invoice_number, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.invoice_number ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.invoice_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.invoice_number}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    status: e.target.value as 'pending' | 'received' | 'cancelled'
                  }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="pending">Pendente</option>
                  <option value="received">Recebido</option>
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
              {purchaseItems.length > 0 && (
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
                            Custo Unit.
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
                        {purchaseItems.map((item) => (
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
                                  value={item.unit_cost}
                                  onChange={(e) => updateItemCost(item.id, parseFloat(e.target.value) || 0)}
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
                            {formatCurrency(purchaseSubtotal)}
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

                {/* Checkbox de Compra Já Paga */}
                <div className="flex items-center md:col-span-2">
                  <input
                    type="checkbox"
                    checked={formData.payment_info.paid}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      payment_info: {
                        ...prev.payment_info,
                        paid: e.target.checked,
                        paid_date: e.target.checked ? getCurrentDate() : undefined
                      }
                    }))}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Compra já foi paga (todas as parcelas)
                  </label>
                </div>
              </div>

              {/* ✅ Seção de Frete */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h5 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                  <Truck className="h-4 w-4 text-amber-600 mr-2" />
                  Informações de Frete
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
                    Esta compra possui frete
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
                        Tipo de Frete
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: CIF, FOB, Transportadora"
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
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-amber-900 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Resumo Financeiro
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal dos Produtos:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(purchaseSubtotal)}</span>
                  </div>
                  {formData.payment_info.has_shipping && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Frete:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(formData.payment_info.shipping_cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-amber-300">
                    <span className="font-semibold text-gray-900">Total da Compra:</span>
                    <span className="font-bold text-amber-900 text-lg">{formatCurrency(purchaseTotal)}</span>
                  </div>
                  {formData.payment_info.installments > 1 && (
                    <div className="flex justify-between text-xs text-gray-600 pt-2">
                      <span>Parcelamento:</span>
                      <span>
                        {formData.payment_info.installments}x de {formatCurrency(formData.payment_info.installment_value)}
                      </span>
                    </div>
                  )}
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
                placeholder="Observações adicionais sobre a compra..."
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
                    <span>Registrar Compra</span>
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
                      onClick={() => addProductToPurchase(product.id)}
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
                          <p className="font-medium text-amber-600">{formatCurrency(product.cost_price || 0)}</p>
                          <p className="text-xs text-gray-500 mt-1">Custo unitário</p>
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

      {/* ====== TAB: FORNECEDORES ====== */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Fornecedores</h3>
            <button 
              onClick={() => setShowSupplierModal(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Novo Fornecedor</span>
            </button>
          </div>
          
          {suppliers.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Nenhum fornecedor cadastrado</p>
              <p className="text-sm text-gray-400 mb-4">
                Cadastre fornecedores para começar a registrar compras
              </p>
              <button
                onClick={() => setShowSupplierModal(true)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Cadastrar Primeiro Fornecedor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map(supplier => (
                <div key={supplier.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-800 flex-1 pr-2">{supplier.name}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                      supplier.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {supplier.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    {supplier.cnpj && (
                      <p className="flex items-start">
                        <span className="font-medium min-w-[60px]">CNPJ:</span>
                        <span className="ml-1">{supplier.cnpj}</span>
                      </p>
                    )}
                    {supplier.email && (
                      <p className="flex items-start">
                        <span className="font-medium min-w-[60px]">Email:</span>
                        <span className="ml-1 truncate">{supplier.email}</span>
                      </p>
                    )}
                    {supplier.phone && (
                      <p className="flex items-start">
                        <span className="font-medium min-w-[60px]">Tel:</span>
                        <span className="ml-1">{supplier.phone}</span>
                      </p>
                    )}
                    {supplier.contact && (
                      <p className="flex items-start">
                        <span className="font-medium min-w-[60px]">Contato:</span>
                        <span className="ml-1">{supplier.contact}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => handleEditSupplier(supplier)}
                      className="text-gray-600 hover:text-amber-600 transition-colors"
                      title="Editar fornecedor"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="text-gray-600 hover:text-red-600 transition-colors"
                      title="Excluir fornecedor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====== TAB: ESTOQUE ====== */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Controle de Estoque</h3>
          
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Nenhum produto cadastrado</p>
                <p className="text-sm text-gray-400">
                  Cadastre produtos para gerenciar o estoque
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Produto</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Categoria</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tipo</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estoque Atual</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estoque Mínimo</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Valor em Estoque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => {
                      const stockStatus = product.current_stock > product.min_stock 
                        ? 'normal' 
                        : product.current_stock === 0
                        ? 'empty'
                        : 'low';
                        
                      const stockValue = product.current_stock * (product.cost_price || 0);
                      
                      return (
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium">{product.name}</td>
                          <td className="py-3 px-4 text-sm">{product.category || '-'}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="capitalize">
                              {product.type === 'material_bruto' 
                                ? 'Material Bruto' 
                                : product.type === 'parte_produto'
                                ? 'Parte de Produto'
                                : 'Produto Pronto'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`font-medium ${
                              stockStatus === 'empty' ? 'text-red-600' : 
                              stockStatus === 'low' ? 'text-yellow-600' : ''
                            }`}>
                              {product.current_stock} {product.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">{product.min_stock} {product.unit}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              stockStatus === 'normal'
                                ? 'bg-green-100 text-green-800' 
                                : stockStatus === 'empty'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {stockStatus === 'normal' 
                                ? 'Normal' 
                                : stockStatus === 'empty'
                                ? 'Sem Estoque'
                                : 'Estoque Baixo'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">
                            {formatCurrency(stockValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={6} className="py-3 px-4 text-sm font-medium text-right">
                        Total em Estoque:
                      </td>
                      <td className="py-3 px-4 text-sm font-bold">
                        {formatCurrency(
                          products.reduce((sum, p) => sum + (p.current_stock * (p.cost_price || 0)), 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
          
          {/* Resumo de alertas de estoque */}
          {products.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Sem Estoque</p>
                    <p className="text-2xl font-bold text-red-900 mt-1">
                      {products.filter(p => p.current_stock === 0).length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Estoque Baixo</p>
                    <p className="text-2xl font-bold text-yellow-900 mt-1">
                      {products.filter(p => p.current_stock > 0 && p.current_stock <= p.min_stock).length}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Estoque Adequado</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {products.filter(p => p.current_stock > p.min_stock).length}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====== MODAL DE FORNECEDOR ====== */}
      {showSupplierModal && (
        <SupplierModal
          isOpen={showSupplierModal}
          onClose={handleCloseSupplierModal}
          supplier={editingSupplier}
        />
      )}
    </div>
  );
};

export default Purchases;
