import React, { useState, useEffect } from 'react';
import { X, Briefcase, FileText, User, Calendar, DollarSign, Package, Plus, Trash2, Search, ChevronDown, Check } from 'lucide-react';
import { useApp, Project, ProjectProduct } from '../contexts/AppContext';

interface ProjectFormModalProps {
  project?: Project | null;
  onClose: () => void;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ project, onClose }) => {
  const { clients, products, addProject, updateProject } = useApp();
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    status: 'orcamento' as 'orcamento' | 'aprovado' | 'em_producao' | 'concluido' | 'entregue',
    type: 'orcamento' as 'orcamento' | 'venda',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    materials_cost: '',
    labor_cost: '',
    profit_margin: '20'
  });
  
  const [projectProducts, setProjectProducts] = useState<ProjectProduct[]>([]);
  const [paymentTerms, setPaymentTerms] = useState({
    installments: 1,
    payment_method: 'dinheiro' as 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia',
    discount_percentage: 0
  });
  
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        client_id: project.client_id,
        title: project.title,
        description: project.description,
        status: project.status,
        type: project.type,
        start_date: project.start_date,
        end_date: project.end_date,
        materials_cost: project.materials_cost?.toString() || '',
        labor_cost: project.labor_cost?.toString() || '',
        profit_margin: project.profit_margin?.toString() || '20'
      });
      
      setProjectProducts(project.products || []);
      
      if (project.payment_terms) {
        setPaymentTerms({
          installments: project.payment_terms.installments,
          payment_method: project.payment_terms.payment_method,
          discount_percentage: project.payment_terms.discount_percentage
        });
      }
      
      // Set selected client name for display
      const client = clients.find(c => c.id === project.client_id);
      if (client) {
        setSelectedClientName(client.name);
        setClientSearch(client.name);
      }
    }
  }, [project]);

  const calculateBudget = () => {
    const productsTotal = projectProducts.reduce((sum, p) => sum + p.total_price, 0);
    const materialsCost = parseFloat(formData.materials_cost) || 0;
    const laborCost = parseFloat(formData.labor_cost) || 0;
    const profitMargin = parseFloat(formData.profit_margin) || 0;
    
    const totalCosts = productsTotal + materialsCost + laborCost;
    const budget = totalCosts * (1 + profitMargin / 100);
    
    return budget;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      alert('Por favor, selecione um cliente');
      return;
    }
    
    const budget = calculateBudget();
    const discountAmount = budget * (paymentTerms.discount_percentage / 100);
    const finalValue = budget - discountAmount;
    const installmentValue = finalValue / paymentTerms.installments;
    
    const projectData = {
      client_id: formData.client_id,
      title: formData.title,
      description: formData.description,
      status: formData.status,
      type: formData.type,
      products: projectProducts,
      budget,
      start_date: formData.start_date,
      end_date: formData.end_date || formData.start_date,
      materials_cost: parseFloat(formData.materials_cost) || 0,
      labor_cost: parseFloat(formData.labor_cost) || 0,
      profit_margin: parseFloat(formData.profit_margin) || 20,
      payment_terms: {
        installments: paymentTerms.installments,
        payment_method: paymentTerms.payment_method,
        discount_percentage: paymentTerms.discount_percentage,
        installment_value: installmentValue,
        total_with_discount: finalValue
      }
    };
    
    if (project) {
      updateProject(project.id, projectData);
    } else {
      addProject(projectData);
    }
    
    onClose();
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
      [name]: name === 'installments' || name === 'discount_percentage' ? parseInt(value) || 0 : value
    }));
  };

  const addProductToProject = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingProduct = projectProducts.find(p => p.product_id === productId);
    
    if (existingProduct) {
      setProjectProducts(prev => prev.map(p => 
        p.product_id === productId 
          ? { ...p, quantity: p.quantity + 1, total_price: (p.quantity + 1) * p.unit_price }
          : p
      ));
    } else {
      const unitPrice = product.sale_price || product.cost_price * 1.5; // Usar preço de venda ou custo + 50%
      setProjectProducts(prev => [...prev, {
        id: Date.now().toString(),
        product_id: productId,
        product_name: product.name,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice
      }]);
    }
    
    setShowProductSearch(false);
    setProductSearch('');
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
    
    // Clear selection if search doesn't match exactly
    const exactMatch = clients.find(c => c.name.toLowerCase() === value.toLowerCase());
    if (!exactMatch) {
      setFormData(prev => ({ ...prev, client_id: '' }));
      setSelectedClientName('');
    }
  };

  const handleClientSearchFocus = () => {
    setShowClientDropdown(true);
  };

  const handleClientSearchBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      setShowClientDropdown(false);
    }, 200);
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }
    
    setProjectProducts(prev => prev.map(p => 
      p.product_id === productId 
        ? { ...p, quantity, total_price: quantity * p.unit_price }
        : p
    ));
  };

  const updateProductPrice = (productId: string, unitPrice: number) => {
    setProjectProducts(prev => prev.map(p => 
      p.product_id === productId 
        ? { ...p, unit_price: unitPrice, total_price: p.quantity * unitPrice }
        : p
    ));
  };

  const removeProduct = (productId: string) => {
    setProjectProducts(prev => prev.filter(p => p.product_id !== productId));
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.description.toLowerCase().includes(productSearch.toLowerCase())
  );

  const budget = calculateBudget();
  const discountAmount = budget * (paymentTerms.discount_percentage / 100);
  const finalValue = budget - discountAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-xl">
          <h2 className="text-2xl font-bold">
            {project ? 'Editar Projeto' : 'Novo Projeto'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Dados Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2 text-amber-600" />
                Cliente
              </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={handleClientSearchChange}
                    onFocus={handleClientSearchFocus}
                    onBlur={handleClientSearchBlur}
                    placeholder="Digite para buscar cliente..."
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  
                  {/* Validation indicator */}
                  {formData.client_id && (
                    <Check className="absolute right-10 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                
                {/* Dropdown */}
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
                              {client.type === 'pj' && client.cnpj && (
                                <div className="text-xs text-gray-400">CNPJ: {client.cnpj}</div>
                              )}
                              {client.type === 'pf' && client.cpf && (
                                <div className="text-xs text-gray-400">CPF: {client.cpf}</div>
                              )}
                            </div>
                            {formData.client_id === client.id && (
                              <Check className="h-5 w-5 text-amber-600" />
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum cliente encontrado</p>
                        <p className="text-xs">Tente ajustar a busca</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Required field validation */}
              {!formData.client_id && clientSearch && (
                <p className="mt-1 text-sm text-red-600">
                  Por favor, selecione um cliente da lista
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo do Projeto
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="orcamento">Orçamento</option>
                <option value="venda">Venda</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="h-4 w-4 inline mr-2 text-amber-600" />
                Título do Projeto
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Ex: Cozinha sob medida"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2 text-amber-600" />
              Descrição
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Descreva o projeto..."
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2 text-amber-600" />
                Data de Início
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
                Data de Entrega
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Produtos */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Produtos do Projeto</h3>
              <button
                type="button"
                onClick={() => setShowProductSearch(true)}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Produto</span>
              </button>
            </div>

            <div className="space-y-3">
              {projectProducts.map((projectProduct) => (
                <div key={projectProduct.id} className="bg-white p-4 rounded-lg border flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{projectProduct.product_name}</h4>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Qtd:</label>
                      <input
                        type="number"
                        value={projectProduct.quantity}
                        onChange={(e) => updateProductQuantity(projectProduct.product_id, parseInt(e.target.value))}
                        min="1"
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Preço:</label>
                      <input
                        type="number"
                        value={projectProduct.unit_price}
                        onChange={(e) => updateProductPrice(projectProduct.product_id, parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      Total: R$ {projectProduct.total_price.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(projectProduct.product_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {projectProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum produto adicionado</p>
              </div>
            )}
          </div>

          {/* Custos */}
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

          {/* Condições de Pagamento */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Condições de Pagamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          {/* Resumo Financeiro */}
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {project ? 'Atualizar' : 'Criar'} Projeto
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Busca de Produtos */}
      {showProductSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
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
    </div>
  );
};

export default ProjectFormModal;