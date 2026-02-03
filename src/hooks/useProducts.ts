import { useState, useCallback, useEffect, useRef } from 'react';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';

export function useProducts(catalogId: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const productsRef = useRef<Product[]>([]);
  const catalogIdRef = useRef<string | null>(catalogId);
  const hasInitializedRef = useRef(false);

  // Mantém as refs atualizadas
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    catalogIdRef.current = catalogId;
  }, [catalogId]);

  // Função interna de salvamento (ATÔMICA - previne perda de dados)
  const saveProductsInternal = useCallback(async (isManualSave = false): Promise<{ success: boolean; error?: string; savedCount?: number }> => {
    const currentProducts = productsRef.current;
    const currentCatalogId = catalogIdRef.current;
    
    if (!currentCatalogId) {
      return { success: false, error: 'Nenhum catálogo selecionado' };
    }
    
    // Proteção: não salvar lista vazia se ainda não carregamos os dados
    if (!hasInitializedRef.current) {
      console.log('Salvamento ignorado: dados ainda não foram carregados');
      return { success: false, error: 'Dados ainda não carregados' };
    }
    
    setIsSaving(true);
    
    // Retry logic para salvamento manual (até 5 tentativas com backoff exponencial)
    const maxRetries = isManualSave ? 5 : 2;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Usa função atômica do banco - DELETE + INSERT numa única transação
        // Se o INSERT falhar, o DELETE é revertido automaticamente
        const productsToSave = currentProducts.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image_url: p.image,
        }));

        console.log(`[Save] Tentativa ${attempt}/${maxRetries} - Salvando ${productsToSave.length} produtos...`);

        const { error } = await supabase.rpc('replace_catalog_products', {
          p_catalog_id: currentCatalogId,
          p_products: productsToSave,
        });

        if (error) throw error;

        // Verificação pós-salvamento: confirma que todos foram salvos
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('catalog_id', currentCatalogId);

        if (countError) {
          console.warn('Aviso: não foi possível verificar contagem após salvamento');
        } else if (count !== productsToSave.length) {
          throw new Error(`Verificação falhou: salvos ${count} de ${productsToSave.length} produtos`);
        }

        console.log(`✅ Produtos salvos com sucesso: ${productsToSave.length} itens (verificado)`);
        setIsSaving(false);
        return { success: true, savedCount: productsToSave.length };
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Erro ao salvar produtos (tentativa ${attempt}/${maxRetries}):`, error);
        
        // Aguarda antes de tentar novamente (backoff exponencial)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    setIsSaving(false);
    return { 
      success: false, 
      error: lastError?.message || 'Erro desconhecido ao salvar' 
    };
  }, []);

  // Auto-save com debounce de 2 segundos após cada alteração
  // Usa saveProductsInternal(false) para auto-save (menos retries)
  useEffect(() => {
    if (!hasInitialized || !catalogId) return;

    // Só auto-salva se houver produtos (previne salvar lista vazia acidentalmente)
    if (products.length === 0 && hasInitializedRef.current) {
      console.log('Auto-save ignorado: lista de produtos vazia');
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const result = await saveProductsInternal(false);
      if (!result.success) {
        console.warn('⚠️ Auto-save falhou:', result.error);
      }
    }, 2000); // Aumentado para 2 segundos para evitar salvamentos muito frequentes

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [products, hasInitialized, saveProductsInternal, catalogId]);

  // Reseta quando muda de catálogo
  useEffect(() => {
    setProducts([]);
    setHasInitialized(false);
    hasInitializedRef.current = false;
  }, [catalogId]);

  const loadProducts = useCallback(async () => {
    if (!catalogId) return false;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('catalog_id', catalogId)
        .order('position', { ascending: true });

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
      } else {
        setProducts([]);
      }
      setHasInitialized(true);
      hasInitializedRef.current = true;
      return data && data.length > 0;
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setHasInitialized(true);
      hasInitializedRef.current = true;
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [catalogId]);

  const saveProducts = useCallback(async (): Promise<{ success: boolean; error?: string; savedCount?: number }> => {
    return saveProductsInternal(true); // isManualSave = true para ativar retries
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

  const moveProductTo = useCallback((currentIndex: number, targetIndex: number) => {
    if (currentIndex === targetIndex) return;
    
    setProducts((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(currentIndex, 1);
      result.splice(targetIndex, 0, removed);
      return result;
    });
  }, []);

  return {
    products,
    addProduct,
    updateProduct,
    removeProduct,
    reorderProducts,
    moveProductTo,
    saveProducts,
    loadProducts,
    isSaving,
    isLoading,
  };
}
