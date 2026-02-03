import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { Image, Loader2, Download } from 'lucide-react';
import { generateProductCardBlob } from '@/utils/generateCard';
import JSZip from 'jszip';

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
  const [step, setStep] = useState<'catalogs' | 'products'>('catalogs');
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProducts[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('catalogs');
      setSelectedCatalogIds(currentCatalogId ? [currentCatalogId] : []);
      setCatalogProducts([]);
      setSelectedProductIds([]);
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

  const handleExportCards = async () => {
    if (selectedProductIds.length === 0) return;

    setIsExporting(true);
    try {
      // Get all selected products
      const selectedProducts: Product[] = [];
      for (const catalog of catalogProducts) {
        for (const product of catalog.products) {
          if (selectedProductIds.includes(product.id)) {
            selectedProducts.push(product);
          }
        }
      }

      // Create ZIP file
      const zip = new JSZip();

      // Generate all cards and add to ZIP
      for (const product of selectedProducts) {
        const result = await generateProductCardBlob(product);
        if (result) {
          zip.file(result.filename, result.blob);
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cards_${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao exportar cards:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const totalProducts = catalogProducts.reduce((sum, c) => sum + c.products.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            {step === 'catalogs' ? 'Selecionar Catálogos' : 'Selecionar Produtos'}
          </DialogTitle>
        </DialogHeader>

        {step === 'catalogs' ? (
          <>
            <div className="py-4">
              <p className="mb-4 text-sm text-muted-foreground">
                Selecione os catálogos dos quais deseja exportar cards de produtos:
              </p>

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
                  'Próximo'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-4">
              <p className="mb-4 text-sm text-muted-foreground">
                Selecione os produtos que deseja exportar como cards:
              </p>

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
                onClick={handleExportCards}
                disabled={selectedProductIds.length === 0 || isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando ZIP...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar {selectedProductIds.length} Card(s)
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
