
import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import ClientModal from '../components/ClientModal';

const Clients: React.FC = () => {
  const { clients = [], deleteClient } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteClient(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const filteredClients = clients.filter(client =>
    client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client?.phone?.includes(searchTerm) ||
    client?.cpf?.includes(searchTerm) ||
    client?.cnpj?.includes(searchTerm)
  );

  // Função segura para formatar endereço
  const formatAddress = (client: any) => {
    if (!client) return 'Endereço não informado';
    
    const parts = [];
    
    if (client.street) {
      parts.push(client.street);
      if (client.numero) {
        parts.push(`, ${client.numero}`);
      }
    }
    
    if (client.neighborhood) {
      parts.push(` - ${client.neighborhood}`);
    }
    
    if (client.city && client.state) {
      parts.push(` - ${client.city}/${client.state}`);
    } else if (client.city) {
      parts.push(` - ${client.city}`);
    } else if (client.state) {
      parts.push(` - ${client.state}`);
    }
    
    if (client.zip_code) {
      parts.push(` - CEP: ${client.zip_code}`);
    }
    
    return parts.length > 0 ? parts.join('') : 'Endereço não informado';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Clientes</h1>
          <p className="text-gray-600">Gerencie sua base de clientes</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Cliente</span>
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
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    {searchTerm ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-800">{client.name || 'Nome não informado'}</div>
                      <div className="text-sm text-gray-500">{client.email || 'Email não informado'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        {client.type === 'pf' ? (
                          <>
                            <span className="font-medium">CPF:</span> {client.cpf || 'Não informado'}
                          </>
                        ) : (
                          <>
                            <span className="font-medium">CNPJ:</span> {client.cnpj || 'Não informado'}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {client.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {client.phone}
                          </div>
                        )}
                        {client.mobile && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {client.mobile}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                        <span>{formatAddress(client)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-gray-600 hover:text-amber-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
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
        <ClientModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          client={selectedClient}
        />
      )}
    </div>
  );
};

export default Clients;
