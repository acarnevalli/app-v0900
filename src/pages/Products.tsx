import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, TrendingUp, Box } from 'lucide-react';
import { useApp, Product } from '../contexts/AppContext';
import ProductModal from '../components/ProductModal';

const Products: React.FC = () => {
  const { products, deleteProduct, loading } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Extrair categorias únicas
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const productTypes = [
    { value: 'material_bruto', label: 'Material Bruto', color: 'bg-blue-100 text-blue-800' },
    { value: 'parte_produto', label: 'Parte de Produto', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'produto_pronto', label: 'Produto Pronto', color: 'bg-green-100 text-green-800' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesType = typeFilter === 'all' || product.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeInfo = (type: string) => {
    return productTypes.find(t => t.value === type) || productTypes[0];
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduct(productId);
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto');
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
          <p className="text-gray-600 mt-1">
            {products.length} {products.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
          </p>
        </div>
        <button
          onClick={handleNewProduct}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">Todos os Tipos</option>
            {productTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-white rounded-xl shadow-lg p-12">
            <Box className="h-24 w-24 mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-medium text-gray-500 mb-2">
              {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all' 
                ? 'Nenhum produto encontrado' 
                : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece adicionando seu primeiro produto'
              }
            </p>
            {!searchTerm && categoryFilter === 'all' && typeFilter === 'all' && (
              <button
                onClick={handleNewProduct}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-medium inline-flex items-center space-x-2 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                <span>Adicionar Primeiro Produto</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const typeInfo = getTypeInfo(product.type);
            const isLowStock = product.currentstock <= product.minstock;
            const profitMargin = product.saleprice && product.costprice
              ? ((product.saleprice - product.costprice) / product.saleprice * 100)
              : 0;

            return (
              <div 
                key={product.id} 
                className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  isLowStock ? 'ring-2 ring-red-400' : ''
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        {product.category && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                  )}

                  {/* Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Unidade:</span>
                      <span className="font-medium text-gray-800">{product.unit}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Estoque Atual:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                          {product.currentstock} {product.unit}
                        </span>
                        {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>

                    {isLowStock && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                        <p className="text-xs text-red-700 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Estoque abaixo do mínimo ({product.minstock})
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Custo:</span>
                        <span className="font-medium text-red-600">
                          R$ {product.costprice.toFixed(2)}
                        </span>
                      </div>

                      {product.saleprice && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Venda:</span>
                          <div className="text-right">
                            <span className="font-medium text-green-600">
                              R$ {product.saleprice.toFixed(2)}
                            </span>
                            {profitMargin > 0 && (
                              <div className="flex items-center justify-end text-xs text-green-600">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {profitMargin.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {product.components && product.components.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">
                            Componentes ({product.components.length})
                          </span>
                        </div>
                        <div className="space-y-1 max-h-16 overflow-y-auto">
                          {product.components.slice(0, 3).map((component, index) => (
                            <div key={index} className="text-xs text-gray-500 flex justify-between">
                              <span className="truncate">{component.productname}</span>
                              <span className="ml-2">{component.quantity} {component.unit}</span>
                            </div>
                          ))}
                          {product.components.length > 3 && (
                            <p className="text-xs text-gray-400 italic">
                              +{product.components.length - 3} mais...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {product.supplier && (
                      <div className="border-t pt-3">
                        <p className="text-xs text-gray-500">
                          <strong>Fornecedor:</strong> {product.supplier}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ProductModal
        isOpen={isModalOpen}
        product={editingProduct}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default Products;
