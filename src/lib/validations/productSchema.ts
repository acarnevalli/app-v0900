import * as yup from 'yup';

export const productSchema = yup.object({
  name: yup.string().required('Nome é obrigatório'),
  category: yup.string().required('Categoria é obrigatória'),
  cost_price: yup
    .number()
    .typeError('Preço de custo inválido')
    .min(0, 'Preço não pode ser negativo')
    .required('Preço de custo é obrigatório'),
  profit_margin: yup
    .number()
    .typeError('Margem inválida')
    .min(0, 'Margem mínima é 0%')
    .max(99, 'Margem máxima é 99%')
    .required('Margem é obrigatória'),
  unit: yup.string().required('Unidade é obrigatória'),
  min_stock: yup.number().integer().min(0).default(0),
  current_stock: yup.number().integer().min(0).default(0),
}).required();
