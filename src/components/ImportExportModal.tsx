import React, { useState } from 'react';
import {
  X,
  Upload,
  FileDown,
  Users,
  Package,
  Send,
  RefreshCw,
} from 'lucide-react';
import { importClientsCSV, importProductsCSV } from '../utils/importExport';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal que permite importar e exportar clientes ou produtos do sistema.
 * Usa diretamente o Supabase sem API intermediária.
 */
const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [importType, setImportType] = useState<'clientes' | 'produtos'>('clientes');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<any[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  /** Processa o arquivo CSV selecionado */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('📄 Lendo arquivo...');
    setResult(null);

    try {
      const text = await file.text();
      const imported =
        importType === 'clientes' ? importClientsCSV(text) : importProductsCSV(text);

      if (imported.success) {
        setResult(imported.data || []);
        setStatus(`✅ Importação concluída (${imported.data?.length} registros detectados).`);
      } else {
        setStatus(`❌ Erro: ${imported.error}`);
      }
    } catch (err) {
      console.error(err);
      setStatus('❌ Erro ao processar o arquivo CSV.');
    }
  };

  /** Envia os dados importados diretamente ao Supabase */
  const handleSendToAPI = async () => {
    if (!result || result.length === 0) {
      setStatus('⚠️ Nenhum dado válido para enviar.');
      return;
    }

    if (!user) {
      setStatus('❌ Você precisa estar autenticado para importar dados.');
      return;
    }

    setIsUploading(true);
    setStatus('🚀 Enviando dados para o banco...');

    try {
      if (importType === 'clientes') {
        // Adicionar userid a cada cliente
        const clientsWithUserId = result.map(client => ({
          ...client,
          userid: user.id,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
          // Campos obrigatórios com defaults
          mobile: client.mobile || client.phone || '(00) 00000-0000',
          country: client.country || 'Brasil',
          state: client.state || 'N/A',
          city: client.city || 'N/A',
          zipcode: client.zipcode || '00000-000',
          neighborhood: client.neighborhood || 'N/A',
          streettype: client.streettype || 'Rua',
          street: client.street || 'N/A',
        }));

        const { error } = await supabase
          .from('clients')
          .insert(clientsWithUserId);

        if (error) throw error;

        setStatus(`✅ ${result.length} clientes importados com sucesso! ✔️`);
      } else {
        // Produtos (sem userid)
        const productsFormatted = result.map(product => ({
          name: product.name,
          description: product.description || '',
          category: product.category || 'Geral',
          type: 'produtopronto' as const,
          unit: product.unit || 'UN',
          costprice: product.cost || product.costprice || 0,
          saleprice: product.price || product.saleprice || 0,
          currentstock: product.stock || product.currentstock || 0,
          minstock: product.minstock || 0,
          supplier: product.supplier || '',
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('products')
          .insert(productsFormatted);

        if (error) throw error;

        setStatus(`✅ ${result.length} produtos importados com sucesso! ✔️`);
      }

      // Limpar após sucesso
      setResult(null);
      setFileName('');
      
      // Recarregar página após 2 segundos para atualizar lista
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error('Erro ao importar:', err);
      setStatus(`❌ Falha ao enviar: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsUploading(false);
    }
  };

  /** Exporta dados reais do Supabase em CSV */
  const handleExportData = async () => {
    if (!user) {
      setStatus('❌ Você precisa estar autenticado para exportar dados.');
      return;
    }

    setIsExporting(true);
    setStatus('⬇️ Gerando arquivo de exportação...');

    try {
      if (importType === 'clientes') {
        // Buscar clientes do usuário
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('userid', user.id);

        if (error) throw error;

        if (!data || data.length === 0) {
          setStatus('⚠️ Nenhum cliente encontrado para exportar.');
          setIsExporting(false);
          return;
        }

        // Converter para CSV
        const headers = [
          'nome', 'email', 'telefone', 'cpf', 'cnpj', 
          'cidade', 'estado', 'cep', 'bairro', 'rua'
        ];
        const rows = data.map(c => [
          c.name,
          c.email,
          c.phone,
          c.cpf || '',
          c.cnpj || '',
          c.city,
          c.state,
          c.zipcode,
          c.neighborhood,
          c.street
        ]);

        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `clientes${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        setStatus(`✅ ${data.length} clientes exportados com sucesso!`);

      } else {
        // Buscar produtos
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
          setStatus('⚠️ Nenhum produto encontrado para exportar.');
          setIsExporting(false);
          return;
        }

        // Converter para CSV
        const headers = [
          'nome', 'codigo', 'categoria', 'tipo', 'unidade',
          'custo', 'precovenda', 'estoqueatual', 'estoqueminimo'
        ];
        const rows = data.map(p => [
          p.name,
          p.id,
          p.category,
          p.type,
          p.unit,
          p.costprice,
          p.saleprice || '',
          p.currentstock,
          p.minstock
        ]);

        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `produtos${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        setStatus(`✅ ${data.length} produtos exportados com sucesso!`);
      }

    } catch (err: any) {
      console.error('Erro ao exportar:', err);
      setStatus(`❌ Falha ao exportar: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsExporting(false);
    }
  };

  /** Gera um arquivo modelo */
  const handleExportTemplate = () => {
    const template =
      importType === 'clientes'
        ? 'nome,email,telefone,cpf,cnpj,cidade,estado,cep,bairro,rua\n' +
          'João Silva,joao@email.com,(11) 98888-8888,123.456.789-00,,São Paulo,SP,01234-567,Centro,Rua A\n' +
          'Empresa LTDA,empresa@email.com,(11) 3333-3333,,12.345.678/0001-90,São Paulo,SP,04567-890,Jardins,Av B\n'
        : 'nome,categoria,tipo,unidade,custo,precovenda,estoqueatual,estoqueminimo\n' +
          'Produto Exemplo,Geral,produtopronto,UN,10.00,25.00,100,10\n' +
          'Material Bruto,Materiais,materialbruto,KG,5.50,0,500,50\n';

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download =
      importType === 'clientes' ? 'modeloclientes.csv' : 'modeloprodutos.csv';
    link.click();

    setStatus('✅ Modelo baixado com sucesso!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Importar / Exportar Dados
        </h2>

        {/* Seleção entre Clientes ou Produtos */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => {
              setImportType('clientes');
              setStatus(null);
              setResult(null);
              setFileName('');
            }}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center space-x-2 border transition ${
              importType === 'clientes'
                ? 'bg-amber-100 border-amber-400'
                : 'bg-gray-50 border-gray-300'
            }`}
          >
            <Users className="h-5 w-5 text-amber-600" />
            <span>Clientes</span>
          </button>

          <button
            onClick={() => {
              setImportType('produtos');
              setStatus(null);
              setResult(null);
              setFileName('');
            }}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center space-x-2 border transition ${
              importType === 'produtos'
                ? 'bg-green-100 border-green-400'
                : 'bg-gray-50 border-gray-300'
            }`}
          >
            <Package className="h-5 w-5 text-green-600" />
            <span>Produtos</span>
          </button>
        </div>

        {/* Upload */}
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4 hover:border-amber-400 transition">
          <input
            type="file"
            accept=".csv,text/csv"
            id="fileInput"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
            <Upload className="h-8 w-8 text-purple-500 mb-2" />
            <span className="text-sm text-gray-600 text-center">
              {fileName || 'Clique para selecionar um arquivo CSV'}
            </span>
          </label>
        </div>

        {/* Botões principais */}
        <div className="flex flex-col space-y-2 mb-3">
          <div className="flex space-x-2">
            <button
              onClick={handleExportTemplate}
              className="w-1/2 flex items-center justify-center space-x-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 transition"
            >
              <FileDown className="h-5 w-5" />
              <span>Baixar Modelo</span>
            </button>

            <button
              disabled={!result || isUploading}
              onClick={handleSendToAPI}
              className={`w-1/2 flex items-center justify-center space-x-2 rounded-lg py-2 text-white transition ${
                !result || isUploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <Send className="h-5 w-5" />
              <span>{isUploading ? 'Enviando...' : 'Importar'}</span>
            </button>
          </div>

          <button
            onClick={handleExportData}
            disabled={isExporting}
            className={`w-full flex items-center justify-center space-x-2 rounded-lg py-2 text-white transition ${
              isExporting
                ? 'bg-blue-400 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <RefreshCw className={`h-5 w-5 ${isExporting ? 'animate-spin' : ''}`} />
            <span>{isExporting ? 'Exportando...' : 'Exportar Dados'}</span>
          </button>
        </div>

        {/* Status / Logs */}
        {status && (
          <div className={`mt-3 p-3 rounded-lg text-sm text-center ${
            status.includes('✅') ? 'bg-green-50 text-green-700' :
            status.includes('❌') ? 'bg-red-50 text-red-700' :
            status.includes('⚠️') ? 'bg-yellow-50 text-yellow-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {status}
          </div>
        )}

        {/* Pré-visualização */}
        {result && result.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50 text-xs text-gray-700">
            <p className="font-semibold mb-2 text-gray-800">
              📋 Pré-visualização (até 3 registros):
            </p>
            <pre className="whitespace-pre-wrap">{JSON.stringify(result.slice(0, 3), null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportExportModal;
