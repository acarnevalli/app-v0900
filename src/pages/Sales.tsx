import React, { useState } from 'react';
import { ShoppingCart, Package, DollarSign, TrendingUp, Calendar, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Sales: React.FC = () => {
  const { sales = [], clients = [], products = [], addSale } = useApp();
  const [activeTab, setActiveTab] = useState<'list' | 'new' | 'products'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Vendas</h1>
        <p className="text-gray-600">Gerencie suas vendas, orçamentos e pedidos</p>
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
          Listar Vendas
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
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'products'
              ? 'bg-white text-amber-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Produtos
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
                  <p className="text-sm text-gray-600 mb-1">Total de Vendas (Mês)</p>
                  <p className="text-2xl font-bold text-gray-800">
                    R$ {sales
                      .filter(s => {
                        const saleDate = new Date(s.date);
                        const now = new Date();
                        return saleDate.getMonth() === now.getMonth() && 
                               saleDate.getFullYear() === now.getFullYear();
                      })
                      .reduce((sum, s) => sum + s.total, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vendas Hoje</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {sales.filter(s => {
                      const saleDate = new Date(s.date).toDateString();
                      const today = new Date().toDateString();
                      return saleDate === today;
                    }).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ticket Médio</p>
                  <p className="text-2xl font-bold text-gray-800">
                    R$ {sales.length > 0 ? (sales.reduce((sum, s) => sum + s.total, 0) / sales.length).toFixed(2) : '0,00'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-amber-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Produtos Vendidos</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {sales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
                  </p>
                </div>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por cliente, produto ou número da venda..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Sales List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendas Recentes</h3>
              
              {sales.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma venda registrada</p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Registrar Primeira Venda
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">#</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Data</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Cliente</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Produtos</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale, index) => (
                        <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{index + 1}</td>
                          <td className="py-3 px-4 text-sm">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                          <td className="py-3 px-4 text-sm">{sale.client_name}</td>
                          <td className="py-3 px-4 text-sm">{sale.items.length} itens</td>
                          <td className="py-3 px-4 text-sm font-medium">R$ {sale.total.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              sale.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : sale.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {sale.status === 'completed' ? 'Concluída' : sale.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Nova Venda</h3>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500">
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Venda
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500">
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500">
                  <option value="pending">Pendente</option>
                  <option value="completed">Concluída</option>
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
                placeholder="Observações sobre a venda..."
              />
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="mb-4 flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Total:</span>
                <span className="text-2xl font-bold text-amber-600">R$ 0,00</span>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Finalizar Venda
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Catálogo de Produtos</h3>
          
          {products.filter(p => p.type === 'produto_pronto').length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum produto pronto cadastrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {products.filter(p => p.type === 'produto_pronto').map(product => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">{product.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Estoque:</span>
                    <span className={`text-sm font-medium ${
                      product.current_stock > product.min_stock 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {product.current_stock} {product.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">Preço:</span>
                    <span className="text-lg font-bold text-amber-600">
                      R$ {product.sale_price?.toFixed(2) || '0,00'}
                    </span>
                  </div>
                  <button className="w-full py-2 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors">
                    Adicionar à Venda
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sales;
