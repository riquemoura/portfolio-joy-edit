import { useState, useCallback, useEffect, useRef } from 'react';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const productsRef = useRef<Product[]>([]);

  // Mantém a ref atualizada com o estado atual
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // Função interna de salvamento
  const saveProductsInternal = useCallback(async () => {
    const currentProducts = productsRef.current;
    setIsSaving(true);
    try {
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const productsToSave = currentProducts.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image_url: p.image,
      }));

      if (productsToSave.length > 0) {
        const { error } = await supabase.from('products').insert(productsToSave);
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Auto-save com debounce de 1.5 segundos após cada alteração
  useEffect(() => {
    if (!hasInitialized) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveProductsInternal();
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [products, hasInitialized, saveProductsInternal]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedProducts: Product[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: Number(p.price),
          image: p.image_url || '',
        }));
        setProducts(loadedProducts);
      }
      setHasInitialized(true);
      return data && data.length > 0;
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setHasInitialized(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProducts = useCallback(async () => {
    return saveProductsInternal();
  }, [saveProductsInternal]);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
    };
    setProducts((prev) => [...prev, newProduct]);
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Omit<Product, 'id'>>) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, ...updates } : product
      )
    );
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  }, []);

  const reorderProducts = useCallback((startIndex: number, endIndex: number) => {
    setProducts((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  return {
    products,
    addProduct,
    updateProduct,
    removeProduct,
    reorderProducts,
    saveProducts,
    loadProducts,
    isSaving,
    isLoading,
  };
}
