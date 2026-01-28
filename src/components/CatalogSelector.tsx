import { useState } from 'react';
import { Catalog } from '@/types/catalog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FolderOpen, Plus, Trash2, Check, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CatalogSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogs: Catalog[];
  currentCatalog: Catalog | null;
  onSelect: (catalog: Catalog) => void;
  onCreate: (name: string) => Promise<Catalog | null>;
  onDelete: (id: string) => Promise<boolean>;
  onRename: (id: string, name: string) => Promise<boolean>;
}

export function CatalogSelector({
  open,
  onOpenChange,
  catalogs,
  currentCatalog,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: CatalogSelectorProps) {
  const [newCatalogName, setNewCatalogName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = async () => {
    if (!newCatalogName.trim()) return;
    
    const catalog = await onCreate(newCatalogName.trim());
    if (catalog) {
      setNewCatalogName('');
      setIsCreating(false);
      onSelect(catalog);
      onOpenChange(false);
    }
  };

  const handleSelect = (catalog: Catalog) => {
    onSelect(catalog);
    onOpenChange(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (catalogs.length <= 1) return; // Não permite deletar o último catálogo
    await onDelete(id);
  };

  const handleStartEdit = (catalog: Catalog, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(catalog.id);
    setEditingName(catalog.name);
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingId || !editingName.trim()) return;
    await onRename(editingId, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Meus Catálogos
          </DialogTitle>
          <DialogDescription>
            Selecione um catálogo existente ou crie um novo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {catalogs.map((catalog) => (
            <div
              key={catalog.id}
              onClick={() => editingId !== catalog.id && handleSelect(catalog)}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                currentCatalog?.id === catalog.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              )}
            >
              {editingId === catalog.id ? (
                <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(e as unknown as React.MouseEvent);
                      if (e.key === 'Escape') handleCancelEdit(e as unknown as React.MouseEvent);
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {currentCatalog?.id === catalog.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                    <span className="font-medium">{catalog.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => handleStartEdit(catalog, e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {catalogs.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(catalog.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          {isCreating ? (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-primary">
              <Input
                placeholder="Nome do novo catálogo"
                value={newCatalogName}
                onChange={(e) => setNewCatalogName(e.target.value)}
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewCatalogName('');
                  }
                }}
              />
              <Button size="sm" onClick={handleCreate} disabled={!newCatalogName.trim()}>
                Criar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setNewCatalogName('');
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Catálogo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
