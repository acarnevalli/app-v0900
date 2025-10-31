import React, { useState, useMemo, useEffect } from 'react';
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
  TrendingUp,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
  BarChart3,
  Printer
} from 'lucide-react';
import { useApp, Project } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import ProjectFormModal from '../components/ProjectFormModal';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { OrderPDFDocument } from '../components/OrderPDFDocument';
import { useCompanyInfo } from '../hooks/useCompanyInfo';

// Interface melhorada com tipagem correta
interface ProjectDetailsModalProps {
  project: Project;
  onClose: () => void;
  companyData: any | null;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  onClose,
  companyData
}) => {
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

  // Dados padrão caso companyData seja null
  const safeCompanyData = companyData || {
    company_name: 'Empresa não configurada',
    cnpj: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    logo_url: ''
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

        {/* Conteúdo Completo */}
        <div className="p-8 space-y-6">
          {/* Cliente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User size={18} />
              Cliente
            </h3>
            <p className="text-gray-900 font-medium">{project.client_name || 'Não identificado'}</p>
          </div>

          {/* Status e Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-sm text-gray-600 block mb-2">Status:</span>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                {getStatusText(project.status)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-sm text-gray-600 block mb-2">Tipo:</span>
              <p className="font-medium text-lg">{getTypeText(project.type)}</p>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <span className="text-sm text-gray-600 block mb-1">Data de Início:</span>
              <p className="font-medium text-orange-900">{formatDate(project.start_date)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <span className="text-sm text-gray-600 block mb-1">Data de Entrega:</span>
              <p className="font-medium text-purple-900">{formatDate(project.end_date)}</p>
            </div>
          </div>

          {/* Prazo em Dias */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Prazo de Entrega
            </h3>
            <p className="text-lg font-bold text-amber-900">{project.delivery_deadline_days} dias</p>
          </div>

          {/* Descrição */}
          {project.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Descrição:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
            </div>
          )}

          {/* Produtos/Serviços */}
          {project.products && project.products.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Package size={18} />
                Itens do Pedido
              </h3>
              <div className="space-y-2">
                {project.products.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.item_type === 'produto' ? '📦 Produto' : '🔧 Serviço'} - Quantidade: {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-lg text-amber-600">{formatCurrency(item.unit_price || 0)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totais */}
          <div className="border-t-2 border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-gray-700">Valor Total:</span>
              <span className="text-3xl font-bold text-amber-600">{formatCurrency(project.budget)}</span>
            </div>
          </div>

          {/* Desconto e Total com Desconto */}
          {project.payment_terms?.discount_percentage && project.payment_terms.discount_percentage > 0 && (
            <>
              <div className="flex justify-between text-green-700 bg-green-50 p-4 rounded-lg">
                <span>Desconto ({project.payment_terms.discount_percentage}%):</span>
                <span className="font-bold">
                  -{formatCurrency((project.budget * project.payment_terms.discount_percentage) / 100)}
                </span>
              </div>
              <div className="border-t border-green-200 pt-2 flex justify-between bg-green-50 p-4 rounded-lg">
                <span className="font-bold">Total com Desconto:</span>
                <span className="font-bold text-green-700">
                  {formatCurrency(project.payment_terms.total_with_discount || 0)}
                </span>
              </div>
            </>
          )}

          {/* Condições de Pagamento */}
          {project.payment_terms && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign size={18} />
                Condições de Pagamento
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between">
                  <span className="text-gray-600">Parcelas:</span>
                  <span className="font-medium">{project.payment_terms.installments}x</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">Valor por Parcela:</span>
                  <span className="font-medium">
                    {formatCurrency(project.payment_terms.installment_value || 0)}
                  </span>
                </p>
                {project.payment_terms.payment_method && (
                  <p className="flex justify-between">
                    <span className="text-gray-600">Método:</span>
                    <span className="font-medium capitalize">
                      {project.payment_terms.payment_method.replace(/_/g, ' ')}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Margem de Lucro */}
          {project.profit_margin !== undefined && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h3 className="font-bold text-green-900 mb-2">Margem de Lucro</h3>
              <p className="text-lg font-bold text-green-900">{project.profit_margin}%</p>
            </div>
          )}

          {/* Observações */}
          {project.notes && (
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Observações</h3>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">{project.notes}</p>
            </div>
          )}
        </div>

        {/* Footer com Botões */}
        <div className="sticky bottom-0 bg-gray-100 px-8 py-4 flex justify-between items-center border-t">
          <PDFDownloadLink
            document={<OrderPDFDocument companyData={safeCompanyData} orderData={project} />}
            fileName={`${project.type}-${project.order_number}-${Date.now()}.pdf`}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {({ loading }) =>
              loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Preparando PDF...</span>
                </>
              ) : (
                <>
                  <Printer size={18} />
                  <span>Imprimir PDF</span>
                </>
              )
            }
          </PDFDownloadLink>
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

// Componente Principal
const OrdersAndQuotes: React.FC = () => {
  const { projects, deleteProject, clients } = useApp();

  // Estados de filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);

  // Estados para filtro de data
  const [dateFilterType, setDateFilterType] = useState<'month' | 'week' | 'biweekly' | 'year' | 'custom'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Hook centralizado para dados da empresa
  const { companyInfo, loading: companyLoading, error: companyError } = useCompanyInfo();

  // Tratamento de erro da empresa
  useEffect(() => {
    if (companyError) {
      console.error('Erro ao carregar informações da empresa:', companyError);
    }
  }, [companyError]);

  // Funções de Status
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

  // Funções de Filtro de Data
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

  // Estatísticas
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

  // Filtros
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    const dateRange = getDateRange();
    if (dateRange) {
      filtered = filtered.filter(p => {
        const projectDate = new Date(p.start_date);
        return projectDate >= dateRange.startDate && projectDate <= dateRange.endDate;
      });
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.order_number?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.client_name?.toLowerCase().includes(search) ||
        p.products?.some(prod => prod.product_name.toLowerCase().includes(search))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === typeFilter);
    }

    return filtered;
  }, [projects, searchTerm, statusFilter, typeFilter, currentDate, dateFilterType, customStartDate, customEndDate]);

  // Handlers
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
    alert('Exportação de dados em desenvolvimento!');
  };

  const handleCompanySettings = () => {
    const event = new CustomEvent('changePage', { detail: 'company-settings' });
    window.dispatchEvent(event);
  };

  // Render Principal
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
            onClick={handleCompanySettings}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Settings className="h-5 w-5" />
            <span>Configurar Empresa</span>
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
          companyData={companyInfo}
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
