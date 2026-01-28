import { useState } from 'react';
import { Catalog } from '@/types/catalog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogs: Catalog[];
  currentCatalogId: string | null;
  onGenerate: (catalogIds: string[]) => Promise<void>;
  isGenerating: boolean;
}

export function PDFGeneratorModal({
  open,
  onOpenChange,
  catalogs,
  currentCatalogId,
  onGenerate,
  isGenerating,
}: PDFGeneratorModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => 
    currentCatalogId ? [currentCatalogId] : []
  );

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === catalogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(catalogs.map((c) => c.id));
    }
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) return;
    await onGenerate(selectedIds);
    onOpenChange(false);
  };

  // Reset selection when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && currentCatalogId) {
      setSelectedIds([currentCatalogId]);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar PDF
          </DialogTitle>
          <DialogDescription>
            Selecione os catálogos que deseja incluir no PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto">
          {/* Select All */}
          <div
            onClick={handleSelectAll}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              selectedIds.length === catalogs.length
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-accent'
            )}
          >
            <Checkbox
              checked={selectedIds.length === catalogs.length && catalogs.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="font-medium">Selecionar todos</span>
            <span className="text-sm text-muted-foreground ml-auto">
              {catalogs.length} catálogo{catalogs.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="border-t border-border my-2" />

          {catalogs.map((catalog) => (
            <div
              key={catalog.id}
              onClick={() => handleToggle(catalog.id)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                selectedIds.includes(catalog.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              )}
            >
              <Checkbox
                checked={selectedIds.includes(catalog.id)}
                onCheckedChange={() => handleToggle(catalog.id)}
              />
              <span className="font-medium">{catalog.name}</span>
              {catalog.id === currentCatalogId && (
                <span className="text-xs text-muted-foreground ml-auto">(atual)</span>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={selectedIds.length === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Gerar {selectedIds.length > 1 ? `${selectedIds.length} PDFs` : 'PDF'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
