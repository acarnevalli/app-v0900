// src/components/PayablesTab.tsx
import React, { useMemo, useState } from 'react';
import { TrendingDown, DollarSign, AlertCircle, Clock, Building2, Target } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import TransactionsTable from './TransactionsTable';
import { formatCurrency } from '../lib/utils';

const PayablesTab: React.FC = () => {
  const { financialTransactions, suppliers, costCenters } = useApp();
  
  // Filtros locais
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('all');

  // Filtrar apenas despesas (expense)
  const expenseTransactions = useMemo(() => {
    return financialTransactions.filter(t => t.type === 'expense');
  }, [financialTransactions]);

  // Aplicar filtros avançados
  const filteredTransactions = useMemo(() => {
    let filtered = [...expenseTransactions];

    // Filtro por fornecedor
    if (selectedSupplier !== 'all') {
      filtered = filtered.filter(t => t.supplierid === selectedSupplier);
    }

    // Filtro por status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }

    // Filtro por centro de custo
    if (selectedCostCenter !== 'all') {
      filtered = filtered.filter(t => t.costcenterid === selectedCostCenter);
    }

    // Filtro por data de vencimento
    if (dueDateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(t => {
        if (!t.duedate) return false;
        const dueDate = new Date(t.duedate);
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
  }, [expenseTransactions, selectedSupplier, selectedStatus, selectedCostCenter, dueDateFilter]);

  // Cálculos para os cards de resumo
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);

    // Total a pagar (pendente + parcial)
    const totalPayable = expenseTransactions
      .filter(t => t.status === 'pending' || t.status === 'partial')
      .reduce((sum, t) => sum + (t.amount - (t.paidamount || 0)), 0);

    // Pago nos últimos 30 dias
    const paidLast30Days = expenseTransactions
      .filter(t => 
        t.paymentdate && 
        new Date(t.paymentdate) >= thirtyDaysAgo &&
        (t.status === 'paid' || t.status === 'partial')
      )
      .reduce((sum, t) => sum + (t.paidamount || 0), 0);

    // Total vencido
    const totalOverdue = expenseTransactions
      .filter(t => {
        if (!t.duedate || t.status !== 'pending') return false;
        const dueDate = new Date(t.duedate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Próximos vencimentos (7 dias)
    const upcomingDue = expenseTransactions
      .filter(t => {
        if (!t.duedate || t.status !== 'pending') return false;
        const dueDate = new Date(t.duedate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= next7Days;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalPayable,
      paidLast30Days,
      totalOverdue,
      upcomingDue
    };
  }, [expenseTransactions]);

  // Top 5 fornecedores
  const topSuppliers = useMemo(() => {
    const supplierTotals = expenseTransactions
      .filter(t => t.supplierid)
      .reduce((acc, t) => {
        const supplierId = t.supplierid!;
        if (!acc[supplierId]) {
          acc[supplierId] = { total: 0, count: 0 };
        }
        acc[supplierId].total += t.amount;
        acc[supplierId].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(supplierTotals)
      .map(([supplierId, data]) => ({
        supplier: suppliers.find(s => s.id === supplierId),
        ...data
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [expenseTransactions, suppliers]);

  // Top 5 centros de custo
  const topCostCenters = useMemo(() => {
    const costCenterTotals = expenseTransactions
      .filter(t => t.costcenterid)
      .reduce((acc, t) => {
        const costCenterId = t.costcenterid!;
        if (!acc[costCenterId]) {
          acc[costCenterId] = { total: 0, count: 0 };
        }
        acc[costCenterId].total += t.amount;
        acc[costCenterId].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(costCenterTotals)
      .map(([costCenterId, data]) => ({
        costCenter: costCenters.find(cc => cc.id === costCenterId),
        ...data
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [expenseTransactions, costCenters]);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total a Pagar */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total a Pagar</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.totalPayable)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Pago (últimos 30 dias) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pago (30 dias)</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(stats.paidLast30Days)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-blue-600" />
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

        {/* Próximos 7 dias */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Próximos 7 dias</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {formatCurrency(stats.upcomingDue)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Avançados */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por Fornecedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fornecedor
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Fornecedores</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
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

          {/* Filtro por Centro de Custo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Centro de Custo
            </label>
            <select
              value={selectedCostCenter}
              onChange={(e) => setSelectedCostCenter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Centros</option>
              {costCenters.map(cc => (
                <option key={cc.id} value={cc.id}>
                  {cc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estatísticas em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Fornecedores */}
        {topSuppliers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Top 5 Fornecedores
              </h3>
            </div>
            <div className="space-y-3">
              {topSuppliers.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.supplier?.name || 'Fornecedor não encontrado'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.count} transaç{item.count === 1 ? 'ão' : 'ões'}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatCurrency(item.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 5 Centros de Custo */}
        {topCostCenters.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Despesas por Centro de Custo
              </h3>
            </div>
            <div className="space-y-3">
              {topCostCenters.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.costCenter?.name || 'Centro não encontrado'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.count} transaç{item.count === 1 ? 'ão' : 'ões'}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(item.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Transações */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Contas a Pagar
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

export default PayablesTab;
