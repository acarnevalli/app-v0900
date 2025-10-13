import React, { useState, useEffect } from 'react';
import { X, Save, Package, Plus, Trash2, Calculator } from 'lucide-react';
import { useApp, Product, ProductComponent } from '../contexts/AppContext';
import ProductCombobox from './ProductCombobox';

interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addProduct, updateProduct, products } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    type: 'produto_pronto' as 'material_bruto' | 'parte_produto' | 'produto_pronto',
    unit: 'UN',
    cost_price: 0,
    sale_price: 0,
    current_stock: 0,
    min_stock: 0,
    supplier: '',
    components: [] as ProductComponent[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        type: product.type || 'produto_pronto',
        unit: product.unit || 'UN',
        cost_price: product.cost_price || 0,
        sale_price: product.sale_price || 0,
        current_stock: product.current_stock || 0,
        min_stock: product.min_stock || 0,
        supplier: product.supplier || '',
        components: product.components || [],
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['cost_price', 'sale_price', 'current_stock', 'min_stock'].includes(name)
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleAddComponent = () => {
    setFormData(prev => ({
      ...prev,
      components: [
        ...prev.components,
        {
          product_id: '',
          component_id: '',
          product_name: '',
          quantity: 1,
          unit: '',
          unit_cost: 0,
          total_cost: 0,
        },
      ],
    }));
  };

  const handleSelectComponent = (index: number, selectedProduct: Product) => {
    const updatedComponents = [...formData.components];
    const quantity = updatedComponents[index].quantity || 1;
    
    updatedComponents[index] = {
      ...updatedComponents[index],
      product_id: selectedProduct.id,
      component_id: selectedProduct.id,
      product_name: selectedProduct.name,
      unit: selectedProduct.unit,
      unit_cost: selectedProduct.cost_price,
      total_cost: quantity * selectedProduct.cost_price,
    };

    const totalCost = updatedComponents.reduce((sum, comp) => sum + (comp.total_cost || 0), 0);

    setFormData(prev => ({
      ...prev,
      components: updatedComponents,
      cost_price: totalCost,
    }));
  };

  const handleComponentQuantityChange = (index: number, quantity: number) => {
    const updatedComponents = [...formData.components];
    updatedComponents[index].quantity = quantity;
    updatedComponents[index].total_cost = quantity * updatedComponents[index].unit_cost;

    const totalCost = updatedComponents.reduce((sum, comp) => sum + (comp.total_cost || 0), 0);

    setFormData(prev => ({
      ...prev,
      components: updatedComponents,
      cost_price: totalCost,
    }));
  };

  const handleRemoveComponent = (index: number) => {
    const updatedComponents = formData.components.filter((_, i) => i !== index);
    const totalCost = updatedComponents.reduce((sum, comp) => sum + (comp.total_cost || 0), 0);

    setFormData(prev => ({
      ...prev,
      components: updatedComponents,
      cost_price: totalCost,
    }));
  };

  const calculateSuggestedPrice = () => {
    const margin = 30; // 30% de margem padrão
    const suggestedPrice = formData.cost_price * (1 + margin / 100);
    setFormData(prev => ({
      ...prev,
      sale_price: Math.round(suggestedPrice * 100) / 100,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Nome do produto é obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        unit: formData.unit,
        cost_price: formData.cost_price,
        sale_price: formData.sale_price || undefined,
        current_stock: formData.current_stock,
        min_stock: formData.min_stock,
        supplier: formData.supplier,
        components: formData.components,
      };

      if (product) {
        await updateProduct({
          ...productData,
          id: product.id,
          user_id: product.user_id,
          created_at: product.created_at,
          updated_at: new Date().toISOString(),
        });
      } else {
        await addProduct(productData);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const usedComponentIds = formData.components.map(c => c.product_id).filter(Boolean);
  const excludeIds = product ? [product.id, ...usedComponentIds] : usedComponentIds;
  const totalComponentsCost = formData.components.reduce((sum, c) => sum + (c.total_cost || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">
              {product ? 'Editar Produto' : 'Novo Produto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Informações Básicas
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: Mesa de Madeira"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Descrição detalhada do produto..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Móveis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="material_bruto">Material Bruto</option>
                  <option value="parte_produto">Parte do Produto</option>
                  <option value="produto_pronto">Produto Pronto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="UN">Unidade (UN)</option>
                  <option value="KG">Quilograma (KG)</option>
                  <option value="G">Grama (G)</option>
                  <option value="L">Litro (L)</option>
                  <option value="ML">Mililitro (ML)</option>
                  <option value="M">Metro (M)</option>
                  <option value="M2">Metro² (M²)</option>
                  <option value="M3">Metro³ (M³)</option>
                  <option value="CX">Caixa (CX)</option>
                  <option value="PC">Pacote (PC)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Componentes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold text-gray-800">
                Componentes
              </h3>
              <button
                type="button"
                onClick={handleAddComponent}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center space-x-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Componente</span>
              </button>
            </div>

            {formData.components.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
                Nenhum componente adicionado. Use componentes para produtos compostos.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.components.map((component, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Produto Componente
                      </label>
                      <ProductCombobox
                        products={products}
                        selectedProductId={component.product_id}
                        onSelect={(selectedProduct) => handleSelectComponent(index, selectedProduct)}
                        excludeProductIds={excludeIds}
                        placeholder="Selecione um produto..."
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantidade
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={component.quantity || ''}
                          onChange={(e) => handleComponentQuantityChange(index, parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Unidade
                        </label>
                        <input
                          type="text"
                          value={component.unit || ''}
                          disabled
                          className="w-full px-2 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Custo Unit.
                        </label>
                        <input
                          type="text"
                          value={component.unit_cost ? `R$ ${component.unit_cost.toFixed(2)}` : ''}
                          disabled
                          className="w-full px-2 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Total
                        </label>
                        <input
                          type="text"
                          value={component.total_cost ? `R$ ${component.total_cost.toFixed(2)}` : ''}
                          disabled
                          className="w-full px-2 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded font-medium"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(index)}
                      className="w-full px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition flex items-center justify-center space-x-2 text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remover</span>
                    </button>
                  </div>
                ))}

                {formData.components.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-800">
                        Custo Total dos Componentes:
                      </span>
                      <span className="text-lg font-bold text-green-900">
                        R$ {totalComponentsCost.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Este valor será usado como custo do produto
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preços e Estoque */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Preços e Estoque
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de Custo (R$)
                </label>
                <input
                  type="number"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Preço de Venda (R$)
                  </label>
                  <button
                    type="button"
                    onClick={calculateSuggestedPrice}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <Calculator className="h-3 w-3" />
                    <span>Calcular (30%)</span>
                  </button>
                </div>
                <input
                  type="number"
                  name="sale_price"
                  value={formData.sale_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque Atual
                </label>
                <input
                  type="number"
                  name="current_stock"
                  value={formData.current_stock}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque Mínimo
                </label>
                <input
                  type="number"
                  name="min_stock"
                  value={formData.min_stock}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fornecedor
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nome do fornecedor"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <Save className="h-5 w-5" />
              <span>{loading ? 'Salvando...' : 'Salvar Produto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
