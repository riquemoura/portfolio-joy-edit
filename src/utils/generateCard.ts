import html2canvas from 'html2canvas';
import { Product } from '@/types/product';

// Download a single product card as PNG
export async function downloadProductCard(product: Product): Promise<boolean> {
  console.log('[Card Export] Iniciando geração do card para:', product.name);
  
  // Create the card canvas
  const canvas = await createCardCanvas(product);
  if (!canvas) {
    console.error('[Card Export] Falha ao criar canvas');
    return false;
  }
  
  console.log('[Card Export] Canvas criado com sucesso, dimensões:', canvas.width, 'x', canvas.height);

  // Get clean filename
  const cleanName = product.name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
  const fileName = `card_${cleanName}.png`;
  
  console.log('[Card Export] Gerando blob para download:', fileName);

  // Download the file
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('[Card Export] Falha ao gerar blob');
        resolve(false);
        return;
      }
      
      console.log('[Card Export] Blob criado, tamanho:', blob.size, 'bytes');

      const url = URL.createObjectURL(blob);
      console.log('[Card Export] URL criada:', url);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      console.log('[Card Export] Link adicionado ao DOM, disparando click...');
      link.click();
      console.log('[Card Export] Click disparado');
      document.body.removeChild(link);

      // Cleanup after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
        console.log('[Card Export] Download concluído para:', fileName);
        resolve(true);
      }, 500);
    }, 'image/png');
  });
}

// Create the card canvas
async function createCardCanvas(product: Product): Promise<HTMLCanvasElement | null> {
  // Create a container div for the card
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  // Create the card element
  const card = document.createElement('div');
  card.style.width = '400px';
  card.style.backgroundColor = '#ffffff';
  card.style.borderRadius = '16px';
  card.style.overflow = 'hidden';
  card.style.boxShadow = '0 10px 40px rgba(0,0,0,0.15)';
  card.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  // Image section
  const imageContainer = document.createElement('div');
  imageContainer.style.width = '100%';
  imageContainer.style.height = '300px';
  imageContainer.style.backgroundColor = '#f3f4f6';
  imageContainer.style.display = 'flex';
  imageContainer.style.alignItems = 'center';
  imageContainer.style.justifyContent = 'center';
  imageContainer.style.overflow = 'hidden';

  if (product.image) {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    // Wait for image to load
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = product.image;
    });
    
    imageContainer.appendChild(img);
  } else {
    // Placeholder for no image
    const placeholder = document.createElement('div');
    placeholder.style.width = '80px';
    placeholder.style.height = '80px';
    placeholder.style.backgroundColor = '#d1d5db';
    placeholder.style.borderRadius = '8px';
    imageContainer.appendChild(placeholder);
  }

  card.appendChild(imageContainer);

  // Content section
  const content = document.createElement('div');
  content.style.padding = '24px';

  // Product name
  const name = document.createElement('h2');
  name.textContent = product.name;
  name.style.margin = '0 0 12px 0';
  name.style.fontSize = '24px';
  name.style.fontWeight = '700';
  name.style.color = '#111827';
  name.style.lineHeight = '1.3';
  content.appendChild(name);

  // Description
  if (product.description) {
    const description = document.createElement('p');
    description.textContent = product.description;
    description.style.margin = '0 0 16px 0';
    description.style.fontSize = '14px';
    description.style.color = '#6b7280';
    description.style.lineHeight = '1.6';
    content.appendChild(description);
  }

  // Price
  const price = document.createElement('div');
  price.textContent = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
  price.style.fontSize = '28px';
  price.style.fontWeight = '800';
  price.style.color = '#059669';
  price.style.marginTop = '8px';
  content.appendChild(price);

  card.appendChild(content);
  container.appendChild(card);

  // Wait a bit for rendering
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    // Generate canvas from the card
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    return canvas;
  } catch (error) {
    console.error('Erro ao gerar canvas:', error);
    return null;
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

// Keep backward compatibility
export async function generateProductCard(product: Product): Promise<void> {
  await downloadProductCard(product);
}
