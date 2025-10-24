// src/pages/Finance.tsx

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Download,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';

const Finance: React.FC = () => {
  const { 
    financialTransactions = [],
    bankAccounts = [],
    costCenters = [],
    getFinancialSummary,
    getCashFlow,
    getOverdueTransactions,
  } = useApp();

  // ====== ESTADOS ======
  const [activeTab, setActiveTab] = useState<'overview' | 'receivables' | 'payables' | 'cashflow'>('overview');
  const [dateFilter, setDateFilter] = useState('month');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ====== CÁLCULOS ======
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Período atual baseado no filtro
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    let start = new Date();
    
    if (dateFilter === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (dateFilter === 'month') {
      start = new Date(currentYear, currentMonth, 1);
    } else if (dateFilter === 'year') {
      start = new Date(currentYear, 0, 1);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [dateFilter, currentMonth, currentYear]);

  // Resumo financeiro do período
  const summary = useMemo(() => 
    getFinancialSummary(startDate, endDate),
    [getFinancialSummary, startDate, endDate]
  );

  // Contas a receber
  const receivables = useMemo(() => 
    financialTransactions.filter(t => t.type === 'income'),
    [financialTransactions]
  );

  const receivablesPending = useMemo(() =>
    receivables.filter(t => t.status === 'pending'),
    [receivables]
  );

  const receivablesOverdue = useMemo(() =>
    receivables.filter(t => {
      const dueDate = new Date(t.due_date);
      return t.status === 'pending' && dueDate < today;
    }),
    [receivables, today]
  );

  // Contas a pagar
  const payables = useMemo(() => 
    financialTransactions.filter(t => t.type === 'expense'),
    [financialTransactions]
  );

  const payablesPending = useMemo(() =>
    payables.filter(t => t.status === 'pending'),
    [payables]
  );

  const payablesOverdue = useMemo(() =>
    payables.filter(t => {
      const dueDate = new Date(t.due_date);
      return t.status === 'pending' && dueDate < today;
    }),
    [payables, today]
  );

  // Totais
  const totalReceivablesPending = useMemo(() =>
    receivablesPending.reduce((sum, t) => sum + t.amount, 0),
    [receivablesPending]
  );

  const totalReceivablesOverdue = useMemo(() =>
    receivablesOverdue.reduce((sum, t) => sum + t.amount, 0),
    [receivablesOverdue]
  );

  const totalPayablesPending = useMemo(() =>
    payablesPending.reduce((sum, t) => sum + t.amount, 0),
    [payablesPending]
  );

  const totalPayablesOverdue = useMemo(() =>
    payablesOverdue.reduce((sum, t) => sum + t.amount, 0),
    [payablesOverdue]
  );

  // Saldo total das contas bancárias
  const totalBankBalance = useMemo(() =>
    bankAccounts
      .filter(acc => acc.active)
      .reduce((sum, acc) => sum + acc.current_balance, 0),
    [bankAccounts]
  );

  // Projeção para próximos 30 dias
  const next30Days = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }, []);

  const projectedIncome = useMemo(() =>
    receivablesPending
      .filter(t => new Date(t.due_date) <= next30Days)
      .reduce((sum, t) => sum + t.amount, 0),
    [receivablesPending, next30Days]
  );

  const projectedExpense = useMemo(() =>
    payablesPending
      .filter(t => new Date(t.due_date) <= next30Days)
      .reduce((sum, t) => sum + t.amount, 0),
    [payablesPending, next30Days]
  );

  const projectedBalance = totalBankBalance + projectedIncome - projectedExpense;

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    let filtered = financialTransactions;

    // Filtro de busca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(search) ||
        t.client_name?.toLowerCase().includes(search) ||
        t.supplier_name?.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search)
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    return filtered;
  }, [financialTransactions, searchTerm, statusFilter]);

  // ====== COMPONENTES UI ======

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    subtitle?: string;
  }> = ({ title, value, icon: Icon, color, bgColor, subtitle }) => (
    <div 
      className={`${bgColor} rounded-xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-shadow`}
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: color + '20' }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method?: string) => {
    const methods: { [key: string]: string } = {
      dinheiro: '💵 Dinheiro',
      pix: '📱 PIX',
      cartao_credito: '💳 Crédito',
      cartao_debito: '💳 Débito',
      boleto: '📄 Boleto',
      transferencia: '🏦 Transferência',
      cheque: '📝 Cheque',
    };

    return methods[method || ''] || method || '-';
  };

  // ====== RENDER ======

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestão Financeira</h1>
          <p className="text-gray-600 mt-1">Controle completo das suas finanças</p>
        </div>
        <button
          onClick={() => {/* TODO: Abrir modal de nova transação */}}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          <span>Nova Transação</span>
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Saldo em Contas"
          value={formatCurrency(totalBankBalance)}
          icon={Wallet}
          color="#3B82F6"
          bgColor="bg-blue-50"
          subtitle="Disponível agora"
        />

        <StatCard
          title="A Receber"
          value={formatCurrency(totalReceivablesPending)}
          icon={ArrowUpCircle}
          color="#10B981"
          bgColor="bg-green-50"
          subtitle={`${receivablesPending.length} pendente(s)`}
        />

        <StatCard
          title="A Pagar"
          value={formatCurrency(totalPayablesPending)}
          icon={ArrowDownCircle}
          color="#EF4444"
          bgColor="bg-red-50"
          subtitle={`${payablesPending.length} pendente(s)`}
        />

        <StatCard
          title="Projeção 30 Dias"
          value={formatCurrency(projectedBalance)}
          icon={TrendingUp}
          color={projectedBalance >= 0 ? "#10B981" : "#EF4444"}
          bgColor={projectedBalance >= 0 ? "bg-green-50" : "bg-red-50"}
          subtitle="Saldo projetado"
        />
      </div>

      {/* Alertas de Vencidos */}
      {(receivablesOverdue.length > 0 || payablesOverdue.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {receivablesOverdue.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-center mb-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                <h3 className="text-lg font-semibold text-orange-800">
                  Recebimentos Vencidos
                </h3>
              </div>
              <p className="text-3xl font-bold text-orange-700 mb-2">
                {formatCurrency(totalReceivablesOverdue)}
              </p>
              <p className="text-sm text-orange-600">
                {receivablesOverdue.length} conta(s) vencida(s)
              </p>
            </div>
          )}

          {payablesOverdue.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center mb-3">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-red-800">
                  Pagamentos Vencidos
                </h3>
              </div>
              <p className="text-3xl font-bold text-red-700 mb-2">
                {formatCurrency(totalPayablesOverdue)}
              </p>
              <p className="text-sm text-red-600">
                {payablesOverdue.length} conta(s) vencida(s)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Resultado do Período */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            Resultado do Período
          </h3>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="week">Última Semana</option>
            <option value="month">Este Mês</option>
            <option value="year">Este Ano</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">Receitas</p>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(summary.totalIncome)}
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 mb-1">Despesas</p>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(summary.totalExpense)}
            </p>
          </div>

          <div className={`${summary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-lg p-4`}>
            <p className={`text-sm ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'} mb-1`}>
              Resultado
            </p>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {formatCurrency(Math.abs(summary.balance))}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.balance >= 0 ? 'Superávit' : 'Déficit'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela será adicionada na PARTE 7 */}
    </div>
  );
};

export default Finance;
