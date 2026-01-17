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
  const cardHeight = 120;
  const imageSize = 55;
  const productsPerPage = 4;
  const startY = 45;

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

  const totalPages = Math.ceil(products.length / productsPerPage);

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    await addBackground(pdf);
    addHeader(pdf);

    const pageProducts = products.slice(
      pageIndex * productsPerPage,
      (pageIndex + 1) * productsPerPage
    );

    for (let i = 0; i < pageProducts.length; i++) {
      const product = pageProducts[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col * (cardWidth + margin);
      const y = startY + row * (cardHeight + 10);

      // Card background
      pdf.setFillColor(250, 250, 250);
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

      // Product image - centered at top
      const imgX = x + (cardWidth - imageSize) / 2;
      const imgY = y + 5;

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
      const textX = x + 5;
      const textWidth = cardWidth - 10;

      // Product name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(40, 40, 40);
      const nameLines = pdf.splitTextToSize(product.name, textWidth);
      pdf.text(nameLines.slice(0, 1), textX, textY + 4);

      // Description - 3 lines
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      const descLines = pdf.splitTextToSize(product.description, textWidth);
      const displayLines = descLines.slice(0, 3);
      pdf.text(displayLines, textX, textY + 10);

      // Price at bottom
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(120, 90, 60);
      pdf.text(formatPrice(product.price), textX, y + cardHeight - 5);
    }

    addFooter(pdf, pageIndex + 1, totalPages);
  }

  pdf.save(`${catalogTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
