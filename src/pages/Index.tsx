import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/product';
import { CatalogHeader } from '@/components/CatalogHeader';
import { ProductCard } from '@/components/ProductCard';
import { ProductForm } from '@/components/ProductForm';
import { BackgroundModal } from '@/components/BackgroundModal';
import { generateCatalogPDF } from '@/utils/generatePDF';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { products, addProduct, updateProduct, removeProduct } = useProducts();
  const [catalogTitle, setCatalogTitle] = useState('Meu Catálogo');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

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
      />

      <main className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-6 rounded-full bg-muted p-6">
              <Plus className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="mb-2 font-serif text-2xl font-semibold text-foreground">
              Nenhum produto cadastrado
            </h2>
            <p className="mb-6 text-center text-muted-foreground">
              Comece adicionando produtos ao seu catálogo
            </p>
            <Button onClick={() => setIsProductFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Produto
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                {products.length} produto{products.length !== 1 ? 's' : ''} no
                catálogo
              </p>
              <Button onClick={() => setIsProductFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEditProduct}
                  onRemove={removeProduct}
                />
              ))}
            </div>
          </>
        )}
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
