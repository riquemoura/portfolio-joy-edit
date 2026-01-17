import { useState, useCallback } from 'react';
import { Product } from '@/types/product';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);

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

  return {
    products,
    addProduct,
    updateProduct,
    removeProduct,
  };
}
