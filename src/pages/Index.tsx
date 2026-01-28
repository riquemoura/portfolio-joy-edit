import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCatalogs } from '@/hooks/useCatalogs';
import { Product } from '@/types/product';
import { CatalogHeader } from '@/components/CatalogHeader';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardReorder } from '@/components/ProductCardReorder';
import { ProductForm } from '@/components/ProductForm';
import { BackgroundModal } from '@/components/BackgroundModal';
import { CatalogSelector } from '@/components/CatalogSelector';
import { PDFGeneratorModal } from '@/components/PDFGeneratorModal';
import { generateCatalogPDF, CatalogData } from '@/utils/generatePDF';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const {
    catalogs,
    currentCatalog,
    loadCatalogs,
    createCatalog,
    updateCatalog,
    deleteCatalog,
    selectCatalog,
  } = useCatalogs();

  const { products, addProduct, updateProduct, removeProduct, saveProducts, loadProducts, isSaving, isLoading, reorderProducts } = useProducts(currentCatalog?.id ?? null);
  
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isCatalogSelectorOpen, setIsCatalogSelectorOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const { toast } = useToast();

  // Carrega catálogos ao inicializar
  useEffect(() => {
    loadCatalogs();
  }, []);

  // Carrega produtos quando o catálogo muda
  useEffect(() => {
    if (currentCatalog) {
      loadProducts();
      setBackgroundImage(currentCatalog.backgroundImage);
    }
  }, [currentCatalog?.id]);

  // Salva background no catálogo
  useEffect(() => {
    if (currentCatalog && backgroundImage !== currentCatalog.backgroundImage) {
      updateCatalog(currentCatalog.id, { backgroundImage });
    }
  }, [backgroundImage]);

  const handleTitleChange = (newTitle: string) => {
    if (currentCatalog) {
      updateCatalog(currentCatalog.id, { name: newTitle });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleCloseProductForm = (open: boolean) => {
    setIsProductFormOpen(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  const handleSaveProject = async () => {
    const success = await saveProducts();
    if (success) {
      toast({
        title: 'Projeto salvo!',
        description: 'Seus produtos foram salvos com sucesso.',
      });
    } else {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o projeto. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleGeneratePDF = async (catalogIds: string[]) => {
    setIsGeneratingPDF(true);
    try {
      let generatedCount = 0;
      
      for (const catalogId of catalogIds) {
        const catalog = catalogs.find((c) => c.id === catalogId);
        if (!catalog) continue;

        // Busca produtos do catálogo
        const { data: catalogProducts, error } = await supabase
          .from('products')
          .select('*')
          .eq('catalog_id', catalogId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (catalogProducts && catalogProducts.length > 0) {
          const productsForPDF: Product[] = catalogProducts.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: Number(p.price),
            image: p.image_url || '',
          }));

          await generateCatalogPDF(productsForPDF, catalog.name, catalog.backgroundImage);
          generatedCount++;
        }
      }

      if (generatedCount > 0) {
        toast({
          title: 'PDF gerado com sucesso!',
          description: generatedCount > 1 
            ? `${generatedCount} catálogos foram gerados.`
            : 'O download do catálogo foi iniciado.',
        });
      } else {
        toast({
          title: 'Catálogos vazios',
          description: 'Os catálogos selecionados não possuem produtos.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Ocorreu um erro ao gerar o catálogo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleRenameCatalog = async (id: string, name: string) => {
    return updateCatalog(id, { name });
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={
        backgroundImage
          ? {
              backgroundImage: `linear-gradient(to bottom, hsl(var(--background) / 0.9), hsl(var(--background) / 0.95)), url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      <CatalogHeader
        title={currentCatalog?.name || 'Meu Catálogo'}
        onTitleChange={handleTitleChange}
        onCustomizeBackground={() => setIsBackgroundModalOpen(true)}
        onGeneratePDF={() => setIsPDFModalOpen(true)}
        isGeneratingPDF={isGeneratingPDF}
        onSaveProject={handleSaveProject}
        isSaving={isSaving}
        onAddProduct={() => setIsProductFormOpen(true)}
        onEditOrder={() => setIsEditingOrder(!isEditingOrder)}
        isEditingOrder={isEditingOrder}
        onOpenCatalogs={() => setIsCatalogSelectorOpen(true)}
      />

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground sm:text-base">
            {products.length} produto{products.length !== 1 ? 's' : ''} no catálogo
            {isEditingOrder && <span className="ml-2 text-primary">(Arraste para reordenar)</span>}
          </p>
        </div>
        
        {/* Grid otimizado para mobile - 2 colunas */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            isEditingOrder ? (
              <ProductCardReorder
                key={product.id}
                product={product}
                index={index}
                totalProducts={products.length}
                onMoveUp={() => reorderProducts(index, index - 1)}
                onMoveDown={() => reorderProducts(index, index + 1)}
              />
            ) : (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onRemove={removeProduct}
              />
            )
          ))}
        </div>
      </main>

      <ProductForm
        open={isProductFormOpen}
        onOpenChange={handleCloseProductForm}
        onSubmit={addProduct}
        editingProduct={editingProduct}
        onUpdate={updateProduct}
      />

      <BackgroundModal
        open={isBackgroundModalOpen}
        onOpenChange={setIsBackgroundModalOpen}
        currentBackground={backgroundImage}
        onBackgroundChange={setBackgroundImage}
      />

      <CatalogSelector
        open={isCatalogSelectorOpen}
        onOpenChange={setIsCatalogSelectorOpen}
        catalogs={catalogs}
        currentCatalog={currentCatalog}
        onSelect={selectCatalog}
        onCreate={createCatalog}
        onDelete={deleteCatalog}
        onRename={handleRenameCatalog}
      />

      <PDFGeneratorModal
        open={isPDFModalOpen}
        onOpenChange={setIsPDFModalOpen}
        catalogs={catalogs}
        currentCatalogId={currentCatalog?.id ?? null}
        onGenerate={handleGeneratePDF}
        isGenerating={isGeneratingPDF}
      />
    </div>
  );
};

export default Index;
