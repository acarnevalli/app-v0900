# 📊 Módulo Financeiro - Documentação

## Visão Geral

Sistema completo de gestão financeira integrado aos módulos de Vendas, Compras e Projetos.

## Funcionalidades

### 1. Contas a Receber
- ✅ Registro automático de vendas
- ✅ Parcelamento automático
- ✅ Controle de status (pendente, pago, vencido)
- ✅ Filtros avançados
- ✅ Relatório de top clientes

### 2. Contas a Pagar
- ✅ Registro automático de compras
- ✅ Gestão de fornecedores
- ✅ Controle por centro de custo
- ✅ Alertas de vencimento
- ✅ Relatório de top fornecedores

### 3. Fluxo de Caixa
- ✅ DRE (Demonstração de Resultados)
- ✅ Projeção de saldo
- ✅ Evolução mensal (últimos 6 meses)
- ✅ Despesas por centro de custo

### 4. Contas Bancárias
- ✅ Múltiplas contas
- ✅ Tipos: Corrente, Poupança, Dinheiro, Investimento
- ✅ Controle de saldo automático
- ✅ Histórico de transações

## Estrutura de Dados

### Financial Transaction
```typescript
{
  type: 'income' | 'expense'
  description: string
  amount: number
  due_date: Date
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial'
  client_id?: string
  supplier_id?: string
  bank_account_id?: string
  cost_center_id?: string
  installment_number?: number
  total_installments?: number
}
