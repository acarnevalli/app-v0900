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

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal que permite importar e exportar clientes ou produtos do sistema.
 * Inclui envio via API, download de modelo e exportação real do banco.
 */
const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
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

  /** Envia os dados importados ao backend */
  const handleSendToAPI = async () => {
    if (!result || result.length === 0) {
      setStatus('⚠️ Nenhum dado válido para enviar.');
      return;
    }

    setIsUploading(true);
    setStatus('🚀 Enviando dados para o servidor...');

    try {
      const resp = await fetch(
        importType === 'clientes'
          ? '/api/import/clients'
          : '/api/import/products',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result),
        }
      );

      if (resp.ok) {
        const json = await resp.json().catch(() => ({}));
        setStatus(`✅ Dados enviados com sucesso ✔️ (${result.length} registros).`);
        console.log('Import API response:', json);
        setResult(null);
        setFileName('');
      } else {
        const txt = await resp.text();
        setStatus(`❌ Falha ao enviar: ${txt}`);
      }
    } catch (err) {
      console.error(err);
      setStatus('❌ Erro de conexão com o servidor.');
    } finally {
      setIsUploading(false);
    }
  };

  /** Exporta dados reais do backend em CSV */
  const handleExportData = async () => {
    setIsExporting(true);
    setStatus('⬇️ Gerando arquivo de exportação...');

    try {
      const resp = await fetch(
        importType === 'clientes'
          ? '/api/export/clients'
          : '/api/export/products'
      );
      if (!resp.ok) throw new Error('Erro ao gerar exportação');
      const csv = await resp.text();

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download =
        importType === 'clientes'
          ? 'export_clientes.csv'
          : 'export_produtos.csv';
      link.click();

      setStatus('✅ Exportação concluída.');
    } catch (err) {
      console.error(err);
      setStatus('❌ Falha ao exportar dados do servidor.');
    } finally {
      setIsExporting(false);
    }
  };

  /** Gera um arquivo modelo */
  const handleExportTemplate = () => {
    const template =
      importType === 'clientes'
        ? 'nome,email,telefone,cpf,cnpj,cidade,estado\n'
        : 'nome,codigo,preco,custo,categoria,quantidade\n';

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download =
      importType === 'clientes' ? 'modelo_clientes.csv' : 'modelo_produtos.csv';
    link.click();
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
            onClick={() => setImportType('clientes')}
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
            onClick={() => setImportType('produtos')}
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
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4">
          <input
            type="file"
            accept=".csv,text/csv"
            id="fileInput"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
            <Upload className="h-8 w-8 text-purple-500 mb-2" />
            <span className="text-sm text-gray-600">
              {fileName || 'Clique ou arraste um arquivo CSV para importar'}
            </span>
          </label>
        </div>

        {/* Botões principais */}
        <div className="flex flex-col space-y-2 mb-3">
          <div className="flex space-x-2">
            <button
              onClick={handleExportTemplate}
              className="w-1/2 flex items-center justify-center space-x-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 py-2"
            >
              <FileDown className="h-5 w-5" />
              <span>Modelo CSV</span>
            </button>

            <button
              disabled={!result || isUploading}
              onClick={handleSendToAPI}
              className={`w-1/2 flex items-center justify-center space-x-2 rounded-lg py-2 text-white transition ${
                !result
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <Send className="h-5 w-5" />
              <span>{isUploading ? 'Enviando...' : 'Enviar Dados'}</span>
            </button>
          </div>

          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-blue-600 text-white py-2 hover:bg-blue-700 transition"
          >
            <RefreshCw className="h-5 w-5" />
            <span>{isExporting ? 'Gerando exportação...' : 'Exportar dados do sistema'}</span>
          </button>
        </div>

        {/* Status / Logs */}
        {status && (
          <div className="mt-2 text-sm text-center text-gray-700 whitespace-pre-line">
            {status}
          </div>
        )}

        {/* Pré-visualização */}
        {result && result.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto border-t pt-2 text-xs text-gray-700">
            <p className="font-semibold mb-1">Pré-visualização (até 3 linhas):</p>
            <pre>{JSON.stringify(result.slice(0, 3), null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportExportModal;
