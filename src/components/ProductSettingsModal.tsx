import React, { useState } from 'react';
import { X, Package, Tag, Plus, Trash2, CreditCard as Edit2, Save, RotateCcw, Settings, AlertTriangle } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface ProductSettingsModalProps {
  onClose: () => void;
}

const ProductSettingsModal: React.FC<ProductSettingsModalProps> = ({ onClose }) => {
  const { productSettings, updateProductSettings, resetProductSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<'categories' | 'units' | 'alerts' | 'automation'>('categories');
  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ index: number; value: string } | null>(null);
  const [editingUnit, setEditingUnit] = useState<{ index: number; value: string } | null>(null);

  const handleAddCategory = () => {
    if (newCategory.trim() && !productSettings.categories.includes(newCategory.trim())) {
      updateProductSettings({
        categories: [...productSettings.categories, newCategory.trim()]
      });
      setNewCategory('');
    }
  };

  const handleAddUnit = () => {
    if (newUnit.trim() && !productSettings.units.includes(newUnit.trim())) {
      updateProductSettings({
        units: [...productSettings.units, newUnit.trim()]
      });
      setNewUnit('');
    }
  };

  const handleDeleteCategory = (index: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      const newCategories = productSettings.categories.filter((_, i) => i !== index);
      updateProductSettings({ categories: newCategories });
    }
  };

  const handleDeleteUnit = (index: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta unidade?')) {
      const newUnits = productSettings.units.filter((_, i) => i !== index);
      updateProductSettings({ units: newUnits });
    }
  };

  const handleEditCategory = (index: number, newValue: string) => {
    if (newValue.trim() && !productSettings.categories.includes(newValue.trim())) {
      const newCategories = [...productSettings.categories];
      newCategories[index] = newValue.trim();
      updateProductSettings({ categories: newCategories });
    }
    setEditingCategory(null);
  };

  const handleEditUnit = (index: number, newValue: string) => {
    if (newValue.trim() && !productSettings.units.includes(newValue.trim())) {
      const newUnits = [...productSettings.units];
      newUnits[index] = newValue.trim();
      updateProductSettings({ units: newUnits });
    }
    setEditingUnit(null);
  };

  const handleAlertSettingChange = (field: string, value: any) => {
    updateProductSettings({
      stockAlerts: {
        ...productSettings.stockAlerts,
        [field]: value
      }
    });
  };

  const handleAutomationSettingChange = (field: string, value: any) => {
    updateProductSettings({
      automation: {
        ...productSettings.automation,
        [field]: value
      }
    });
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja restaurar todas as configurações padrão?')) {
      resetProductSettings();
    }
  };

  const tabs = [
    { id: 'categories', label: 'Categorias', icon: Tag },
    { id: 'units', label: 'Unidades', icon: Package },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'automation', label: 'Automação', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center">
            <Package className="h-6 w-6 mr-2" />
            Configurações de Produtos e Estoque
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
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
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
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Gerenciar Categorias</h3>
                
                {/* Adicionar nova categoria */}
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h4 className="font-medium text-amber-800 mb-3">Adicionar Nova Categoria</h4>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nome da categoria"
                      className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCategory.trim()}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* Lista de categorias */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Categorias Existentes ({productSettings.categories.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {productSettings.categories.map((category, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                        {editingCategory?.index === index ? (
                          <div className="flex-1 flex space-x-2">
                            <input
                              type="text"
                              value={editingCategory.value}
                              onChange={(e) => setEditingCategory({ ...editingCategory, value: e.target.value })}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditCategory(index, editingCategory.value);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleEditCategory(index, editingCategory.value)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium text-gray-800">{category}</span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => setEditingCategory({ index, value: category })}
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(index)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'units' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Gerenciar Unidades de Medida</h3>
                
                {/* Adicionar nova unidade */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3">Adicionar Nova Unidade</h4>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="Sigla da unidade (ex: KG, M²)"
                      className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddUnit()}
                    />
                    <button
                      onClick={handleAddUnit}
                      disabled={!newUnit.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* Lista de unidades */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Unidades Existentes ({productSettings.units.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {productSettings.units.map((unit, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                        {editingUnit?.index === index ? (
                          <div className="flex-1 flex space-x-2">
                            <input
                              type="text"
                              value={editingUnit.value}
                              onChange={(e) => setEditingUnit({ ...editingUnit, value: e.target.value })}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditUnit(index, editingUnit.value);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleEditUnit(index, editingUnit.value)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingUnit(null)}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium text-gray-800">{unit}</span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => setEditingUnit({ index, value: unit })}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUnit(index)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Configurações de Alertas</h3>
                
                <div className="space-y-6">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-4">Alertas de Estoque Baixo</h4>
                    
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productSettings.stockAlerts.enabled}
                          onChange={(e) => handleAlertSettingChange('enabled', e.target.checked)}
                          className="mr-3 text-red-600 focus:ring-red-500"
                        />
                        <span className="font-medium text-red-700">Habilitar alertas de estoque baixo</span>
                      </label>

                      {productSettings.stockAlerts.enabled && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-red-700 mb-2">
                              Mostrar alerta quando estoque for menor ou igual a:
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="number"
                                value={productSettings.stockAlerts.threshold}
                                onChange={(e) => handleAlertSettingChange('threshold', parseInt(e.target.value) || 0)}
                                min="0"
                                className="w-20 px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              />
                              <span className="text-sm text-red-600">unidades do estoque mínimo</span>
                            </div>
                          </div>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={productSettings.stockAlerts.showInDashboard}
                              onChange={(e) => handleAlertSettingChange('showInDashboard', e.target.checked)}
                              className="mr-3 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-red-700">Mostrar alertas no dashboard</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={productSettings.stockAlerts.highlightLowStock}
                              onChange={(e) => handleAlertSettingChange('highlightLowStock', e.target.checked)}
                              className="mr-3 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-red-700">Destacar produtos com estoque baixo na lista</span>
                          </label>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-4">Alertas de Validade</h4>
                    
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productSettings.stockAlerts.expirationAlerts}
                          onChange={(e) => handleAlertSettingChange('expirationAlerts', e.target.checked)}
                          className="mr-3 text-yellow-600 focus:ring-yellow-500"
                        />
                        <span className="font-medium text-yellow-700">Habilitar alertas de validade (futuro)</span>
                      </label>
                      <p className="text-sm text-yellow-600">
                        Esta funcionalidade será implementada em versões futuras para produtos com data de validade.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'automation' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Configurações de Automação</h3>
                
                <div className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-4">Movimentação Automática de Estoque</h4>
                    
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productSettings.automation.autoStockMovement}
                          onChange={(e) => handleAutomationSettingChange('autoStockMovement', e.target.checked)}
                          className="mr-3 text-green-600 focus:ring-green-500"
                        />
                        <span className="font-medium text-green-700">Movimentar estoque automaticamente ao criar projetos</span>
                      </label>
                      <p className="text-sm text-green-600 ml-6">
                        Quando habilitado, o sistema automaticamente reduzirá o estoque dos materiais ao criar um projeto.
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-4">Cálculo Automático de Custos</h4>
                    
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productSettings.automation.autoCalculateCosts}
                          onChange={(e) => handleAutomationSettingChange('autoCalculateCosts', e.target.checked)}
                          className="mr-3 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-blue-700">Calcular custos automaticamente</span>
                      </label>
                      <p className="text-sm text-blue-600 ml-6">
                        Recalcula automaticamente o custo de produtos compostos quando o custo dos componentes é alterado.
                      </p>

                      <div className="ml-6">
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Margem de lucro padrão para novos produtos (%):
                        </label>
                        <input
                          type="number"
                          value={productSettings.automation.defaultProfitMargin}
                          onChange={(e) => handleAutomationSettingChange('defaultProfitMargin', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-24 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-4">Sugestões Inteligentes</h4>
                    
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productSettings.automation.suggestReorder}
                          onChange={(e) => handleAutomationSettingChange('suggestReorder', e.target.checked)}
                          className="mr-3 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="font-medium text-purple-700">Sugerir reposição de estoque</span>
                      </label>
                      <p className="text-sm text-purple-600 ml-6">
                        Sugere automaticamente quando é necessário repor o estoque baseado no histórico de consumo.
                      </p>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productSettings.automation.suggestAlternatives}
                          onChange={(e) => handleAutomationSettingChange('suggestAlternatives', e.target.checked)}
                          className="mr-3 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="font-medium text-purple-700">Sugerir produtos alternativos</span>
                      </label>
                      <p className="text-sm text-purple-600 ml-6">
                        Sugere produtos alternativos quando um item está em falta no estoque.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSettingsModal;