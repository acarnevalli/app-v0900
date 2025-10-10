import React, { useState } from 'react';
import { ShoppingBag, Package, TrendingDown, Calendar, Search, Truck, Plus, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Purchases: React.FC = () => {
  const { purchases = [], suppliers = [], products = [], addPurchase, addSupplier } = useApp();
  const [activeTab, setActiveTab] = useState<'list' | 'new' | 'suppliers' | 'stock'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Compras</h1>
        <p className="text-gray-600">Gerencie suas compras, fornecedores e estoque</p>
      </div>

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

      {/* Content */}
      {activeTab === 'list' && (
        <div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Compras (Mês)</p>
                  <p className="text-2xl font-bold text-gray-800">R$ 0,00</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Compras Pendentes</p>
                  <p className="text-2xl font-bold text-gray-800">0</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fornecedores Ativos</p>
                  <p className="text-2xl font-bold text-gray-800">{suppliers.filter(s => s.active).length}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Itens em Falta</p>
                  <p className="text-2xl font-bold text-gray-800">{products.filter(p => p.current_stock <= p.min_stock).length}</p>
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
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Purchases List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Compras Recentes</h3>
              
              {purchases.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma compra registrada</p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Registrar Primeira Compra
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">#</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Data</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fornecedor</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Itens</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((purchase) => (
                        <tr key={purchase.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{purchase.invoice_number || purchase.id.slice(0, 8)}</td>
                          <td className="py-3 px-4 text-sm">{new Date(purchase.date).toLocaleDateString('pt-BR')}</td>
                          <td className="py-3 px-4 text-sm">{purchase.supplier_name}</td>
                          <td className="py-3 px-4 text-sm">{purchase.items.length} itens</td>
                          <td className="py-3 px-4 text-sm font-medium">R$ {purchase.total.toFixed(2)}</td>
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
                              <button className="text-gray-600 hover:text-amber-600">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="text-gray-600 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
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

      {activeTab === 'new' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Nova Compra</h3>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500">
                  <option value="">Selecione um fornecedor</option>
                  {suppliers.filter(s => s.active).map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Compra
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da NF
                </label>
                <input
                  type="text"
                  placeholder="Número da nota fiscal"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500">
                  <option value="pending">Pendente</option>
                  <option value="received">Recebido</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produtos
              </label>
              <button
                type="button"
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-amber-500 hover:text-amber-600 flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Adicionar Produto</span>
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Observações adicionais..."
              />
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Registrar Compra
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Fornecedores</h3>
            <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Novo Fornecedor</span>
            </button>
          </div>
          
          {suppliers.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum fornecedor cadastrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map(supplier => (
                <div key={supplier.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800">{supplier.name}</h4>
                  {supplier.cnpj && <p className="text-sm text-gray-600">CNPJ: {supplier.cnpj}</p>}
                  {supplier.phone && <p className="text-sm text-gray-600">Tel: {supplier.phone}</p>}
                  <div className="mt-3 flex justify-between items-center">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      supplier.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {supplier.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <div className="flex space-x-2">
                      <button className="text-gray-600 hover:text-amber-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Controle de Estoque</h3>
          
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum produto cadastrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Produto</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Categoria</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estoque Atual</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estoque Mínimo</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium">{product.name}</td>
                        <td className="py-3 px-4 text-sm">{product.category}</td>
                        <td className="py-3 px-4 text-sm">{product.current_stock} {product.unit}</td>
                        <td className="py-3 px-4 text-sm">{product.min_stock} {product.unit}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            product.current_stock > product.min_stock 
                              ? 'bg-green-100 text-green-800' 
                              : product.current_stock === 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {product.current_stock > product.min_stock 
                              ? 'Normal' 
                              : product.current_stock === 0
                              ? 'Sem Estoque'
                              : 'Estoque Baixo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
