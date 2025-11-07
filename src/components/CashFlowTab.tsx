// src/components/CashFlowTab.tsx
import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../lib/utils';

type PeriodFilter = 'currentmonth' | 'last3months' | 'last6months' | 'last12months' | 'custom';

const CashFlowTab: React.FC = () => {
  const { financialTransactions, bankAccounts, costCenters } = useApp();
  
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('last6months');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Calcular período baseado no filtro
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date(now);

    switch (periodFilter) {
      case 'currentmonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last3months':
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'last6months':
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case 'last12months':
        start = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate);
          end = new Date(customEndDate);
        }
        break;
    }

    return { startDate: start, endDate: end };
  }, [periodFilter, customStartDate, customEndDate]);

  // Filtrar transações pelo período
  const periodTransactions = useMemo(() => {
    return financialTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }, [financialTransactions, startDate, endDate]);

  // Calcular totais
  const totals = useMemo(() => {
    const income = periodTransactions
      .filter(t => t.type === 'income' && (t.status === 'paid' || t.status === 'partial'))
      .reduce((sum, t) => sum + (t.paidamount || 0), 0);

    const expense = periodTransactions
      .filter(t => t.type === 'expense' && (t.status === 'paid' || t.status === 'partial'))
      .reduce((sum, t) => sum + (t.paidamount || 0), 0);

    const result = income - expense;
    const margin = income > 0 ? (result / income) * 100 : 0;

    return { income, expense, result, margin };
  }, [periodTransactions]);

  // Calcular saldo total das contas bancárias
  const totalBankBalance = useMemo(() => {
    return bankAccounts
      .filter(ba => ba.active)
      .reduce((sum, ba) => sum + ba.currentbalance, 0);
  }, [bankAccounts]);

  // Calcular projeção (pendentes)
  const projection = useMemo(() => {
    const pendingIncome = financialTransactions
      .filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'partial'))
      .reduce((sum, t) => sum + (t.amount - (t.paidamount || 0)), 0);

    const pendingExpense = financialTransactions
      .filter(t => t.type === 'expense' && (t.status === 'pending' || t.status === 'partial'))
      .reduce((sum, t) => sum + (t.amount - (t.paidamount || 0)), 0);

    const projectedBalance = totalBankBalance + pendingIncome - pendingExpense;

    return { pendingIncome, pendingExpense, projectedBalance };
  }, [financialTransactions, totalBankBalance]);

  // Evolução mensal (últimos 6 meses)
  const monthlyEvolution = useMemo(() => {
    const months: { month: string; income: number; expense: number; result: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthTransactions = financialTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income' && (t.status === 'paid' || t.status === 'partial'))
        .reduce((sum, t) => sum + (t.paidamount || 0), 0);

      const expense = monthTransactions
        .filter(t => t.type === 'expense' && (t.status === 'paid' || t.status === 'partial'))
        .reduce((sum, t) => sum + (t.paidamount || 0), 0);

      months.push({
        month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        income,
        expense,
        result: income - expense
      });
    }

    return months;
  }, [financialTransactions]);

  // Despesas por Centro de Custo
  const expensesByCostCenter = useMemo(() => {
    const totals: Record<string, number> = {};

    periodTransactions
      .filter(t => t.type === 'expense' && t.costcenterid && (t.status === 'paid' || t.status === 'partial'))
      .forEach(t => {
        const ccId = t.costcenterid!;
        totals[ccId] = (totals[ccId] || 0) + (t.paidamount || 0);
      });

    return Object.entries(totals)
      .map(([ccId, total]) => ({
        costCenter: costCenters.find(cc => cc.id === ccId),
        total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [periodTransactions, costCenters]);

  // Calcular porcentagem máxima para gráficos
  const maxMonthlyValue = useMemo(() => {
    return Math.max(...monthlyEvolution.map(m => Math.max(m.income, m.expense)));
  }, [monthlyEvolution]);

  const maxCostCenterValue = useMemo(() => {
    return expensesByCostCenter.length > 0 
      ? Math.max(...expensesByCostCenter.map(e => e.total))
      : 1;
  }, [expensesByCostCenter]);

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Período de Análise</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="currentmonth">Mês Atual</option>
              <option value="last3months">Últimos 3 Meses</option>
              <option value="last6months">Últimos 6 Meses</option>
              <option value="last12months">Últimos 12 Meses</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {periodFilter === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* DRE - Demonstração de Resultados */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Demonstração de Resultados (DRE)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Receitas */}
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Receitas Totais</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.income)}
            </p>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>Entradas</span>
            </div>
          </div>

          {/* Despesas */}
          <div className="border-l-4 border-red-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Despesas Totais</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.expense)}
            </p>
            <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
              <ArrowDownRight className="h-4 w-4" />
              <span>Saídas</span>
            </div>
          </div>

          {/* Resultado */}
          <div className={`border-l-4 ${totals.result >= 0 ? 'border-blue-500' : 'border-orange-500'} pl-4`}>
            <p className="text-sm text-gray-600 mb-1">Resultado</p>
            <p className={`text-2xl font-bold ${totals.result >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatCurrency(totals.result)}
            </p>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
              {totals.result >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span>{totals.result >= 0 ? 'Lucro' : 'Prejuízo'}</span>
            </div>
          </div>

          {/* Margem */}
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Margem de Lucro</p>
            <p className="text-2xl font-bold text-purple-600">
              {totals.margin.toFixed(1)}%
            </p>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
              <PieChart className="h-4 w-4" />
              <span>Rentabilidade</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fluxo de Caixa */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Fluxo de Caixa
        </h3>
        <div className="space-y-4">
          {/* Saldo Atual */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Saldo Atual em Contas</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(totalBankBalance)}
                </p>
              </div>
            </div>
          </div>

          {/* Projeção */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">A Receber</p>
              <p className="text-lg font-semibold text-green-600">
                + {formatCurrency(projection.pendingIncome)}
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">A Pagar</p>
              <p className="text-lg font-semibold text-red-600">
                - {formatCurrency(projection.pendingExpense)}
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-purple-50">
              <p className="text-sm text-gray-600 mb-1">Saldo Projetado</p>
              <p className="text-lg font-semibold text-purple-600">
                {formatCurrency(projection.projectedBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Evolução Mensal (Últimos 6 Meses)
            </h3>
          </div>
          <div className="space-y-4">
            {monthlyEvolution.map((month, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {month.month}
                  </span>
                  <span className={`text-sm font-semibold ${month.result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(month.result)}
                  </span>
                </div>
                <div className="space-y-1">
                  {/* Barra de Receitas */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16">Receitas</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(month.income / maxMonthlyValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-700 w-24 text-right">
                      {formatCurrency(month.income)}
                    </span>
                  </div>
                  {/* Barra de Despesas */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16">Despesas</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${(month.expense / maxMonthlyValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-700 w-24 text-right">
                      {formatCurrency(month.expense)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas por Centro de Custo */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Despesas por Centro de Custo
            </h3>
          </div>
          {expensesByCostCenter.length > 0 ? (
            <div className="space-y-4">
              {expensesByCostCenter.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {item.costCenter?.name || 'Sem Centro de Custo'}
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${(item.total / maxCostCenterValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {((item.total / totals.expense) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma despesa com centro de custo no período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashFlowTab;
