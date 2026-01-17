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
      <div className="relative aspect-square overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-muted-foreground">Sem imagem</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-background/90 backdrop-blur-sm"
            onClick={() => onEdit(product)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 bg-destructive/90 backdrop-blur-sm"
            onClick={() => onRemove(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="mb-1 font-serif text-lg font-semibold tracking-tight text-foreground">
          {product.name}
        </h3>
        <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <p className="font-serif text-xl font-bold text-primary">
          {formatPrice(product.price)}
        </p>
      </CardContent>
    </Card>
  );
}
