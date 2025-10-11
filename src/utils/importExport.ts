
interface CSVImportResult {
  success: boolean;
  data?: any[];
  error?: string;
}

// Função para detectar o separador do CSV
function detectCSVSeparator(csvText: string): string {
  const firstLine = csvText.split('\n')[0];
  const separators = [',', ';', '\t', '|'];
  
  let maxCount = 0;
  let bestSeparator = ',';
  
  for (const sep of separators) {
    const count = (firstLine.match(new RegExp(`\\${sep}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestSeparator = sep;
    }
  }
  
  return bestSeparator;
}

// Função auxiliar para parsear linha CSV considerando vírgulas dentro de aspas
function parseCSVLine(line: string, separator: string = ','): string[] {
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

export const importClientsCSV = (csvText: string): CSVImportResult => {
  try {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return { success: false, error: 'Arquivo CSV vazio ou inválido' };
    }

    // Detectar separador
    const separator = detectCSVSeparator(csvText);
    console.log('Separador detectado:', separator);

    // Remover BOM se existir
    let firstLine = lines[0];
    if (firstLine.charCodeAt(0) === 0xFEFF) {
      firstLine = firstLine.substring(1);
    }

    const headers = firstLine.split(separator).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    console.log('Headers encontrados:', headers);
    
    const clients = [];
    const warnings = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line, separator);
      const client: any = {
        type: 'pf',
        fl_ativo: true,
        country: 'Brasil',
        street_type: 'Rua',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Debug: mostrar valores da primeira linha
      if (i === 1) {
        console.log('Primeira linha de dados:', values);
        console.log('Mapeamento headers/valores:', headers.map((h, idx) => `${h}: ${values[idx]}`));
      }

      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        
        // Mapear campos do CSV para o formato do sistema - mais flexível
        switch (header) {
          case 'nome':
          case 'name':
          case 'razao_social':
          case 'razão social':
          case 'cliente':
            client.name = value;
            break;
          case 'email':
          case 'e-mail':
            client.email = value || `cliente${i}@exemplo.com`;
            break;
          case 'telefone':
          case 'phone':
          case 'fone':
            client.phone = value || '';
            break;
          case 'celular':
          case 'mobile':
          case 'whatsapp':
            client.mobile = value || '';
            break;
          case 'cpf':
            client.cpf = value;
            if (value) client.type = 'pf';
            break;
          case 'cnpj':
            client.cnpj = value;
            if (value) client.type = 'pj';
            break;
          case 'endereco':
          case 'endereço':
          case 'street':
          case 'rua':
          case 'logradouro':
            client.street = value || '';
            break;
          case 'numero':
          case 'número':
          case 'num':
            client.numero = value || 'S/N';
            break;
          case 'bairro':
          case 'neighborhood':
            client.neighborhood = value || '';
            break;
          case 'cidade':
          case 'city':
            client.city = value || '';
            break;
          case 'estado':
          case 'state':
          case 'uf':
            client.state = value || '';
            break;
          case 'cep':
          case 'zip_code':
          case 'codigo_postal':
            client.zip_code = value || '';
            break;
        }
      });

      // Se não tiver nome mas tiver outros dados, tentar criar um nome
      if (!client.name) {
        if (client.razao_social) {
          client.name = client.razao_social;
        } else if (values.length > 0 && values[0]) {
          // Se o primeiro campo tiver valor, assume que é o nome
          client.name = values[0].trim();
        }
      }

      // Validar campos obrigatórios com mensagens mais claras
      if (!client.name) {
        warnings.push(`Linha ${i + 1}: Cliente sem nome, pulando...`);
        console.warn(`Linha ${i + 1}: Dados completos:`, values);
        continue;
      }

      // Preencher campos obrigatórios vazios com valores padrão
      if (!client.email) client.email = `cliente${Date.now()}@exemplo.com`;
      if (!client.phone) client.phone = '(00) 0000-0000';
      if (!client.mobile) client.mobile = '(00) 00000-0000';
      if (!client.street) client.street = 'Não informado';
      if (!client.neighborhood) client.neighborhood = 'Não informado';
      if (!client.city) client.city = 'Não informado';
      if (!client.state) client.state = 'SP';
      if (!client.zip_code) client.zip_code = '00000-000';

      clients.push(client);
    }

    console.log(`Importação concluída: ${clients.length} clientes importados, ${warnings.length} avisos`);
    
    if (warnings.length > 0) {
      console.warn('Avisos durante importação:', warnings);
    }

    if (clients.length === 0) {
      return { 
        success: false, 
        error: 'Nenhum cliente válido encontrado no arquivo. Verifique se o arquivo possui a coluna "nome" ou se os dados estão corretos.' 
      };
    }

    return { success: true, data: clients };
  } catch (error) {
    console.error('Erro ao importar CSV:', error);
    return { success: false, error: 'Erro ao processar arquivo CSV' };
  }
};

export const importProductsCSV = (csvText: string): CSVImportResult => {
  try {
    const separator = detectCSVSeparator(csvText);
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return { success: false, error: 'Arquivo CSV vazio ou inválido' };
    }

    let firstLine = lines[0];
    if (firstLine.charCodeAt(0) === 0xFEFF) {
      firstLine = firstLine.substring(1);
    }

    const headers = firstLine.split(separator).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line, separator);
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
          case 'produto':
            product.name = value;
            break;
          case 'descricao':
          case 'descrição':
          case 'description':
            product.description = value;
            break;
          case 'categoria':
          case 'category':
            product.category = value;
            break;
          case 'preco_custo':
          case 'preço_custo':
          case 'cost_price':
          case 'custo':
            product.cost_price = parseFloat(value.replace(',', '.')) || 0;
            break;
          case 'preco_venda':
          case 'preço_venda':
          case 'sale_price':
          case 'venda':
            product.sale_price = parseFloat(value.replace(',', '.')) || 0;
            break;
          case 'estoque':
          case 'stock':
          case 'quantidade':
            product.current_stock = parseInt(value) || 0;
            break;
          case 'estoque_minimo':
          case 'estoque_mínimo':
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

      // Valores padrão
      if (!product.description) product.description = '';
      if (!product.category) product.category = 'Geral';

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

// Funções de exportação
export const exportClientsCSV = (clients: any[]): string => {
  const headers = ['nome', 'email', 'telefone', 'celular', 'cpf', 'cnpj', 'endereco', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
  const rows = clients.map(client => 
    headers.map(header => {
      let value = '';
      switch(header) {
        case 'endereco':
          value = client.street || '';
          break;
        default:
          value = client[header] || '';
      }
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
    headers.map(header => {
      let value = '';
      switch(header) {
        case 'estoque':
          value = product.current_stock || 0;
          break;
        case 'estoque_minimo':
          value = product.min_stock || 0;
          break;
        default:
          value = product[header] || '';
      }
      return value;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
};
