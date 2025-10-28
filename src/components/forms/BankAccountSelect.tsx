import React from 'react';
import { useApp } from '../../context/AppContext';

interface BankAccountSelectProps {
  value: string;
  onChange: (accountId: string) => void;
  required?: boolean;
  label?: string;
  error?: string;
  showBalance?: boolean;
}

export const BankAccountSelect: React.FC<BankAccountSelectProps> = ({
  value,
  onChange,
  required = true,
  label = 'Conta Bancária',
  error,
  showBalance = true
}) => {
  const { bankAccounts } = useApp();

  const activeAccounts = bankAccounts.filter(acc => acc.active);

  if (activeAccounts.length === 0) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ Nenhuma conta bancária ativa encontrada.
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Configure uma conta em <strong>Configurações → Contas Bancárias</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <option value="">Selecione uma conta...</option>
        {activeAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
            {account.bank_name && ` (${account.bank_name})`}
            {showBalance && ` - Saldo: R$ ${account.current_balance.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
