import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { Image, Loader2, Download, ChevronRight, Check } from 'lucide-react';
import { downloadProductCard } from '@/utils/generateCard';

interface Catalog {
  id: string;
  name: string;
}

interface CardExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogs: Catalog[];
  currentCatalogId: string | null;
}

interface CatalogProducts {
  catalogId: string;
  catalogName: string;
  products: Product[];
}

export function CardExportModal({
  open,
  onOpenChange,
  catalogs,
  currentCatalogId,
}: CardExportModalProps) {
  const [step, setStep] = useState<'catalogs' | 'products' | 'exporting'>('catalogs');
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProducts[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Export state
  const [productsToExport, setProductsToExport] = useState<Product[]>([]);
  const [currentExportIndex, setCurrentExportIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('catalogs');
      setSelectedCatalogIds(currentCatalogId ? [currentCatalogId] : []);
      setCatalogProducts([]);
      setSelectedProductIds([]);
      setProductsToExport([]);
      setCurrentExportIndex(0);
    }
  }, [open, currentCatalogId]);

  const handleCatalogToggle = (catalogId: string) => {
    setSelectedCatalogIds((prev) =>
      prev.includes(catalogId)
        ? prev.filter((id) => id !== catalogId)
        : [...prev, catalogId]
    );
  };

  const handleSelectAllCatalogs = () => {
    if (selectedCatalogIds.length === catalogs.length) {
      setSelectedCatalogIds([]);
    } else {
      setSelectedCatalogIds(catalogs.map((c) => c.id));
    }
  };

  const handleLoadProducts = async () => {
    if (selectedCatalogIds.length === 0) return;

    setIsLoading(true);
    try {
      const loadedCatalogs: CatalogProducts[] = [];

      for (const catalogId of selectedCatalogIds) {
        const catalog = catalogs.find((c) => c.id === catalogId);
        if (!catalog) continue;

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('catalog_id', catalogId)
          .eq('is_page_break', false)
          .order('position', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const products: Product[] = data.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: Number(p.price),
            image: p.image_url || '',
            isPageBreak: false,
          }));

          loadedCatalogs.push({
            catalogId,
            catalogName: catalog.name,
            products,
          });
        }
      }

      setCatalogProducts(loadedCatalogs);
      // Select all products by default
      const allProductIds = loadedCatalogs.flatMap((c) => c.products.map((p) => p.id));
      setSelectedProductIds(allProductIds);
      setStep('products');
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllProducts = () => {
    const allProductIds = catalogProducts.flatMap((c) => c.products.map((p) => p.id));
    if (selectedProductIds.length === allProductIds.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(allProductIds);
    }
  };

  const handleStartExport = () => {
    // Gather selected products in order
    const selectedProducts: Product[] = [];
    for (const catalog of catalogProducts) {
      for (const product of catalog.products) {
        if (selectedProductIds.includes(product.id)) {
          selectedProducts.push(product);
        }
      }
    }
    
    setProductsToExport(selectedProducts);
    setCurrentExportIndex(0);
    setStep('exporting');
  };

  const handleDownloadCurrent = async () => {
    if (currentExportIndex >= productsToExport.length) return;
    
    setIsDownloading(true);
    try {
      const product = productsToExport[currentExportIndex];
      await downloadProductCard(product);
      
      // Move to next product after download
      if (currentExportIndex < productsToExport.length - 1) {
        setCurrentExportIndex(currentExportIndex + 1);
      } else {
        // All done - close modal
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro ao baixar card:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const currentProduct = productsToExport[currentExportIndex];
  const totalProducts = catalogProducts.reduce((sum, c) => sum + c.products.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            {step === 'catalogs' && 'Selecionar Catálogos'}
            {step === 'products' && 'Selecionar Produtos'}
            {step === 'exporting' && `Baixar Card ${currentExportIndex + 1} de ${productsToExport.length}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'catalogs' && 'Escolha os catálogos para exportar cards'}
            {step === 'products' && 'Escolha os produtos para exportar como cards'}
            {step === 'exporting' && 'Clique em Baixar para salvar cada card'}
          </DialogDescription>
        </DialogHeader>

        {step === 'catalogs' && (
          <>
            <div className="py-4">
              <div className="mb-3 flex items-center gap-2">
                <Checkbox
                  id="select-all-catalogs"
                  checked={selectedCatalogIds.length === catalogs.length && catalogs.length > 0}
                  onCheckedChange={handleSelectAllCatalogs}
                />
                <label htmlFor="select-all-catalogs" className="text-sm font-medium">
                  Selecionar todos
                </label>
              </div>

              <ScrollArea className="h-64 rounded-md border p-4">
                <div className="space-y-3">
                  {catalogs.map((catalog) => (
                    <div key={catalog.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`catalog-${catalog.id}`}
                        checked={selectedCatalogIds.includes(catalog.id)}
                        onCheckedChange={() => handleCatalogToggle(catalog.id)}
                      />
                      <label
                        htmlFor={`catalog-${catalog.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {catalog.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleLoadProducts}
                disabled={selectedCatalogIds.length === 0 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'products' && (
          <>
            <div className="py-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all-products"
                    checked={selectedProductIds.length === totalProducts && totalProducts > 0}
                    onCheckedChange={handleSelectAllProducts}
                  />
                  <label htmlFor="select-all-products" className="text-sm font-medium">
                    Selecionar todos ({totalProducts})
                  </label>
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedProductIds.length} selecionado(s)
                </span>
              </div>

              <ScrollArea className="h-64 rounded-md border">
                <div className="p-4">
                  {catalogProducts.map((catalog) => (
                    <div key={catalog.catalogId} className="mb-4 last:mb-0">
                      <h4 className="mb-2 font-medium text-foreground">{catalog.catalogName}</h4>
                      <div className="space-y-2 pl-2">
                        {catalog.products.map((product) => (
                          <div key={product.id} className="flex items-center gap-3">
                            <Checkbox
                              id={`product-${product.id}`}
                              checked={selectedProductIds.includes(product.id)}
                              onCheckedChange={() => handleProductToggle(product.id)}
                            />
                            <label
                              htmlFor={`product-${product.id}`}
                              className="flex flex-1 cursor-pointer items-center gap-2 text-sm"
                            >
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-8 w-8 rounded object-cover"
                                />
                              )}
                              <span className="flex-1 truncate">{product.name}</span>
                              <span className="text-muted-foreground">
                                R$ {product.price.toFixed(2)}
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('catalogs')}>
                Voltar
              </Button>
              <Button
                onClick={handleStartExport}
                disabled={selectedProductIds.length === 0}
              >
                <Image className="mr-2 h-4 w-4" />
                Iniciar Exportação ({selectedProductIds.length})
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'exporting' && currentProduct && (
          <>
            <div className="py-4">
              {/* Preview card */}
              <div className="mx-auto mb-4 w-full max-w-[280px] overflow-hidden rounded-lg border bg-card shadow-md">
                {currentProduct.image ? (
                  <img
                    src={currentProduct.image}
                    alt={currentProduct.name}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-muted">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-foreground line-clamp-2">{currentProduct.name}</h3>
                  {currentProduct.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {currentProduct.description}
                    </p>
                  )}
                  <p className="mt-2 text-lg font-bold text-primary">
                    R$ {currentProduct.price.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                {Array.from({ length: productsToExport.length }, (_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full ${
                      i < currentExportIndex
                        ? 'bg-primary'
                        : i === currentExportIndex
                        ? 'bg-primary animate-pulse'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                onClick={handleDownloadCurrent}
                disabled={isDownloading}
                className="w-full sm:w-auto"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : currentExportIndex < productsToExport.length - 1 ? (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar e Próximo
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Baixar e Finalizar
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
