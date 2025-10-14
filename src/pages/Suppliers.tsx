import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, Building } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import SupplierModal from '../components/SupplierModal';

const Suppliers: React.FC = () => {
  const { suppliers = [], deleteSupplier } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      await deleteSupplier(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier?.phone?.includes(searchTerm) ||
    supplier?.cnpj?.includes(searchTerm)
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Fornecedores</h1>
          <p className="text-gray-600">Gerencie seus fornecedores de materiais</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por nome, email, telefone ou documento..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Nome</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Documento</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Contato</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Endereço</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    {searchTerm ? 'Nenhum fornecedor encontrado.' : 'Nenhum fornecedor cadastrado.'}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-800">{supplier.name || 'Nome não informado'}</div>
                      <div className="text-sm text-gray-500">{supplier.contact || 'Contato não informado'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        {supplier.cnpj ? (
                          <>
                            <span className="font-medium">CNPJ:</span> {supplier.cnpj}
                          </>
                        ) : (
                          'Não informado'
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {supplier.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {supplier.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-start text-sm text-gray-600">
                        <Building className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                        <span>{supplier.address || 'Endereço não informado'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-gray-600 hover:text-amber-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <SupplierModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          supplier={selectedSupplier}
        />
      )}
    </div>
  );
};

export default Suppliers;
