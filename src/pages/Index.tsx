import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/product';
import { CatalogHeader } from '@/components/CatalogHeader';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardReorder } from '@/components/ProductCardReorder';
import { ProductForm } from '@/components/ProductForm';
import { BackgroundModal } from '@/components/BackgroundModal';
import { generateCatalogPDF } from '@/utils/generatePDF';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { products, addProduct, updateProduct, removeProduct, saveProducts, loadProducts, isSaving, isLoading, reorderProducts } = useProducts();
  const [catalogTitle, setCatalogTitle] = useState('Meu Catálogo');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const { toast } = useToast();

  // Carrega produtos do banco ao inicializar (sem produtos demo)
  useEffect(() => {
    loadProducts();
  }, []);

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

  const handleGeneratePDF = async () => {
    if (products.length === 0) {
      toast({
        title: 'Catálogo vazio',
        description: 'Adicione pelo menos um produto antes de gerar o PDF.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingPDF(true);
    try {
      await generateCatalogPDF(products, catalogTitle, backgroundImage);
      toast({
        title: 'PDF gerado com sucesso!',
        description: 'O download do catálogo foi iniciado.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Ocorreu um erro ao gerar o catálogo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
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
        title={catalogTitle}
        onTitleChange={setCatalogTitle}
        onCustomizeBackground={() => setIsBackgroundModalOpen(true)}
        onGeneratePDF={handleGeneratePDF}
        isGeneratingPDF={isGeneratingPDF}
        onSaveProject={handleSaveProject}
        isSaving={isSaving}
        onAddProduct={() => setIsProductFormOpen(true)}
        onEditOrder={() => setIsEditingOrder(!isEditingOrder)}
        isEditingOrder={isEditingOrder}
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
    </div>
  );
};

export default Index;
