import { useState, useEffect, useRef } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCatalogs } from '@/hooks/useCatalogs';
import { Product } from '@/types/product';
import { CatalogHeader } from '@/components/CatalogHeader';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardReorder } from '@/components/ProductCardReorder';
import { PageBreakCard } from '@/components/PageBreakCard';
import { ProductForm } from '@/components/ProductForm';
import { BackgroundModal } from '@/components/BackgroundModal';
import { CatalogSelector } from '@/components/CatalogSelector';
import { PDFGeneratorModal } from '@/components/PDFGeneratorModal';
import { generateCatalogPDF, CatalogData } from '@/utils/generatePDF';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { migrateBase64ImagesToStorage } from '@/utils/migrateImages';

const Index = () => {
  const {
    catalogs,
    currentCatalog,
    loadCatalogs,
    createCatalog,
    updateCatalog,
    deleteCatalog,
    duplicateCatalog,
    selectCatalog,
  } = useCatalogs();

  const { products, addProduct, addPageBreak, updateProduct, removeProduct, saveProducts, loadProducts, isSaving, isLoading, reorderProducts, moveProductTo } = useProducts(currentCatalog?.id ?? null);
  
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isCatalogSelectorOpen, setIsCatalogSelectorOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const hasMigratedRef = useRef(false);
  const { toast } = useToast();

  // Carrega catálogos ao inicializar
  useEffect(() => {
    loadCatalogs();
  }, []);

  // Migra imagens base64 para storage (apenas uma vez)
  useEffect(() => {
    const runMigration = async () => {
      if (hasMigratedRef.current) return;
      hasMigratedRef.current = true;

      setIsMigrating(true);
      try {
        const result = await migrateBase64ImagesToStorage();
        if (result.migrated > 0) {
          toast({
            title: 'Imagens migradas',
            description: `${result.migrated} imagem(ns) foram otimizadas para melhor performance.`,
          });
          // Recarrega os produtos após migração
          loadProducts();
        }
      } catch (error) {
        console.error('Erro na migração:', error);
      } finally {
        setIsMigrating(false);
      }
    };

    runMigration();
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
    const result = await saveProducts();
    if (result.success) {
      toast({
        title: 'Projeto salvo!',
        description: `${result.savedCount ?? products.length} produto(s) salvos e verificados com sucesso.`,
      });
    } else {
      toast({
        title: 'Erro ao salvar',
        description: `${result.error || 'Ocorreu um erro ao salvar o projeto.'} Tente novamente.`,
        variant: 'destructive',
        duration: 10000, // Mantém visível por mais tempo em caso de erro
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
        // Busca produtos ordenados por position (ordem manual definida pelo usuário)
        const { data: catalogProducts, error } = await supabase
          .from('products')
          .select('*')
          .eq('catalog_id', catalogId)
          .order('position', { ascending: true });

        if (error) throw error;

        if (catalogProducts && catalogProducts.length > 0) {
          const productsForPDF: Product[] = catalogProducts.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: Number(p.price),
            image: p.image_url || '',
            isPageBreak: (p as any).is_page_break || false,
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

  const handleDuplicateCatalog = async (id: string) => {
    const newCatalog = await duplicateCatalog(id);
    if (newCatalog) {
      toast({
        title: 'Catálogo duplicado!',
        description: `O catálogo "${newCatalog.name}" foi criado com todos os produtos.`,
      });
    } else {
      toast({
        title: 'Erro ao duplicar',
        description: 'Não foi possível duplicar o catálogo. Tente novamente.',
        variant: 'destructive',
      });
    }
    return newCatalog;
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
        onAddPageBreak={addPageBreak}
        onEditOrder={() => setIsEditingOrder(!isEditingOrder)}
        isEditingOrder={isEditingOrder}
        onOpenCatalogs={() => setIsCatalogSelectorOpen(true)}
      />

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground sm:text-base">
            {products.filter(p => !p.isPageBreak).length} produto{products.filter(p => !p.isPageBreak).length !== 1 ? 's' : ''} no catálogo
            {products.filter(p => p.isPageBreak).length > 0 && (
              <span className="ml-2 text-amber-600">
                ({products.filter(p => p.isPageBreak).length} quebra{products.filter(p => p.isPageBreak).length !== 1 ? 's' : ''} de página)
              </span>
            )}
            {isEditingOrder && <span className="ml-2 text-primary">(Arraste para reordenar)</span>}
          </p>
        </div>
        
        {/* Grid otimizado para mobile - 2 colunas */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            isEditingOrder ? (
              product.isPageBreak ? (
                <PageBreakCard
                  key={product.id}
                  index={index}
                  totalProducts={products.length}
                  onMoveUp={() => reorderProducts(index, index - 1)}
                  onMoveDown={() => reorderProducts(index, index + 1)}
                  onMoveTo={(newIndex) => moveProductTo(index, newIndex)}
                  onRemove={() => removeProduct(product.id)}
                />
              ) : (
                <ProductCardReorder
                  key={product.id}
                  product={product}
                  index={index}
                  totalProducts={products.length}
                  onMoveUp={() => reorderProducts(index, index - 1)}
                  onMoveDown={() => reorderProducts(index, index + 1)}
                  onMoveTo={(newIndex) => moveProductTo(index, newIndex)}
                />
              )
            ) : (
              !product.isPageBreak && (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEditProduct}
                  onRemove={removeProduct}
                />
              )
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
        onDuplicate={handleDuplicateCatalog}
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
