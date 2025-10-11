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
    let firstLine = lines[0].replace(/^\uFEFF/, '');
    const headers = firstLine.split(separator).map(h => h.trim().toLowerCase());

    const clients = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line, separator);
      const client: any = { type: 'pf', fl_ativo: true };

      headers.forEach((header, idx) => {
        const val = values[idx]?.trim().replace(/^['"]|['"]$/g, '') || '';
        switch (header) {
          case 'nome':
          case 'cliente':
          case 'name':
            client.name = val;
            break;
          case 'email':
          case 'e-mail':
            client.email = val;
            break;
          case 'telefone':
          case 'phone':
            client.phone = val;
            break;
          case 'cpf':
            client.cpf = val;
            break;
          case 'cnpj':
            client.cnpj = val;
            client.type = 'pj';
            break;
          case 'cidade':
            client.city = val;
            break;
          case 'estado':
          case 'uf':
            client.state = val;
            break;
        }
      });

      if (!client.name) continue;

      // Defaults
      if (!client.email) client.email = `cliente${Date.now()}@exemplo.com`;
      if (!client.phone) client.phone = '(00) 0000-0000';
      if (!client.city) client.city = 'Não informado';

      clients.push(client);
    }

    if (clients.length === 0) return { success: false, error: 'Nenhum cliente válido encontrado' };

    return { success: true, data: clients };
  } catch {
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
