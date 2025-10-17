import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  User, 
  DollarSign, 
  Clock, 
  Edit2, 
  Trash2, 
  FileText, 
  Download, 
  Filter,
  Package,
  Wrench,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useApp, Project } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import ProjectFormModal from '../components/ProjectFormModal';

const OrdersAndQuotes: React.FC = () => {
  const { projects, deleteProject, clients } = useApp();
  
  // ====== ESTADOS ======
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // ====== FUNÇÕES DE FORMATAÇÃO ======
  
  const getStatusColor = (status: string) => {
    const colors = {
      orcamento: 'bg-blue-100 text-blue-800 border-blue-200',
      aprovado: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      em_producao: 'bg-orange-100 text-orange-800 border-orange-200',
      concluido: 'bg-green-100 text-green-800 border-green-200',
      entregue: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status: string) => {
    const texts = {
      orcamento: 'Orçamento',
      aprovado: 'Aprovado',
      em_producao: 'Em Produção',
      concluido: 'Concluído',
      entregue: 'Entregue'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getTypeColor = (type: string) => {
    return type === 'orcamento' 
      ? 'bg-blue-50 text-blue-700 border-blue-200' 
      : 'bg-green-50 text-green-700 border-green-200';
  };

  const getTypeText = (type: string) => {
    return type === 'orcamento' ? '📋 Orçamento' : '✅ Venda';
  };

  // ====== ESTATÍSTICAS ======
  
  const stats = useMemo(() => {
    const totalOrcamentos = projects.filter(p => p.type === 'orcamento').length;
    const totalVendas = projects.filter(p => p.type === 'venda').length;
    
    const vendasAprovadas = projects.filter(p => 
      p.type === 'venda' && 
      (p.status === 'aprovado' || p.status === 'em_producao')
    ).length;
    
    const valorTotalVendas = projects
      .filter(p => p.type === 'venda' && p.status !== 'cancelado')
      .reduce((sum, p) => sum + (p.budget || 0), 0);
    
    return {
      totalOrcamentos,
      totalVendas,
      vendasAprovadas,
      valorTotalVendas
    };
  }, [projects]);

  // ====== FILTROS ======
  
  const filteredProjects = useMemo(() => {
    let filtered = projects;
    
    // Filtro de busca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.order_number?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.client_name?.toLowerCase().includes(search) ||
        p.products?.some(prod => prod.product_name.toLowerCase().includes(search))
      );
    }
    
    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    // Filtro de tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === typeFilter);
    }
    
    return filtered;
  }, [projects, searchTerm, statusFilter, typeFilter]);

  // ====== HANDLERS ======
  
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido/orçamento?')) return;
    
    try {
      await deleteProject(projectId);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir pedido/orçamento');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleNewOrder = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  // ====== RENDERIZAÇÃO DE ITENS ======
  
  const renderItemsList = (products: any[]) => {
    if (!products || products.length === 0) return null;
    
    const produtosCount = products.filter(p => p.item_type === 'produto').length;
    const servicosCount = products.filter(p => p.item_type === 'servico').length;
    
    return (
      <div className="flex items-center space-x-3 text-sm text-gray-600">
        {produtosCount > 0 && (
          <div className="flex items-center space-x-1">
            <Package className="h-4 w-4 text-blue-500" />
            <span>{produtosCount} produto{produtosCount !== 1 ? 's' : ''}</span>
          </div>
        )}
        {servicosCount > 0 && (
          <div className="flex items-center space-x-1">
            <Wrench className="h-4 w-4 text-orange-500" />
            <span>{servicosCount} serviço{servicosCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    );
  };

  // ====== RENDER PRINCIPAL ======
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vendas e Orçamentos</h1>
          <p className="text-gray-600 mt-1">Gerencie seus pedidos, orçamentos e vendas</p>
        </div>
        <button
          onClick={handleNewOrder}
          className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Pedido</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Orçamentos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalOrcamentos}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Vendas</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalVendas}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Em Andamento</p>
              <p className="text-2xl font-bold text-orange-600">{stats.vendasAprovadas}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total em Vendas</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.valorTotalVendas)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filtros:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por número, cliente, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Todos os Tipos</option>
            <option value="orcamento">📋 Orçamentos</option>
            <option value="venda">✅ Vendas</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="orcamento">Orçamento</option>
            <option value="aprovado">Aprovado</option>
            <option value="em_producao">Em Produção</option>
            <option value="concluido">Concluído</option>
            <option value="entregue">Entregue</option>
          </select>
        </div>
      </div>
        {/* Lista de Pedidos/Orçamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100">
            <div className="p-6">
              {/* Cabeçalho do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl font-bold text-amber-600">
                      {project.order_number}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(project.type)}`}>
                      {getTypeText(project.type)}
                    </span>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <p className="text-gray-700 mb-4 line-clamp-2 min-h-[3rem]">
                {project.description}
              </p>

              {/* Informações */}
              <div className="space-y-3">
                {/* Cliente */}
                <div className="flex items-center space-x-3 text-gray-600">
                  <User className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span className="text-sm truncate">{project.client_name || 'Cliente não identificado'}</span>
                </div>

                {/* Itens */}
                {renderItemsList(project.products)}

                {/* Valor */}
                <div className="flex items-center space-x-3 text-gray-600">
                  <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">
                      {formatCurrency(project.budget)}
                    </span>
                    {project.payment_terms && project.payment_terms.discount_percentage > 0 && (
                      <span className="text-xs text-green-600">
                        Com desconto: {formatCurrency(project.payment_terms.total_with_discount || 0)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pagamento */}
                {project.payment_terms && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm">
                      {project.payment_terms.installments}x de {formatCurrency(project.payment_terms.installment_value || 0)}
                    </span>
                  </div>
                )}

                {/* Datas */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">
                      Início: {formatDate(project.start_date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">
                      {project.delivery_deadline_days} dias
                    </span>
                  </div>
                </div>

                {/* Data de Entrega */}
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    Entrega: {formatDate(project.end_date)}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="px-6 pb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    project.status === 'orcamento' ? 'bg-blue-500 w-1/5' :
                    project.status === 'aprovado' ? 'bg-yellow-500 w-2/5' :
                    project.status === 'em_producao' ? 'bg-orange-500 w-3/5' :
                    project.status === 'concluido' ? 'bg-green-500 w-4/5' :
                    'bg-purple-500 w-full'
                  }`}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-white rounded-xl shadow-lg p-12">
            <div className="text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? (
                <AlertCircle className="h-16 w-16 mx-auto" />
              ) : (
                <FileText className="h-16 w-16 mx-auto" />
              )}
            </div>
            <h3 className="text-xl font-medium text-gray-500 mb-2">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Nenhum pedido encontrado' 
                : 'Nenhum pedido cadastrado'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro orçamento ou venda'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <button
                onClick={handleNewOrder}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Criar Primeiro Pedido</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ProjectFormModal
          project={editingProject}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default OrdersAndQuotes;
