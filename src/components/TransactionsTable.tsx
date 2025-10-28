import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { FinancialTransaction } from '../../types';
import PaymentModal from './PaymentModal';

interface TransactionsTableProps {
  transactions: FinancialTransaction[];
  onEdit: (transaction: FinancialTransaction) => void;
  showTypeColumn?: boolean;
}

type StatusFilter = 'all' | 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled';

export default function TransactionsTable({ 
  transactions, 
  onEdit,
  showTypeColumn = true 
}: TransactionsTableProps) {
  const { deleteFinancialTransaction, clients, suppliers, projects } = useApp();
  
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);

  // Função para obter o nome da referência
  const getReferenceName = (transaction: FinancialTransaction): string => {
    if (transaction.client_id) {
      const client = clients.find(c => c.id === transaction.client_id);
      return client?.name || 'Cliente não encontrado';
    }
    if (transaction.supplier_id) {
      const supplier = suppliers.find(s => s.id === transaction.supplier_id);
      return supplier?.name || 'Fornecedor não encontrado';
    }
    if (transaction.project_id) {
      const project = projects.find(p => p.id === transaction.project_id);
      return project?.name || 'Projeto não encontrado';
    }
    return '-';
  };

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Filtro de busca
      const matchesSearch = 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getReferenceName(transaction).toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de status
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, statusFilter, clients, suppliers, projects]);

  // Handler de deletar
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await deleteFinancialTransaction(id);
      } catch (error) {
        console.error('Erro ao deletar transação:', error);
        alert('Erro ao deletar transação');
      }
    }
  };

  // Handler de abrir modal de pagamento
  const handleOpenPayment = (transaction: FinancialTransaction) => {
    setSelectedTransaction(transaction);
    setPaymentModalOpen(true);
  };

  // Badge de status
  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    
    const labels = {
      paid: 'Pago',
      pending: 'Pendente',
      overdue: 'Vencido',
      partial: 'Parcial',
      cancelled: 'Cancelado',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // Badge de tipo
  const getTypeBadge = (type: string) => {
    return type === 'income' ? (
      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
        <TrendingUp className="w-4 h-4" />
        Receita
      </span>
    ) : (
      <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
        <TrendingDown className="w-4 h-4" />
        Despesa
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por descrição ou cliente/fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtro de Status */}
        <div className="sm:w-48">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="all">Todos Status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencido</option>
              <option value="partial">Parcial</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-medium">{filteredTransactions.length}</span> de{' '}
        <span className="font-medium">{transactions.length}</span> transações
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {showTypeColumn && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente/Fornecedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={showTypeColumn ? 7 : 6} className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhuma transação encontrada</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    {showTypeColumn && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(transaction.type)}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </div>
                      {transaction.installment_number && (
                        <div className="text-xs text-gray-500">
                          Parcela {transaction.installment_number}/{transaction.total_installments}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getReferenceName(transaction)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(transaction.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        R$ {transaction.amount.toFixed(2)}
                      </div>
                      {transaction.paid_amount > 0 && transaction.status === 'partial' && (
                        <div className="text-xs text-green-600">
                          Pago: R$ {transaction.paid_amount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão de Pagar (apenas para pendentes e parciais) */}
                        {(transaction.status === 'pending' || transaction.status === 'partial') && (
                          <button
                            onClick={() => handleOpenPayment(transaction)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Registrar Pagamento"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Botão de Editar */}
                        <button
                          onClick={() => onEdit(transaction)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {/* Botão de Deletar */}
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Pagamento */}
      {selectedTransaction && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
}
