# Sistema de Vínculo de Componentes e Controle de Estoque

## Resumo da Implementação

Este documento descreve as mudanças implementadas para transformar o sistema de componentes de produtos de texto livre para um sistema robusto de vínculo entre produtos cadastrados, com controle automático de estoque e cálculo de custos.

## Alterações Principais

### 1. Banco de Dados Supabase

**Arquivo:** Migração SQL aplicada via `mcp__supabase__apply_migration`

Foram criadas as seguintes tabelas:

- **products**: Armazena todos os produtos (materiais brutos, partes de produto, produtos prontos)
- **product_components**: Relacionamento N:N entre produtos e seus componentes
- **stock_movements**: Histórico completo de movimentações de estoque
- **clients**: Cadastro de clientes
- **projects**: Projetos e orçamentos
- **project_products**: Produtos utilizados em cada projeto
- **transactions**: Transações financeiras

Todos com:
- RLS (Row Level Security) habilitado
- Políticas restritivas por usuário
- Índices para otimização de consultas
- Triggers para atualização automática de timestamps

### 2. Integração com Supabase

**Arquivos criados:**

- `src/lib/supabase.ts`: Cliente Supabase configurado
- `src/lib/supabase-types.ts`: Tipos TypeScript do banco de dados
- `src/lib/product-operations.ts`: Funções auxiliares para operações de produtos

**Funcionalidades implementadas:**

- ✅ Verificação de referências circulares (produto não pode usar ele mesmo como componente)
- ✅ Cálculo recursivo de custos de produtos compostos
- ✅ Movimentação automática de estoque ao criar projetos
- ✅ Verificação de disponibilidade de estoque
- ✅ Busca de produtos que usam determinado componente

### 3. AppContext Migrado

**Arquivo:** `src/contexts/AppContext.tsx` (reescrito)

Mudanças principais:
- ❌ Removido: localStorage
- ✅ Adicionado: Integração completa com Supabase
- ✅ Todas as operações são assíncronas e persistidas no banco
- ✅ Carregamento automático de dados ao inicializar
- ✅ Validações de integridade referencial
- ✅ Tratamento de erros robusto

### 4. Novo Sistema de Seleção de Componentes

**Arquivo:** `src/components/ProductCombobox.tsx` (novo)

Componente reutilizável com:
- 🔍 Busca em tempo real enquanto digita
- 🏷️ Exibição de tipo do produto (Material Bruto, Parte de Produto, Produto Pronto)
- ⚠️ Alerta visual para produtos com estoque baixo
- 📊 Informações completas: categoria, unidade, estoque, custo
- 🚫 Exclusão de produtos já selecionados
- ✅ Seleção intuitiva com dropdown

### 5. ProductModal Atualizado

**Arquivo:** `src/components/ProductModal.tsx` (reescrito)

Melhorias implementadas:

**Seleção de Componentes:**
- ✅ Substituição de campos de texto por ProductCombobox
- ✅ Preenchimento automático de unidade e custo ao selecionar produto
- ✅ Cálculo automático do custo total (quantidade × custo unitário)
- ✅ Validação para evitar adicionar o mesmo componente duas vezes
- ✅ Validação para evitar adicionar o próprio produto como componente

**Cálculo Automático de Custos:**
- ✅ Recálculo automático do custo do produto baseado nos componentes
- ✅ Indicador visual quando custo é calculado automaticamente
- ✅ Botão "Calcular Preço Sugerido" com margem de lucro configurável
- ✅ Respeita configuração de automação no ProductSettings

**Interface Melhorada:**
- ✅ Layout mais organizado e intuitivo
- ✅ Campos desabilitados (unidade, custo unitário) para valores automáticos
- ✅ Resumo visual do custo total dos componentes
- ✅ Mensagens de erro claras e úteis
- ✅ Estado de loading durante salvamento

### 6. Funcionalidades de Validação

**Implementadas em:** `src/lib/product-operations.ts` e `AppContext`

- ✅ Verificação de referências circulares antes de salvar
- ✅ Bloqueio de exclusão de produtos usados como componentes
- ✅ Mensagens de erro descritivas
- ✅ Validação de estoque disponível

### 7. Movimentação Automática de Estoque

**Implementada em:** `AppContext.processProjectStockMovement`

Quando um projeto é criado/aprovado:
- ✅ Deduz automaticamente o estoque dos produtos utilizados
- ✅ Deduz recursivamente o estoque dos componentes
- ✅ Cria registro de movimentação com referência ao projeto
- ✅ Histórico completo de todas as movimentações

## Como Usar

### 1. Criar um Produto Simples (Material Bruto)

1. Vá em "Produtos" → "Novo Produto"
2. Preencha nome, categoria, tipo (Material Bruto)
3. Defina unidade, estoques e preços
4. Salvar

### 2. Criar um Produto Composto

1. Vá em "Produtos" → "Novo Produto"
2. Preencha informações básicas
3. Clique em "+ Adicionar Componente"
4. Selecione um produto cadastrado no dropdown
5. Defina a quantidade necessária
6. O custo será calculado automaticamente
7. Repita para adicionar mais componentes
8. O custo total do produto será atualizado automaticamente
9. Opcionalmente, use "Calcular" para sugerir preço de venda
10. Salvar

### 3. Editar um Produto

1. Na lista de produtos, clique no ícone de editar
2. Modifique os campos desejados
3. Adicione/remova componentes conforme necessário
4. Os custos serão recalculados automaticamente
5. Salvar

### 4. Criar um Projeto que Usa Produtos

1. Vá em "Projetos" → "Novo Projeto"
2. Selecione cliente, preencha informações
3. Adicione produtos ao projeto
4. Ao salvar com status diferente de "Orçamento", o estoque será movimentado automaticamente
5. Todos os componentes necessários terão seu estoque deduzido

## Configurações

### Automação de Custos

Em "Configurações" → "Produtos e Estoque" → "Automação":

- **Calcular custos automaticamente**: Quando ativado, recalcula o custo de produtos compostos baseado nos componentes
- **Margem de lucro padrão**: Percentual usado no botão "Calcular" de preço de venda

### Alertas de Estoque

Em "Configurações" → "Produtos e Estoque" → "Alertas":

- **Habilitar alertas de estoque baixo**: Mostra avisos visuais
- **Destacar produtos com estoque baixo**: Adiciona destaque visual na lista

## Benefícios da Implementação

✅ **Consistência de Dados**: Não há mais erros de digitação nos nomes dos componentes

✅ **Controle Preciso**: Estoque sempre atualizado e rastreável

✅ **Cálculos Automáticos**: Custos sempre corretos baseados nos componentes atuais

✅ **Rastreabilidade Completa**: Histórico de movimentações vinculado a projetos

✅ **Validações Robustas**: Previne erros como referências circulares

✅ **Interface Intuitiva**: Seleção fácil de produtos com busca e filtros

✅ **Performance Otimizada**: Índices no banco de dados para consultas rápidas

✅ **Escalabilidade**: Preparado para crescer com o negócio

## Observações Importantes

- ⚠️ Como o sistema está usando autenticação local (não Supabase Auth), foi criado um mock user ID baseado no usuário logado
- ⚠️ Em produção, será necessário integrar com Supabase Auth para suporte multi-usuário real
- ⚠️ Os dados antigos em localStorage não são migrados automaticamente
- ⚠️ O primeiro acesso após o deploy criará as tabelas vazias

## Próximos Passos Sugeridos

1. **Integração com Supabase Auth**: Substituir autenticação local por Supabase Auth
2. **Migração de Dados**: Script para migrar dados do localStorage para Supabase
3. **Relatórios Avançados**: Tela dedicada para relatórios de movimentação de estoque
4. **Visualização de Árvore**: Interface visual para ver hierarquia de produtos compostos
5. **Alertas Automáticos**: Notificações quando estoque atingir nível crítico
6. **Histórico de Preços**: Rastrear mudanças de preço ao longo do tempo
7. **Exportação de Relatórios**: PDF/Excel com detalhamento de custos por produto

## Suporte

O sistema está pronto para uso e todas as funcionalidades foram testadas durante a implementação. Em caso de dúvidas ou problemas, verifique:

1. Console do navegador para erros
2. Configurações do Supabase (.env)
3. Permissões RLS no Supabase
4. Logs de erro no AppContext

---

**Desenvolvido em:** 2025-10-01
**Versão:** 1.0.0
