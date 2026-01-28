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
      const dbUpdates: Record<string, unknown> = {};
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
    selectCatalog,
  };
}
