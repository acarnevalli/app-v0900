import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { FinancialTransaction, BankAccount } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FinancialTransaction;
}

export default function PaymentModal({ isOpen, onClose, transaction }: PaymentModalProps) {
  const { bankAccounts, payTransaction } = useApp();
  
  // Estados do formulário
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Valores calculados
  const remainingAmount = transaction.amount - (transaction.paidamount || 0);
  const maxPayment = remainingAmount + (transaction.discount || 0);

  // Filtrar apenas contas ativas
  const activeAccounts = bankAccounts.filter(acc => acc.active);

  // Inicializar valores quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setPaidAmount(remainingAmount.toFixed(2));
      setBankAccountId(transaction.bankaccountid || '');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen, transaction, remainingAmount]);

  // Validação do valor pago
  const validateAmount = (value: number): boolean => {
    if (value <= 0) {
      setError('O valor pago deve ser maior que zero');
      return false;
    }
    if (value > maxPayment) {
      setError(`O valor não pode ser maior que ${maxPayment.toFixed(2)}`);
      return false;
    }
    setError('');
    return true;
  };

  // Handler de mudança de valor
  const handleAmountChange = (value: string) => {
    setPaidAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      validateAmount(numValue);
    }
  };

  // Submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(paidAmount);
    
    // Validações
    if (!validateAmount(amount)) return;
    
    if (!bankAccountId) {
      setError('Selecione uma conta bancária');
      return;
    }

    if (!paymentDate) {
      setError('Selecione a data do pagamento');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await payTransaction(transaction.id, {
        paidamount: amount,
        paymentdate: paymentDate,
        bankaccountid: bankAccountId
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Registrar Pagamento
              </h2>
              <p className="text-sm text-gray-500">
                {transaction.type === 'income' ? 'Recebimento' : 'Pagamento'} de transação
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Informações da Transação */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Descrição:</span>
              <span className="font-medium text-gray-900">{transaction.description}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Valor Total:</span>
              <span className="font-medium text-gray-900">
                R$ {transaction.amount.toFixed(2)}
              </span>
            </div>
            {transaction.paidamount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Já Pago:</span>
                <span className="font-medium text-green-600">
                  R$ {transaction.paidamount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-gray-600 font-medium">Valor Restante:</span>
              <span className="font-bold text-blue-600">
                R$ {remainingAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Alerta de Erro */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Valor Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Valor Pago
            </label>
            <input
              type="number"
              step="0.01"
              value={paidAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Máximo: R$ {maxPayment.toFixed(2)}
            </p>
          </div>

          {/* Data do Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data do Pagamento
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Conta Bancária */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 inline mr-1" />
              Conta Bancária
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Selecione uma conta</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - Saldo: R$ {account.currentbalance.toFixed(2)}
                </option>
              ))}
            </select>
            {activeAccounts.length === 0 && (
              <p className="mt-1 text-xs text-red-600">
                Nenhuma conta bancária ativa disponível
              </p>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || activeAccounts.length === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
