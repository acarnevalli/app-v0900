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
    const count = firstLine.split(sep).length - 1;
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
        const value = values[index]?.trim().replace(/^["']|["']$/g, '') || '';
        
        // Mapear campos do CSV para o formato do sistema
        switch (header) {
          case 'nome':
          case 'name':
          case 'cliente':
            client.name = value;
            break;
          case 'razão social':
          case 'razao social':
            // Se tiver razão social e não tiver nome, usa a razão social como nome
            if (value && !client.name) {
              client.name = value;
            }
            client.razao_social = value;
            break;
          case 'email principal':
          case 'email':
          case 'e-mail':
            client.email = value || `cliente${Date.now()}@exemplo.com`;
            break;
          case 'telefone principal':
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
            if (value) {
              client.cpf = value;
              client.type = 'pf';
            }
            break;
          case 'cnpj':
            if (value) {
              client.cnpj = value;
              client.type = 'pj';
              // Se tem CNPJ e tem razão social, usa a razão social como nome
              if (client.razao_social) {
                client.name = client.razao_social;
              }
            }
            break;
          case 'endereço':
          case 'endereco':
          case 'street':
          case 'rua':
          case 'logradouro':
            client.street = value || '';
            break;
          case 'número':
          case 'numero':
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
            client.zip_code = value ? value.replace(/\D/g, '') : ''; // Remove não-dígitos do CEP
            break;
          case 'complemento':
            client.complemento = value || '';
            break;
          case 'inscrição estadual':
          case 'inscricao estadual':
            client.inscricao_estadual = value || '';
            break;
          case 'status':
            client.fl_ativo = value.toLowerCase() === 'ativado' || value.toLowerCase() === 'ativo';
            break;
          case 'observações':
          case 'observacoes':
          case 'observação':
          case 'observacao':
            client.observacoes = value || '';
            break;
        }
      });

      // Lógica especial para determinar o nome
      if (!client.name || client.name === '""') {
        // Tentar pegar o nome de outras fontes
        if (values[0] && values[0] !== '""') {
          client.name = values[0].replace(/^["']|["']$/g, '');
        } else if (client.razao_social) {
          client.name = client.razao_social;
        }
      }

      // Validar campos obrigatórios com mensagens mais claras
      if (!client.name || client.name === '""' || client.name.trim() === '') {
        warnings.push(`Linha ${i + 1}: Cliente sem nome válido, pulando...`);
        console.warn(`Linha ${i + 1}: Dados completos:`, values);
        continue;
      }

      // Determinar tipo baseado em CPF/CNPJ
      if (client.cnpj && client.cnpj.length > 0) {
        client.type = 'pj';
      } else if (client.cpf && client.cpf.length > 0) {
        client.type = 'pf';
      } else {
        // Tentar inferir pelo nome
        client.type = client.name.includes('LTDA') || client.name.includes('EIRELI') || client.name.includes('ME') ? 'pj' : 'pf';
      }

      // Preencher campos obrigatórios vazios com valores padrão
      if (!client.email || client.email === '""') client.email = `cliente${Date.now()}@exemplo.com`;
      if (!client.phone) client.phone = '(00) 0000-0000';
      if (!client.mobile) client.mobile = '(00) 00000-0000';
      if (!client.street) client.street = 'Não informado';
      if (!client.neighborhood) client.neighborhood = 'Centro';
      if (!client.city) client.city = 'Não informado';
      if (!client.state) client.state = 'RS'; // Padrão RS baseado nos seus dados
      if (!client.zip_code) client.zip_code = '00000-000';

      // Adicionar o tipo de rua se o endereço não começar com tipo
      if (client.street && client.street !== 'Não informado') {
        const tiposRua = ['rua', 'avenida', 'av', 'travessa', 'alameda', 'praça'];
        const primeiroTermoLower = client.street.split(' ')[0].toLowerCase();
        if (!tiposRua.some(tipo => primeiroTermoLower.includes(tipo))) {
          // Detectar se é avenida pelo conteúdo
          if (client.street.toLowerCase().includes('presidente') || client.street.toLowerCase().includes('av.')) {
            client.street = 'Avenida ' + client.street.replace(/^av\.|^av /i, '');
            client.street_type = 'Avenida';
          } else {
            client.street_type = 'Rua';
          }
        }
      }

      clients.push(client);
    }

    console.log(`Importação concluída: ${clients.length} clientes importados, ${warnings.length} avisos`);

    if (warnings.length > 0) {
      console.warn('Avisos durante importação:', warnings);
    }

    if (clients.length === 0) {
      return { 
        success: false, 
        error: 'Nenhum cliente válido encontrado no arquivo. Verifique se o arquivo possui dados válidos.' 
      };
    }

    return { success: true, data: clients };
  } catch (error) {
    console.error('Erro ao importar CSV:', error);
    return { success: false, error: 'Erro ao processar arquivo CSV' };
  }
};
