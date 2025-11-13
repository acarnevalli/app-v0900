import React from 'react';
import { X, Edit2, Printer, User, DollarSign, Package, Calendar, Clock } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { OrderPDFDocument } from './OrderPDFDocument';

interface Project {
  id: string;
  order_number: string;
  type: 'orcamento' | 'venda';
  status: string;
  client_name?: string;
  description: string;
  start_date: string;
  end_date: string;
  delivery_deadline_days: number;
  budget: number;
  products?: any[];
  payment_terms?: any;
  profit_margin?: number;
  notes?: string;
}

interface ProjectDetailsModalProps {
  project: Project;
  onClose: () => void;
  onEdit: (project: Project) => void;
  companyData: any | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ 
  project, 
  onClose, 
  onEdit, 
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

        {/* Content */}
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

          {/* Prazo */}
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

          {/* Produtos */}
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

          {/* Valor Total */}
          <div className="border-t-2 border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-gray-700">Valor Total:</span>
              <span className="text-3xl font-bold text-amber-600">{formatCurrency(project.budget)}</span>
            </div>
          </div>

          {/* Desconto */}
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
                {project.payment_terms.installment_interval && project.payment_terms.installments > 1 && (
                  <p className="flex justify-between">
                    <span className="text-gray-600">Intervalo:</span>
                    <span className="font-medium">
                      {project.payment_terms.installment_interval === 7 && 'Semanal (7 dias)'}
                      {project.payment_terms.installment_interval === 15 && 'Quinzenal (15 dias)'}
                      {project.payment_terms.installment_interval === 30 && 'Mensal (30 dias)'}
                      {project.payment_terms.installment_interval === 60 && 'Bimestral (60 dias)'}
                      {project.payment_terms.installment_interval === 90 && 'Trimestral (90 dias)'}
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
          <div className="flex space-x-3">
            {/* BOTÃO EDITAR */}
            <button
              onClick={() => {
                onEdit(project);
                onClose();
              }}
              className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              <Edit2 size={18} />
              <span>Editar</span>
            </button>
            
            {/* BOTÃO IMPRIMIR PDF */}
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
          </div>
          
          {/* BOTÃO FECHAR */}
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

export default ProjectDetailsModal;
