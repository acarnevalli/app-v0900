// src/components/ReceivablesTab.tsx
import React, { useMemo, useState } from 'react';
import { TrendingUp, DollarSign, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import TransactionsTable from './TransactionsTable';
import { formatCurrency } from '../lib/utils';

const ReceivablesTab: React.FC = () => {
  const { financialTransactions, clients } = useApp();
  
  // Filtros locais
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all'); // all, overdue, next7days, next30days

  // Filtrar apenas receitas (income)
  const incomeTransactions = useMemo(() => {
    return financialTransactions.filter(t => t.type === 'income');
  }, [financialTransactions]);

  // Aplicar filtros avançados
  const filteredTransactions = useMemo(() => {
    let filtered = [...incomeTransactions];

    // Filtro por cliente
    if (selectedClient !== 'all') {
      filtered = filtered.filter(t => t.client_id === selectedClient);
    }

    // Filtro por status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }

    // Filtro por data de vencimento
    if (dueDateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);

        switch (dueDateFilter) {
          case 'overdue':
            return dueDate < today && t.status === 'pending';
          case 'next7days':
            const next7 = new Date(today);
            next7.setDate(next7.getDate() + 7);
            return dueDate >= today && dueDate <= next7;
          case 'next30days':
            const next30 = new Date(today);
            next30.setDate(next30.getDate() + 30);
            return dueDate >= today && dueDate <= next30;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [incomeTransactions, selectedClient, selectedStatus, dueDateFilter]);

  // Cálculos para os cards de resumo
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total a receber (pendente + parcial)
    const totalReceivable = incomeTransactions
      .filter(t => t.status === 'pending' || t.status === 'partial')
      .reduce((sum, t) => sum + (t.amount - (t.paid_amount || 0)), 0);

    // Recebido nos últimos 30 dias
    const receivedLast30Days = incomeTransactions
      .filter(t => 
        t.payment_date && 
        new Date(t.payment_date) >= thirtyDaysAgo &&
        (t.status === 'paid' || t.status === 'partial')
      )
      .reduce((sum, t) => sum + (t.paid_amount || 0), 0);

    // Total vencido
    const totalOverdue = incomeTransactions
      .filter(t => {
        if (!t.due_date || t.status !== 'pending') return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Taxa de recebimento (últimos 30 dias)
    const totalDueLast30Days = incomeTransactions
      .filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        return dueDate >= thirtyDaysAgo && dueDate <= now;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const receivementRate = totalDueLast30Days > 0 
      ? (receivedLast30Days / totalDueLast30Days) * 100 
      : 0;

    return {
      totalReceivable,
      receivedLast30Days,
      totalOverdue,
      receivementRate
    };
  }, [incomeTransactions]);

  // Top 5 clientes
  const topClients = useMemo(() => {
    const clientTotals = incomeTransactions
      .filter(t => t.client_id)
      .reduce((acc, t) => {
        const clientId = t.client_id!;
        if (!acc[clientId]) {
          acc[clientId] = { total: 0, count: 0 };
        }
        acc[clientId].total += t.amount;
        acc[clientId].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(clientTotals)
      .map(([clientId, data]) => ({
        client: clients.find(c => c.id === clientId),
        ...data
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [incomeTransactions, clients]);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total a Receber */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total a Receber</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.totalReceivable)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Recebido (últimos 30 dias) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recebido (30 dias)</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(stats.receivedLast30Days)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Vencido */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vencido</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(stats.totalOverdue)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Taxa de Recebimento */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Recebimento</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {stats.receivementRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Avançados */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="partial">Parcial</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>

          {/* Filtro por Vencimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vencimento
            </label>
            <select
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="overdue">Vencidos</option>
              <option value="next7days">Próximos 7 dias</option>
              <option value="next30days">Próximos 30 dias</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 5 Clientes */}
      {topClients.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Top 5 Clientes
            </h3>
          </div>
          <div className="space-y-3">
            {topClients.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">
                    {item.client?.name || 'Cliente não encontrado'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.count} transaç{item.count === 1 ? 'ão' : 'ões'}
                  </p>
                </div>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(item.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de Transações */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Contas a Receber
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({filteredTransactions.length} transaç{filteredTransactions.length === 1 ? 'ão' : 'ões'})
            </span>
          </h3>
        </div>
        <TransactionsTable transactions={filteredTransactions} />
      </div>
    </div>
  );
};

export default ReceivablesTab;
