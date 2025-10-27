// src/components/TransactionsTable.tsx

import React from 'react';
import {
  Edit,
  Trash2,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { FinancialTransaction } from '../types'; // Supondo que você tenha um arquivo de tipos

interface TransactionsTableProps {
  transactions: FinancialTransaction[];
  onEdit: (transaction: FinancialTransaction) => void;
  onDelete: (transactionId: string) => void;
  onPay: (transaction: FinancialTransaction) => void; // Para o futuro modal de pagamento
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  onEdit,
  onDelete,
  onPay,
}) => {

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Pago', color: 'bg-green-100 text-green-800' },
      overdue: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
      partial: { label: 'Parcial', color: 'bg-blue-100 text-blue-800' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma transação encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">Tente ajustar os filtros ou adicione uma nova transação.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                {t.type === 'income' ? 
                  <ArrowUpCircle className="h-5 w-5 text-green-500" /> : 
                  <ArrowDownCircle className="h-5 w-5 text-red-500" />}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{t.description}</div>
                <div className="text-sm text-gray-500">{t.client_name || t.supplier_name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                {formatCurrency(t.amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(t.due_date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(t.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  {t.status === 'pending' && (
                    <button
                      onClick={() => onPay(t)} // Usará o modal da Parte 9
                      className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full"
                      title="Registrar Pagamento"
                    >
                      <DollarSign className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(t)}
                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-full"
                    title="Editar Transação"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-full"
                    title="Excluir Transação"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;
