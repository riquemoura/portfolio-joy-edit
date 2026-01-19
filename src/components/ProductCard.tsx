import { Product } from '@/types/product';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onRemove: (id: string) => void;
}

export function ProductCard({ product, onEdit, onRemove }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Card className="group overflow-hidden border-border/40 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
      {/* Imagem com aspect ratio fixo para mobile */}
      <div className="relative aspect-[4/5] overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground sm:text-sm">Sem imagem</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        {/* Botões de ação - menores em mobile */}
        <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:right-2 sm:top-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-6 w-6 bg-background/90 backdrop-blur-sm sm:h-8 sm:w-8"
            onClick={() => onEdit(product)}
          >
            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-6 w-6 bg-destructive/90 backdrop-blur-sm sm:h-8 sm:w-8"
            onClick={() => onRemove(product.id)}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
      
      {/* Conteúdo compacto para mobile */}
      <CardContent className="p-2 sm:p-4">
        <h3 className="mb-0.5 font-serif text-sm font-semibold leading-tight tracking-tight text-foreground sm:mb-1 sm:text-lg">
          {product.name}
        </h3>
        <p className="mb-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground sm:mb-3 sm:line-clamp-3 sm:text-sm sm:leading-relaxed">
          {product.description}
        </p>
        <p className="font-serif text-base font-bold text-primary sm:text-xl">
          {formatPrice(product.price)}
        </p>
      </CardContent>
    </Card>
  );
}
