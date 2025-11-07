import React, { useState } from 'react';
import { X, Building, MapPin, FileText, CreditCard, RotateCcw, Phone, Mail, Globe, Hash, Shield, Banknote } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({ isOpen, onClose }) => {
  const { companySettings, updateCompanySettings, resetCompanySettings } = useSettings();
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'fiscal' | 'banking'>('basic');

   if (!isOpen) return null;

  const handleBasicChange = (field: string, value: string) => {
    updateCompanySettings({
      basic: {
        ...companySettings.basic,
        [field]: value
      }
    });
  };

  const handleAddressChange = (field: string, value: string) => {
    updateCompanySettings({
      address: {
        ...companySettings.address,
        [field]: value
      }
    });
  };

  const handleFiscalChange = (field: string, value: any) => {
    updateCompanySettings({
      fiscal: {
        ...companySettings.fiscal,
        [field]: value
      }
    });
  };

  const handleBankingChange = (field: string, value: string) => {
    updateCompanySettings({
      banking: {
        ...companySettings.banking,
        [field]: value
      }
    });
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja restaurar as configurações padrão da empresa?')) {
      resetCompanySettings();
    }
  };

  const formatCNPJ = (value: string) => {
    if (!value) return '';
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    if (!value) return '';
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatZipCode = (value: string) => {
    if (!value) return '';
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const tabs = [
    { id: 'basic', label: 'Dados Básicos', icon: Building },
    { id: 'address', label: 'Endereço', icon: MapPin },
    { id: 'fiscal', label: 'Informações Fiscais', icon: FileText },
    { id: 'banking', label: 'Dados Bancários', icon: CreditCard }
  ];

  const taxRegimeOptions = [
    { value: 'simplesnacional', label: 'Simples Nacional' },
    { value: 'lucropresumido', label: 'Lucro Presumido' },
    { value: 'lucroreal', label: 'Lucro Real' },
    { value: 'mei', label: 'MEI - Microempreendedor Individual' }
  ];

  const crtOptions = [
    { value: '1', label: '1 - Simples Nacional' },
    { value: '2', label: '2 - Simples Nacional - Excesso' },
    { value: '3', label: '3 - Regime Normal' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center">
            <Building className="h-6 w-6 mr-2" />
            Configurações da Empresa
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Restaurar padrões"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar com abas */}
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            <div className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Conteúdo das abas */}
          <div className="flex-1 p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Dados Básicos da Empresa</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="h-4 w-4 inline mr-2 text-indigo-600" />
                      Razão Social
                    </label>
                    <input
                      type="text"
                      value={companySettings.basic.name}
                      onChange={(e) => handleBasicChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Nome completo da empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={companySettings.basic.tradeName}
                      onChange={(e) => handleBasicChange('tradeName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Nome comercial"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-2 text-indigo-600" />
                      Email Principal
                    </label>
                    <input
                      type="email"
                      value={companySettings.basic.email}
                      onChange={(e) => handleBasicChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="contato@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="h-4 w-4 inline mr-2 text-indigo-600" />
                      Website
                    </label>
                    <input
                      type="url"
                      value={companySettings.basic.website}
                      onChange={(e) => handleBasicChange('website', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="www.empresa.com.br"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-2 text-indigo-600" />
                      Telefone Fixo
                    </label>
                    <input
                      type="tel"
                      value={companySettings.basic.phone}
                      onChange={(e) => handleBasicChange('phone', formatPhone(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="(11) 3333-3333"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Celular/WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={companySettings.basic.mobile}
                      onChange={(e) => handleBasicChange('mobile', formatPhone(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'address' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Endereço da Empresa</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={companySettings.address.zipCode}
                      onChange={(e) => handleAddressChange('zipCode', formatZipCode(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="00000-000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={companySettings.address.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="SP"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={companySettings.address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="São Paulo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logradouro
                    </label>
                    <input
                      type="text"
                      value={companySettings.address.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Rua das Flores"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={companySettings.address.neighborhood}
                      onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Centro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={companySettings.address.number}
                      onChange={(e) => handleAddressChange('number', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={companySettings.address.complement}
                      onChange={(e) => handleAddressChange('complement', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Sala 101"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País
                    </label>
                    <input
                      type="text"
                      value={companySettings.address.country}
                      onChange={(e) => handleAddressChange('country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Brasil"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fiscal' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Informações Fiscais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Hash className="h-4 w-4 inline mr-2 text-indigo-600" />
                      CNPJ
                    </label>
                    <input
                      type="text"
                      value={companySettings.fiscal.cnpj}
                      onChange={(e) => handleFiscalChange('cnpj', formatCNPJ(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inscrição Estadual
                    </label>
                    <input
                      type="text"
                      value={companySettings.fiscal.ie}
                      onChange={(e) => handleFiscalChange('ie', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inscrição Municipal
                    </label>
                    <input
                      type="text"
                      value={companySettings.fiscal.im}
                      onChange={(e) => handleFiscalChange('im', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNAE Principal
                    </label>
                    <input
                      type="text"
                      value={companySettings.fiscal.cnae}
                      onChange={(e) => handleFiscalChange('cnae', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="1622-9/00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Shield className="h-4 w-4 inline mr-2 text-indigo-600" />
                      Regime Tributário
                    </label>
                    <select
                      value={companySettings.fiscal.taxRegime}
                      onChange={(e) => handleFiscalChange('taxRegime', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {taxRegimeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CRT (Código de Regime Tributário)
                    </label>
                    <select
                      value={companySettings.fiscal.crt}
                      onChange={(e) => handleFiscalChange('crt', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {crtOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-4">Contribuições</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={companySettings.fiscal.icmsContributor}
                        onChange={(e) => handleFiscalChange('icmsContributor', e.target.checked)}
                        className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">ICMS</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={companySettings.fiscal.issContributor}
                        onChange={(e) => handleFiscalChange('issContributor', e.target.checked)}
                        className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">ISS</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={companySettings.fiscal.pisContributor}
                        onChange={(e) => handleFiscalChange('pisContributor', e.target.checked)}
                        className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">PIS</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={companySettings.fiscal.cofinsContributor}
                        onChange={(e) => handleFiscalChange('cofinsContributor', e.target.checked)}
                        className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">COFINS</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'banking' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Dados Bancários</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Banknote className="h-4 w-4 inline mr-2 text-indigo-600" />
                      Banco
                    </label>
                    <input
                      type="text"
                      value={companySettings.banking.bank}
                      onChange={(e) => handleBankingChange('bank', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Nome do banco"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agência
                    </label>
                    <input
                      type="text"
                      value={companySettings.banking.agency}
                      onChange={(e) => handleBankingChange('agency', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conta
                    </label>
                    <input
                      type="text"
                      value={companySettings.banking.account}
                      onChange={(e) => handleBankingChange('account', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="00000-0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Conta
                    </label>
                    <select
                      value={companySettings.banking.accountType}
                      onChange={(e) => handleBankingChange('accountType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="corrente">Conta Corrente</option>
                      <option value="poupanca">Conta Poupança</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={companySettings.banking.pix}
                    onChange={(e) => handleBankingChange('pix', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="CPF, CNPJ, email ou telefone"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pode ser CPF, CNPJ, email, telefone ou chave aleatória
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">💡 Dica</h4>
                  <p className="text-sm text-blue-700">
                    Essas informações podem ser utilizadas em documentos fiscais e propostas comerciais. 
                    Mantenha sempre atualizadas para garantir a credibilidade da empresa.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanySettingsModal;
