import React, { useState } from 'react';
import { X, Upload, FileDown, Users, Package } from 'lucide-react';
import { importClientsCSV, importProductsCSV } from '../utils/importExport';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const [importType, setImportType] = useState<'clientes' | 'produtos'>('clientes');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<any[] | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStatus('Processando arquivo...');

    const text = await file.text();
    const imported =
      importType === 'clientes' ? importClientsCSV(text) : importProductsCSV(text);

    if (imported.success) {
      setResult(imported.data || []);
      setStatus(`Importação concluída! ${imported.data?.length} registros importados.`);
    } else {
      setStatus(imported.error || 'Erro ao importar arquivo.');
    }
  };

  const handleExport = () => {
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
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">Importar / Exportar Dados</h2>

        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setImportType('clientes')}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center space-x-2 border ${
              importType === 'clientes' ? 'bg-amber-100 border-amber-400' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Users className="h-5 w-5 text-amber-600" />
            <span>Clientes</span>
          </button>
          <button
            onClick={() => setImportType('produtos')}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center space-x-2 border ${
              importType === 'produtos' ? 'bg-green-100 border-green-400' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Package className="h-5 w-5 text-green-600" />
            <span>Produtos</span>
          </button>
        </div>

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
              {fileName || 'Clique para selecionar um arquivo CSV'}
            </span>
          </label>
        </div>

        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center space-x-2 rounded-lg bg-purple-600 text-white py-2 hover:bg-purple-700 transition"
        >
          <FileDown className="h-5 w-5" />
          <span>Baixar Modelo CSV ({importType})</span>
        </button>

        {status && <p className="mt-4 text-sm text-gray-600 text-center">{status}</p>}

        {result && result.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto border-t pt-2 text-xs text-gray-700">
            <p className="font-semibold mb-1">Pré-visualização:</p>
            <pre>{JSON.stringify(result.slice(0, 3), null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportExportModal;
