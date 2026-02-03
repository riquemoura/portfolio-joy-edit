import html2canvas from 'html2canvas';
import { Product } from '@/types/product';

// Queue system for sequential card generation with save dialog
class CardExportQueue {
  private queue: Product[] = [];
  private isProcessing = false;
  private onProgress?: (current: number, total: number, productName: string) => void;
  private onComplete?: () => void;
  private onError?: (error: string) => void;
  private total = 0;
  private current = 0;

  setCallbacks(
    onProgress?: (current: number, total: number, productName: string) => void,
    onComplete?: () => void,
    onError?: (error: string) => void
  ) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  async addToQueue(products: Product[]): Promise<void> {
    this.queue = [...products];
    this.total = products.length;
    this.current = 0;

    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      this.onComplete?.();
      return;
    }

    this.isProcessing = true;
    const product = this.queue.shift()!;
    this.current++;

    this.onProgress?.(this.current, this.total, product.name);

    try {
      const success = await generateSingleCardWithSaveDialog(product);
      if (!success) {
        // User cancelled - stop the queue
        this.queue = [];
        this.isProcessing = false;
        this.onComplete?.();
        return;
      }
    } catch (error) {
      console.error(`Erro ao gerar card para ${product.name}:`, error);
      this.onError?.(`Erro ao exportar ${product.name}`);
    }

    // Process next item
    await this.processQueue();
  }
}

// Singleton instance
export const cardExportQueue = new CardExportQueue();

// Export multiple cards with queue
export async function exportMultipleCards(
  products: Product[],
  onProgress?: (current: number, total: number, productName: string) => void,
  onComplete?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  cardExportQueue.setCallbacks(onProgress, onComplete, onError);
  await cardExportQueue.addToQueue(products);
}

// Generate a single card with native save dialog
async function generateSingleCardWithSaveDialog(product: Product): Promise<boolean> {
  // Create the card canvas
  const canvas = await createCardCanvas(product);
  if (!canvas) return false;

  // Get clean filename
  const cleanName = product.name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
  const fileName = `card_${cleanName}.png`;

  // Try using File System Access API (modern browsers - opens native save dialog)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Imagem PNG',
            accept: { 'image/png': ['.png'] },
          },
        ],
      });

      const writable = await handle.createWritable();
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });

      if (blob) {
        await writable.write(blob);
        await writable.close();
        return true;
      }
      return false;
    } catch (error: any) {
      // User cancelled the save dialog
      if (error.name === 'AbortError') {
        return false;
      }
      console.error('Erro ao salvar arquivo:', error);
      // Fall back to traditional download
      return await fallbackDownload(canvas, fileName);
    }
  } else {
    // Fallback for browsers that don't support File System Access API
    return await fallbackDownload(canvas, fileName);
  }
}

// Fallback download method for older browsers
async function fallbackDownload(canvas: HTMLCanvasElement, fileName: string): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(false);
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Wait and cleanup
      setTimeout(() => {
        URL.revokeObjectURL(url);
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
  await generateSingleCardWithSaveDialog(product);
}
