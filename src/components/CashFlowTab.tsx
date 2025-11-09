import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';

const CashFlowTab: React.FC = () => {
  const { financialTransactions } = useApp();
  
  const [dateFilterType, setDateFilterType] = useState<'day' | 'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calcular período baseado no filtro
  const getDateRange = () => {
    const date = new Date(currentDate);
    let startDate: Date, endDate: Date;

    switch (dateFilterType) {
      case 'day':
        startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
        break;

      case 'week':
        const dayOfWeek = date.getDay();
        startDate = new Date(date);
        startDate.setDate(date.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'month':
      default:
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  };

  // Label do período
  const getDateRangeLabel = () => {
    const date = new Date(currentDate);
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    switch (dateFilterType) {
      case 'day':
        return date.toLocaleDateString('pt-BR');

      case 'week':
        const range = getDateRange();
        return `${range.startDate.getDate()}/${range.startDate.getMonth() + 1} - ${range.endDate.getDate()}/${range.endDate.getMonth() + 1}/${range.endDate.getFullYear()}`;

      case 'month':
      default:
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
  };

  // Navegar entre períodos
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    switch (dateFilterType) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;

      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;

      case 'month':
      default:
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }

    setCurrentDate(newDate);
  };

  // Filtrar transações do período
  const periodTransactions = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    
    return financialTransactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate >= startDate && transDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [financialTransactions, currentDate, dateFilterType]);

  // Calcular totais
  const totals = useMemo(() => {
    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [periodTransactions]);

  // Status Badge
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Pago', color: 'bg-green-100 text-green-800' },
      overdue: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filtro de Período:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={dateFilterType}
            onChange={(e) => setDateFilterType(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="day">Diário</option>
            <option value="week">Semanal</option>
            <option value="month">Mensal</option>
          </select>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1 text-center font-medium text-gray-800 bg-blue-50 py-3 rounded-lg border border-blue-200">
              {getDateRangeLabel()}
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Resumo do Período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Receitas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.income)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {periodTransactions.filter(t => t.type === 'income').length} transação(ões)
              </p>
            </div>
            <ArrowUpCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Despesas</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totals.expense)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {periodTransactions.filter(t => t.type === 'expense').length} transação(ões)
              </p>
            </div>
            <ArrowDownCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${
          totals.balance >= 0 ? 'border-blue-500' : 'border-orange-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Saldo</p>
              <p className={`text-2xl font-bold ${
                totals.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {formatCurrency(Math.abs(totals.balance))}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totals.balance >= 0 ? 'Superávit' : 'Déficit'}
              </p>
            </div>
            {totals.balance >= 0 ? (
              <TrendingUp className="h-10 w-10 text-blue-500" />
            ) : (
              <TrendingDown className="h-10 w-10 text-orange-500" />
            )}
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">
            Transações do Período ({periodTransactions.length})
          </h3>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Data</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Tipo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Descrição</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Categoria</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Valor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Conta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {periodTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Nenhuma transação encontrada neste período
                  </td>
                </tr>
              ) : (
                periodTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.type === 'income' ? (
                        <span className="flex items-center text-green-600 font-medium">
                          <ArrowUpCircle className="h-4 w-4 mr-1" />
                          Receita
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600 font-medium">
                          <ArrowDownCircle className="h-4 w-4 mr-1" />
                          Despesa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.account_name || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {periodTransactions.length > 0 && (
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right text-sm text-gray-700">
                    Total do Período:
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className={`font-bold ${
                      totals.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {formatCurrency(Math.abs(totals.balance))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {totals.balance >= 0 ? 'Superávit' : 'Déficit'}
                    </div>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashFlowTab;
