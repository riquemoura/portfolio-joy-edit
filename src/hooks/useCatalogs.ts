import { useState, useCallback } from 'react';
import { Catalog } from '@/types/catalog';
import { supabase } from '@/integrations/supabase/client';

export function useCatalogs() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [currentCatalog, setCurrentCatalog] = useState<Catalog | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCatalogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('catalogs')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const loadedCatalogs: Catalog[] = data.map((c) => ({
          id: c.id,
          name: c.name,
          backgroundImage: c.background_image,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
        setCatalogs(loadedCatalogs);
        
        // Se não há catálogo selecionado, seleciona o primeiro
        if (!currentCatalog && loadedCatalogs.length > 0) {
          setCurrentCatalog(loadedCatalogs[0]);
        }
        
        return loadedCatalogs;
      }
      return [];
    } catch (error) {
      console.error('Erro ao carregar catálogos:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCatalog]);

  const createCatalog = useCallback(async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('catalogs')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newCatalog: Catalog = {
          id: data.id,
          name: data.name,
          backgroundImage: data.background_image,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        setCatalogs((prev) => [...prev, newCatalog]);
        return newCatalog;
      }
      return null;
    } catch (error) {
      console.error('Erro ao criar catálogo:', error);
      return null;
    }
  }, []);

  const updateCatalog = useCallback(async (id: string, updates: Partial<Pick<Catalog, 'name' | 'backgroundImage'>>) => {
    try {
      const dbUpdates: { name?: string; background_image?: string | null } = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.backgroundImage !== undefined) dbUpdates.background_image = updates.backgroundImage;

      const { error } = await supabase
        .from('catalogs')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setCatalogs((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
      
      if (currentCatalog?.id === id) {
        setCurrentCatalog((prev) => prev ? { ...prev, ...updates } : prev);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar catálogo:', error);
      return false;
    }
  }, [currentCatalog]);

  const deleteCatalog = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('catalogs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCatalogs((prev) => prev.filter((c) => c.id !== id));
      
      // Se deletou o catálogo atual, seleciona outro
      if (currentCatalog?.id === id) {
        const remaining = catalogs.filter((c) => c.id !== id);
        setCurrentCatalog(remaining.length > 0 ? remaining[0] : null);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao deletar catálogo:', error);
      return false;
    }
  }, [currentCatalog, catalogs]);

  const duplicateCatalog = useCallback(async (id: string): Promise<Catalog | null> => {
    try {
      // 1. Busca o catálogo original
      const originalCatalog = catalogs.find((c) => c.id === id);
      if (!originalCatalog) {
        console.error('Catálogo não encontrado');
        return null;
      }

      // 2. Cria o novo catálogo com nome "Cópia de X"
      const { data: newCatalogData, error: catalogError } = await supabase
        .from('catalogs')
        .insert({
          name: `Cópia de ${originalCatalog.name}`,
          background_image: originalCatalog.backgroundImage,
        })
        .select()
        .single();

      if (catalogError) throw catalogError;

      const newCatalog: Catalog = {
        id: newCatalogData.id,
        name: newCatalogData.name,
        backgroundImage: newCatalogData.background_image,
        createdAt: newCatalogData.created_at,
        updatedAt: newCatalogData.updated_at,
      };

      // 3. Busca todos os produtos do catálogo original (ordenados por position)
      const { data: originalProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('catalog_id', id)
        .order('position', { ascending: true });

      if (productsError) throw productsError;

      // 4. Copia os produtos para o novo catálogo (se houver)
      if (originalProducts && originalProducts.length > 0) {
        const productsToInsert = originalProducts.map((p, index) => ({
          catalog_id: newCatalog.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image_url: p.image_url,
          position: index, // Mantém a ordem original
        }));

        const { error: insertError } = await supabase
          .from('products')
          .insert(productsToInsert);

        if (insertError) {
          // Se falhar ao copiar produtos, deleta o catálogo criado
          await supabase.from('catalogs').delete().eq('id', newCatalog.id);
          throw insertError;
        }
      }

      // 5. Atualiza o estado local
      setCatalogs((prev) => [...prev, newCatalog]);

      return newCatalog;
    } catch (error) {
      console.error('Erro ao duplicar catálogo:', error);
      return null;
    }
  }, [catalogs]);

  const selectCatalog = useCallback((catalog: Catalog) => {
    setCurrentCatalog(catalog);
  }, []);

  return {
    catalogs,
    currentCatalog,
    isLoading,
    loadCatalogs,
    createCatalog,
    updateCatalog,
    deleteCatalog,
    duplicateCatalog,
    selectCatalog,
  };
}
