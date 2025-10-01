import React, { useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, Package, Tag, Wrench, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { useApp, Product } from '../contexts/AppContext';
import ProductModal from '../components/ProductModal';
import { useSettings } from '../contexts/SettingsContext';

const Products: React.FC = () => {
  const { products, deleteProduct } = useApp();
  const { productSettings } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories = productSettings.categories;
  const productTypes = [
    { value: 'material_bruto', label: 'Material Bruto' },
    { value: 'parte_produto', label: 'Parte de Produto' },
    { value: 'produto_pronto', label: 'Produto Pronto' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesType = typeFilter === 'all' || product.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeColor = (type: string) => {
    const colors = {
      material_bruto: 'bg-blue-100 text-blue-800',
      parte_produto: 'bg-yellow-100 text-yellow-800',
      produto_pronto: 'bg-green-100 text-green-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeText = (type: string) => {
    const texts = {
      material_bruto: 'Material Bruto',
      parte_produto: 'Parte de Produto',
      produto_pronto: 'Produto Pronto'
    };
    return texts[type as keyof typeof texts] || type;
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (productId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(productId);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Produtos</h1>
          <p className="text-gray-600 mt-1">Gerencie seus produtos e composições</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:from-amber-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Todos os Tipos</option>
            {productTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const isLowStock = productSettings.stockAlerts.enabled &&
            product.current_stock <= (product.min_stock + productSettings.stockAlerts.threshold);
          const profitMargin = product.sale_price
            ? ((product.sale_price - product.cost_price) / product.sale_price * 100)
            : 0;

          return (
            <div key={product.id} className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden ${
              isLowStock && productSettings.stockAlerts.highlightLowStock ? 'ring-2 ring-red-300 bg-red-50' : ''
            }`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
                    <div className="flex space-x-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(product.type)}`}>
                        {getTypeText(product.type)}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Package className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">Unidade: {product.unit}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estoque Atual:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${
                        isLowStock && productSettings.stockAlerts.highlightLowStock ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {product.current_stock} {product.unit}
                      </span>
                      {isLowStock && productSettings.stockAlerts.highlightLowStock && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Custo:</span>
                    <span className="font-medium text-red-600">
                      R$ {product.cost_price.toFixed(2)}
                    </span>
                  </div>
                  
                  {product.sale_price && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Preço de Venda:</span>
                      <div className="text-right">
                        <span className="font-medium text-green-600">
                          R$ {product.sale_price.toFixed(2)}
                        </span>
                        {profitMargin > 0 && (
                          <div className="flex items-center text-xs text-green-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {profitMargin.toFixed(1)}% lucro
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center">
                        <Wrench className="h-4 w-4 mr-1 text-amber-600" />
                        Componentes ({product.components.length})
                      </span>
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {product.components.map((component, index) => (
                        <div key={index} className="text-xs text-gray-500 flex justify-between">
                          <span>{component.product_name}</span>
                          <span>{component.quantity} {component.unit} - R$ {component.total_cost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {product.supplier && (
                    <div className="border-t pt-3">
                      <div className="text-xs text-gray-500">
                        <strong>Fornecedor:</strong> {product.supplier}
                      </div>
                    </div>
                  )}
                </div>
                
                {isLowStock && productSettings.stockAlerts.enabled && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-800">Estoque Baixo</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      Estoque atual: {product.current_stock} | Mínimo: {product.min_stock} | 
                      Alerta: {product.min_stock + productSettings.stockAlerts.threshold}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-gray-400 mb-4">
              <Package className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-500 mb-2">
              {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-gray-400">
              {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro produto'
              }
            </p>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Products;