import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageIcon, FileText, Pencil, Check, Save, Plus, ArrowUpDown } from 'lucide-react';

interface CatalogHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  onCustomizeBackground: () => void;
  onGeneratePDF: () => void;
  isGeneratingPDF: boolean;
  onSaveProject: () => void;
  isSaving: boolean;
  onAddProduct: () => void;
  onEditOrder: () => void;
  isEditingOrder: boolean;
}

export function CatalogHeader({
  title,
  onTitleChange,
  onCustomizeBackground,
  onGeneratePDF,
  isGeneratingPDF,
  onSaveProject,
  isSaving,
  onAddProduct,
  onEditOrder,
  isEditingOrder,
}: CatalogHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);

  const handleSave = () => {
    onTitleChange(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(title);
      setIsEditing(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-64 font-serif text-xl"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleSave}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
          <Button variant="outline" onClick={onEditOrder}>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {isEditingOrder ? 'Concluir Ordem' : 'Editar Ordem'}
          </Button>
          <Button variant="outline" onClick={onCustomizeBackground}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Customizar Fundo
          </Button>
          <Button variant="outline" onClick={onSaveProject} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Projeto'}
          </Button>
          <Button onClick={onGeneratePDF} disabled={isGeneratingPDF}>
            <FileText className="mr-2 h-4 w-4" />
            {isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </div>
      </div>
    </header>
  );
}
