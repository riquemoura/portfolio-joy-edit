import html2canvas from 'html2canvas';
import { Product } from '@/types/product';

export async function generateProductCardBlob(product: Product): Promise<{ blob: Blob; filename: string } | null> {
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

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        // Clean filename - remove special characters
        const cleanName = product.name
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .toLowerCase();
        const filename = `card_${cleanName}.png`;

        resolve({ blob, filename });
      }, 'image/png');
    });
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

// Legacy function for single card download
export async function generateProductCard(product: Product): Promise<void> {
  const result = await generateProductCardBlob(product);
  if (!result) return;

  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  link.click();
  URL.revokeObjectURL(url);
}
