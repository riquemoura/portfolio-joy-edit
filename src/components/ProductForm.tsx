import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImagePlus, Crop, Loader2, ArrowRight } from 'lucide-react';
import { ImageCropper } from './ImageCropper';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (product: Omit<Product, 'id'>) => void;
  editingProduct?: Product | null;
  onUpdate?: (id: string, updates: Partial<Omit<Product, 'id'>>) => void;
  onSaveAndNext?: (id: string, updates: Partial<Omit<Product, 'id'>>) => void;
  hasNextProduct?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

// Função para converter base64 para Blob
const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
};

// Verifica se a string é uma URL do Storage
const isStorageUrl = (url: string): boolean => {
  return url.includes('supabase.co/storage') || url.startsWith('https://');
};

export function ProductForm({
  open,
  onOpenChange,
  onSubmit,
  editingProduct,
  onUpdate,
  onSaveAndNext,
  hasNextProduct,
  currentIndex,
  totalCount,
}: ProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [tempImage, setTempImage] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [goToNext, setGoToNext] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setDescription(editingProduct.description);
      setPrice(editingProduct.price.toString());
      setImage(editingProduct.image);
    } else {
      resetForm();
    }
  }, [editingProduct, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setImage('');
    setTempImage('');
    setShowCropper(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload da imagem para o Supabase Storage
  const uploadImageToStorage = async (base64Image: string): Promise<string> => {
    // Se já for uma URL do storage, retorna ela mesma
    if (isStorageUrl(base64Image)) {
      return base64Image;
    }

    // Se for base64, faz upload
    if (base64Image.startsWith('data:')) {
      const blob = base64ToBlob(base64Image);
      const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        throw new Error('Falha ao fazer upload da imagem');
      }

      // Retorna a URL pública
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);
      
      return urlData.publicUrl;
    }

    return base64Image;
  };

  const handleCropComplete = async (croppedImage: string) => {
    setIsUploading(true);
    try {
      // Faz upload da imagem imediatamente após o crop
      const imageUrl = await uploadImageToStorage(croppedImage);
      setImage(imageUrl);
      setShowCropper(false);
      setTempImage('');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível fazer upload da imagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsUploading(true);
    try {
      // Garante que a imagem está no storage (caso não tenha sido feito crop)
      let finalImage = image;
      if (image && image.startsWith('data:')) {
        finalImage = await uploadImageToStorage(image);
      }

      const productData = {
        name,
        description,
        price: parseFloat(price) || 0,
        image: finalImage,
      };

      if (editingProduct && goToNext && onSaveAndNext) {
        onSaveAndNext(editingProduct.id, productData);
        setGoToNext(false);
        // mantém modal aberto; parent troca o editingProduct
      } else if (editingProduct && onUpdate) {
        onUpdate(editingProduct.id, productData);
        onOpenChange(false);
        resetForm();
      } else {
        onSubmit(productData);
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o produto. Tente novamente.',
        variant: 'destructive',
      });
      setGoToNext(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {editingProduct
              ? `Editar Produto${typeof currentIndex === 'number' && totalCount ? ` (${currentIndex + 1} de ${totalCount})` : ''}`
              : 'Adicionar Produto'}
          </DialogTitle>
        </DialogHeader>
        
        {showCropper ? (
          isUploading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Fazendo upload da imagem...</p>
            </div>
          ) : (
            <ImageCropper
              image={tempImage}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          )
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Produto Premium"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o produto em até 3 linhas..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
                required
                autoFocus={!!editingProduct}
                onFocus={(e) => editingProduct && e.currentTarget.select()}
              />
            </div>

            <div className="space-y-2">
              <Label>Imagem do Produto</Label>
              <div className="flex items-center gap-4">
                {image ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                    <img
                      src={image}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-1 right-1 h-6 w-6"
                      onClick={() => {
                        setTempImage(image);
                        setShowCropper(true);
                      }}
                    >
                      <Crop className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full cursor-pointer"
                    disabled={isUploading}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUploading} onClick={() => setGoToNext(false)}>
                {isUploading && !goToNext ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingProduct ? 'Salvar Alterações' : 'Adicionar'
                )}
              </Button>
              {editingProduct && hasNextProduct && onSaveAndNext && (
                <Button
                  type="submit"
                  disabled={isUploading}
                  onClick={() => setGoToNext(true)}
                >
                  {isUploading && goToNext ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Salvar e próximo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
