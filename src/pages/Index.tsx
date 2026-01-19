import { useState, useEffect } from 'react';
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

// Produtos fictícios para demonstração
const demoProducts: Omit<Product, 'id'>[] = [
  {
    name: 'Relógio Elegance Gold',
    description: 'Relógio de pulso com acabamento dourado e pulseira de couro legítimo. Design clássico e sofisticado.',
    price: 1890.00,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
  },
  {
    name: 'Bolsa Premium Leather',
    description: 'Bolsa feminina em couro italiano, com forro interno em seda. Ideal para ocasiões especiais.',
    price: 2450.00,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
  },
  {
    name: 'Óculos Solar Luxe',
    description: 'Óculos de sol com lentes polarizadas e armação em titânio. Proteção UV400.',
    price: 890.00,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
  },
  {
    name: 'Perfume Noir Intense',
    description: 'Fragrância masculina com notas de âmbar, baunilha e madeira de cedro.',
    price: 520.00,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
  },
  {
    name: 'Carteira Executive',
    description: 'Carteira slim em couro genuíno com porta-cartões e compartimento para notas.',
    price: 380.00,
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
  },
  {
    name: 'Cinto Classic Brown',
    description: 'Cinto masculino de couro com fivela em aço inoxidável escovado.',
    price: 290.00,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
  },
];

const Index = () => {
  const { products, addProduct, updateProduct, removeProduct, initializeWithDemoProducts, saveProducts, loadProducts, isSaving, isLoading } = useProducts();
  const [catalogTitle, setCatalogTitle] = useState('Meu Catálogo');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);
  const { toast } = useToast();

  // Carrega produtos do banco ao inicializar
  useEffect(() => {
    const init = async () => {
      const loaded = await loadProducts();
      setHasLoadedFromDb(true);
      if (!loaded) {
        // Se não tinha produtos salvos, carrega os demo
        initializeWithDemoProducts(demoProducts);
      }
    };
    init();
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
      />

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground sm:text-base">
            {products.length} produto{products.length !== 1 ? 's' : ''} no catálogo
          </p>
          <Button size="sm" onClick={() => setIsProductFormOpen(true)} className="sm:size-default">
            <Plus className="mr-1 h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Adicionar Produto</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
        </div>
        
        {/* Grid otimizado para mobile - 2 colunas */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEditProduct}
              onRemove={removeProduct}
            />
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
