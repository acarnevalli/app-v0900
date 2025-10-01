import React, { useState } from 'react';
import { X, FileText, Palette, Image, RotateCcw, Zap } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface PDFSettingsModalProps {
  onClose: () => void;
}

const PDFSettingsModal: React.FC<PDFSettingsModalProps> = ({ onClose }) => {
  const { pdfSettings, updatePDFSettings, resetPDFSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<'watermark' | 'header'>('watermark');

  const handleWatermarkChange = (field: keyof PDFSettings['watermark'], value: any) => {
    updatePDFSettings({
      watermark: {
        ...pdfSettings.watermark,
        [field]: value
      }
    });
  };

  const handleHeaderChange = (field: string, value: any) => {
    if (field.startsWith('companyName.')) {
      const subField = field.split('.')[1];
      updatePDFSettings({
        header: {
          ...pdfSettings.header,
          companyName: {
            ...pdfSettings.header.companyName,
            [subField]: value
          }
        }
      });
    } else if (field.startsWith('gradient.')) {
      const subField = field.split('.')[1];
      updatePDFSettings({
        header: {
          ...pdfSettings.header,
          gradient: {
            ...pdfSettings.header.gradient,
            [subField]: value
          }
        }
      });
    } else {
      updatePDFSettings({
        header: {
          ...pdfSettings.header,
          [field]: value
        }
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      resetPDFSettings();
    }
  };

  const tabs = [
    { id: 'watermark', label: 'Marca d\'água', icon: Image },
    { id: 'header', label: 'Cabeçalho', icon: Palette }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center">
            <FileText className="h-6 w-6 mr-2" />
            Configurações do PDF
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
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
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
            {activeTab === 'watermark' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Configurações da Marca d'água</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center space-x-2 mb-4">
                      <input
                        type="checkbox"
                        checked={pdfSettings.watermark.enabled}
                        onChange={(e) => handleWatermarkChange('enabled', e.target.checked)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-700">Habilitar marca d'água</span>
                    </label>
                  </div>
                </div>

                {pdfSettings.watermark.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opacidade: {Math.round(pdfSettings.watermark.opacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.01"
                          max="0.5"
                          step="0.01"
                          value={pdfSettings.watermark.opacity}
                          onChange={(e) => handleWatermarkChange('opacity', parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1%</span>
                          <span>50%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tamanho: {pdfSettings.watermark.size}px
                        </label>
                        <input
                          type="range"
                          min="40"
                          max="150"
                          step="5"
                          value={pdfSettings.watermark.size}
                          onChange={(e) => handleWatermarkChange('size', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>40px</span>
                          <span>150px</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Posição
                      </label>
                      <select
                        value={pdfSettings.watermark.position}
                        onChange={(e) => handleWatermarkChange('position', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="center">Centro</option>
                        <option value="top-left">Superior Esquerdo</option>
                        <option value="top-right">Superior Direito</option>
                        <option value="bottom-left">Inferior Esquerdo</option>
                        <option value="bottom-right">Inferior Direito</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'header' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Configurações do Cabeçalho</h3>
                
                {/* Configurações de Gradiente */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
                  <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Gradiente do Cabeçalho
                  </h4>
                  
                  <div className="space-y-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={pdfSettings.header.gradient.enabled}
                        onChange={(e) => handleHeaderChange('gradient.enabled', e.target.checked)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-medium text-purple-700">Usar gradiente no cabeçalho</span>
                    </label>
                    
                    {pdfSettings.header.gradient.enabled && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-purple-700 mb-2">
                              Cor Inicial
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={pdfSettings.header.gradient.startColor}
                                onChange={(e) => handleHeaderChange('gradient.startColor', e.target.value)}
                                className="w-12 h-10 border border-purple-300 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={pdfSettings.header.gradient.startColor}
                                onChange={(e) => handleHeaderChange('gradient.startColor', e.target.value)}
                                className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="#4682B4"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-purple-700 mb-2">
                              Cor Final
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={pdfSettings.header.gradient.endColor}
                                onChange={(e) => handleHeaderChange('gradient.endColor', e.target.value)}
                                className="w-12 h-10 border border-purple-300 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={pdfSettings.header.gradient.endColor}
                                onChange={(e) => handleHeaderChange('gradient.endColor', e.target.value)}
                                className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="#1E40AF"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-purple-700 mb-2">
                            Direção do Gradiente
                          </label>
                          <select
                            value={pdfSettings.header.gradient.direction}
                            onChange={(e) => handleHeaderChange('gradient.direction', e.target.value)}
                            className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="horizontal">Horizontal (esquerda → direita)</option>
                            <option value="vertical">Vertical (cima → baixo)</option>
                            <option value="diagonal-right">Diagonal (↘)</option>
                            <option value="diagonal-left">Diagonal (↙)</option>
                          </select>
                        </div>

                        {/* Preview do Gradiente */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-purple-700 mb-2">
                            Pré-visualização
                          </label>
                          <div 
                            className="w-full h-16 rounded-lg border border-purple-300"
                            style={{
                              background: pdfSettings.header.gradient.direction === 'horizontal' 
                                ? `linear-gradient(to right, ${pdfSettings.header.gradient.startColor}, ${pdfSettings.header.gradient.endColor})`
                                : pdfSettings.header.gradient.direction === 'vertical'
                                ? `linear-gradient(to bottom, ${pdfSettings.header.gradient.startColor}, ${pdfSettings.header.gradient.endColor})`
                                : pdfSettings.header.gradient.direction === 'diagonal-right'
                                ? `linear-gradient(to bottom right, ${pdfSettings.header.gradient.startColor}, ${pdfSettings.header.gradient.endColor})`
                                : `linear-gradient(to bottom left, ${pdfSettings.header.gradient.startColor}, ${pdfSettings.header.gradient.endColor})`
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamanho da Fonte: {pdfSettings.header.companyName.fontSize}pt
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      step="1"
                      value={pdfSettings.header.companyName.fontSize}
                      onChange={(e) => handleHeaderChange('companyName.fontSize', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>12pt</span>
                      <span>24pt</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peso da Fonte
                    </label>
                    <select
                      value={pdfSettings.header.companyName.fontWeight}
                      onChange={(e) => handleHeaderChange('companyName.fontWeight', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Negrito</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor do Texto
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={pdfSettings.header.companyName.color}
                        onChange={(e) => handleHeaderChange('companyName.color', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={pdfSettings.header.companyName.color}
                        onChange={(e) => handleHeaderChange('companyName.color', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>

                  {!pdfSettings.header.gradient.enabled && (
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor de Fundo
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={pdfSettings.header.backgroundColor}
                        onChange={(e) => handleHeaderChange('backgroundColor', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={pdfSettings.header.backgroundColor}
                        onChange={(e) => handleHeaderChange('backgroundColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#4682B4"
                      />
                    </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura do Cabeçalho: {pdfSettings.header.height}px
                  </label>
                  <input
                    type="range"
                    min="25"
                    max="50"
                    step="1"
                    value={pdfSettings.header.height}
                    onChange={(e) => handleHeaderChange('height', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>25px</span>
                    <span>50px</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFSettingsModal;