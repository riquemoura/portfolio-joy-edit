import { supabase } from '@/integrations/supabase/client';

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

// Verifica se a string é base64
const isBase64Image = (url: string | null): boolean => {
  return url !== null && url.startsWith('data:image');
};

export interface MigrationResult {
  total: number;
  migrated: number;
  failed: number;
  errors: string[];
}

// Migra todas as imagens base64 existentes para o Storage
export async function migrateBase64ImagesToStorage(
  onProgress?: (current: number, total: number) => void
): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Busca todos os produtos com imagens base64
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, image_url')
      .not('image_url', 'is', null);

    if (fetchError) {
      throw new Error(`Erro ao buscar produtos: ${fetchError.message}`);
    }

    if (!products || products.length === 0) {
      console.log('Nenhum produto encontrado para migrar');
      return result;
    }

    // Filtra apenas produtos com imagens base64
    const productsToMigrate = products.filter(p => isBase64Image(p.image_url));
    result.total = productsToMigrate.length;

    console.log(`Encontrados ${productsToMigrate.length} produtos com imagens base64`);

    for (let i = 0; i < productsToMigrate.length; i++) {
      const product = productsToMigrate[i];
      
      try {
        if (!product.image_url) continue;

        // Converte base64 para blob
        const blob = base64ToBlob(product.image_url);
        const fileName = `product-${product.id}-${Date.now()}.jpg`;

        // Faz upload para o storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Upload falhou: ${uploadError.message}`);
        }

        // Obtém URL pública
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path);

        // Atualiza o produto com a nova URL
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: urlData.publicUrl })
          .eq('id', product.id);

        if (updateError) {
          throw new Error(`Atualização falhou: ${updateError.message}`);
        }

        result.migrated++;
        console.log(`Migrado: ${product.name} (${i + 1}/${productsToMigrate.length})`);
        
        onProgress?.(i + 1, productsToMigrate.length);

      } catch (error) {
        result.failed++;
        const errorMsg = `Erro em ${product.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return result;

  } catch (error) {
    console.error('Erro na migração:', error);
    result.errors.push(error instanceof Error ? error.message : 'Erro desconhecido');
    return result;
  }
}
