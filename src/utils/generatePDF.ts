import jsPDF from 'jspdf';
import { Product } from '@/types/product';
import { MAX_PRODUCT_DESCRIPTION_LENGTH } from '@/constants/product';

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
  const imageSize = Math.min(70, (pageWidth - margin * 3) / 2 - 4 * 2); // Imagem maior, respeitando a largura do card
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

  // Organiza produtos em páginas de 4 produtos cada, respeitando quebras de página
  const pages: Product[][] = [];
  let currentPage: Product[] = [];
  
  for (const product of products) {
    // Se encontrar uma quebra de página
    if (product.isPageBreak) {
      // Se há produtos na página atual, fecha ela
      if (currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
      }
      // Inicia nova página (a quebra força uma nova página mesmo vazia)
      continue;
    }
    
    // Adiciona produto à página atual
    currentPage.push(product);
    
    // Se atingiu 4 produtos, fecha a página
    if (currentPage.length === productsPerPage) {
      pages.push(currentPage);
      currentPage = [];
    }
  }
  
  // Adiciona última página se houver produtos restantes
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }
  
  // Se não houver produtos, retorna sem gerar PDF
  if (pages.length === 0) {
    return;
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

      // Text area below image — tudo deve caber dentro do card (grade fixa)
      const textY = imgY + imageSize + 5;
      const textX = x + cardPadding;
      const textWidth = cardWidth - cardPadding * 2;
      const cardBottomY = y + rowHeight;

      // Price ancorado na base do card (posição fixa, mesma em todos os cards)
      const priceFontSize = 13;
      const priceY = cardBottomY - cardPadding - 1;

      // Product name (1 linha)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(40, 40, 40);
      const nameLines = pdf.splitTextToSize(product.name, textWidth);
      pdf.text(nameLines.slice(0, 1), textX, textY + 4);

      // Description com auto-regulação: reduz fonte e nº de linhas até caber
      // no espaço entre o nome e o preço, sem nunca sair da caixa
      const descStartY = textY + 9;
      const descMaxBottom = priceY - 7; // folga antes do preço
      let descFontSize = 8;
      let descLines: string[] = [];
      let descLineH = lineHeight;

      while (descFontSize >= 6) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(descFontSize);
        descLineH = lineHeight * (descFontSize / 8);
        const lines: string[] = pdf.splitTextToSize(product.description || '', textWidth);
        const maxLines = Math.max(1, Math.floor((descMaxBottom - descStartY) / descLineH));
        if (lines.length <= maxLines) {
          descLines = lines;
          break;
        }
        descFontSize -= 0.5;
      }

      // Se ainda assim não couber, trunca com reticências na última linha visível
      if (descLines.length === 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(descFontSize);
        descLineH = lineHeight * (descFontSize / 8);
        const maxLines = Math.max(1, Math.floor((descMaxBottom - descStartY) / descLineH));
        const allLines: string[] = pdf.splitTextToSize(product.description || '', textWidth);
        descLines = allLines.slice(0, maxLines);
        if (allLines.length > maxLines && descLines.length > 0) {
          let last = descLines[descLines.length - 1];
          while (last.length > 0 && pdf.getTextWidth(last + '…') > textWidth) {
            last = last.slice(0, -1);
          }
          descLines[descLines.length - 1] = last + '…';
        }
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(descFontSize);
      pdf.setTextColor(100, 100, 100);
      pdf.text(descLines, textX, descStartY + 1);

      // Price — sempre dentro da caixa, na base
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(priceFontSize);
      pdf.setTextColor(120, 90, 60);
      pdf.text(formatPrice(product.price), textX, priceY);
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
