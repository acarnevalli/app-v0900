import React, { useState } from 'react';
import { X, Save, User, Mail, Phone, Smartphone, CreditCard, Home, Building, Building2, Search } from 'lucide-react';
import { useApp, Client } from '../contexts/AppContext';
import { formatCPF, validateCPF } from '../lib/utils';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
}

// ====== FUNÇÕES DE FORMATAÇÃO E VALIDAÇÃO ======

// Formatação de telefone com parênteses e traços
const formatPhone = (value: string): string => {
  const clean = value.replace(/\D/g, '');

  if (clean.length === 0) return '';
  if (clean.length <= 2) return `(${clean}`;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, clean.length - 4)}-${clean.slice(clean.length - 4)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
};

// Formatação de CEP
const formatZipCode = (value: string): string => {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
};

// Formatação de CNPJ
const formatCNPJ = (value: string): string => {
  const clean = value.replace(/\D/g, '');
  
  if (clean.length === 0) return '';
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
};

// Validação de CNPJ
const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/\D/g, '');
  
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != parseInt(digitos.charAt(0))) return false;
  
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != parseInt(digitos.charAt(1))) return false;
  
  return true;
};

// Interface para resposta da API de CEP
interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

// Função para buscar CEP
const fetchAddressByCEP = async (cep: string): Promise<ViaCEPResponse | null> => {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) return null;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, client }) => {
  const { addClient, updateClient } = useApp();

  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone ? formatPhone(client.phone) : '',
    mobile: client?.mobile ? formatPhone(client.mobile) : '',
    cpf: client?.cpf ? formatCPF(client.cpf) : '',
    cnpj: client?.cnpj ? formatCNPJ(client.cnpj) : '',
    type: client?.type || 'pf' as 'pf' | 'pj',
    razaosocial: client?.razaosocial || '',
    inscricaoestadual: client?.inscricaoestadual || '',
    isentoicms: client?.isentoicms || false,
    country: client?.country || 'Brasil',
    state: client?.state || '',
    city: client?.city || '',
    zipcode: client?.zipcode ? formatZipCode(client.zipcode) : '',
    neighborhood: client?.neighborhood || '',
    streettype: client?.streettype || 'Rua',
    street: client?.street || '',
    numero: client?.numero || '',
    complemento: client?.complemento || '',
    flativo: client?.flativo ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingCEP, setIsSearchingCEP] = useState(false);

  if (!isOpen) return null;
  // ====== VALIDAÇÃO ======
  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Validações básicas
    if (!formData.name.trim()) {
      newErrors.name = formData.type === 'pf' ? 'Nome é obrigatório' : 'Razão Social é obrigatória';
    }

    // Email obrigatório e válido
    //if (!formData.email.trim()) {
    //  newErrors.email = 'Email é obrigatório';
    //} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    //  newErrors.email = 'Email inválido';
    //}

    // Telefones obrigatórios
    //if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
    //if (!formData.mobile.trim()) newErrors.mobile = 'Celular é obrigatório';

    // Validações específicas por tipo
    if (formData.type === 'pf') {
      if (formData.cpf) {
        const cleanCPF = formData.cpf.replace(/\D/g, '');
        if (cleanCPF.length > 0 && cleanCPF.length < 11) {
          newErrors.cpf = 'CPF incompleto';
        } else if (cleanCPF.length === 11 && !validateCPF(formData.cpf)) {
          newErrors.cpf = 'CPF inválido';
        }
      }
    } else {
      // Validações para PJ
      if (!formData.cnpj.trim()) {
        newErrors.cnpj = 'CNPJ é obrigatório para Pessoa Jurídica';
      } else {
        const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
        if (cleanCNPJ.length < 14) {
          newErrors.cnpj = 'CNPJ incompleto';
        } else if (!validateCNPJ(formData.cnpj)) {
          newErrors.cnpj = 'CNPJ inválido';
        }
      }
      
      if (!formData.razaosocial.trim()) {
        newErrors.razaosocial = 'Razão Social é obrigatória para Pessoa Jurídica';
      }
    }

    // Validações de endereço
    if (!formData.zipcode.trim()) newErrors.zipcode = 'CEP é obrigatório';
    if (!formData.street.trim()) newErrors.street = 'Logradouro é obrigatório';
    if (!formData.numero.trim()) newErrors.numero = 'Número é obrigatório';
    if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
    if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório';
    if (!formData.country.trim()) newErrors.country = 'País é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ====== BUSCA CEP ======
  const handleCEPSearch = async () => {
    const cleanCep = formData.zipcode.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      setErrors(prev => ({ ...prev, zipcode: 'CEP deve ter 8 dígitos' }));
      return;
    }

    setIsSearchingCEP(true);
    setErrors(prev => {
      const { zipcode, ...rest } = prev;
      return rest;
    });

    try {
      const addressData = await fetchAddressByCEP(formData.zipcode);
      
      if (addressData && !addressData.erro) {
        setFormData(prev => ({
          ...prev,
          street: addressData.logradouro || prev.street,
          neighborhood: addressData.bairro || prev.neighborhood,
          city: addressData.localidade || prev.city,
          state: addressData.uf || prev.state,
          streettype: 'Rua', // Você pode melhorar isso extraindo do logradouro
        }));
        
        // Limpar erros dos campos preenchidos
        setErrors(prev => {
          const { street, neighborhood, city, state, ...rest } = prev;
          return rest;
        });
      } else {
        setErrors(prev => ({ ...prev, zipcode: 'CEP não encontrado' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, zipcode: 'Erro ao buscar CEP' }));
    } finally {
      setIsSearchingCEP(false);
    }
  };

  // ====== CHANGE HANDLER ======
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Formatações específicas
    if (name === 'cpf') {
      const formatted = formatCPF(value);
      setFormData(prev => ({ ...prev, cpf: formatted }));
    } else if (name === 'cnpj') {
      const formatted = formatCNPJ(value);
      setFormData(prev => ({ ...prev, cnpj: formatted }));
    } else if (name === 'phone' || name === 'mobile') {
      const formatted = formatPhone(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'zipcode') {
      const formatted = formatZipCode(value);
      setFormData(prev => ({ ...prev, zipcode: formatted }));
      
      // Buscar CEP automaticamente quando completo
      if (formatted.replace(/\D/g, '').length === 8) {
        setTimeout(() => handleCEPSearch(), 500);
      }
    } else if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value as 'pf' | 'pj',
        cpf: value === 'pf' ? prev.cpf : '',
        cnpj: value === 'pj' ? prev.cnpj : '',
        razaosocial: value === 'pf' ? '' : prev.razaosocial,
        inscricaoestadual: value === 'pf' ? '' : prev.inscricaoestadual,
        isentoicms: value === 'pf' ? false : prev.isentoicms,
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Limpar erro do campo alterado
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // ====== SUBMIT HANDLER ======
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const cleanData: any = {
        ...formData,
        cpf: formData.type === 'pf' ? (formData.cpf.replace(/\D/g, '') || undefined) : undefined,
        cnpj: formData.type === 'pj' ? (formData.cnpj.replace(/\D/g, '') || undefined) : undefined,
        phone: formData.phone.replace(/\D/g, ''),
        mobile: formData.mobile.replace(/\D/g, ''),
        zipcode: formData.zipcode.replace(/\D/g, ''),
        flativo: formData.flativo,
        // Limpar campos específicos de PJ se for PF
        razaosocial: formData.type === 'pj' ? formData.razaosocial : undefined,
        inscricaoestadual: formData.type === 'pj' ? formData.inscricaoestadual : undefined,
        isentoicms: formData.type === 'pj' ? formData.isentoicms : undefined,
      };

      if (client?.id) {
        await updateClient(client.id, cleanData);
      } else {
        await addClient(cleanData);
      }
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar cliente:', err);
      
      // Tratamento específico de erros
      if (err.code === '23505') {
        if (err.message?.includes('cpf')) {
          setErrors({ submit: 'Já existe um cliente cadastrado com este CPF' });
        } else if (err.message?.includes('cnpj')) {
          setErrors({ submit: 'Já existe um cliente cadastrado com este CNPJ' });
        } else if (err.message?.includes('email')) {
          setErrors({ submit: 'Este email já está cadastrado para outro cliente' });
        } else {
          setErrors({ submit: 'Já existe um cliente com estes dados' });
        }
      } else {
        setErrors({ submit: err.message || 'Erro ao salvar. Tente novamente.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  }; return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-amber-100">
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

          {/* CPF / CNPJ e Dados PJ */}
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
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
                  <input
                    type="text"
                    name="inscricaoestadual"
                    value={formData.inscricaoestadual}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="ISENTO ou número"
                  />
                </div>
              </>
            )}
          </div>

          {/* Nome Fantasia para PJ */}
          {formData.type === 'pj' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social *</label>
              <input
                type="text"
                name="razaosocial"
                value={formData.razaosocial}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.razaosocial ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Razão Social da empresa"
              />
              {errors.razaosocial && <p className="mt-1 text-sm text-red-600">{errors.razaosocial}</p>}
            </div>
          )}

          {/* Checkbox Isento ICMS para PJ */}
          {formData.type === 'pj' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isentoicms"
                checked={formData.isentoicms}
                onChange={handleChange}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <label className="text-sm text-gray-700">Isento de ICMS</label>
            </div>
          )}

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
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="(00) 0000-00000"
                  maxLength={15}
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
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
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.mobile ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              {errors.mobile && <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>}
            </div>
          </div>
           {/* Endereço */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <Home className="h-5 w-5 text-amber-600 mr-2" />
              Endereço
            </h3>

            {/* CEP com busca */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      errors.zipcode ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <button
                    type="button"
                    onClick={handleCEPSearch}
                    disabled={isSearchingCEP || formData.zipcode.replace(/\D/g, '').length !== 8}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-amber-600 hover:text-amber-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                    title="Buscar CEP"
                  >
                    {isSearchingCEP ? (
                      <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.zipcode && <p className="mt-1 text-sm text-red-600">{errors.zipcode}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro *</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.street ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nome da rua/avenida"
                />
                {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.numero ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="000"
                />
                {errors.numero && <p className="mt-1 text-sm text-red-600">{errors.numero}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.neighborhood ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Bairro"
                />
                {errors.neighborhood && <p className="mt-1 text-sm text-red-600">{errors.neighborhood}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Cidade"
                />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.state ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
                {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.country ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Brasil"
                />
                {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Logradouro</label>
              <select
                name="streettype"
                value={formData.streettype}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="Rua">Rua</option>
                <option value="Avenida">Avenida</option>
                <option value="Praça">Praça</option>
                <option value="Alameda">Alameda</option>
                <option value="Estrada">Estrada</option>
                <option value="Travessa">Travessa</option>
                <option value="Rodovia">Rodovia</option>
                <option value="Via">Via</option>
                <option value="Viela">Viela</option>
                <option value="Beco">Beco</option>
              </select>
            </div>
          </div>

          {/* Status Ativo */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="flativo"
              checked={formData.flativo}
              onChange={handleChange}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
            />
            <label className="text-sm text-gray-700">Cliente ativo</label>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-100">
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
  );
};

export default ClientModal;
