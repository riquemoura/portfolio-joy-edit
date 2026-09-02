import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ImageIcon,
  FileText,
  Pencil,
  Check,
  Save,
  Plus,
  ArrowUpDown,
  FolderOpen,
  SeparatorHorizontal,
  CreditCard,
  Trash2,
  LogIn,
  LogOut,
  Menu,
  CopyX,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CatalogHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  onCustomizeBackground: () => void;
  onGeneratePDF: () => void;
  isGeneratingPDF: boolean;
  onSaveProject: () => void;
  isSaving: boolean;
  onAddProduct: () => void;
  onAddPageBreak: () => void;
  onEditOrder: () => void;
  isEditingOrder: boolean;
  onOpenCatalogs: () => void;
  onExportCards: () => void;
  onRemoveAllPageBreaks: () => void;
  pageBreaksCount: number;
  canEdit: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onDuplicateWithoutPrices: () => void;
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
  onAddPageBreak,
  onEditOrder,
  isEditingOrder,
  onOpenCatalogs,
  onExportCards,
  onRemoveAllPageBreaks,
  pageBreaksCount,
  canEdit,
  onSignIn,
  onSignOut,
  onDuplicateWithoutPrices,
}: CatalogHeaderProps) {

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [isRemoveBreaksDialogOpen, setIsRemoveBreaksDialogOpen] = useState(false);

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
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Menu className="mr-2 h-4 w-4" />
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Funções do projeto</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {canEdit && (
                <>
                  <DropdownMenuItem onClick={onAddProduct}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Produto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEditOrder}>
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    {isEditingOrder ? 'Concluir Ordem' : 'Editar Ordem'}
                  </DropdownMenuItem>
                  {isEditingOrder && (
                    <DropdownMenuItem onClick={onAddPageBreak}>
                      <SeparatorHorizontal className="mr-2 h-4 w-4 text-amber-600" />
                      Adicionar Quebra de Página
                    </DropdownMenuItem>
                  )}
                  {isEditingOrder && pageBreaksCount > 0 && (
                    <DropdownMenuItem
                      onClick={() => setIsRemoveBreaksDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover Todas as Quebras
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onCustomizeBackground}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Customizar Fundo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDuplicateWithoutPrices}>
                    <CopyX className="mr-2 h-4 w-4" />
                    Copiar Catálogo sem Preços
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem onClick={onOpenCatalogs}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Meus Catálogos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportCards}>
                <CreditCard className="mr-2 h-4 w-4" />
                Exportar Cards
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onGeneratePDF} disabled={isGeneratingPDF}>
                <FileText className="mr-2 h-4 w-4" />
                {isGeneratingPDF ? 'Gerando PDF...' : 'Gerar PDF'}
              </DropdownMenuItem>

              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSaveProject} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Projeto'}
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              {canEdit ? (
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onSignIn}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={isRemoveBreaksDialogOpen} onOpenChange={setIsRemoveBreaksDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover todas as quebras de página?</AlertDialogTitle>
            <AlertDialogDescription>
              {pageBreaksCount} quebra{pageBreaksCount !== 1 ? 's' : ''} de página ser{pageBreaksCount !== 1 ? 'ão' : 'á'} removida{pageBreaksCount !== 1 ? 's' : ''} deste catálogo. Os produtos serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRemoveAllPageBreaks}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
