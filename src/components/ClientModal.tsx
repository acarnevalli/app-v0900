import React, { useState } from 'react';
import { X, Save, User, Mail, Phone, Smartphone, CreditCard, Home, Building, Building2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatCPF, validateCPF } from '../lib/utils';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: {
    id?: string;
    name: string;
    type: 'pf' | 'pj';
    cpf?: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    razao_social?: string;
    inscricao_estadual?: string;
    isento_icms?: boolean;
    country?: string;
    state?: string;
    city?: string;
    zip_code?: string;
    neighborhood?: string;
    street_type?: string;
    street?: string;
    numero?: string;
    complemento?: string;
  } | null;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, client }) => {
  const { addClient, updateClient } = useApp();

  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    mobile: client?.mobile || '',
    cpf: client?.cpf ? formatCPF(client.cpf) : '',
    cnpj: client?.cnpj || '',
    type: client?.type || 'pf',
    razao_social: client?.razao_social || '',
    inscricao_estadual: client?.inscricao_estadual || '',
    isento_icms: client?.isento_icms || false,
    country: client?.country || 'Brasil',
    state: client?.state || '',
    city: client?.city || '',
    zip_code: client?.zip_code || '',
    neighborhood: client?.neighborhood || '',
    street_type: client?.street_type || 'rua',
    street: client?.street || '',
    numero: client?.numero || '',
    complemento: client?.complemento || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.type === 'pf' && formData.cpf) {
      const clean = formData.cpf.replace(/\D/g, '');
      if (clean.length > 0 && clean.length < 11) {
        newErrors.cpf = 'CPF incompleto';
      } else if (clean.length === 11 && !validateCPF(formData.cpf)) {
        newErrors.cpf = 'CPF inválido';
      }
    }

    if (formData.type === 'pj' && !formData.razao_social.trim()) {
      newErrors.razao_social = 'Razão Social é obrigatória para Pessoa Jurídica';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'cpf') {
      const formatted = formatCPF(value);
      setFormData((prev) => ({ ...prev, cpf: formatted }));
    } else if (name === 'type') {
      setFormData((prev) => ({
        ...prev,
        type: value as 'pf' | 'pj',
        cpf: value === 'pf' ? prev.cpf : '',
        cnpj: value === 'pj' ? prev.cnpj : '',
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
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
        cpf: formData.cpf.replace(/\D/g, '') || undefined,
        cnpj: formData.cnpj.replace(/\D/g, '') || undefined,
      };

      if (client?.id) {
        await updateClient(client.id, cleanData);
      } else {
        await addClient(cleanData);
      }
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar cliente:', err);
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-amber-100">
        <div className="flex justify-between items-center p-6 border-b border-amber-100">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              {formData.type === 'pf' ? (
                <User className="h-6 w-6 text-amber-700" />
              ) : (
                <Building2 className="h-6 w-6 text-amber-700" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {client ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <p className="text-sm text-gray-500">
                {formData.type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Tipo de Cliente */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="pf"
                    checked={formData.type === 'pf'}
                    onChange={handleChange}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Pessoa Física</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="pj"
                    checked={formData.type === 'pj'}
                    onChange={handleChange}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Pessoa Jurídica</span>
                </label>
              </div>
            </div>
          </div>

          {/* Nome / Razão Social */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.type === 'pf' ? 'Nome Completo' : 'Razão Social'} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={formData.type === 'pf' ? 'João Silva' : 'Marcenaria Pro LTDA'}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* CPF / CNPJ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.type === 'pf' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      errors.cpf ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                {errors.cpf && <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="00.000.000/0000-00"
                />
              </div>
            )}
          </div>

          {/* Dados de Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="cliente@exemplo.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Fixo</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {formData.type === 'pj' && (
               <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
              <input
                type="text"
                name="inscricao_estadual"
                value={formData.inscricao_estadual}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="ISENTO ou número"
              />
            </div>

                {formData.type === 'pj' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isento_icms"
                checked={formData.isento_icms}
                onChange={handleChange}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <label className="text-sm text-gray-700">Isento de ICMS</label>
            </div>
          )}
        </div>

        {/* Endereço */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Home className="h-5 w-5 text-amber-600 mr-2" />
            Endereço
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Nome da rua/avenida"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="00000-000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Bairro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Cidade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
            <input
              type="text"
              name="complemento"
              value={formData.complemento}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Apto, bloco, etc."
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-100 px-6 pb-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center space-x-2 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Salvando...' : 'Salvar Cliente'}</span>
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-70 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
export default ClientModal;
