import React, { useState } from 'react';
import { X, Save, User, Mail, Phone, Building } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatCNPJ, validateCNPJ } from '../lib/utils';

// --- Atualização: Adicionando a prop onSuccess ---
interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: {
    id?: string;
    name: string;
    cnpj?: string;
    contact?: string;
    email?: string;
    phone?: string;
    address?: string;
  } | null;
  // Nova prop: chamada após salvar com sucesso (útil no cadastro de produtos)
  onSuccess?: (supplier: Supplier) => void;
}

// Adicionando a interface Supplier aqui ou você pode importá-la do AppContext
export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ 
  isOpen, 
  onClose, 
  supplier, 
  onSuccess 
}) => {
  const { addSupplier } = useApp();
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    cnpj: supplier?.cnpj ? formatCNPJ(supplier.cnpj) : '',
    contact: supplier?.contact || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.cnpj) {
      const clean = formData.cnpj.replace(/\D/g, '');
      if (clean.length > 0 && clean.length < 14) {
        newErrors.cnpj = 'CNPJ incompleto';
      } else if (clean.length === 14 && !validateCNPJ(formData.cnpj)) {
        newErrors.cnpj = 'CNPJ inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'cnpj') {
      const formatted = formatCNPJ(value);
      setFormData((prev) => ({ ...prev, cnpj: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const cleanData = {
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, '') || undefined,
      };

      // Se for edição, chame updateSupplier (não implementado aqui, mas pode ser)
      if (supplier?.id) {
        await updateSupplier(supplier.id, cleanData); // Se já tiver updateSupplier disponível
        onClose();
      } else {
        // Adiciona o fornecedor
        const { data, error } = await supabase
          .from('suppliers')
          .insert([{
            ...cleanData,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) throw error;

        // ✅ Chama onSuccess com o novo fornecedor
        if (onSuccess) {
          onSuccess(data as Supplier);
        }

        onClose();
      }
    } catch (err: any) {
      console.error('Erro ao salvar fornecedor:', err);
      setErrors({ submit: err.message || 'Erro ao salvar. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-amber-100">
        <div className="flex justify-between items-center p-6 border-b border-amber-100">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Building className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              <p className="text-sm text-gray-500">
                {supplier ? 'Atualize as informações do fornecedor' : 'Cadastre um novo fornecedor'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Digite o nome do fornecedor"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input
              type="text"
              name="cnpj"
              value={formData.cnpj}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                errors.cnpj ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
            {errors.cnpj && <p className="mt-1 text-sm text-red-600">{errors.cnpj}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contato (Responsável)</label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Nome do responsável"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="fornecedor@exemplo.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              placeholder="Endereço completo do fornecedor"
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center space-x-2 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Fornecedor'}</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-70 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Função auxiliar updateSupplier (opcional, se quiser reaproveitar aqui)
const updateSupplier = async (id: string, data: any) => {
  const { error } = await supabase
    .from('suppliers')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

// Função supabase (não precisa redeclarar se já estiver no projeto)
const supabase = (window as any).supabase; // Apenas para compatibilidade — normalmente vem do ../lib/supabase

export default SupplierModal;
