import { supabase } from './supabase';
import { Product, ProductComponent } from '../contexts/AppContext';

export const checkCircularReference = async (
  productId: string,
  componentId: string,
  visited: Set<string> = new Set()
): Promise<boolean> => {
  if (productId === componentId) return true;
  if (visited.has(componentId)) return false;

  visited.add(componentId);

  const { data: components } = await supabase
    .from('product_components')
    .select('component_id')
    .eq('product_id', componentId);

  if (!components || components.length === 0) return false;

  for (const comp of components) {
    if (await checkCircularReference(productId, comp.component_id, visited)) {
      return true;
    }
  }

  return false;
};

export const getProductComponents = async (productId: string): Promise<ProductComponent[]> => {
  const { data: components, error } = await supabase
    .from('product_components')
    .select(`
      id,
      quantity,
      component:component_id (
        id,
        name,
        unit,
        cost_price
      )
    `)
    .eq('product_id', productId);

  if (error) {
    console.error('Error fetching components:', error);
    return [];
  }

  return components.map((c: any) => ({
    product_id: c.component.id,
    product_name: c.component.name,
    quantity: c.quantity,
    unit: c.component.unit,
    unit_cost: c.component.cost_price,
    total_cost: c.quantity * c.component.cost_price
  }));
};

export const calculateProductCost = async (productId: string): Promise<number> => {
  const { data: product } = await supabase
    .from('products')
    .select('type, cost_price')
    .eq('id', productId)
    .single();

  if (!product) return 0;

  if (product.type === 'material_bruto') {
    return product.cost_price;
  }

  const components = await getProductComponents(productId);

  let totalCost = 0;
  for (const comp of components) {
    const componentCost = await calculateProductCost(comp.product_id);
    totalCost += componentCost * comp.quantity;
  }

  return totalCost;
};

export const updateProductCost = async (productId: string): Promise<void> => {
  const calculatedCost = await calculateProductCost(productId);

  await supabase
    .from('products')
    .update({ cost_price: calculatedCost })
    .eq('id', productId);
};

export const getProductsUsingComponent = async (componentId: string): Promise<Product[]> => {
  const { data: products, error } = await supabase
    .from('product_components')
    .select(`
      product:product_id (
        id,
        name,
        description,
        category,
        type,
        unit,
        cost_price,
        sale_price,
        current_stock,
        min_stock,
        supplier,
        created_at
      )
    `)
    .eq('component_id', componentId);

  if (error) {
    console.error('Error fetching products using component:', error);
    return [];
  }

  return products.map((p: any) => ({
    ...p.product,
    components: []
  }));
};

export const processStockMovement = async (
  productId: string,
  quantity: number,
  movementType: 'entrada' | 'saida',
  userId: string,
  projectId?: string,
  recursive: boolean = true
): Promise<void> => {
  const { data: product } = await supabase
    .from('products')
    .select('current_stock, cost_price')
    .eq('id', productId)
    .single();

  if (!product) return;

  const newStock = movementType === 'entrada'
    ? product.current_stock + quantity
    : Math.max(0, product.current_stock - quantity);

  await supabase
    .from('products')
    .update({ current_stock: newStock })
    .eq('id', productId);

  await supabase
    .from('stock_movements')
    .insert({
      product_id: productId,
      movement_type: movementType,
      quantity: quantity,
      unit_price: product.cost_price,
      total_value: quantity * product.cost_price,
      project_id: projectId || null,
      reference_type: projectId ? 'project' : 'manual',
      user_id: userId,
      date: new Date().toISOString().split('T')[0]
    });

  if (recursive && movementType === 'saida') {
    const components = await getProductComponents(productId);

    for (const comp of components) {
      await processStockMovement(
        comp.product_id,
        comp.quantity * quantity,
        'saida',
        userId,
        projectId,
        true
      );
    }
  }
};

export const checkStockAvailability = async (
  productId: string,
  requiredQuantity: number
): Promise<{ available: boolean; currentStock: number; required: number }> => {
  const { data: product } = await supabase
    .from('products')
    .select('current_stock, type')
    .eq('id', productId)
    .single();

  if (!product) {
    return { available: false, currentStock: 0, required: requiredQuantity };
  }

  if (product.type === 'material_bruto') {
    return {
      available: product.current_stock >= requiredQuantity,
      currentStock: product.current_stock,
      required: requiredQuantity
    };
  }

  const components = await getProductComponents(productId);

  for (const comp of components) {
    const totalRequired = comp.quantity * requiredQuantity;
    const availability = await checkStockAvailability(comp.product_id, totalRequired);

    if (!availability.available) {
      return availability;
    }
  }

  return {
    available: true,
    currentStock: product.current_stock,
    required: requiredQuantity
  };
};
