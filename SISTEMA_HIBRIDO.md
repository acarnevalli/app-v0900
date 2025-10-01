# Sistema Híbrido de Armazenamento

## Visão Geral

O sistema foi completamente reestruturado para funcionar com **armazenamento local (IndexedDB)** por padrão, com opção de sincronização com serviços em nuvem quando desejado. Isso significa:

✅ **Uso Gratuito e Offline**: Funciona 100% offline sem custos
✅ **Sem Dependência de Internet**: Opera normalmente sem conexão
✅ **Sincronização Opcional**: Conecte com Supabase ou outros serviços quando quiser
✅ **Controle Total dos Dados**: Você decide onde e quando seus dados são armazenados
✅ **Flexibilidade**: Mude entre local e nuvem a qualquer momento

---

## Arquitetura

### Camada de Abstração de Dados

O sistema usa uma arquitetura em camadas que separa a lógica de negócio do armazenamento:

```
┌─────────────────────────────────────┐
│         Aplicação (AppContext)       │
├─────────────────────────────────────┤
│       Storage Manager (Unificado)    │
├─────────────────────────────────────┤
│  Adaptador Local  │  Adaptador Cloud │
│   (IndexedDB)     │    (Supabase)    │
└─────────────────────────────────────┘
```

### Componentes Principais

1. **Storage Manager** (`src/lib/storage/storage-manager.ts`)
   - Gerencia o provedor ativo (local ou nuvem)
   - Controla sincronização automática
   - Coordena migração de dados

2. **IndexedDB Adapter** (`src/lib/storage/indexeddb-adapter.ts`)
   - Banco de dados local no navegador
   - Funciona 100% offline
   - Sem custos ou limites (exceto espaço do navegador)

3. **Supabase Adapter** (`src/lib/storage/supabase-adapter.ts`)
   - Adaptador para sincronização com Supabase
   - Opcional e configurável
   - Outros adaptadores podem ser criados (Firebase, AWS, etc.)

4. **Sync Manager** (`src/lib/storage/sync-manager.ts`)
   - Gerencia sincronização bidirecional
   - Resolução de conflitos automática ou manual
   - Fila de operações offline

---

## Configuração Inicial

### 1. Uso Local (Padrão - Gratuito)

Por padrão, o sistema inicia em modo local, sem necessidade de configuração:

1. Abra o sistema no navegador
2. Faça login normalmente
3. Todos os dados são salvos localmente no IndexedDB do navegador

**Vantagens:**
- Gratuito
- Rápido
- Funciona offline
- Sem limites de uso

**Limitações:**
- Dados apenas no dispositivo atual
- Backup manual necessário

### 2. Habilitando Sincronização em Nuvem (Opcional)

Para sincronizar entre dispositivos ou fazer backup automático:

1. Acesse **Configurações** → **Sistema** → **Sincronização e Nuvem**
2. Clique em **Supabase** (ou outro provedor)
3. Insira suas credenciais:
   - **URL do Projeto**: `https://seu-projeto.supabase.co`
   - **Chave Anônima**: Obtida no painel do Supabase
4. Clique em **Testar Conexão** para validar
5. Clique em **Salvar Configuração**
6. Opcionalmente, ative **Sincronização Automática**

---

## Funcionalidades

### Sincronização Manual

Mesmo com sincronização automática desativada, você pode sincronizar quando quiser:

1. Vá em **Configurações** → **Sincronização e Nuvem**
2. Clique em **Sincronizar Agora**
3. O sistema irá:
   - Enviar dados locais para a nuvem
   - Baixar dados novos da nuvem
   - Resolver conflitos automaticamente

### Sincronização Automática

Quando ativada, o sistema sincroniza automaticamente:
- A cada 5 minutos (quando online)
- Ao reconectar após ficar offline
- Após operações importantes (criar projeto, etc.)

### Modo Offline

O sistema detecta automaticamente quando está offline:

**Indicador Visual:**
- Na barra lateral, veja o status: **Online** ou **Offline**
- Operações pendentes são mostradas

**Funcionamento:**
1. Sistema funciona normalmente offline
2. Operações são salvas localmente
3. Fila de sincronização é criada
4. Ao voltar online, sincroniza automaticamente

### Resolução de Conflitos

Quando o mesmo registro é editado em dois lugares diferentes, o sistema resolve automaticamente usando a estratégia configurada:

**Estratégias Disponíveis:**
- **Mais recente vence** (padrão): Mantém a última modificação
- **Local vence**: Sempre prioriza mudanças locais
- **Remoto vence**: Sempre prioriza mudanças da nuvem
- **Resolução manual**: Você decide caso a caso

Para configurar:
1. **Configurações** → **Sincronização e Nuvem**
2. **Estratégia de Resolução de Conflitos**
3. Selecione a estratégia desejada

### Migração de Dados

#### Do Supabase para Local

Se você já tem dados no Supabase e quer migrar para local:

1. **Configurações** → **Sincronização e Nuvem**
2. Configure as credenciais do Supabase
3. Clique em **Migrar Dados do Supabase para Local**
4. Aguarde a conclusão (pode demorar alguns minutos)
5. Todos os dados serão copiados para o armazenamento local

#### Do Local para Supabase

Para enviar dados locais para a nuvem pela primeira vez:

1. Configure as credenciais do Supabase
2. Clique em **Sincronizar Agora**
3. Todos os dados locais serão enviados para a nuvem

### Backup e Exportação

#### Exportar Dados

Para fazer backup dos dados locais:

1. **Configurações** → **Sincronização e Nuvem**
2. Clique em **Exportar Dados**
3. Um arquivo JSON será baixado com todos os dados
4. Guarde esse arquivo em local seguro

#### Importar Dados

Para restaurar de um backup:

1. **Configurações** → **Sincronização e Nuvem**
2. Clique em **Importar Dados**
3. Selecione o arquivo JSON do backup
4. Os dados serão restaurados

---

## Comparação de Modos

| Característica | Local | Supabase | Servidor Próprio |
|----------------|-------|----------|------------------|
| Custo | Gratuito | Gratuito até limite* | Custo do servidor |
| Internet | Não necessária | Necessária para sync | Necessária para sync |
| Sincronização | Não | Sim | Sim |
| Múltiplos dispositivos | Não | Sim | Sim |
| Backup automático | Não | Sim | Sim |
| Velocidade | Muito rápida | Rápida | Depende do servidor |
| Limite de dados | Espaço do navegador** | 500MB gratuito* | Ilimitado |

\* Supabase oferece 500MB gratuitos, depois é pago
\** Navegadores modernos oferecem 1GB+ de espaço para IndexedDB

---

## Cenários de Uso

### Uso Individual em Um Computador

**Recomendação:** Modo Local
- Gratuito
- Rápido
- Sem complexidade
- Faça backups manuais periodicamente

### Uso em Múltiplos Dispositivos

**Recomendação:** Sincronização com Supabase
- Dados sincronizados entre dispositivos
- Backup automático
- Acesse de qualquer lugar

### Uso em Equipe

**Recomendação:** Sincronização com Supabase ou servidor próprio
- Todos veem os mesmos dados em tempo real
- Resolução automática de conflitos
- Auditoria de mudanças

### Ambientes sem Internet Confiável

**Recomendação:** Modo Local + Sincronização Manual
- Funciona offline sem problemas
- Sincronize quando tiver internet
- Fila de operações pendentes

---

## Configurações Avançadas

### Intervalo de Sincronização

Por padrão, sincroniza a cada 5 minutos. Para alterar:

Edite `src/lib/storage/storage-manager.ts`:
```typescript
const DEFAULT_CONFIG: StorageConfig = {
  syncInterval: 300000 // 5 minutos em milissegundos
};
```

### Adicionar Novos Provedores

Para adicionar suporte a Firebase, AWS, etc.:

1. Crie um novo adaptador em `src/lib/storage/`
2. Implemente a interface `IStorageAdapter`
3. Adicione no `StorageManager`
4. Atualize a UI em `SyncSettingsModal.tsx`

Exemplo de estrutura:
```typescript
export class FirebaseAdapter implements IStorageAdapter {
  // Implementar métodos da interface
}
```

---

## Troubleshooting

### Problema: Dados não estão sincronizando

**Soluções:**
1. Verifique se está online (ícone na sidebar)
2. Vá em Configurações → Sincronização e teste a conexão
3. Verifique se há operações pendentes
4. Tente sincronização manual

### Problema: Conflitos constantes

**Soluções:**
1. Mude a estratégia de conflito para "Local vence" ou "Remoto vence"
2. Evite editar o mesmo registro em múltiplos dispositivos simultaneamente
3. Sincronize com mais frequência

### Problema: Navegador ficando lento

**Soluções:**
1. Exporte e limpe dados antigos periodicamente
2. Use filtros para não carregar todos os registros de uma vez
3. Considere usar sincronização em nuvem e limpar dados locais antigos

### Problema: Perdi meus dados locais

**Soluções:**
1. Se tinha sincronização habilitada: basta reconectar e sincronizar
2. Se tinha backup manual: importe o arquivo JSON
3. **Prevenção:** Sempre mantenha backups ou use sincronização

---

## Segurança

### Dados Locais

- Armazenados no IndexedDB do navegador
- Protegidos pela política de mesma origem (Same-Origin Policy)
- Limpar dados do navegador = perda de dados locais

### Dados em Nuvem

- Protegidos por autenticação do provedor
- Use HTTPS sempre
- Mantenha as chaves seguras (não compartilhe)

### Recomendações

1. **Não use o mesmo computador público:** Dados ficam no navegador
2. **Faça backups regulares:** Especialmente em modo local
3. **Use senhas fortes:** Para acesso ao sistema e serviços em nuvem
4. **Monitore acessos:** No painel do Supabase, veja quem acessa

---

## Custos Estimados

### Modo Local
**Custo:** R$ 0,00/mês
- Completamente gratuito
- Sem limites de uso

### Supabase (Plano Gratuito)
**Custo:** R$ 0,00/mês até:
- 500MB de banco de dados
- 1GB de armazenamento de arquivos
- 2GB de largura de banda

### Supabase (Plano Pro)
**Custo:** ~US$ 25/mês (~R$ 125/mês)
- 8GB de banco de dados
- 100GB de armazenamento
- 250GB de largura de banda

### Servidor Próprio
**Custo:** Variável
- VPS básico: R$ 20-50/mês
- Você gerencia tudo
- Sem limites externos

---

## Próximos Passos

Com o sistema híbrido implementado, você pode:

1. **Usar imediatamente em modo local** (gratuito)
2. **Criar conta no Supabase** se quiser sincronização
3. **Configurar backup automático** para segurança
4. **Expandir para múltiplos dispositivos** quando necessário

## Suporte

Em caso de dúvidas ou problemas:
1. Consulte este documento
2. Verifique o console do navegador (F12) para erros
3. Revise as configurações de sincronização
4. Teste com dados de exemplo primeiro

---

**Desenvolvido em:** 2025-10-01
**Versão:** 2.0.0 (Sistema Híbrido)
