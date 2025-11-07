import React, { useState } from 'react';
import { Check, ChevronsUpDown, AlertTriangle, Package } from 'lucide-react';
import { Product } from '../contexts/AppContext';

interface ProductComboboxProps {
  products: Product[];
  selectedProductId?: string;
  onSelect: (product: Product) => void;
  excludeProductIds?: string[];
  placeholder?: string;
}

const ProductCombobox: React.FC<ProductComboboxProps> = ({
  products,
  selectedProductId,
  onSelect,
  excludeProductIds = [],
  placeholder = 'Selecione um produto...'
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const availableProducts = products.filter(
    p => !excludeProductIds.includes(p.id)
  );

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const getTypeColor = (type: string) => {
    const colors = {
      material_bruto: 'bg-blue-100 text-blue-800',
      parte_produto: 'bg-yellow-100 text-yellow-800',
      produto_pronto: 'bg-green-100 text-green-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeText = (type: string) => {
    const texts = {
      material_bruto: 'Material Bruto',
      parte_produto: 'Parte de Produto',
      produto_pronto: 'Produto Pronto'
    };
    return texts[type as keyof typeof texts] || type;
  };

  const isLowStock = (product: Product) => {
    return product.current_stock <= product.min_stock;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
      >
        <span className={selectedProduct ? 'text-gray-900' : 'text-gray-500'}>
          {selectedProduct ? selectedProduct.name : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-gray-400" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Nenhum produto encontrado</p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const lowStock = isLowStock(product);
                  const isSelected = product.id === selectedProductId;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        onSelect(product);
                        setOpen(false);
                        setSearchTerm('');
                      }}
                      className={`w-full flex items-start gap-3 px-3 py-2 hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-amber-50' : ''
                      } ${lowStock ? 'bg-red-50' : ''}`}
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {product.name}
                          </span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-amber-600" />
                          )}
                          {lowStock && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(product.type)}`}>
                            {getTypeText(product.type)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {product.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            • {product.unit}
                          </span>
                          <span className={`text-xs font-medium ${lowStock ? 'text-red-600' : 'text-green-600'}`}>
                            Estoque: {product.current_stock}
                          </span>
                          <span className="text-xs text-gray-600">
                            R$ {product.cost_price.toFixed(2)}
                          </span>
                        </div>
                        {product.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductCombobox;
