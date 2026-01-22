import { Product } from '@/types/product';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';

interface ProductCardReorderProps {
  product: Product;
  index: number;
  totalProducts: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ProductCardReorder({ 
  product, 
  index, 
  totalProducts,
  onMoveUp, 
  onMoveDown 
}: ProductCardReorderProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/30 bg-card/80 backdrop-blur-sm">
      {/* Imagem com aspect ratio fixo */}
      <div className="relative aspect-[4/5] overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover opacity-70"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground sm:text-sm">Sem imagem</span>
          </div>
        )}
        
        {/* Indicador de posição e botões de mover */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 bg-background/90"
              onClick={onMoveUp}
              disabled={index === 0}
            >
              <ChevronUp className="h-6 w-6" />
            </Button>
            
            <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2">
              <GripVertical className="h-4 w-4 text-primary-foreground" />
              <span className="text-lg font-bold text-primary-foreground">
                {index + 1}
              </span>
            </div>
            
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 bg-background/90"
              onClick={onMoveDown}
              disabled={index === totalProducts - 1}
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Conteúdo compacto */}
      <CardContent className="p-2 sm:p-4">
        <h3 className="mb-0.5 font-serif text-sm font-semibold leading-tight tracking-tight text-foreground sm:mb-1 sm:text-lg">
          {product.name}
        </h3>
        <p className="font-serif text-base font-bold text-primary sm:text-xl">
          {formatPrice(product.price)}
        </p>
      </CardContent>
    </Card>
  );
}