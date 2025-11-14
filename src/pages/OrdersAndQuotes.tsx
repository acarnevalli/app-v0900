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
  Printer,
  Filter,
  Package,
  TrendingUp,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart3,
  Printer
} from 'lucide-react';
import { useApp, Project } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import ProjectFormModal from '../components/ProjectFormModal';
import { useSettings } from '../contexts/SettingsContext';
import { useCompanyInfo } from '../hooks/useCompanyInfo';

interface ProjectDetailsModalProps {
  project: Project;
  onClose: () => void;
  companyData: any | null;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ project, onClose, companyData }) => {
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

        <div className="p-8 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User size={18} />
              Cliente
            </h3>
            <p className="text-gray-900 font-medium">{project.client_name || 'Não identificado'}</p>
          </div>

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

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Prazo de Entrega
            </h3>
            <p className="text-lg font-bold text-amber-900">{project.delivery_deadline_days} dias</p>
          </div>

          {project.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Descrição:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
            </div>
          )}

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

          <div className="border-t-2 border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-gray-700">Valor Total:</span>
              <span className="text-3xl font-bold text-amber-600">{formatCurrency(project.budget)}</span>
            </div>
          </div>

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

          {project.profit_margin !== undefined && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h3 className="font-bold text-green-900 mb-2">Margem de Lucro</h3>
              <p className="text-lg font-bold text-green-900">{project.profit_margin}%</p>
            </div>
          )}

          {project.notes && (
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Observações</h3>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">{project.notes}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-100 px-8 py-4 flex justify-between items-center border-t">
            <button
              onClick={() => generatePDF(project)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir PDF</span>
            </button>
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

const OrdersAndQuotes: React.FC = () => {
  const { projects, deleteProject, clients, addSale, addProject, updateProject } = useApp();
  const { pdfSettings, companySettings } = useSettings();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);

  const [dateFilterType, setDateFilterType] = useState<'month' | 'week' | 'biweekly' | 'year' | 'custom'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const { companyInfo, loading: companyLoading, error: companyError } = useCompanyInfo();

  useEffect(() => {
    if (companyError) {
      console.error('Erro ao carregar informações da empresa:', companyError);
    }
  }, [companyError]);

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

// ========== FUNÇÃO GENERATEPDF CORRIGIDA ==========
  const generatePDF = async (project: Project) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Verificar se companySettings existe
      if (!companySettings) {
        console.error('Configurações da empresa não disponíveis');
        alert('Erro: Configurações da empresa não carregadas. Por favor, configure a empresa antes de gerar o PDF.');
        return;
      }

      const companyInfo = {
        name: companySettings.basic?.name || 'CARNEVALLI ESQUADRIAS LTDA',
        address: `${companySettings.address?.street || ''}, ${companySettings.address?.number || ''}${companySettings.address?.complement ? ' - ' + companySettings.address.complement : ''} - ${companySettings.address?.neighborhood || ''}`,
        city: `${companySettings.address?.city || ''} - ${companySettings.address?.state || ''} - CEP: ${companySettings.address?.zipCode || ''}`,
        phone: companySettings.basic?.phone || '',
        email: companySettings.basic?.email || '',
        cnpj: companySettings.fiscal?.cnpj || '',
        ie: companySettings.fiscal?.ie || ''
      };

      // Função auxiliar para converter hex em RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 70, g: 130, b: 180 };
      };

      // ==================== MARCA D'ÁGUA ====================
      if (pdfSettings?.watermark?.enabled) {
        try {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          logoImg.src = '/logo.svg';

          await new Promise((resolve) => {
            logoImg.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve(false);
                return;
              }

              canvas.width = logoImg.width;
              canvas.height = logoImg.height;
              ctx.globalAlpha = pdfSettings.watermark.opacity;
              ctx.drawImage(logoImg, 0, 0);
              const watermarkData = canvas.toDataURL('image/png');

              const imgWidth = pdfSettings.watermark.size;
              const imgHeight = pdfSettings.watermark.size;
              let x = 0;
              let y = 0;

              switch (pdfSettings.watermark.position) {
                case 'center':
                  x = (210 - imgWidth) / 2;
                  y = (297 - imgHeight) / 2;
                  break;
                case 'top-left':
                  x = 10;
                  y = 10;
                  break;
                case 'top-right':
                  x = 210 - imgWidth - 10;
                  y = 10;
                  break;
                case 'bottom-left':
                  x = 10;
                  y = 297 - imgHeight - 10;
                  break;
                case 'bottom-right':
                  x = 210 - imgWidth - 10;
                  y = 297 - imgHeight - 10;
                  break;
              }

              doc.addImage(watermarkData, 'PNG', x, y, imgWidth, imgHeight);
              resolve(true);
            };
            logoImg.onerror = () => resolve(false);
            
            // Timeout de 2 segundos para carregar logo
            setTimeout(() => resolve(false), 2000);
          });
        } catch (error) {
          console.log('Logo não encontrado, continuando sem marca d\'água');
        }
      }

      // ==================== CABEÇALHO PROFISSIONAL ====================
      const headerHeight = pdfSettings?.header?.height || 40;
      const headerWidth = 210;
      const steps = 50;

      // Aplicar gradiente ou cor sólida no cabeçalho
      if (pdfSettings?.header?.gradient?.enabled) {
        const startColor = hexToRgb(pdfSettings.header.gradient.startColor);
        const endColor = hexToRgb(pdfSettings.header.gradient.endColor);

        for (let i = 0; i < steps; i++) {
          const ratio = i / steps;
          let r, g, b;

          switch (pdfSettings.header.gradient.direction) {
            case 'horizontal':
              r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
              g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
              b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);
              doc.setFillColor(r, g, b);
              doc.rect((headerWidth / steps) * i, 0, headerWidth / steps, headerHeight, 'F');
              break;
            case 'vertical':
              r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
              g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
              b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);
              doc.setFillColor(r, g, b);
              doc.rect(0, (headerHeight / steps) * i, headerWidth, headerHeight / steps, 'F');
              break;
            case 'diagonal-right':
              r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
              g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
              b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);
              doc.setFillColor(r, g, b);
              doc.rect((headerWidth / steps) * i, 0, headerWidth / steps, headerHeight, 'F');
              break;
            case 'diagonal-left':
              r = Math.round(endColor.r + (startColor.r - endColor.r) * ratio);
              g = Math.round(endColor.g + (startColor.g - endColor.g) * ratio);
              b = Math.round(endColor.b + (startColor.b - endColor.b) * ratio);
              doc.setFillColor(r, g, b);
              doc.rect((headerWidth / steps) * i, 0, headerWidth / steps, headerHeight, 'F');
              break;
          }
        }
      } else {
        const bgColor = hexToRgb(pdfSettings?.header?.backgroundColor || '#4682B4');
        doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
        doc.rect(0, 0, headerWidth, headerHeight, 'F');
      }

      // Logo no cabeçalho
      let logoLoaded = false;
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = '/400dpiLogoCropped.png';

        await new Promise((resolve) => {
          logoImg.onload = () => {
            doc.addImage(logoImg, 'PNG', 12, 8, 30, 30);
            logoLoaded = true;
            resolve(true);
          };
          logoImg.onerror = () => resolve(false);
          
          // Timeout de 2 segundos
          setTimeout(() => resolve(false), 2000);
        });
      } catch (error) {
        console.log('Logo não encontrado no cabeçalho');
      }

      // Informações da empresa no cabeçalho
      const textColor = hexToRgb(pdfSettings?.header?.companyName?.color || '#FFFFFF');
      doc.setTextColor(textColor.r, textColor.g, textColor.b);
      
      // Nome da empresa
      doc.setFontSize(pdfSettings?.header?.companyName?.fontSize || 16);
      doc.setFont('helvetica', pdfSettings?.header?.companyName?.fontWeight || 'bold');
      doc.text(companyInfo.name, logoLoaded ? 47 : 15, 15);

      // Endereço
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(companyInfo.address, logoLoaded ? 47 : 15, 21);
      doc.text(companyInfo.city, logoLoaded ? 47 : 15, 25);

      // Informações de contato no lado direito do cabeçalho
      doc.setFontSize(8);
      const rightAlign = 195;
      doc.text(companyInfo.phone, rightAlign, 15, { align: 'right' });
      doc.text(companyInfo.email, rightAlign, 19, { align: 'right' });
      doc.text(`CNPJ: ${companyInfo.cnpj}`, rightAlign, 23, { align: 'right' });
      if (companyInfo.ie) {
        doc.text(`IE: ${companyInfo.ie}`, rightAlign, 27, { align: 'right' });
      }

      // Linha separadora após cabeçalho
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, headerHeight + 3, 195, headerHeight + 3);

      // ==================== TIPO DO DOCUMENTO (ORÇAMENTO / VENDA) ====================
      let yPosition = headerHeight + 12;
      
      doc.setTextColor(0, 0, 0);
      const isQuote = project.type === 'orcamento';
      const docTitle = isQuote ? 'ORÇAMENTO' : 'VENDA CONCLUÍDA';
      
      // Caixa com o tipo do documento
      if (isQuote) {
        doc.setFillColor(59, 130, 246); // Azul para orçamento
      } else {
        doc.setFillColor(34, 197, 94); // Verde para venda
      }
      doc.roundedRect(15, yPosition - 5, 60, 10, 2, 2, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(docTitle, 45, yPosition + 1, { align: 'center' });

      // Número do documento
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const orderNumber = project.order_number || project.number || '-';
      doc.text(`Nº ${orderNumber.toString().padStart(4, '0')}`, 195, yPosition + 1, { align: 'right' });

      yPosition += 15;

      // ==================== DADOS DO CLIENTE ====================
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(15, yPosition, 180, 22, 2, 2, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO CLIENTE', 17, yPosition + 5);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cliente: ${project.client_name || 'Não identificado'}`, 17, yPosition + 11);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 17, yPosition + 17);
      
      if (project.start_date) {
        doc.text(`Início: ${new Date(project.start_date).toLocaleDateString('pt-BR')}`, 120, yPosition + 11);
      }
      if (project.end_date) {
        doc.text(`Prazo: ${new Date(project.end_date).toLocaleDateString('pt-BR')}`, 120, yPosition + 17);
      }

      yPosition += 30;

      // ==================== DESCRIÇÃO DO PROJETO ====================
      if (project.description) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DESCRIÇÃO', 15, yPosition);
        
        yPosition += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const splitDescription = doc.splitTextToSize(project.description, 180);
        doc.text(splitDescription, 15, yPosition);
        yPosition += (splitDescription.length * 5) + 8;
      }

      // ==================== LISTA DE PRODUTOS/SERVIÇOS ====================
      if (project.products && project.products.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('PRODUTOS E SERVIÇOS', 15, yPosition);
        yPosition += 8;

        // Cabeçalho da tabela
        doc.setFillColor(70, 130, 180);
        doc.roundedRect(15, yPosition - 5, 180, 8, 1, 1, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Item', 17, yPosition);
        doc.text('Qtd', 125, yPosition, { align: 'center' });
        doc.text('Valor Unit.', 150, yPosition, { align: 'right' });
        doc.text('Total', 185, yPosition, { align: 'right' });

        yPosition += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        // Linhas de produtos
        project.products.forEach((product: any, index: number) => {
          // Verificar se precisa de nova página
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          // Linha zebrada
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, yPosition - 4, 180, 10, 'F');
          }

          // Nome do produto
          const productName = doc.splitTextToSize(product.product_name || 'Produto sem nome', 100);
          doc.text(productName[0], 17, yPosition);
          
          // Quantidade
          doc.text((product.quantity || 0).toString(), 125, yPosition, { align: 'center' });
          
          // Valor unitário
          doc.text(`R$ ${(product.unit_price || 0).toFixed(2).replace('.', ',')}`, 150, yPosition, { align: 'right' });
          
          // Total
          const totalPrice = product.total_price || (product.quantity * product.unit_price) || 0;
          doc.text(`R$ ${totalPrice.toFixed(2).replace('.', ',')}`, 185, yPosition, { align: 'right' });

          yPosition += 10;
        });

        // Linha separadora antes dos totais
        doc.setDrawColor(70, 130, 180);
        doc.setLineWidth(0.8);
        doc.line(125, yPosition, 195, yPosition);
        yPosition += 8;

        // Totais
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        
        // Subtotal
        doc.text('Subtotal:', 145, yPosition, { align: 'right' });
        doc.text(`R$ ${(project.budget || 0).toFixed(2).replace('.', ',')}`, 185, yPosition, { align: 'right' });
        yPosition += 6;

        // Desconto (se houver)
        if (project.payment_terms?.discount_percentage && project.payment_terms.discount_percentage > 0) {
          doc.setFont('helvetica', 'normal');
          const discountAmount = (project.budget || 0) * (project.payment_terms.discount_percentage / 100);
          doc.text(`Desconto (${project.payment_terms.discount_percentage}%):`, 145, yPosition, { align: 'right' });
          doc.text(`-R$ ${discountAmount.toFixed(2).replace('.', ',')}`, 185, yPosition, { align: 'right' });
          yPosition += 6;

          // Total com desconto
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setFillColor(34, 197, 94);
          doc.roundedRect(125, yPosition - 4, 70, 10, 2, 2, 'F');
          doc.setTextColor(255, 255, 255);
          const finalValue = project.payment_terms.total_with_discount || ((project.budget || 0) - discountAmount);
          doc.text('TOTAL:', 145, yPosition + 2, { align: 'right' });
          doc.text(`R$ ${finalValue.toFixed(2).replace('.', ',')}`, 185, yPosition + 2, { align: 'right' });
          yPosition += 12;
        } else {
          // Total sem desconto
          doc.setFontSize(12);
          doc.setFillColor(34, 197, 94);
          doc.roundedRect(125, yPosition - 4, 70, 10, 2, 2, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text('TOTAL:', 145, yPosition + 2, { align: 'right' });
          doc.text(`R$ ${(project.budget || 0).toFixed(2).replace('.', ',')}`, 185, yPosition + 2, { align: 'right' });
          yPosition += 12;
        }

        doc.setTextColor(0, 0, 0);
      }

      // ==================== CONDIÇÕES DE PAGAMENTO E ENTREGA ====================
      yPosition += 8;
      
      // Verificar se precisa de nova página
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(15, yPosition, 180, 8, 1, 1, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CONDIÇÕES DE PAGAMENTO', 17, yPosition + 5);
      yPosition += 13;

      if (project.payment_terms) {
        const paymentMethodLabels: { [key: string]: string } = {
          'dinheiro': 'Dinheiro',
          'pix': 'PIX',
          'cartao_credito': 'Cartão de Crédito',
          'cartao_debito': 'Cartão de Débito',
          'boleto': 'Boleto Bancário',
          'transferencia': 'Transferência Bancária'
        };

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Forma de Pagamento: ${paymentMethodLabels[project.payment_terms.payment_method] || project.payment_terms.payment_method}`, 17, yPosition);
        yPosition += 6;

        // Parcelas
        if (project.payment_terms.installments > 1) {
          doc.text(`Parcelamento: ${project.payment_terms.installments}x de R$ ${(project.payment_terms.installment_value || 0).toFixed(2).replace('.', ',')}`, 17, yPosition);
          yPosition += 10;

          // Tabela de parcelas
          doc.setFillColor(70, 130, 180);
          doc.roundedRect(15, yPosition - 5, 180, 7, 1, 1, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Parcela', 25, yPosition);
          doc.text('Vencimento', 95, yPosition, { align: 'center' });
          doc.text('Valor', 175, yPosition, { align: 'right' });
          
          yPosition += 7;
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');

          for (let i = 1; i <= Math.min(project.payment_terms.installments, 10); i++) {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }

            if (i % 2 === 0) {
              doc.setFillColor(250, 250, 250);
              doc.rect(15, yPosition - 4, 180, 7, 'F');
            }

            const installmentDate = new Date();
            installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
            
            doc.text(`${i}ª parcela`, 25, yPosition);
            doc.text(installmentDate.toLocaleDateString('pt-BR'), 95, yPosition, { align: 'center' });
            doc.text(`R$ ${(project.payment_terms.installment_value || 0).toFixed(2).replace('.', ',')}`, 175, yPosition, { align: 'right' });
            
            yPosition += 7;
          }

          if (project.payment_terms.installments > 10) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(`... e mais ${project.payment_terms.installments - 10} parcelas`, 17, yPosition);
            yPosition += 6;
          }
        } else {
          doc.text(`Pagamento à vista`, 17, yPosition);
          yPosition += 6;
        }
      }

      yPosition += 8;

      // Informações de entrega
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(15, yPosition, 180, 8, 1, 1, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMAÇÕES DE ENTREGA', 17, yPosition + 5);
      yPosition += 13;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (project.delivery_deadline_days) {
        doc.text(`Prazo de Entrega: ${project.delivery_deadline_days} dias após aprovação`, 17, yPosition);
        yPosition += 6;
      }
      
      if (project.end_date) {
        doc.text(`Data Prevista: ${new Date(project.end_date).toLocaleDateString('pt-BR')}`, 17, yPosition);
        yPosition += 6;
      }

      // Observações
      if (project.notes) {
        yPosition += 6;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('OBSERVAÇÕES', 17, yPosition);
        yPosition += 6;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitNotes = doc.splitTextToSize(project.notes, 180);
        doc.text(splitNotes, 17, yPosition);
        yPosition += (splitNotes.length * 4);
      }

      // ==================== RODAPÉ ====================
      const footerY = 280;
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, footerY - 5, 195, footerY - 5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      
      if (isQuote) {
        doc.text('Este orçamento tem validade de 30 dias a partir da data de emissão.', 15, footerY);
      } else {
        doc.text('Obrigado pela sua compra!', 15, footerY);
      }
      
      doc.text('Documento gerado automaticamente pelo sistema.', 15, footerY + 4);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 195, footerY, { align: 'right' });

      // Salvar o PDF
      const docType = project.type === 'orcamento' ? 'Orcamento' : 'Venda';
      const clientName = project.client_name?.replace(/\s+/g, '_') || 'Cliente';
      const fileName = `${docType}_${orderNumber}_${clientName}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
      console.log('PDF gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o PDF. Verifique o console para mais detalhes.');
    }
  };
  // ========== FIM DA FUNÇÃO GENERATEPDF ==========
  
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

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleSaveProject = async (projectData: any) => {
    try {
      if (projectData.type === 'venda' && !editingProject) {
        const saleItems = projectData.products?.map((item: any) => ({
          productid: item.productid,
          productname: item.product_name || item.productname,
          quantity: item.quantity,
          unitprice: item.unit_price,
          total: (item.unit_price || 0) * item.quantity
        })) || [];

        await addSale({
          date: projectData.start_date,
          clientid: projectData.clientid,
          clientname: projectData.client_name || '',
          items: saleItems,
          total: projectData.budget || 0,
          status: 'completed',
          paymentmethod: projectData.payment_terms?.payment_method || '',
          notes: projectData.notes || ''
        });
      } else if (editingProject) {
        await updateProject(editingProject.id, projectData);
      } else {
        await addProject(projectData);
      }
      setIsModalOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar pedido/venda: ' + (error as any)?.message);
    }
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

  return (
    <div className="space-y-6">
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
          <button
            onClick={handleNewOrder}
            className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Pedido</span>
          </button>
        </div>
      </div>

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

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Número</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Valor (R$)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Situação</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ações</th>
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
                          generatePDF(project);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Imprimir PDF"
                      >
                        <Printer className="w-4 h-4" />
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

      {detailsProject && (
        <ProjectDetailsModal
          project={detailsProject}
          onClose={() => setDetailsProject(null)}
          companyData={companyInfo}
        />
      )}

      {isModalOpen && (
        <ProjectFormModal
          project={editingProject}
          onClose={handleModalClose}
          onSave={handleSaveProject}
        />
      )}
    </div>
  );
};

export default OrdersAndQuotes;
