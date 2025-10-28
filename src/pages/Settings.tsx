import React, { useState } from 'react';
import { LogOut, FileText, Package, Building, User, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PDFSettingsModal from '../components/PDFSettingsModal';
import CompanySettingsModal from '../components/CompanySettingsModal';
import ImportExportModal from '../components/ImportExportModal';
import ProductSettingsModal from '../components/ProductSettingsModal';
import { defaultCostCenters } from '../utils/defaultCostCenters';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [isProductSettingsModalOpen, setIsProductSettingsModalOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair do sistema?')) {
      logout();
    }
  };

  const handleCreateDefaultCostCenters = async () => {
  try {
    for (const cc of defaultCostCenters) {
      await addCostCenter(cc);
    }
    alert('Centros de custo padrão criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar centros de custo:', error);
    alert('Erro ao criar centros de custo');
  }
};

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do sistema</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-amber-600" />
          Perfil do Usuário
        </h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{user?.email}</p>
            </div>
          </div>
          <div className="pt-4">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >

            <button
              onClick={handleCreateDefaultCostCenters}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Criar Centros de Custo Padrão
              </button>
              
              <LogOut className="h-4 w-4" />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => setIsCompanyModalOpen(true)}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="bg-amber-100 p-3 rounded-lg group-hover:bg-amber-200 transition-colors">
              <Building className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Dados da Empresa</h3>
          <p className="text-gray-600 text-sm">Configure as informações da sua marcenaria</p>
        </div>

        <div
          onClick={() => setIsPDFModalOpen(true)}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Configurações de PDF</h3>
          <p className="text-gray-600 text-sm">Personalize seus documentos e orçamentos</p>
        </div>

        <div
          onClick={() => setIsProductSettingsModalOpen(true)}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Configurações de Produtos</h3>
          <p className="text-gray-600 text-sm">Gerencie categorias e unidades de medida</p>
        </div>

        <div
          onClick={() => setIsImportExportModalOpen(true)}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Importar/Exportar</h3>
          <p className="text-gray-600 text-sm">Faça backup e restaure seus dados</p>
        </div>
      </div>

      {isPDFModalOpen && (
        <PDFSettingsModal
          isOpen={isPDFModalOpen}
          onClose={() => setIsPDFModalOpen(false)}
        />
      )}

      {isCompanyModalOpen && (
        <CompanySettingsModal
          isOpen={isCompanyModalOpen}
          onClose={() => setIsCompanyModalOpen(false)}
        />
      )}

      {isImportExportModalOpen && (
        <ImportExportModal
          isOpen={isImportExportModalOpen}
          onClose={() => setIsImportExportModalOpen(false)}
        />
      )}

      {isProductSettingsModalOpen && (
        <ProductSettingsModal
          isOpen={isProductSettingsModalOpen}
          onClose={() => setIsProductSettingsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Settings;
