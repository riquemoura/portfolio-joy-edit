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
  const imageSize = 70;
  const startY = 45;
  const cardPadding = 5;
  const lineHeight = 3.5; // altura de cada linha de descrição

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
    pdfDoc.setFontSize(24);
    pdfDoc.setTextColor(40, 40, 40);
    pdfDoc.text(catalogTitle, pageWidth / 2, 25, { align: 'center' });
    
    pdfDoc.setDrawColor(180, 160, 140);
    pdfDoc.setLineWidth(0.5);
    pdfDoc.line(margin, 32, pageWidth - margin, 32);
  };

  const addFooter = (pdfDoc: jsPDF, pageNum: number, totalPages: number) => {
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(10);
    pdfDoc.setTextColor(120, 120, 120);
    pdfDoc.text(
      `Página ${pageNum} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  };
  // Função para calcular altura do card baseado na descrição
  const calculateCardHeight = (description: string): number => {
    const textWidth = cardWidth - 10;
    const descLines = pdf.splitTextToSize(description, textWidth);
    const baseHeight = imageSize + 5 + 8 + 5; // imagem + espaço + nome + espaço
    const descHeight = descLines.length * lineHeight;
    const priceHeight = 8;
    return baseHeight + descHeight + priceHeight + cardPadding * 2;
  };

  // Organiza produtos em páginas dinamicamente
  const pages: Product[][] = [];
  let currentPage: Product[] = [];
  let currentY = startY;
  let currentCol = 0;
  let rowHeights: number[] = [];

  for (const product of products) {
    const cardHeight = calculateCardHeight(product.description);
    
    // Se é uma nova linha (col 0) ou segunda coluna
    if (currentCol === 0) {
      rowHeights.push(cardHeight);
    } else {
      // Atualiza altura da linha para o maior card
      rowHeights[rowHeights.length - 1] = Math.max(rowHeights[rowHeights.length - 1], cardHeight);
    }

    const rowHeight = rowHeights[rowHeights.length - 1];
    
    // Verifica se cabe na página atual
    if (currentY + rowHeight > pageHeight - 20) {
      // Nova página
      if (currentPage.length > 0) {
        pages.push(currentPage);
      }
      currentPage = [product];
      currentY = startY + cardHeight + 10;
      currentCol = 1;
      rowHeights = [cardHeight];
    } else {
      currentPage.push(product);
      if (currentCol === 1) {
        // Fim da linha, avança Y
        currentY += rowHeight + 10;
        currentCol = 0;
      } else {
        currentCol = 1;
      }
    }
  }
  
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    await addBackground(pdf);
    addHeader(pdf);

    const pageProducts = pages[pageIndex];
    let yPosition = startY;
    let maxRowHeight = 0;

    for (let i = 0; i < pageProducts.length; i++) {
      const product = pageProducts[i];
      const col = i % 2;
      const cardHeight = calculateCardHeight(product.description);
      
      if (col === 0) {
        if (i > 0) {
          yPosition += maxRowHeight + 10;
        }
        maxRowHeight = cardHeight;
      } else {
        maxRowHeight = Math.max(maxRowHeight, cardHeight);
      }

      const x = margin + col * (cardWidth + margin);
      const y = yPosition;

      // Card background
      pdf.setFillColor(250, 250, 250);
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

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
