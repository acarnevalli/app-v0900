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

Integrações Automáticas
Vendas → Contas a Receber
Ao criar uma venda com pagamento parcelado, o sistema automaticamente:

Cria N transações (uma por parcela)
Define datas de vencimento
Vincula ao cliente
Calcula valores
Compras → Contas a Pagar
Ao criar uma compra, o sistema automaticamente:

Cria transações de pagamento
Vincula ao fornecedor
Adiciona custos de frete (se houver)
Permite definir centro de custo
Projetos → Contas a Receber/Pagar
Projetos do tipo "venda" geram contas a receber automaticamente.

Uso
Criar Transação Manual
Acesse Financeiro → Nova Transação
Preencha os dados
Defina se é receita ou despesa
Salve
Registrar Pagamento
Localize a transação
Clique em "Pagar"
Selecione a conta bancária
Informe valor e data
Confirme
Visualizar Relatórios
Acesse a aba "Fluxo de Caixa"
Selecione o período desejado
Analise os gráficos e indicadores
Manutenção
Backup
Todas as transações são armazenadas no Supabase com backup automático.

Auditoria
Cada transação possui timestamps de criação e atualização.

text

---

## **🧪 ROTEIRO DE TESTES**

Execute os seguintes testes para validar o sistema:

### **Teste 1: Criar Conta Bancária**
- [ ] Criar conta corrente
- [ ] Criar conta poupança
- [ ] Verificar se aparecem na lista
- [ ] Editar uma conta
- [ ] Desativar uma conta

### **Teste 2: Criar Transação Manual**
- [ ] Criar receita simples
- [ ] Criar despesa simples
- [ ] Criar receita parcelada (3x)
- [ ] Verificar se as 3 parcelas aparecem
- [ ] Editar uma transação

### **Teste 3: Registrar Pagamentos**
- [ ] Pagar uma receita totalmente
- [ ] Pagar uma despesa parcialmente
- [ ] Verificar se o saldo da conta mudou
- [ ] Verificar se o status mudou para "pago"

### **Teste 4: Integrações Automáticas**
- [ ] Criar uma venda parcelada
- [ ] Verificar se transações foram criadas
- [ ] Criar uma compra
- [ ] Verificar transação de despesa

### **Teste 5: Relatórios**
- [ ] Acessar aba Fluxo de Caixa
- [ ] Mudar período de análise
- [ ] Verificar se gráficos atualizam
- [ ] Conferir cálculos da DRE

