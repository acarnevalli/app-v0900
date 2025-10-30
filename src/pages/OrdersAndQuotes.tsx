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
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart3
} from 'lucide-react';
import { useApp, Project } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import ProjectFormModal from '../components/ProjectFormModal';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FileText, Settings } from 'lucide-react';
import PDFSettingsModal from '../components/PDFSettingsModal';
import ProjectPDFDocument from '../components/ProjectPDFDocument';

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
            onClick={() => setIsPDFSettingsOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
          <Settings className="h-5 w-5" />
            <span>Config. PDF</span>
          </button>
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
  
  // Novos estados para filtro de data
  const [dateFilterType, setDateFilterType] = useState<'month' | 'week' | 'biweekly' | 'year' | 'custom'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Novos estados para função de gerar PDF
  const [isPDFSettingsOpen, setIsPDFSettingsOpen] = useState(false);
  const { pdfSettings, updatePDFSettings } = useApp();

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

  // ====== FUNÇÕES DE FILTRO DE DATA ======
  
  const getDateRange = () => {
    const date = new Date(currentDate);
    let startDate: Date, endDate: Date;

    switch (dateFilterType) {
      case 'week':
        const dayOfWeek = date.getDay();
        startDate = new Date(date);
        startDate.setDate(date.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'biweekly':
        const dayOfMonth = date.getDate();
        if (dayOfMonth <= 15) {
          startDate = new Date(date.getFullYear(), date.getMonth(), 1);
          endDate = new Date(date.getFullYear(), date.getMonth(), 15, 23, 59, 59, 999);
        } else {
          startDate = new Date(date.getFullYear(), date.getMonth(), 16);
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        break;

      case 'year':
        startDate = new Date(date.getFullYear(), 0, 1);
        endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          return null;
        }
        break;

      case 'month':
      default:
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  };

  const getDateRangeLabel = () => {
    const date = new Date(currentDate);
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    switch (dateFilterType) {
      case 'week':
        const range = getDateRange();
        if (range) {
          return `${range.startDate.getDate()}/${range.startDate.getMonth() + 1} - ${range.endDate.getDate()}/${range.endDate.getMonth() + 1}/${range.endDate.getFullYear()}`;
        }
        return '';

      case 'biweekly':
        const dayOfMonth = date.getDate();
        const quinzena = dayOfMonth <= 15 ? '1ª Quinzena' : '2ª Quinzena';
        return `${quinzena} - ${months[date.getMonth()]} ${date.getFullYear()}`;

      case 'year':
        return `${date.getFullYear()}`;

      case 'custom':
        if (customStartDate && customEndDate) {
          return `${new Date(customStartDate).toLocaleDateString('pt-BR')} - ${new Date(customEndDate).toLocaleDateString('pt-BR')}`;
        }
        return 'Selecione as datas';

      case 'month':
      default:
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    switch (dateFilterType) {
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;

      case 'biweekly':
        const dayOfMonth = newDate.getDate();
        if (direction === 'next') {
          if (dayOfMonth <= 15) {
            newDate.setDate(16);
          } else {
            newDate.setMonth(newDate.getMonth() + 1, 1);
          }
        } else {
          if (dayOfMonth > 15) {
            newDate.setDate(1);
          } else {
            newDate.setMonth(newDate.getMonth() - 1, 16);
          }
        }
        break;

      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;

      case 'month':
      default:
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }

    setCurrentDate(newDate);
  };

  // ====== ESTATÍSTICAS ======
  
  const stats = useMemo(() => {
    const dateRange = getDateRange();
    let filteredByDate = projects;

    if (dateRange) {
      filteredByDate = projects.filter(p => {
        const projectDate = new Date(p.start_date);
        return projectDate >= dateRange.startDate && projectDate <= dateRange.endDate;
      });
    }

    const totalOrcamentos = filteredByDate.filter(p => p.type === 'orcamento').length;
    const totalVendas = filteredByDate.filter(p => p.type === 'venda').length;
    
    const vendasAprovadas = filteredByDate.filter(p => 
      p.type === 'venda' && 
      (p.status === 'aprovado' || p.status === 'em_producao')
    ).length;
    
    const valorTotalVendas = filteredByDate
      .filter(p => p.type === 'venda' && p.status !== 'cancelado')
      .reduce((sum, p) => sum + (p.budget || 0), 0);
    
    return {
      totalOrcamentos,
      totalVendas,
      vendasAprovadas,
      valorTotalVendas
    };
  }, [projects, currentDate, dateFilterType, customStartDate, customEndDate]);

  // ====== FILTROS ======
  
  const filteredProjects = useMemo(() => {
    let filtered = projects;
    
    // Filtro de data
    const dateRange = getDateRange();
    if (dateRange) {
      filtered = filtered.filter(p => {
        const projectDate = new Date(p.start_date);
        return projectDate >= dateRange.startDate && projectDate <= dateRange.endDate;
      });
    }
    
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
  }, [projects, searchTerm, statusFilter, typeFilter, currentDate, dateFilterType, customStartDate, customEndDate]);

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

  const handleExportData = () => {
    // Função para exportar dados (futura implementação)
    alert('Exportação de dados em desenvolvimento!');
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
        <div className="flex space-x-3">
          <button
            onClick={handleExportData}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Download className="h-5 w-5" />
            <span>Exportar</span>
          </button>          
          <div className="flex space-x-3">
        <button
          onClick={() => setIsPDFSettingsOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Settings className="h-5 w-5" />
          <span>Config. PDF</span>
        </button>
        <button
          onClick={handleExportData}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Download className="h-5 w-5" />
          <span>Exportar</span>
        </button>
        <button
          onClick={handleNewOrder}
          className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Pedido</span>
        </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Orçamentos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalOrcamentos}</p>
              <p className="text-xs text-gray-500 mt-1">{getDateRangeLabel()}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Vendas</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalVendas}</p>
              <p className="text-xs text-gray-500 mt-1">{getDateRangeLabel()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Em Andamento</p>
              <p className="text-2xl font-bold text-orange-600">{stats.vendasAprovadas}</p>
              <p className="text-xs text-gray-500 mt-1">{getDateRangeLabel()}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total em Vendas</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.valorTotalVendas)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{getDateRangeLabel()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Filtros de Data */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">Período:</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <select
            value={dateFilterType}
            onChange={(e) => setDateFilterType(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="month">Mensal</option>
            <option value="week">Semanal</option>
            <option value="biweekly">Quinzenal</option>
            <option value="year">Anual</option>
            <option value="custom">Período Personalizado</option>
          </select>

          {dateFilterType !== 'custom' ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex-1 text-center font-medium text-gray-800 bg-amber-50 py-3 rounded-lg border border-amber-200">
                {getDateRangeLabel()}
              </div>
              <button
                onClick={() => navigateDate('next')}
                className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Data inicial"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Data final"
              />
            </div>
          )}
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

      {/* Resultado da busca */}
      {filteredProjects.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-800">
            <BarChart3 className="h-5 w-5" />
            <span className="font-medium">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'registro encontrado' : 'registros encontrados'}
            </span>
          </div>
          <span className="text-sm text-blue-600">{getDateRangeLabel()}</span>
        </div>
      )}

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
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Valor (R$)
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Situação
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
                          ? 'Nenhum pedido encontrado com os filtros aplicados' 
                          : `Nenhum pedido cadastrado em ${getDateRangeLabel()}`}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Tente ajustar os filtros ou período
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
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{project.client_name || 'Cliente não identificado'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full border ${
                        project.type === 'orcamento' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {project.type === 'orcamento' ? 'Orçamento' : 'Venda'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(project.budget)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2 flex">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(project);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
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
    pdfContent={
      <PDFDownloadLink
        document={<ProjectPDFDocument project={detailsProject} settings={pdfSettings} />}
        fileName={`${detailsProject.type === 'orcamento' ? 'Orcamento' : 'Pedido'}-${detailsProject.order_number}.pdf`}
        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors font-medium flex items-center space-x-2"
      >
        {({ loading }) => (
          <>
            <FileText className="h-5 w-5" />
            <span>{loading ? 'Gerando PDF...' : 'Baixar PDF'}</span>
          </>
        )}
      </PDFDownloadLink>
    }
  />
)}
      
      {/* Modal de Edição/Criação */}
      {isModalOpen && (
        <ProjectFormModal
          project={editingProject}
          onClose={handleModalClose}
        />
      )}
      
      {/* Modal de Configurações do PDF */}
      {isPDFSettingsOpen && (
        <PDFSettingsModal
          isOpen={isPDFSettingsOpen}
          onClose={() => setIsPDFSettingsOpen(false)}
          currentSettings={pdfSettings}
          onSave={updatePDFSettings}
        />
      )}
    </div>
  );
};

export default OrdersAndQuotes;
