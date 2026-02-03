import { useState, useRef, useEffect } from 'react';
import { Product } from '@/types/product';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';

interface ProductCardReorderProps {
  product: Product;
  index: number;
  totalProducts: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveTo: (newIndex: number) => void;
}

export function ProductCardReorder({ 
  product, 
  index, 
  totalProducts,
  onMoveUp, 
  onMoveDown,
  onMoveTo,
}: ProductCardReorderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleStartEdit = () => {
    setEditValue(String(index + 1));
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleConfirmEdit = () => {
    const newPosition = parseInt(editValue, 10);
    
    // Valida se é um número válido dentro do range
    if (!isNaN(newPosition) && newPosition >= 1 && newPosition <= totalProducts) {
      const newIndex = newPosition - 1; // Converte para índice (0-based)
      if (newIndex !== index) {
        onMoveTo(newIndex);
      }
    }
    
    setIsEditing(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue('');
    }
  };

  const handleBlur = () => {
    // Cancela a edição ao perder o foco
    setIsEditing(false);
    setEditValue('');
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
            
            {isEditing ? (
              <div className="flex items-center gap-1 rounded-full bg-primary px-2 py-1">
                <GripVertical className="h-4 w-4 text-primary-foreground" />
                <Input
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={totalProducts}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  className="h-8 w-14 border-none bg-background/90 p-1 text-center text-lg font-bold focus-visible:ring-0"
                />
              </div>
            ) : (
              <button
                onClick={handleStartEdit}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 transition-transform hover:scale-105 active:scale-95"
                title="Clique para editar a posição"
              >
                <GripVertical className="h-4 w-4 text-primary-foreground" />
                <span className="text-lg font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </button>
            )}
            
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