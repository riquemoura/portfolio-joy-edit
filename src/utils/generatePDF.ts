import jsPDF from 'jspdf';
import { Product } from '@/types/product';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export interface CatalogData {
  id: string;
  name: string;
  products: Product[];
  backgroundImage: string | null;
}

export async function generateCatalogPDF(
  products: Product[],
  catalogTitle: string,
  backgroundImage: string | null
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const cardWidth = (pageWidth - margin * 3) / 2;
  const imageSize = 55; // Tamanho da imagem reduzido para caber 4 por página
  const startY = 40;
  const cardPadding = 4;
  const lineHeight = 3.2; // altura de cada linha de descrição
  const productsPerPage = 4; // 2x2 grid
  const cardHeight = (pageHeight - startY - 25) / 2 - 5; // Altura fixa para 2 linhas

  const addBackground = async (pdfDoc: jsPDF) => {
    if (backgroundImage) {
      try {
        const img = await loadImage(backgroundImage);
        pdfDoc.addImage(img, 'JPEG', 0, 0, pageWidth, pageHeight);
        pdfDoc.setFillColor(255, 255, 255);
        pdfDoc.saveGraphicsState();
        (pdfDoc as any).internal.write('0.85 g');
        pdfDoc.rect(0, 0, pageWidth, pageHeight, 'F');
        pdfDoc.restoreGraphicsState();
      } catch (error) {
        console.error('Error loading background image:', error);
      }
    }
  };

  const addHeader = (pdfDoc: jsPDF) => {
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(22);
    pdfDoc.setTextColor(40, 40, 40);
    pdfDoc.text(catalogTitle, pageWidth / 2, 22, { align: 'center' });
    
    pdfDoc.setDrawColor(180, 160, 140);
    pdfDoc.setLineWidth(0.5);
    pdfDoc.line(margin, 28, pageWidth - margin, 28);
  };

  const addFooter = (pdfDoc: jsPDF, pageNum: number, totalPages: number) => {
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(9);
    pdfDoc.setTextColor(120, 120, 120);
    pdfDoc.text(
      `Página ${pageNum} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  };

  // Organiza produtos em páginas de 4 produtos cada
  const pages: Product[][] = [];
  for (let i = 0; i < products.length; i += productsPerPage) {
    pages.push(products.slice(i, i + productsPerPage));
  }

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    await addBackground(pdf);
    addHeader(pdf);

    const pageProducts = pages[pageIndex];
    const rowHeight = cardHeight;

    for (let i = 0; i < pageProducts.length; i++) {
      const product = pageProducts[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      
      const x = margin + col * (cardWidth + margin);
      const y = startY + row * (rowHeight + 5);

      // Card background
      pdf.setFillColor(250, 250, 250);
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(x, y, cardWidth, rowHeight, 3, 3, 'FD');

      // Product image - centered at top
      const imgX = x + (cardWidth - imageSize) / 2;
      const imgY = y + cardPadding;

      if (product.image) {
        try {
          const img = await loadImage(product.image);
          pdf.addImage(img, 'JPEG', imgX, imgY, imageSize, imageSize);
        } catch (error) {
          pdf.setFillColor(240, 240, 240);
          pdf.rect(imgX, imgY, imageSize, imageSize, 'F');
        }
      } else {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(imgX, imgY, imageSize, imageSize, 'F');
      }

      // Text area below image
      const textY = imgY + imageSize + 5;
      const textX = x + cardPadding;
      const textWidth = cardWidth - cardPadding * 2;

      // Product name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(40, 40, 40);
      const nameLines = pdf.splitTextToSize(product.name, textWidth);
      pdf.text(nameLines.slice(0, 1), textX, textY + 4);

      // Description - ALL lines (auto-adjustable)
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      const descLines = pdf.splitTextToSize(product.description, textWidth);
      pdf.text(descLines, textX, textY + 10);

      // Price below description
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(120, 90, 60);
      pdf.text(formatPrice(product.price), textX, textY + 10 + (descLines.length * lineHeight) + 5);
    }

    addFooter(pdf, pageIndex + 1, pages.length);
  }

  pdf.save(`${catalogTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export async function generateMultipleCatalogsPDF(
  catalogs: CatalogData[]
): Promise<void> {
  for (const catalog of catalogs) {
    if (catalog.products.length > 0) {
      await generateCatalogPDF(catalog.products, catalog.name, catalog.backgroundImage);
    }
  }
}
