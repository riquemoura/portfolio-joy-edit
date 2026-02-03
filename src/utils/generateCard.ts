import html2canvas from 'html2canvas';
import { Product } from '@/types/product';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
};

export async function generateProductCardBlob(product: Product): Promise<{ blob: Blob; filename: string } | null> {
  // Create a container div for the card
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  // Create the card element - matching PDF proportions
  // PDF card: ~87.5mm width, keeping similar aspect ratio
  const card = document.createElement('div');
  card.style.width = '350px';
  card.style.backgroundColor = '#fafafa';
  card.style.border = '1px solid #dcdcdc';
  card.style.borderRadius = '12px';
  card.style.overflow = 'hidden';
  card.style.fontFamily = 'Helvetica, Arial, sans-serif';
  card.style.padding = '16px';

  // Image section - centered like in PDF
  const imageContainer = document.createElement('div');
  imageContainer.style.width = '100%';
  imageContainer.style.display = 'flex';
  imageContainer.style.justifyContent = 'center';
  imageContainer.style.marginBottom = '20px';

  if (product.image) {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.style.width = '220px';
    img.style.height = '220px';
    img.style.objectFit = 'cover';
    
    // Wait for image to load
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = product.image;
    });
    
    imageContainer.appendChild(img);
  } else {
    // Placeholder for no image - matching PDF style
    const placeholder = document.createElement('div');
    placeholder.style.width = '220px';
    placeholder.style.height = '220px';
    placeholder.style.backgroundColor = '#f0f0f0';
    imageContainer.appendChild(placeholder);
  }

  card.appendChild(imageContainer);

  // Product name - matching PDF: helvetica bold, 11pt equivalent
  const name = document.createElement('h2');
  name.textContent = product.name;
  name.style.margin = '0 0 8px 0';
  name.style.fontSize = '18px';
  name.style.fontWeight = '700';
  name.style.color = '#282828';
  name.style.lineHeight = '1.3';
  card.appendChild(name);

  // Description - matching PDF: helvetica normal, 8pt equivalent, color #646464
  if (product.description) {
    const description = document.createElement('p');
    description.textContent = product.description;
    description.style.margin = '0 0 16px 0';
    description.style.fontSize = '13px';
    description.style.fontWeight = '400';
    description.style.color = '#646464';
    description.style.lineHeight = '1.5';
    card.appendChild(description);
  }

  // Price - matching PDF: helvetica bold, 13pt equivalent, color rgb(120, 90, 60)
  const price = document.createElement('div');
  price.textContent = formatPrice(product.price);
  price.style.fontSize = '21px';
  price.style.fontWeight = '700';
  price.style.color = 'rgb(120, 90, 60)';
  card.appendChild(price);

  container.appendChild(card);

  // Wait a bit for rendering
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    // Generate canvas from the card
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#fafafa',
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
