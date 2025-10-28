// src/components/TransactionModal.tsx
import React from 'react';
import { X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

// Definindo os tipos para as props do componente
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  editingTransaction: any;
  clients: any[];
  suppliers: any[];
  bankAccounts: any[];
  costCenters: any[];
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formState,
  setFormState,
  editingTransaction,
  clients,
  suppliers,
  bankAccounts,
  costCenters,
}) => {
  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormState(prev => ({ ...prev, amount: value }));
  };

  // ⭐⭐⭐ ADICIONE ESTA FUNÇÃO AQUI ⭐⭐⭐
  const handleSave = async () => {
    // Validação 1: Descrição obrigatória
    if (!formState.description || formState.description.trim() === '') {
      alert('A descrição é obrigatória');
      return;
    }

    // Validação 2: Valor deve ser maior que zero
    if (!formState.amount || formState.amount <= 0) {
      alert('O valor deve ser maior que zero');
      return;
    }

    // Validação 3: Número de parcelas (se houver)
    if (formState.installments && formState.installments < 1) {
      alert('O número de parcelas deve ser maior que zero');
      return;
    }

    // Validação 4: Se status for 'paid', deve ter conta bancária
    if (formState.status === 'paid' && !formState.bank_account_id) {
      alert('Selecione uma conta bancária para transações pagas');
      return;
    }

    // Validação 5: Se status for 'paid', deve ter data de pagamento
    if (formState.status === 'paid' && !formState.payment_date) {
      alert('Informe a data do pagamento');
      return;
    }

    // Validação 6: Data de vencimento não pode ser anterior à data da transação
    if (formState.due_date && formState.date && formState.due_date < formState.date) {
      const confirm = window.confirm('A data de vencimento é anterior à data da transação. Deseja continuar?');
      if (!confirm) return;
    }

    // Se passou em todas as validações, chama o onSave original
    try {
      await onSave();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      alert('Erro ao salvar transação. Verifique os dados e tente novamente.');
    }
  };
  // ⭐⭐⭐ FIM DA ADIÇÃO ⭐⭐⭐

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form - Overflow scroll */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Tipo de Transação */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormState(prev => ({ ...prev, type: 'income' }))}
              className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-all ${
                formState.type === 'income'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              <ArrowUpCircle />
              <span className="font-semibold">Receita</span>
            </button>
            <button
              onClick={() => setFormState(prev => ({ ...prev, type: 'expense' }))}
              className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-all ${
                formState.type === 'expense'
                  ? 'bg-red-50 border-red-500 text-red-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              <ArrowDownCircle />
              <span className="font-semibold">Despesa</span>
            </button>
          </div>
          
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <input
              type="text"
              name="description"
              value={formState.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={formState.type === 'income' ? 'Ex: Venda de produto X' : 'Ex: Compra de matéria-prima'}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
              <input
                type="number"
                name="amount"
                value={formState.amount}
                onChange={handleAmountChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0,00"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formState.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Campos Condicionais para Status PAGO */}
          {formState.status === 'paid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do Pagamento *</label>
                <input
                  type="date"
                  name="payment_date"
                  value={formState.payment_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conta de {formState.type === 'income' ? 'Entrada' : 'Saída'} *</label>
                <select
                  name="bank_account_id"
                  value={formState.bank_account_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                  required
                >
                  <option value="">Selecione uma conta</option>
                  {bankAccounts.filter(acc => acc.active).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} - {formatCurrency(acc.current_balance)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data da Transação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data da Transação</label>
              <input
                type="date"
                name="date"
                value={formState.date}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
              <input
                type="date"
                name="due_date"
                value={formState.due_date}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente ou Fornecedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formState.type === 'income' ? 'Cliente' : 'Fornecedor'}
              </label>
              <select
                name={formState.type === 'income' ? 'client_id' : 'supplier_id'}
                value={formState.type === 'income' ? formState.client_id : formState.supplier_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione...</option>
                {formState.type === 'income' 
                  ? clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  : suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                }
              </select>
            </div>

            {/* Centro de Custo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Custo</label>
              <select
                name="cost_center_id"
                value={formState.cost_center_id || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Nenhum</option>
                {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 mt-auto">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          
          {/* ⭐ MUDANÇA AQUI: era onClick={onSave} */}
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            {editingTransaction ? 'Salvar Alterações' : 'Criar Transação'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
