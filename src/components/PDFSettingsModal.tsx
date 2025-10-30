// app-v0900/src/components/PDFSettingsModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Type, Palette } from 'lucide-react';

export interface PDFSettings {
  // Informações da Empresa
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo: string; // URL ou base64
  
  // Cores e Estilo
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  
  // Configurações do Documento
  showLogo: boolean;
  showHeader: boolean;
  showFooter: boolean;
  footerText: string;
  
  // Campos a exibir
  showClientDetails: boolean;
  showPaymentTerms: boolean;
  showProducts: boolean;
  showNotes: boolean;
  showSignature: boolean;
  
  // Textos Customizáveis
  documentTitle: string;
  thankYouMessage: string;
}

interface PDFSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: PDFSettings;
  onSave: (settings: PDFSettings) => void;
}

const defaultSettings: PDFSettings = {
  companyName: 'Sua Marcenaria',
  companyAddress: 'Rua Exemplo, 123 - Cidade/UF',
  companyPhone: '(00) 0000-0000',
  companyEmail: 'contato@suamarcenaria.com',
  companyLogo: '',
  primaryColor: '#8B4513',
  secondaryColor: '#D2691E',
  textColor: '#333333',
  showLogo: true,
  showHeader: true,
  showFooter: true,
  footerText: 'Obrigado pela preferência!',
  showClientDetails: true,
  showPaymentTerms: true,
  showProducts: true,
  showNotes: true,
  showSignature: true,
  documentTitle: 'Orçamento / Pedido',
  thankYouMessage: 'Agradecemos a sua confiança!'
};

const PDFSettingsModal: React.FC<PDFSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave
}) => {
  const [settings, setSettings] = useState<PDFSettings>(currentSettings || defaultSettings);

  useEffect(() => {
    setSettings(currentSettings || defaultSettings);
  }, [currentSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, companyLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-700 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Configurações do PDF</h2>
            <p className="text-amber-100 text-sm mt-1">Personalize seus orçamentos e pedidos</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-amber-800 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-8 space-y-8">
          {/* Informações da Empresa */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <ImageIcon className="h-5 w-5 text-amber-600" />
              <span>Informações da Empresa</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={settings.companyAddress}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo da Empresa
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                {settings.companyLogo && (
                  <img src={settings.companyLogo} alt="Logo" className="mt-2 h-20 object-contain" />
                )}
              </div>
            </div>
          </div>

          {/* Cores e Estilo */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Palette className="h-5 w-5 text-amber-600" />
              <span>Cores e Estilo</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor Primária
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor Secundária
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor do Texto
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={settings.textColor}
                    onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.textColor}
                    onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Textos Customizáveis */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Type className="h-5 w-5 text-amber-600" />
              <span>Textos Customizáveis</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Documento
                </label>
                <input
                  type="text"
                  value={settings.documentTitle}
                  onChange={(e) => setSettings({ ...settings, documentTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem de Agradecimento
                </label>
                <input
                  type="text"
                  value={settings.thankYouMessage}
                  onChange={(e) => setSettings({ ...settings, thankYouMessage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto do Rodapé
                </label>
                <input
                  type="text"
                  value={settings.footerText}
                  onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Campos a Exibir */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Campos a Exibir no PDF</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'showLogo', label: 'Exibir Logo' },
                { key: 'showHeader', label: 'Exibir Cabeçalho' },
                { key: 'showFooter', label: 'Exibir Rodapé' },
                { key: 'showClientDetails', label: 'Detalhes do Cliente' },
                { key: 'showPaymentTerms', label: 'Condições de Pagamento' },
                { key: 'showProducts', label: 'Lista de Produtos/Serviços' },
                { key: 'showNotes', label: 'Observações' },
                { key: 'showSignature', label: 'Área de Assinatura' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={settings[key as keyof PDFSettings] as boolean}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                    className="w-5 h-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-100 px-8 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-colors font-medium flex items-center space-x-2"
          >
            <Save className="h-5 w-5" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFSettingsModal;
export { defaultSettings };
