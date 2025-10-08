import React, { useEffect, useState } from "react";
import { useApp, Product, ProductComponent } from "../contexts/AppContext";
import { useSettings } from "../contexts/SettingsContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ProductCombobox from "./ProductCombobox";
import { Calculator, AlertTriangle } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, { message: "Campo obrigatório" }),
  description: z.string().optional(),
  category: z.string().min(1, { message: "Selecione uma categoria" }),
  type: z.enum(["material_bruto", "parte_produto", "produto_pronto"], {
    errorMap: () => ({ message: "Selecione um tipo" }),
  }),
  unit: z.string().min(1, { message: "Campo obrigatório" }),
  current_stock: z.coerce
    .number()
    .min(0, { message: "Estoque atual deve ser maior ou igual a 0" }),
  min_stock: z.coerce
    .number()
    .min(0, { message: "Estoque mínimo deve ser maior ou igual a 0" }),
  cost_price: z.coerce
    .number()
    .min(0, { message: "Informe um preço de custo válido" }),
  sale_price: z.coerce
    .number()
    .min(0, { message: "Preço de venda inválido" })
    .optional(),
  supplier: z.string().optional(),
  components: z
    .array(
      z.object({
        product_id: z.string().min(1, { message: "Selecione um produto" }),
        product_name: z.string(),
        quantity: z.coerce
          .number()
          .min(0.001, { message: "Quantidade deve ser maior que 0" }),
        unit: z.string(),
        unit_cost: z.number(),
        total_cost: z.number(),
      })
    )
    .optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

type ProductModalProps = {
  product?: Product | null;
  onClose: () => void;
};

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addProduct, updateProduct, products, calculateProductCost } = useApp();
  const { productSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      type: "material_bruto",
      unit: "",
      current_stock: 0,
      min_stock: 0,
      cost_price: 0,
      sale_price: undefined,
      supplier: "",
      components: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "components",
  });

  const watchedComponents = watch("components");
  const watchedType = watch("type");

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        category: product.category,
        type: product.type as any,
        unit: product.unit,
        current_stock: product.current_stock,
        min_stock: product.min_stock,
        cost_price: product.cost_price,
        sale_price: product.sale_price,
        supplier: product.supplier,
        components: product.components || [],
      });
    } else {
      reset();
    }
  }, [product, reset]);

  useEffect(() => {
    if (watchedComponents?.length > 0 && productSettings?.automation?.autoCalculateCosts) {
      const totalCost = watchedComponents.reduce((sum, comp) => sum + (comp.total_cost || 0), 0);
      if (totalCost > 0) {
        setValue("cost_price", totalCost);
      }
    }
  }, [watchedComponents, setValue, productSettings?.automation?.autoCalculateCosts]);

  const handleAddComponent = () => {
    append({
      product_id: "",
      product_name: "",
      quantity: 1,
      unit: "",
      unit_cost: 0,
      total_cost: 0,
    });
  };

  const handleSelectProduct = (selectedProduct: Product, index: number) => {
    const component = fields[index];
    const quantity = component.quantity || 1;

    update(index, {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity: quantity,
      unit: selectedProduct.unit,
      unit_cost: selectedProduct.cost_price,
      total_cost: quantity * selectedProduct.cost_price,
    });
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const component = fields[index];
    update(index, {
      ...component,
      quantity: quantity,
      total_cost: quantity * component.unit_cost,
    });
  };

  const calculateSuggestedPrice = () => {
    const costPrice = watch("cost_price");
    const margin = productSettings.automation.defaultProfitMargin || 20;
    const suggestedPrice = costPrice * (1 + margin / 100);
    setValue("sale_price", Math.round(suggestedPrice * 100) / 100);
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const productData: Omit<Product, "id" | "created_at"> = {
        name: data.name,
        description: data.description || "",
        category: data.category,
        type: data.type,
        unit: data.unit,
        current_stock: data.current_stock,
        min_stock: data.min_stock,
        cost_price: data.cost_price,
        sale_price: data.sale_price,
        supplier: data.supplier,
        components: data.components || [],
      };

      if (product) {
        await updateProduct({
          ...productData,
          id: product.id,
          created_at: product.created_at,
        });
      } else {
        await addProduct(productData);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar produto");
      setIsSubmitting(false);
    }
  };

  const usedComponentIds = fields.map(f => f.product_id).filter(Boolean);
  const excludeIds = product ? [product.id, ...usedComponentIds] : usedComponentIds;

  const totalComponentsCost = fields.reduce((sum, field) => sum + (field.total_cost || 0), 0);
  const hasComponents = fields.length > 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Erro</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Nome do Produto</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                onValueChange={(val) => setValue("category", val)}
                defaultValue={product?.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {productSettings.categories.map((cat: string) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                onValueChange={(val) => setValue("type", val as any)}
                defaultValue={product?.type || "material_bruto"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="material_bruto">Material Bruto</SelectItem>
                  <SelectItem value="parte_produto">Parte de Produto</SelectItem>
                  <SelectItem value="produto_pronto">Produto Pronto</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Unidade</Label>
            <Input {...register("unit")} placeholder="UN, KG, M², L, etc." />
            {errors.unit && <p className="text-red-500 text-sm">{errors.unit.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estoque Atual</Label>
              <Input type="number" step="0.01" {...register("current_stock")} />
              {errors.current_stock && (
                <p className="text-red-500 text-sm">{errors.current_stock.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Estoque Mínimo</Label>
              <Input type="number" step="0.01" {...register("min_stock")} />
              {errors.min_stock && (
                <p className="text-red-500 text-sm">{errors.min_stock.message}</p>
              )}
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <Label>Componentes</Label>
              <Button
                size="sm"
                type="button"
                onClick={handleAddComponent}
                variant="outline"
              >
                + Adicionar Componente
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum componente adicionado. Clique em "Adicionar Componente" para começar.
              </p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-3 bg-gray-50">
                <div className="space-y-2">
                  <Label className="text-sm">Produto</Label>
                  <Controller
                    name={`components.${index}.product_id`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <ProductCombobox
                        products={products}
                        selectedProductId={controllerField.value}
                        onSelect={(selectedProduct) => handleSelectProduct(selectedProduct, index)}
                        excludeProductIds={excludeIds}
                        placeholder="Selecione um produto..."
                      />
                    )}
                  />
                  {errors.components?.[index]?.product_id && (
                    <p className="text-red-500 text-sm">{errors.components[index]?.product_id?.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      step="0.001"
                      placeholder="Qtd"
                      value={field.quantity || ""}
                      onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unidade</Label>
                    <Input
                      value={field.unit || ""}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Custo Unit.</Label>
                    <Input
                      value={field.unit_cost ? `R$ ${field.unit_cost.toFixed(2)}` : ""}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Custo Total</Label>
                    <Input
                      value={field.total_cost ? `R$ ${field.total_cost.toFixed(2)}` : ""}
                      disabled
                      className="bg-gray-100 font-medium"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                  className="w-full"
                >
                  Remover Componente
                </Button>
              </div>
            ))}

            {hasComponents && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-amber-800">
                    Custo Total dos Componentes:
                  </span>
                  <span className="text-lg font-bold text-amber-900">
                    R$ {totalComponentsCost.toFixed(2)}
                  </span>
                </div>
                {productSettings.automation.autoCalculateCosts && (
                  <p className="text-xs text-amber-700 mt-1">
                    O custo do produto será atualizado automaticamente
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço de Custo</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("cost_price")}
                  className={hasComponents && productSettings.automation.autoCalculateCosts ? "bg-amber-50" : ""}
                />
                {errors.cost_price && (
                  <p className="text-red-500 text-sm">{errors.cost_price.message}</p>
                )}
                {hasComponents && productSettings.automation.autoCalculateCosts && (
                  <p className="text-xs text-amber-600">
                    Calculado automaticamente a partir dos componentes
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Preço de Venda (opcional)</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={calculateSuggestedPrice}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    <Calculator className="h-3 w-3 mr-1" />
                    Calcular ({productSettings.automation.defaultProfitMargin}%)
                  </Button>
                </div>
                <Input type="number" step="0.01" {...register("sale_price")} />
                {errors.sale_price && (
                  <p className="text-red-500 text-sm">{errors.sale_price.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fornecedor (opcional)</Label>
            <Input {...register("supplier")} />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;

