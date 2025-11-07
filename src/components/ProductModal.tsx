import React, { useState, useEffect } from 'react';
import { X, Save, Search, Plus, ChevronDown } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import SupplierModal from './SupplierModal';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id?: string;
    name: string;
    description: string;
    category: string;
    type: 'material_bruto' | 'parte_produto' | 'produto_pronto';
    unit: string;
    cost_price: number;
    sale_price: number;
    current_stock: number;
    min_stock: number;
    supplier?: string;
  } | null;
  onSuccess?: (product: any) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product, onSuccess }) => {
  const { addProduct, updateProduct, suppliers, categories, addCategory, loadCategories } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    type: 'material_bruto' as const,
    unit: 'un',
    cost_price: '',
    profit_margin: '30',
    sale_price: '',
    min_stock: '0',
    current_stock: '0',
    supplier: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<typeof categories>([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtra fornecedores baseado na busca
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    supplier.cnpj?.includes(supplierSearchQuery) ||
    supplier.email?.toLowerCase().includes(supplierSearchQuery.toLowerCase())
  );

  // Carrega categorias ao abrir
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, loadCategories]);

  // Atualiza lista de categorias filtradas
  useEffect(() => {
    if (!categoryQuery.trim()) {
      setFilteredCategories(categories);
    } else {
      setFilteredCategories(
        categories.filter(cat =>
          cat.name.toLowerCase().includes(categoryQuery.toLowerCase())
        )
      );
    }
  }, [categoryQuery, categories]);

  // Preenche dados se for edição
  useEffect(() => {
    if (product) {
      const margin = product.sale_price && product.sale_price > 0
        ? (((product.sale_price - product.cost_price) / product.sale_price) * 100).toFixed(2)
        : '30';

      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        type: product.type || 'material_bruto',
        unit: product.unit || 'un',
        cost_price: product.cost_price?.toString() || '',
        profit_margin: margin,
        sale_price: product.sale_price?.toFixed(2) || '',
        min_stock: product.min_stock?.toString() || '0',
        current_stock: product.current_stock?.toString() || '0',
        supplier: product.supplier || '',
      });
      setSupplierSearchQuery(product.supplier || '');
    } else {
      resetForm();
    }
    setErrors({});
  }, [product]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      type: 'material_bruto',
      unit: 'un',
      cost_price: '',
      profit_margin: '30',
      sale_price: '',
      min_stock: '0',
      current_stock: '0',
      supplier: '',
    });
    setSupplierSearchQuery('');
  };

  // Calcula preço de venda: venda = custo / (1 - margem/100)
  const calculateSalePrice = (cost: number, margin: number): number => {
    if (margin <= 0) return cost;
    if (margin >= 100) return Infinity;
    return parseFloat((cost / (1 - margin / 100)).toFixed(2));
  };

  // Atualiza preço de venda ao mudar custo ou margem
  useEffect(() => {
    const cost = parseFloat(formData.cost_price) || 0;
    const margin = parseFloat(formData.profit_margin) || 0;
    const salePrice = calculateSalePrice(cost, margin);
    setFormData(prev => ({
      ...prev,
      sale_price: isNaN(salePrice) ? '' : salePrice.toFixed(2)
    }));
  }, [formData.cost_price, formData.profit_margin]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.category) newErrors.category = 'Categoria é obrigatória';
    if (!formData.cost_price || isNaN(parseFloat(formData.cost_price)))
      newErrors.cost_price = 'Preço de custo inválido';
    if (!formData.unit.trim()) newErrors.unit = 'Unidade é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const dataToSave = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        type: formData.type,
        unit: formData.unit.trim(),
        cost_price: parseFloat(formData.cost_price),
        sale_price: parseFloat(formData.sale_price),
        min_stock: parseInt(formData.min_stock, 10) || 0,
        current_stock: parseInt(formData.current_stock, 10) || 0,
        supplier: formData.supplier.trim() || null,
      };

      if (product?.id) {
        await updateProduct({ ...product, ...dataToSave });
      } else {
        await addProduct(dataToSave);
      }

      onSuccess?.(dataToSave);
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Erro ao salvar o produto.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryQuery.trim()) return;
    try {
      await addCategory(categoryQuery);
      setFormData(prev => ({ ...prev, category: categoryQuery }));
      setCategoryQuery('');
    } catch (err: any) {
      alert(err.message || 'Erro ao criar categoria.');
    }
  };

  const handleSupplierCreated = (supplier: { name: string }) => {
    setFormData(prev => ({ ...prev, supplier: supplier.name }));
    setSupplierSearchQuery(supplier.name);
    setIsSupplierModalOpen(false);
  };

  const handleSelectSupplier = (supplier: any) => {
    setFormData(prev => ({ ...prev, supplier: supplier.name }));
    setSupplierSearchQuery(supplier.name);
    setShowSupplierDropdown(false);
  };

  // Fecha o dropdown quando clica fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.supplier-dropdown-container')) {
        setShowSupplierDropdown(false);
      }
    };

    if (showSupplierDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSupplierDropdown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-amber-100 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-amber-100">
          <h2 className="text-2xl font-bold text-gray-800">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulário */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Nome e Unidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Mesa de Jantar"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                  errors.unit ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="un, kg, m"
              />
              {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit}</p>}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
              placeholder="Detalhes do produto..."
            />
          </div>

          {/* Categoria com criação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <div className="space-y-2">
              <input
                type="text"
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                placeholder="Buscar ou digitar nova categoria"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
              {categoryQuery && (
                <div className="flex flex-wrap gap-2">
                  {filteredCategories.slice(0, 5).map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category: cat.name }));
                        setCategoryQuery('');
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
                    >
                      {cat.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="flex items-center space-x-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-full"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{categoryQuery} (nova)</span>
                  </button>
                </div>
              )}
              {formData.category && !categoryQuery && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <span className="text-green-800 font-medium">{formData.category}</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: '' }))}
                    className="text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="material_bruto">Matéria-prima</option>
              <option value="parte_produto">Componente</option>
              <option value="produto_pronto">Produto Final</option>
            </select>
          </div>

          {/* Custo, Margem, Venda */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
                  errors.cost_price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.cost_price && <p className="mt-1 text-sm text-red-600">{errors.cost_price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Margem (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="99"
                name="profit_margin"
                value={formData.profit_margin}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venda (R$)</label>
              <input
                type="text"
                value={`R$ ${parseFloat(formData.sale_price || '0').toFixed(2)}`}
                readOnly
                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Estoque */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual</label>
              <input
                type="number"
                min="0"
                name="current_stock"
                value={formData.current_stock}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
              <input
                type="number"
                min="0"
                name="min_stock"
                value={formData.min_stock}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Fornecedor - PARTE ATUALIZADA COM AUTOCOMPLETE */}
          <div className="supplier-dropdown-container">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={supplierSearchQuery}
                onChange={(e) => {
                  setSupplierSearchQuery(e.target.value);
                  setFormData(prev => ({ ...prev, supplier: e.target.value }));
                  setShowSupplierDropdown(true);
                }}
                onFocus={() => setShowSupplierDropdown(true)}
                placeholder="Buscar fornecedor..."
                className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="p-1 text-amber-600 hover:text-amber-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Dropdown de fornecedores */}
              {showSupplierDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredSuppliers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      {supplierSearchQuery ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
                    </div>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <button
                        key={supplier.id}
                        type="button"
                        onClick={() => handleSelectSupplier(supplier)}
                        className="w-full px-4 py-2 text-left hover:bg-amber-50 focus:bg-amber-50 focus:outline-none transition-colors"
                      >
                        <div className="font-medium text-gray-900">{supplier.name}</div>
                        {(supplier.cnpj || supplier.email) && (
                          <div className="text-sm text-gray-500">
                            {supplier.cnpj && <span>CNPJ: {supplier.cnpj}</span>}
                            {supplier.cnpj && supplier.email && <span> • </span>}
                            {supplier.email && <span>{supplier.email}</span>}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Mostra fornecedor selecionado */}
            {formData.supplier && !showSupplierDropdown && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                <span className="text-sm text-amber-800">
                  Fornecedor selecionado: <strong>{formData.supplier}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, supplier: '' }));
                    setSupplierSearchQuery('');
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center space-x-2 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Salvando...' : 'Salvar Produto'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>

        {/* Modal de Novo Fornecedor */}
        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          onSuccess={handleSupplierCreated}
        />
      </div>
    </div>
  );
};

export default ProductModal;
