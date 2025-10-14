import React, { useState } from 'react';
import { X, Save, Search, Plus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import SupplierModal from './SupplierModal'; // Certifique-se de que já existe e foi atualizado

// Lista de categorias pré-definidas
const CATEGORIES = [
  'Móveis',
  'Decoração',
  'Cozinha',
  'Banheiro',
  'Iluminação',
  'Elétrica',
  'Hidráulica',
  'Jardim',
  'Escritório',
  'Ferramentas',
  'Utensílios',
  'Vidros',
  'Metais',
  'Pintura',
  'Tintas',
  'Ferragens',
  'Pisos',
  'Revestimentos',
  'Esquadrias',
];

// Interface para Produto (pode ser importada de outro lugar)
interface Product {
  id?: string;
  name: string;
  description: string;
  category: string;
  type: 'material_bruto' | 'parte_produto' | 'produto_pronto';
  unit: string;
  cost_price: number;
  sale_price?: number;
  current_stock: number;
  min_stock: number;
  supplier?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null; // Se for edição
  onSuccess?: (product: Product) => void; // Callback após salvar
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product, onSuccess }) => {
  const { addProduct, updateProduct, suppliers } = useApp();

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    type: (product?.type as 'material_bruto' | 'parte_produto' | 'produto_pronto') || 'material_bruto',
    unit: product?.unit || 'un',
    cost_price: product?.cost_price ? product.cost_price.toString() : '',
    profit_margin: '30', // Margem para cálculo dinâmico
    sale_price: product?.sale_price ? product.sale_price.toFixed(2) : '',
    min_stock: product?.min_stock ? product.min_stock.toString() : '0',
    current_stock: product?.current_stock ? product.current_stock.toString() : '0',
    supplier: product?.supplier || '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categorias filtradas por busca
  const filteredCategories = CATEGORIES.filter(cat =>
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Atualiza preço de venda com base na margem de lucro
  const calculateSalePrice = (cost: number, margin: number): number => {
    if (margin <= 0 || margin >= 100) return cost;
    return parseFloat((cost / (1 - margin / 100)).toFixed(2));
  };

  React.useEffect(() => {
    const cost = parseFloat(formData.cost_price) || 0;
    const margin = parseFloat(formData.profit_margin) || 0;
    const salePrice = calculateSalePrice(cost, margin);
    setFormData((prev) => ({ ...prev, sale_price: salePrice.toFixed(2) }));
  }, [formData.cost_price, formData.profit_margin]);

  // Validação
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.category) newErrors.category = 'Categoria é obrigatória';
    if (!formData.cost_price || isNaN(parseFloat(formData.cost_price)))
      newErrors.cost_price = 'Preço de custo inválido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSupplierSelected = (supplierName: string) => {
    setFormData((prev) => ({ ...prev, supplier: supplierName }));
  };

  const handleNewSupplierCreated = (supplier: { name: string }) => {
    handleSupplierSelected(supplier.name);
    setIsSupplierModalOpen(false);
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        unit: formData.unit,
        cost_price: parseFloat(formData.cost_price),
        sale_price: parseFloat(formData.sale_price),
        min_stock: parseInt(formData.min_stock, 10) || 0,
        current_stock: parseInt(formData.current_stock, 10) || 0,
        supplier: formData.supplier || null,
      };

      if (product?.id) {
        await updateProduct({ ...product, ...productData });
      } else {
        await addProduct(productData);
      }

      if (onSuccess) {
        onSuccess(productData as Product);
      }
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Erro ao salvar produto.' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
                placeholder="Ex: Cadeira de Escritório"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="un, kg, m, par"
              />
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
              placeholder="Detalhes adicionais..."
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <div className="space-y-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar categoria..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-sm">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <div
                        key={cat}
                        className="px-4 py-2 hover:bg-amber-50 cursor-pointer"
                        onClick={() => {
                          setFormData({ ...formData, category: cat });
                          setSearchQuery('');
                        }}
                      >
                        {cat}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">Nenhuma categoria encontrada</div>
                  )}
                </div>
              )}
              {!searchQuery && !formData.category && (
                <p className="text-sm text-gray-500">Digite para buscar ou selecionar uma categoria</p>
              )}
              {formData.category && !searchQuery && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <span className="font-medium text-green-800">{formData.category}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: '' })}
                    className="text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
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

          {/* Custo, Lucro, Venda */}
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
                placeholder="40"
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

          {/* Fornecedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Buscar fornecedor..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  title="Cadastrar novo fornecedor"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center space-x-2 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Salvando...' : 'Salvar Produto'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-70 transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Modal Aninhado: Cadastro de Fornecedor */}
        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          onSuccess={(supp) => handleNewSupplierCreated(supp)}
        />
      </div>
    </div>
  );
};

export default ProductModal;
