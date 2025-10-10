import React, { useState } from 'react';
import { X, Upload, Download, FileText } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { 
  importClientsCSV, 
  importProductsCSV, 
  importProjectsCSV, 
  importTransactionsCSV,
  exportClientsCSV,
  exportProductsCSV 
} from '../utils/importExport';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const { clients, products, addClient, addProduct, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setMessage(null);
    } else {
      setMessage({ type: 'error', text: 'Por favor, selecione um arquivo CSV válido.' });
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedType) {
      setMessage({ type: 'error', text: 'Selecione um arquivo e o tipo de dados.' });
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const csvText = e.target?.result as string;
        let result;
        
        switch (selectedType) {
          case 'clients':
            result = importClientsCSV(csvText);
            if (result.success && result.data) {
              for (const client of result.data) {
                await addClient(client);
              }
              setMessage({ type: 'success', text: `${result.data.length} clientes importados com sucesso!` });
            }
            break;
            
          case 'products':
            result = importProductsCSV(csvText);
            if (result.success && result.data) {
              for (const product of result.data) {
                await addProduct(product);
              }
              setMessage({ type: 'success', text: `${result.data.length} produtos importados com sucesso!` });
            }
            break;
            
          case 'projects':
            result = importProjectsCSV(csvText);
            break;
            
          case 'transactions':
            result = importTransactionsCSV(csvText);
            break;
        }
        
        if (result && !result.success) {
          setMessage({ type: 'error', text: result.error || 'Erro ao importar dados.' });
        }
        
        if (result?.success) {
          await refreshData();
          setTimeout(() => {
            onClose();
          }, 2000);
        }
        
        setImporting(false);
      };
      
      reader.readAsText(selectedFile);
    } catch (error) {
      console.error('Erro ao importar:', error);
      setMessage({ type: 'error', text: 'Erro ao processar arquivo.' });
      setImporting(false);
    }
  };

  const handleExport = (type: string) => {
    let csvContent = '';
    let fileName = '';
    
    switch (type) {
      case 'clients':
        csvContent = exportClientsCSV(clients);
        fileName = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'products':
        csvContent = exportProductsCSV(products);
        fileName = `produtos_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      default:
        setMessage({ type: 'error', text: 'Tipo de exportação não implementado.' });
        return;
    }
    
    // Criar blob e fazer download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    
    setMessage({ type: 'success', text: 'Arquivo exportado com sucesso!' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Importar / Exportar Dados</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex space-x-1 mt-4 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'import'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Importar
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'export'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Download className="h-4 w-4 inline mr-2" />
              Exportar
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {activeTab === 'import' ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Importar Dados</h3>
              <p className="text-gray-600 mb-6">
                Carregue dados de arquivos CSV. Certifique-se de que o formato está correto.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Dados
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Selecione o tipo de dados</option>
                    <option value="clients">Clientes</option>
                    <option value="products">Produtos</option>
                    <option value="projects">Projetos</option>
                    <option value="transactions">Transações</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arquivo CSV
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Arquivo selecionado: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2">Formato dos Arquivos CSV:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><strong>Clientes:</strong> nome, email, telefone, celular, cpf, cnpj, endereco, numero, bairro, cidade, estado, cep</li>
                  <li><strong>Produtos:</strong> nome, descricao, categoria, preco_custo, preco_venda, estoque, estoque_minimo, unidade</li>
                </ul>
              </div>

              <button
                onClick={handleImport}
                disabled={!selectedFile || !selectedType || importing}
                className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {importing ? 'Importando...' : 'Importar Dados'}
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-4">Exportar Dados</h3>
              <p className="text-gray-600 mb-6">
                Exporte seus dados em formato CSV para backup ou análise externa.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => handleExport('clients')}
                  className="border border-gray-200 rounded-lg p-4 hover:border-amber-500 cursor-pointer transition-colors"
                >
                  <FileText className="h-8 w-8 text-amber-600 mb-2" />
                  <h4 className="font-medium">Clientes</h4>
                  <p className="text-sm text-gray-600">Exportar lista de clientes</p>
                </div>

                <div
                  onClick={() => handleExport('products')}
                  className="border border-gray-200 rounded-lg p-4 hover:border-amber-500 cursor-pointer transition-colors"
                >
                  <FileText className="h-8 w-8 text-amber-600 mb-2" />
                  <h4 className="font-medium">Produtos</h4>
                  <p className="text-sm text-gray-600">Exportar catálogo de produtos</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;
