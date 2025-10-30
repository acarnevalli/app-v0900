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
  AlertCircle,
  X
} from 'lucide-react';
import { useApp, Project } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import ProjectFormModal from '../components/ProjectFormModal';

// ====== MODAL DE VISUALIZAÇÃO DE DETALHES ======
interface ProjectDetailsModalProps {
  project: Project;
  onClose: () => void;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ project, onClose }) => {
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

  const getTypeText = (type: string) => {
    return type === 'orcamento' ? '📋 Orçamento' : '✅ Venda';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-700 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {project.type === 'orcamento' ? 'Orçamento' : 'Venda'} #{project.order_number}
            </h2>
            <p className="text-amber-100 text-sm mt-1">Detalhes completos do pedido</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-amber-800 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-8 space-y-6">
          {/* Tipo e Status */}
          <div className="flex items-center space-x-4">
            <span className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              project.type === 'orcamento' 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {getTypeText(project.type)}
            </span>
            <span className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </span>
          </div>

          {/* Informações do Cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
              <User className="h-5 w-5 text-amber-600" />
              <span>Informações do Cliente</span>
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium text-gray-900">{project.client_name || 'Não identificado'}</p>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Descrição</h3>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{project.description}</p>
          </div>

          {/* Produtos e Serviços */}
          {project.products && project.products.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span>Itens do Pedido</span>
              </h3>
              <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                {project.products.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {product.item_type === 'produto' ? '📦 Produto' : '🔧 Serviço'}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900">{product.quantity}x</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valores e Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Valor</span>
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Valor Total:</span>
                  <span className="font-bold text-blue-900">{formatCurrency(project.budget)}</span>
                </div>
                {project.payment_terms?.discount_percentage && project.payment_terms.discount_percentage > 0 && (
                  <>
                    <div className="flex justify-between text-green-700">
                      <span>Desconto ({project.payment_terms.discount_percentage}%):</span>
                      <span className="font-bold">
                        -{formatCurrency((project.budget * project.payment_terms.discount_percentage) / 100)}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 flex justify-between">
                      <span className="font-bold">Total com Desconto:</span>
                      <span className="font-bold text-green-700">
                        {formatCurrency(project.payment_terms.total_with_discount || 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {project.payment_terms && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h3 className="font-bold text-green-900 mb-2 flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Parcelamento</span>
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Parcelas:</span>
                    <span className="font-bold text-green-900">{project.payment_terms.installments}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Valor por Parcela:</span>
                    <span className="font-bold text-green-900">
                      {formatCurrency(project.payment_terms.installment_value || 0)}
                    </span>
                  </div>
                  {project.payment_terms.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Método:</span>
                      <span className="font-bold text-green-900">{project.payment_terms.payment_method}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Datas e Prazos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <h3 className="font-bold text-orange-900 mb-2 flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Data de Início</span>
              </h3>
              <p className="text-lg font-bold text-orange-900">{formatDate(project.start_date)}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <h3 className="font-bold text-purple-900 mb-2 flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Data de Entrega</span>
              </h3>
              <p className="text-lg font-bold text-purple-900">{formatDate(project.end_date)}</p>
            </div>
          </div>

          {/* Prazo em Dias */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Prazo de Entrega</span>
            </h3>
            <p className="text-lg font-bold text-amber-900">{project.delivery_deadline_days} dias</p>
          </div>

          {/* Margem de Lucro (se houver) */}
          {project.profit_margin !== undefined && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h3 className="font-bold text-green-900 mb-2">Margem de Lucro</h3>
              <p className="text-lg font-bold text-green-900">{project.profit_margin}%</p>
            </div>
          )}

          {/* Notas ou Observações */}
          {project.notes && (
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Observações</h3>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{project.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-100 px-8 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// ====== COMPONENTE PRINCIPAL ======

const OrdersAndQuotes: React.FC = () => {
  const { projects, deleteProject, clients } = useApp();
  
  // ====== ESTADOS ======
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);

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

  const handleRowClick = (project: Project) => {
    setDetailsProject(project);
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

      {/* Tabela de Pedidos/Orçamentos */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Valor (R$)
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Situação
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Nota Fiscal
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500 font-medium">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                          ? 'Nenhum pedido encontrado' 
                          : 'Nenhum pedido cadastrado'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => handleRowClick(project)}
                    className="hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(project.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex items-center space-x-1 rounded-full text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200">
                        {project.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {project.client_name || 'Cliente não identificado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(project.budget)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>Emitir NF-e</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2 flex">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(project);
                        }}
                        className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {detailsProject && (
        <ProjectDetailsModal
          project={detailsProject}
          onClose={() => setDetailsProject(null)}
        />
      )}

      {/* Modal de Edição/Criação */}
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
