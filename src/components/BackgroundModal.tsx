import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImagePlus, Trash2 } from 'lucide-react';

interface BackgroundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBackground: string | null;
  onBackgroundChange: (background: string | null) => void;
}

export function BackgroundModal({
  open,
  onOpenChange,
  currentBackground,
  onBackgroundChange,
}: BackgroundModalProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(
    currentBackground
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    onBackgroundChange(previewImage);
    onOpenChange(false);
  };

  const handleRemove = () => {
    setPreviewImage(null);
    onBackgroundChange(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Customizar Fundo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Imagem de Fundo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Background preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <ImagePlus className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={!previewImage && !currentBackground}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover Fundo
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleApply}>Aplicar</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
