import React from 'react';
import { X } from 'lucide-react';
import { Project } from '../contexts/AppContext';
import { PDFSettings } from './PDFSettingsModal';
import { formatCurrency, formatDate } from '../lib/utils';

interface ProjectDetailsModalProps {
  project: Project;
  onClose: () => void;
  onGeneratePDF?: (project: Project) => void;
  pdfContent?: React.ReactNode;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ 
  project, 
  onClose,
  onGeneratePDF,
  pdfContent
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
              <span>👤 Informações do Cliente</span>
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
              <h3 className="font-bold text-gray-800 mb-3">📦 Itens do Pedido</h3>
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
              <h3 className="font-bold text-blue-900 mb-2">💰 Valor</h3>
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
                <h3 className="font-bold text-green-900 mb-2">📋 Parcelamento</h3>
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
              <h3 className="font-bold text-orange-900 mb-2">📅 Data de Início</h3>
              <p className="text-lg font-bold text-orange-900">{formatDate(project.start_date)}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <h3 className="font-bold text-purple-900 mb-2">📅 Data de Entrega</h3>
              <p className="text-lg font-bold text-purple-900">{formatDate(project.end_date)}</p>
            </div>
          </div>

          {/* Prazo em Dias */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <h3 className="font-bold text-amber-900 mb-2">⏱️ Prazo de Entrega</h3>
            <p className="text-lg font-bold text-amber-900">{project.delivery_deadline_days} dias</p>
          </div>

          {/* Margem de Lucro (se houver) */}
          {project.profit_margin !== undefined && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h3 className="font-bold text-green-900 mb-2">📊 Margem de Lucro</h3>
              <p className="text-lg font-bold text-green-900">{project.profit_margin}%</p>
            </div>
          )}

          {/* Notas ou Observações */}
          {project.notes && (
            <div>
              <h3 className="font-bold text-gray-800 mb-2">📝 Observações</h3>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{project.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-100 px-8 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Fechar
          </button>
          {pdfContent && (
            <div>
              {pdfContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
