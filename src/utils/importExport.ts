interface CSVImportResult {
  success: boolean;
  data?: any[];
  error?: string;
}

export const importClientsCSV = (csvText: string): CSVImportResult => {
  try {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return { success: false, error: 'Arquivo CSV vazio ou inválido' };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const clients = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      const client: any = {
        type: 'pf',
        fl_ativo: true,
        country: 'Brasil',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        
        // Mapear campos do CSV para o formato do sistema
        switch (header) {
          case 'nome':
          case 'name':
            client.name = value;
            break;
          case 'email':
            client.email = value;
            break;
          case 'telefone':
          case 'phone':
            client.phone = value;
            break;
          case 'celular':
          case 'mobile':
            client.mobile = value;
            break;
          case 'cpf':
            client.cpf = value;
            client.type = 'pf';
            break;
          case 'cnpj':
            client.cnpj = value;
            client.type = 'pj';
            break;
          case 'endereco':
          case 'street':
            client.street = value;
            break;
          case 'numero':
            client.numero = value;
            break;
          case 'bairro':
          case 'neighborhood':
            client.neighborhood = value;
            break;
          case 'cidade':
          case 'city':
            client.city = value;
            break;
          case 'estado':
          case 'state':
            client.state = value;
            break;
          case 'cep':
          case 'zip_code':
            client.zip_code = value;
            break;
        }
      });

      // Validar campos obrigatórios
      if (!client.name || !client.email) {
        console.warn(`Linha ${i + 1}: Cliente sem nome ou email, pulando...`);
        continue;
      }

      clients.push(client);
    }

    return { success: true, data: clients };
  } catch (error) {
    console.error('Erro ao importar CSV:', error);
    return { success: false, error: 'Erro ao processar arquivo CSV' };
  }
};

export const importProductsCSV = (csvText: string): CSVImportResult => {
  try {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return { success: false, error: 'Arquivo CSV vazio ou inválido' };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      const product: any = {
        type: 'produto_pronto',
        unit: 'un',
        current_stock: 0,
        min_stock: 0,
        components: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        
        switch (header) {
          case 'nome':
          case 'name':
            product.name = value;
            break;
          case 'descricao':
          case 'description':
            product.description = value;
            break;
          case 'categoria':
          case 'category':
            product.category = value;
            break;
          case 'preco_custo':
          case 'cost_price':
            product.cost_price = parseFloat(value) || 0;
            break;
          case 'preco_venda':
          case 'sale_price':
            product.sale_price = parseFloat(value) || 0;
            break;
          case 'estoque':
          case 'stock':
            product.current_stock = parseInt(value) || 0;
            break;
          case 'estoque_minimo':
          case 'min_stock':
            product.min_stock = parseInt(value) || 0;
            break;
          case 'unidade':
          case 'unit':
            product.unit = value || 'un';
            break;
        }
      });

      if (!product.name) {
        console.warn(`Linha ${i + 1}: Produto sem nome, pulando...`);
        continue;
      }

      products.push(product);
    }

    return { success: true, data: products };
  } catch (error) {
    console.error('Erro ao importar CSV:', error);
    return { success: false, error: 'Erro ao processar arquivo CSV' };
  }
};

export const importProjectsCSV = (csvText: string): CSVImportResult => {
  // Implementação similar
  return { success: false, error: 'Importação de projetos ainda não implementada' };
};

export const importTransactionsCSV = (csvText: string): CSVImportResult => {
  // Implementação similar
  return { success: false, error: 'Importação de transações ainda não implementada' };
};

// Função auxiliar para parsear linha CSV considerando vírgulas dentro de aspas
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// Funções de exportação
export const exportClientsCSV = (clients: any[]): string => {
  const headers = ['nome', 'email', 'telefone', 'celular', 'cpf', 'cnpj', 'endereco', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
  const rows = clients.map(client => 
    headers.map(header => {
      const value = client[header] || '';
      // Se o valor contém vírgula ou aspas, envolver em aspas
      if (value.toString().includes(',') || value.toString().includes('"')) {
        return `"${value.toString().replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
};

export const exportProductsCSV = (products: any[]): string => {
  const headers = ['nome', 'descricao', 'categoria', 'preco_custo', 'preco_venda', 'estoque', 'estoque_minimo', 'unidade'];
  const rows = products.map(product => 
    headers.map(header => product[header] || '').join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
};
