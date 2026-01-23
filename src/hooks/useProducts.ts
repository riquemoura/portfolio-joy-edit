import { useState, useCallback, useEffect, useRef } from 'react';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save com debounce de 1 segundo após cada alteração
  useEffect(() => {
    if (!hasInitialized) return;

    // Limpa o timeout anterior se existir
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Agenda novo salvamento
    saveTimeoutRef.current = setTimeout(() => {
      saveProducts();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [products, hasInitialized]);

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
        setHasInitialized(true);
        return true; // Indica que carregou produtos do banco
      }
      setHasInitialized(true);
      return false; // Não tinha produtos salvos
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setHasInitialized(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProducts = useCallback(async () => {
    setIsSaving(true);
    try {
      // Limpa todos os produtos existentes no banco
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insere todos os produtos atuais
      const productsToSave = products.map((p) => ({
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
  }, [products]);

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

  const initializeWithDemoProducts = useCallback((demoProducts: Omit<Product, 'id'>[]) => {
    const productsWithIds: Product[] = demoProducts.map((product) => ({
      ...product,
      id: crypto.randomUUID(),
    }));
    setProducts(productsWithIds);
    setHasInitialized(true);
  }, []);

  return {
    products,
    addProduct,
    updateProduct,
    removeProduct,
    reorderProducts,
    initializeWithDemoProducts,
    saveProducts,
    loadProducts,
    isSaving,
    isLoading,
  };
}
