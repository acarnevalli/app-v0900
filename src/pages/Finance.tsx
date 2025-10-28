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
  Building2,
  PiggyBank,
  Banknote,
  TrendingUpIcon,
  X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import TransactionModal from '../components/TransactionModal';
import TransactionsTable from '../components/TransactionsTable';
import ReceivablesTab from '../components/ReceivablesTab';
import PayablesTab from '../components/PayablesTab';
import CashFlowTab from '../components/CashFlowTab';


// ====== MODAL DE CONTA BANCÁRIA (FORA DO COMPONENTE) ======
interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  accountForm: {
    name: string;
    type: 'checking' | 'savings' | 'cash' | 'investment';
    bank_name: string;
    agency: string;
    account_number: string;
    initial_balance: number;
    current_balance: number;
    active: boolean;
  };
  setAccountForm: React.Dispatch<React.SetStateAction<any>>;
  editingAccount: any;
  toast: any; // ⭐ ADICIONADO: recebe o toast como prop
}

const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accountForm,
  setAccountForm,
  editingAccount,
  toast, // ⭐ ADICIONADO
}) => {
  if (!isOpen) return null;

  const getAccountTypeLabel = (type: string) => {
    const types: { [key: string]: { label: string; icon: React.ReactNode } } = {
      checking: { label: 'Conta Corrente', icon: <Building2 className="h-5 w-5" /> },
      savings: { label: 'Poupança', icon: <PiggyBank className="h-5 w-5" /> },
      cash: { label: 'Dinheiro', icon: <Banknote className="h-5 w-5" /> },
      investment: { label: 'Investimento', icon: <TrendingUpIcon className="h-5 w-5" /> },
    };
    return types[type] || types.checking;
  };

  const getAccountTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      checking: 'bg-blue-100 text-blue-800 border-blue-200',
      savings: 'bg-green-100 text-green-800 border-green-200',
      cash: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      investment: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[type] || colors.checking;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Nome da Conta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Conta *
            </label>
            <input
              type="text"
              value={accountForm.name}
              onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Banco do Brasil - Conta Corrente"
            />
          </div>

          {/* Tipo de Conta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Conta *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['checking', 'savings', 'cash', 'investment'] as const).map((type) => {
                const typeInfo = getAccountTypeLabel(type);
                const isSelected = accountForm.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountForm({ ...accountForm, type })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? getAccountTypeColor(type) + ' border-current'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      {typeInfo.icon}
                      <span className="text-xs font-medium text-center">
                        {typeInfo.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Banco (opcional para dinheiro) */}
          {accountForm.type !== 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Banco
              </label>
              <input
                type="text"
                value={accountForm.bank_name}
                onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Banco do Brasil, Nubank, Inter..."
              />
            </div>
          )}

          {/* Agência e Conta (apenas para contas bancárias) */}
          {(accountForm.type === 'checking' || accountForm.type === 'savings') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agência
                </label>
                <input
                  type="text"
                  value={accountForm.agency}
                  onChange={(e) => setAccountForm({ ...accountForm, agency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 1234-5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da Conta
                </label>
                <input
                  type="text"
                  value={accountForm.account_number}
                  onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 12345-6"
                />
              </div>
            </div>
          )}

          {/* Saldo Inicial (apenas ao criar) */}
          {!editingAccount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saldo Inicial
              </label>
              <input
                type="number"
                step="0.01"
                value={accountForm.initial_balance}
                onChange={(e) => setAccountForm({ 
                  ...accountForm, 
                  initial_balance: parseFloat(e.target.value) || 0 
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Informe o saldo atual desta conta
              </p>
            </div>
          )}

          {/* Saldo Atual (apenas ao editar) */}
          {editingAccount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saldo Atual
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(accountForm.current_balance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  O saldo é atualizado automaticamente pelas transações
                </p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="account-active"
              checked={accountForm.active}
              onChange={(e) => setAccountForm({ ...accountForm, active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="account-active" className="text-sm font-medium text-gray-700">
              Conta ativa
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {editingAccount ? 'Salvar Alterações' : 'Criar Conta'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ====== CONTEÚDO DA ABA DE CONTAS BANCÁRIAS ======
const AccountsTabContent: React.FC<{
  bankAccounts?: any[];
  handleOpenAccountModal?: (account?: any) => void;
  handleDeleteAccount?: (id: string) => void;
  handleToggleAccountActive?: (account: any) => void;
  totalBankBalance?: number;
  getAccountTypeLabel?: (type: string) => any;
  getAccountTypeColor?: (type: string) => string;
}> = (props) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Contas Bancárias</h3>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie suas contas correntes, poupança, dinheiro e investimentos
          </p>
        </div>
        <button
          onClick={() => props.handleOpenAccountModal?.()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nova Conta</span>
        </button>
      </div>

      {/* Resumo Total */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <p className="text-sm opacity-90 mb-2">Saldo Total em Contas Ativas</p>
        <p className="text-4xl font-bold">{formatCurrency(props.totalBankBalance || 0)}</p>
        <p className="text-sm opacity-75 mt-2">
          {(props.bankAccounts || []).filter((acc: any) => acc.active).length} conta(s) ativa(s)
        </p>
      </div>

      {/* Lista de Contas */}
      {(!props.bankAccounts || props.bankAccounts.length === 0) ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Nenhuma conta cadastrada
          </h3>
          <p className="text-gray-500 mb-6">
            Comece cadastrando sua primeira conta bancária
          </p>
          <button
            onClick={() => props.handleOpenAccountModal?.()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Cadastrar Primeira Conta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(props.bankAccounts || []).map((account: any) => {
            const typeInfo = props.getAccountTypeLabel?.(account.type) || { label: 'Conta', icon: null };
            const typeColor = props.getAccountTypeColor?.(account.type) || '';

            return (
              <div
                key={account.id}
                className={`bg-white rounded-xl shadow-lg border-2 hover:shadow-xl transition-all ${
                  account.active ? 'border-gray-200' : 'border-gray-300 opacity-60'
                }`}
              >
                {/* Header do Card */}
                <div className={`p-4 rounded-t-xl ${typeColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {typeInfo.icon}
                      <span className="text-sm font-semibold">
                        {typeInfo.label}
                      </span>
                    </div>
                    {!account.active && (
                      <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                        Inativa
                      </span>
                    )}
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {account.name}
                  </h4>
                  
                  {account.bank_name && (
                    <p className="text-sm text-gray-600 mb-3">
                      {account.bank_name}
                      {account.agency && ` • Ag: ${account.agency}`}
                      {account.account_number && ` • CC: ${account.account_number}`}
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Saldo Atual</p>
                    <p className={`text-2xl font-bold ${
                      account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(account.current_balance)}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center space-x-2 mt-4">
                    <button
                      onClick={() => props.handleOpenAccountModal?.(account)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => props.handleToggleAccountActive?.(account)}
                      className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-1 ${
                        account.active
                          ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {account.active ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          <span>Desativar</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Ativar</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => props.handleDeleteAccount?.(account.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Componente para a Barra de Ferramentas de Filtro
const TransactionFilters: React.FC<{
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}> = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter }) => (
  <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
    <div className="flex-grow w-full">
      <input
        type="text"
        placeholder="Buscar por descrição, cliente, fornecedor..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div className="w-full md:w-auto">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="all">Todos os Status</option>
        <option value="pending">Pendente</option>
        <option value="paid">Pago</option>
        <option value="overdue">Vencido</option>
        <option value="cancelled">Cancelado</option>
      </select>
    </div>
  </div>
);

// Componente para a Visualização da Tabela com Filtros
const TransactionsView: React.FC<{
  title: string;
  transactions: any[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onEdit: (transaction: any) => void;
  onDelete: (transactionId: string) => void;
  onPay: (transaction: any) => void;
}> = ({ title, transactions, searchTerm, setSearchTerm, statusFilter, setStatusFilter, onEdit, onDelete, onPay }) => (
  <div className="space-y-4">
    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    <TransactionFilters
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
    />
    <TransactionsTable
      transactions={transactions}
      onEdit={onEdit}
      onDelete={onDelete}
      onPay={onPay}
    />
  </div>
);

const Finance: React.FC = () => {
  const { 
    financialTransactions = [],
    bankAccounts = [],
    costCenters = [],
    clients = [],
    suppliers = [],
    getFinancialSummary,
    getCashFlow,
    getOverdueTransactions,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
  } = useApp();

  // ⭐ ADICIONADO: Hook do Toast
  const { success, error, warning } = useToast();

  // ====== ESTADOS ======
  const [activeTab, setActiveTab] = useState<'overview' | 'receivables' | 'payables' | 'cashflow' | 'accounts'>('overview');
  const [dateFilter, setDateFilter] = useState('month');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ====== ESTADOS PARA CONTAS BANCÁRIAS ======
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'checking' as 'checking' | 'savings' | 'cash' | 'investment',
    bank_name: '',
    agency: '',
    account_number: '',
    initial_balance: 0,
    current_balance: 0,
    active: true,
  });

  // ====== ESTADOS PARA TRANSAÇÕES ======
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense' as 'income' | 'expense',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending' as 'pending' | 'paid' | 'cancelled',
    payment_date: '',
    client_id: null,
    supplier_id: null,
    bank_account_id: null,
    cost_center_id: null,
  });

  
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
    (bankAccounts || [])
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
    let items = financialTransactions;

    // 1. Filtro por Aba Ativa
    if (activeTab === 'receivables') {
      items = items.filter(t => t.type === 'income');
    } else if (activeTab === 'payables') {
      items = items.filter(t => t.type === 'expense');
    }

    // 2. Filtro de Busca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      items = items.filter(t =>
        t.description.toLowerCase().includes(search) ||
        t.client_name?.toLowerCase().includes(search) ||
        t.supplier_name?.toLowerCase().includes(search)
      );
    }

    // 3. Filtro de Status
    if (statusFilter !== 'all') {
      items = items.filter(t => t.status === statusFilter);
    }

    return items;
  }, [financialTransactions, activeTab, searchTerm, statusFilter]);

  // ====== FUNÇÕES DE CONTAS BANCÁRIAS (COM TOASTS) ======
  const handleOpenAccountModal = (account?: any) => {
    if (account) {
      setEditingAccount(account);
      setAccountForm({
        name: account.name,
        type: account.type,
        bank_name: account.bank_name || '',
        agency: account.agency || '',
        account_number: account.account_number || '',
        initial_balance: account.initial_balance,
        current_balance: account.current_balance,
        active: account.active,
      });
    } else {
      setEditingAccount(null);
      setAccountForm({
        name: '',
        type: 'checking',
        bank_name: '',
        agency: '',
        account_number: '',
        initial_balance: 0,
        current_balance: 0,
        active: true,
      });
    }
    setShowAccountModal(true);
  };

  const handleCloseAccountModal = () => {
    setShowAccountModal(false);
    setEditingAccount(null);
    setAccountForm({
      name: '',
      type: 'checking',
      bank_name: '',
      agency: '',
      account_number: '',
      initial_balance: 0,
      current_balance: 0,
      active: true,
    });
  };

  // ⭐ MODIFICADO: Substituído alert() por toasts
  const handleSaveAccount = async () => {
    try {
      // Validações
      if (!accountForm.name.trim()) {
        error('Nome da conta é obrigatório'); // ⭐ Toast em vez de alert
        return;
      }

      console.log('💾 Salvando conta:', accountForm);
      console.log('📝 Editando?', editingAccount ? 'SIM' : 'NÃO');

      if (editingAccount) {
        console.log('🔄 Atualizando conta ID:', editingAccount.id);
        await updateBankAccount(editingAccount.id, accountForm);
        console.log('✅ Conta atualizada com sucesso!');
        success('Conta bancária atualizada com sucesso!'); // ⭐ Toast de sucesso
      } else {
        console.log('➕ Criando nova conta');
        const newAccount = {
          ...accountForm,
          current_balance: accountForm.initial_balance,
        };
        console.log('📦 Dados da nova conta:', newAccount);
        await addBankAccount(newAccount);
        console.log('✅ Conta criada com sucesso!');
        success('Conta bancária criada com sucesso!'); // ⭐ Toast de sucesso
      }
      
      handleCloseAccountModal();
    } catch (err) {
      console.error('❌ Erro ao salvar conta:', err);
      error('Erro ao salvar conta bancária: ' + (err as Error).message); // ⭐ Toast de erro
    }
  };

  // ⭐ MODIFICADO: Substituído alert() por toasts
  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) {
      try {
        await deleteBankAccount(accountId);
        success('Conta bancária excluída com sucesso!'); // ⭐ Toast de sucesso
      } catch (err) {
        console.error('Erro ao excluir conta:', err);
        error('Erro ao excluir conta bancária'); // ⭐ Toast de erro
      }
    }
  };

  // ⭐ MODIFICADO: Adicionado toast de sucesso
  const handleToggleAccountActive = async (account: any) => {
    try {
      await updateBankAccount(account.id, {
        active: !account.active,
      });
      success(`Conta ${account.active ? 'desativada' : 'ativada'} com sucesso!`); // ⭐ Toast de sucesso
    } catch (err) {
      console.error('Erro ao atualizar status da conta:', err);
      error('Erro ao atualizar status da conta'); // ⭐ Toast de erro
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const types: { [key: string]: { label: string; icon: React.ReactNode } } = {
      checking: { label: 'Conta Corrente', icon: <Building2 className="h-5 w-5" /> },
      savings: { label: 'Poupança', icon: <PiggyBank className="h-5 w-5" /> },
      cash: { label: 'Dinheiro', icon: <Banknote className="h-5 w-5" /> },
      investment: { label: 'Investimento', icon: <TrendingUpIcon className="h-5 w-5" /> },
    };
    return types[type] || types.checking;
  };

  const getAccountTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      checking: 'bg-blue-100 text-blue-800 border-blue-200',
      savings: 'bg-green-100 text-green-800 border-green-200',
      cash: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      investment: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[type] || colors.checking;
  };
    // ====== FUNÇÕES DE TRANSAÇÕES (COM TOASTS) ======
  
  const handleOpenTransactionModal = (transaction?: any) => {
    const today = new Date().toISOString().split('T')[0];
    if (transaction) {
      setEditingTransaction(transaction);
      setTransactionForm({
        ...transaction,
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : today,
        due_date: transaction.due_date ? new Date(transaction.due_date).toISOString().split('T')[0] : today,
        payment_date: transaction.payment_date ? new Date(transaction.payment_date).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingTransaction(null);
      setTransactionForm({
        type: 'expense',
        description: '',
        amount: 0,
        date: today,
        due_date: today,
        status: 'pending',
        payment_date: '',
        client_id: null,
        supplier_id: null,
        bank_account_id: null,
        cost_center_id: null,
      });
    }
    setShowTransactionModal(true);
  };

  const handleCloseTransactionModal = () => {
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  // ⭐ MODIFICADO: Substituído alert() por toasts
  const handleSaveTransaction = async () => {
    // Validações básicas
    if (!transactionForm.description.trim()) {
      error('A descrição é obrigatória'); // ⭐ Toast de erro
      return;
    }
    if (transactionForm.amount <= 0) {
      error('O valor deve ser maior que zero'); // ⭐ Toast de erro
      return;
    }
    if (transactionForm.status === 'paid' && !transactionForm.bank_account_id) {
      error('Para transações pagas, é obrigatório selecionar uma conta bancária'); // ⭐ Toast de erro
      return;
    }

    try {
      const dataToSave = { ...transactionForm };
      // Limpar IDs nulos para não enviar para o Supabase
      if (!dataToSave.client_id) delete dataToSave.client_id;
      if (!dataToSave.supplier_id) delete dataToSave.supplier_id;
      if (!dataToSave.bank_account_id) delete dataToSave.bank_account_id;
      if (!dataToSave.cost_center_id) delete dataToSave.cost_center_id;
      if (!dataToSave.payment_date) delete dataToSave.payment_date;

      if (editingTransaction) {
        await updateFinancialTransaction(editingTransaction.id, dataToSave);
        success('Transação atualizada com sucesso!'); // ⭐ Toast de sucesso
      } else {
        await addFinancialTransaction(dataToSave);
        success('Transação criada com sucesso!'); // ⭐ Toast de sucesso
      }
      handleCloseTransactionModal();
    } catch (err) {
      console.error("Erro ao salvar transação:", err);
      error('Ocorreu um erro ao salvar a transação'); // ⭐ Toast de erro
    }
  };

  // ⭐ MODIFICADO: Adicionado toast de sucesso
  const handleDeleteTransaction = async (transactionId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.')) {
      try {
        await deleteFinancialTransaction(transactionId);
        success('Transação excluída com sucesso!'); // ⭐ Toast de sucesso
      } catch (err) {
        console.error('Erro ao excluir transação:', err);
        error('Não foi possível excluir a transação'); // ⭐ Toast de erro
      }
    }
  };
  
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
          onClick={() => handleOpenTransactionModal()}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          <span>Nova Transação</span>
        </button>
      </div>

      {/* Sistema de Abas */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 p-1">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Eye },
              { id: 'accounts', label: 'Contas Bancárias', icon: Wallet },
              { id: 'receivables', label: 'Contas a Receber', icon: ArrowUpCircle },
              { id: 'payables', label: 'Contas a Pagar', icon: ArrowDownCircle },
              { id: 'cashflow', label: 'Fluxo de Caixa', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
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
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
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

                {/* TransactionsView */}
                <div className="mt-8">
                  <TransactionsView
                    title="Transações Recentes"
                    transactions={filteredTransactions}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    onEdit={handleOpenTransactionModal}
                    onDelete={handleDeleteTransaction}
                    onPay={(t) => warning(`Função de pagamento em desenvolvimento para: ${t.description}`)} // ⭐ Toast de aviso
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aba de Contas Bancárias */}
          {activeTab === 'accounts' && (
            <AccountsTabContent 
              bankAccounts={bankAccounts}
              handleOpenAccountModal={handleOpenAccountModal}
              handleDeleteAccount={handleDeleteAccount}
              handleToggleAccountActive={handleToggleAccountActive}
              totalBankBalance={totalBankBalance}
              getAccountTypeLabel={getAccountTypeLabel}
              getAccountTypeColor={getAccountTypeColor}
            />
          )}
          
          {/* Outras abas */}
          {activeTab === 'receivables' && <ReceivablesTab />}
          {activeTab === 'payables' && <PayablesTab />}
          {activeTab === 'cashflow' && <CashFlowTab />}

        </div>
      </div>

      {/* Modal de Conta Bancária (COM TOAST) */}
      <AccountModal
        isOpen={showAccountModal}
        onClose={handleCloseAccountModal}
        onSave={handleSaveAccount}
        accountForm={accountForm}
        setAccountForm={setAccountForm}
        editingAccount={editingAccount}
        toast={{ success, error, warning }} // ⭐ PASSANDO TOAST COMO PROP
      />

      {/* Modal de Transação */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={handleCloseTransactionModal}
        onSave={handleSaveTransaction}
        formState={transactionForm}
        setFormState={setTransactionForm}
        editingTransaction={editingTransaction}
        clients={clients}
        suppliers={suppliers}
        bankAccounts={bankAccounts}
        costCenters={costCenters}
      />
    </div>
  );
};

export default Finance;
