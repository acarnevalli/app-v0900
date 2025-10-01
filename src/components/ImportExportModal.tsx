import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, Users, Package, Briefcase, DollarSign } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface ImportExportModalProps {
  onClose: () => void;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ onClose }) => {
  const {
    exportClientsCSV,
    exportProductsCSV,
    exportProjectsCSV,
    exportTransactionsCSV,
    importClientsCSV,
    importProductsCSV,
    importProjectsCSV,
    importTransactionsCSV
  } = useApp();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isLoading, setIsLoading] = useState(false);
  
  const clientFileRef = useRef<HTMLInputElement>(null);
  const productFileRef = useRef<HTMLInputElement>(null);
  const projectFileRef = useRef<HTMLInputElement>(null);
  const transactionFileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (type: 'clients' | 'products' | 'projects' | 'transactions', file: File) => {
    setIsLoading(true);
    try {
      switch (type) {
        case 'clients':
          await importClientsCSV(file);
          break;
        case 'products':
          await importProductsCSV(file);
          break;
        case 'projects':
          await importProjectsCSV(file);
          break;
        case 'transactions':
          await importTransactionsCSV(file);
          break;
      }
      alert('Importação realizada com sucesso!');
    } catch (error) {
      alert('Erro na importação: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (type: 'clients' | 'products' | 'projects' | 'transactions') => {
    const fileInput = type === 'clients' ? clientFileRef.current :
                     type === 'products' ? productFileRef.current :
                     type === 'projects' ? projectFileRef.current :
                     transactionFileRef.current;
    
    if (fileInput?.files?.[0]) {
      handleImport(type, fileInput.files[0]);
    }
  };

  const exportOptions = [
    {
      id: 'clients',
      title: 'Clientes',
      description: 'Exportar lista completa de clientes',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: exportClientsCSV
    },
    {
      id: 'products',
      title: 'Produtos',
      description: 'Exportar catálogo de produtos',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: exportProductsCSV
    },
    {
      id: 'projects',
      title: 'Projetos',
      description: 'Exportar lista de projetos',
      icon: Briefcase,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      action: exportProjectsCSV
    },
    {
      id: 'transactions',
      title: 'Transações',
      description: 'Exportar histórico financeiro',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: exportTransactionsCSV
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center">
            <FileText className="h-6 w-6 mr-2" />
            Importar / Exportar Dados
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Download className="h-5 w-5 inline mr-2" />
            Exportar
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="h-5 w-5 inline mr-2" />
            Importar
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Exportar Dados</h3>
                <p className="text-gray-600 mb-6">
                  Baixe seus dados em formato CSV para backup ou análise externa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={option.action}
                      className={`${option.bgColor} border border-gray-200 rounded-lg p-6 text-left hover:shadow-md transition-all duration-200 hover:scale-105`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full bg-white ${option.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{option.title}</h4>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Importar Dados</h3>
                <p className="text-gray-600 mb-6">
                  Carregue dados de arquivos CSV. Certifique-se de que o formato está correto.
                </p>
              </div>

              {isLoading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Processando importação...</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Clientes */}
                <div className="bg-blue-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 rounded-full bg-white text-blue-600">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Clientes</h4>
                      <p className="text-sm text-gray-600">Importar lista de clientes</p>
                    </div>
                  </div>
                  <input
                    ref={clientFileRef}
                    type="file"
                    accept=".csv"
                    onChange={() => handleFileSelect('clients')}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isLoading}
                  />
                </div>

                {/* Produtos */}
                <div className="bg-green-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 rounded-full bg-white text-green-600">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Produtos</h4>
                      <p className="text-sm text-gray-600">Importar catálogo de produtos</p>
                    </div>
                  </div>
                  <input
                    ref={productFileRef}
                    type="file"
                    accept=".csv"
                    onChange={() => handleFileSelect('products')}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    disabled={isLoading}
                  />
                </div>

                {/* Projetos */}
                <div className="bg-amber-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 rounded-full bg-white text-amber-600">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Projetos</h4>
                      <p className="text-sm text-gray-600">Importar lista de projetos</p>
                    </div>
                  </div>
                  <input
                    ref={projectFileRef}
                    type="file"
                    accept=".csv"
                    onChange={() => handleFileSelect('projects')}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    disabled={isLoading}
                  />
                </div>

                {/* Transações */}
                <div className="bg-purple-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 rounded-full bg-white text-purple-600">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Transações</h4>
                      <p className="text-sm text-gray-600">Importar histórico financeiro</p>
                    </div>
                  </div>
                  <input
                    ref={transactionFileRef}
                    type="file"
                    accept=".csv"
                    onChange={() => handleFileSelect('transactions')}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Formato dos Arquivos CSV</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• <strong>Clientes:</strong> tipo, nome, endereco, tipopessoa, fone_comercial, fone_celular, cep, cidade, email, cpf_cnpj, inscricao_estadual, bairro, complemento, numero, isento_icms, razao_social, id_empresa, fl_ativo</li>
                  <li>• <strong>Produtos:</strong> id, nome, descricao, categoria, unidade, componentes</li>
                  <li>• <strong>Projetos:</strong> numero, cliente, titulo, descricao, status, tipo, orcamento, data_inicio, data_fim, custo_materiais, custo_mao_obra, margem_lucro</li>
                  <li>• <strong>Transações:</strong> tipo, categoria, descricao, valor, data, projeto</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;