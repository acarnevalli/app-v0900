export interface CSVImportResult {
  success: boolean;
  data?: any[];
  error?: string;
}

// === Função auxiliar para detectar separador ===
function detectCSVSeparator(csvText: string): string {
  const firstLine = csvText.split('\n')[0];
  const separators = [',', ';', '\t', '|'];
  let maxCount = 0;
  let bestSeparator = ',';

  for (const sep of separators) {
    const count = firstLine.split(sep).length - 1;
    if (count > maxCount) {
      maxCount = count;
      bestSeparator = sep;
    }
  }
  return bestSeparator;
}

// === Ajuda a ler uma linha CSV respeitando aspas ===
function parseCSVLine(line: string, separator: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// === Importação de Clientes ===
export const importClientsCSV = (csvText: string): CSVImportResult => {
  try {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return { success: false, error: 'Arquivo CSV vazio ou inválido' };

    const separator = detectCSVSeparator(csvText);
    const clients = [];

    // Pular a primeira linha (cabeçalho)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line, separator);
      
      // Mapeamento direto por índice conforme a ordem fornecida:
      // 0: Nome
      // 1: Razão Social
      // 2: CNPJ
      // 3: CPF
      // 4: ID Estrangeiro (ignorar)
      // 5: DataCriacao (ignorar)
      // 6: Observações (ignorar)
      // 7: Status
      // 8: Código (ignorar)
      // 9: Inscrição Estadual
      // 10: Email principal
      // 11: Telefone principal
      // 12: Data fundação/Aniversário (ignorar)
      // 13: CEP
      // 14: Estado
      // 15: Cidade
      // 16: Endereço
      // 17: Número
      // 18: Bairro
      // 19: Complemento
      // 20: Nome Contato (ignorar)
      // 21: E-mail Contato (ignorar)

      const nome = values[0]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const razaoSocial = values[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const cnpj = values[2]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const cpf = values[3]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const status = values[7]?.trim().replace(/^['"]|['"]$/g, '').toLowerCase() || '';
      const inscricaoEstadual = values[9]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const email = values[10]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const telefone = values[11]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const cep = values[13]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const estado = values[14]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const cidade = values[15]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const endereco = values[16]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const numero = values[17]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const bairro = values[18]?.trim().replace(/^['"]|['"]$/g, '') || '';
      const complemento = values[19]?.trim().replace(/^['"]|['"]$/g, '') || '';

      // Validação: precisa ter pelo menos nome
      if (!nome) continue;

      // Determinar tipo: PJ se tiver CNPJ, senão PF
      const type = cnpj ? 'pj' : 'pf';

      // Determinar se está ativo baseado no status
      const fl_ativo = status === 'ativo' || status === 'active' || status === '1' || status === 'sim' || !status;

      const client: any = {
        name: nome,
        type: type,
        cpf: cpf || null,
        cnpj: cnpj || null,
        razao_social: razaoSocial || null,
        inscricao_estadual: inscricaoEstadual || null,
        isento_icms: false,
        email: email || `cliente${Date.now()}@exemplo.com`,
        phone: telefone || '(00) 0000-0000',
        mobile: telefone || '(00) 00000-0000',
        country: 'Brasil',
        state: estado || 'N/A',
        city: cidade || 'N/A',
        zip_code: cep || '00000-000',
        neighborhood: bairro || 'N/A',
        street_type: 'Rua',
        street: endereco || 'N/A',
        numero: numero || 'S/N',
        complemento: complemento || '',
        id_empresa: null,
        fl_ativo: fl_ativo,
      };

      clients.push(client);
    }

    if (clients.length === 0) {
      return { success: false, error: 'Nenhum cliente válido encontrado no arquivo' };
    }

    return { success: true, data: clients };
  } catch (err) {
    console.error('Erro ao processar CSV:', err);
    return { success: false, error: 'Erro ao processar arquivo CSV de clientes' };
  }
};

// === Importação de Produtos ===
export const importProductsCSV = (csvText: string): CSVImportResult => {
  try {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return { success: false, error: 'Arquivo CSV vazio ou inválido' };

    const separator = detectCSVSeparator(csvText);
    let firstLine = lines[0].replace(/^\uFEFF/, '');
    const headers = firstLine.split(separator).map(h => h.trim().toLowerCase());

    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line, separator);
      const product: any = { active: true };

      headers.forEach((header, idx) => {
        const val = values[idx]?.trim().replace(/^['"]|['"]$/g, '') || '';
        switch (header) {
          case 'nome':
          case 'produto':
          case 'name':
            product.name = val;
            break;
          case 'codigo':
          case 'sku':
            product.code = val;
            break;
          case 'preço':
          case 'preco':
          case 'price':
            product.price = parseFloat(val.replace(',', '.')) || 0;
            break;
          case 'custo':
          case 'cost':
            product.cost = parseFloat(val.replace(',', '.')) || 0;
            break;
          case 'categoria':
          case 'category':
            product.category = val;
            break;
          case 'quantidade':
          case 'estoque':
          case 'stock':
            product.stock = parseFloat(val) || 0;
            break;
        }
      });

      if (!product.name) continue;
      if (!product.code) product.code = `PROD${Date.now()}`;
      products.push(product);
    }

    if (products.length === 0) return { success: false, error: 'Nenhum produto válido encontrado' };

    return { success: true, data: products };
  } catch {
    return { success: false, error: 'Erro ao processar arquivo CSV de produtos' };
  }
};
