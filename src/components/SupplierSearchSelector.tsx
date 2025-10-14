import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Supplier } from '../contexts/AppContext';
import SupplierModal from './SupplierModal';

interface SupplierSearchSelectorProps {
  suppliers: Supplier[];
  selectedId: string | null;
  onSupplierSelect: (id: string | null, supplierName?: string) => void;
}

const SupplierSearchSelector: React.FC<SupplierSearchSelectorProps> = ({
  suppliers,
  selectedId,
  onSupplierSelect,
}) => {
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtered, setFiltered] = useState<Supplier[]>(suppliers);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setFiltered(suppliers);
      return;
    }
    const filteredSuppliers = suppliers.filter(s =>
      s.name.toLowerCase().includes(value.toLowerCase()) ||
      (s.cnpj && s.cnpj.includes(value.replace(/\D/g, '')))
    );
    setFiltered(filteredSuppliers);
  };

  const handleSupplierCreated = (newSupplier: Supplier) => {
    onSupplierSelect(newSupplier.id, newSupplier.name);
    setIsModalOpen(false);
    setQuery(newSupplier.name); // Preenche o input com o nome
  };

  const selectedSupplier = suppliers.find(s => s.id === selectedId);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Fornecedor
      </label>
      {!selectedSupplier ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Buscar fornecedor..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {query && (
            <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-md">
              {filtered.length > 0 ? (
                filtered.map((supp) => (
                  <div
                    key={supp.id}
                    className="px-4 py-2 hover:bg-amber-50 cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      onSupplierSelect(supp.id, supp.name);
                      setQuery(supp.name);
                    }}
                  >
                    <div>
                      <div className="font-medium text-gray-800">{supp.name}</div>
                      {supp.cnpj && (
                        <div className="text-sm text-gray-500">
                          {supp.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">Nenhum fornecedor encontrado</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <span className="font-medium text-green-800">{selectedSupplier.name}</span>
          <button
            type="button"
            onClick={() => {
              onSupplierSelect(null);
              setQuery('');
            }}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplier={null}
        onSuccess={handleSupplierCreated}
      />
    </div>
  );
};

export default SupplierSearchSelector;
