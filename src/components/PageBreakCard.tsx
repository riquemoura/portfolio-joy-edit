import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, FileText, Trash2 } from 'lucide-react';

interface PageBreakCardProps {
  index: number;
  totalProducts: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveTo: (newIndex: number) => void;
  onRemove: () => void;
}

export function PageBreakCard({ 
  index, 
  totalProducts,
  onMoveUp, 
  onMoveDown,
  onMoveTo,
  onRemove,
}: PageBreakCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
    
    if (!isNaN(newPosition) && newPosition >= 1 && newPosition <= totalProducts) {
      const newIndex = newPosition - 1;
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
    setIsEditing(false);
    setEditValue('');
  };

  return (
    <Card className="overflow-hidden border-2 border-dashed border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
      {/* Área visual da quebra de página */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-amber-100/80 to-amber-200/80 dark:from-amber-900/30 dark:to-amber-800/30">
          {/* Controles de posição */}
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
              <div className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1">
                <FileText className="h-4 w-4 text-white" />
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
                className="flex cursor-pointer items-center gap-2 rounded-full bg-amber-500 px-4 py-2 transition-transform hover:scale-105 active:scale-95"
                title="Clique para editar a posição"
              >
                <FileText className="h-4 w-4 text-white" />
                <span className="text-lg font-bold text-white">
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
      
      {/* Conteúdo */}
      <div className="flex items-center justify-between p-2 sm:p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-600" />
          <span className="font-serif text-sm font-semibold text-amber-700 dark:text-amber-400 sm:text-base">
            Quebra de Página
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onRemove}
          title="Remover quebra de página"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}