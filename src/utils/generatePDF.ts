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
  const productWidth = (pageWidth - margin * 3) / 2;
  const productHeight = 90;
  const productsPerPage = 4;
  const startY = 45;

  const addBackground = async (pdfDoc: jsPDF) => {
    if (backgroundImage) {
      try {
        const img = await loadImage(backgroundImage);
        pdfDoc.addImage(img, 'JPEG', 0, 0, pageWidth, pageHeight);
        // Add semi-transparent white overlay for readability
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
    
    // Decorative line
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
      const x = margin + col * (productWidth + margin);
      const y = startY + row * (productHeight + 10);

      // Product card background
      pdf.setFillColor(250, 250, 250);
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(x, y, productWidth, productHeight, 3, 3, 'FD');

      // Product image
      const imgSize = 35;
      const imgX = x + 5;
      const imgY = y + 5;

      if (product.image) {
        try {
          const img = await loadImage(product.image);
          pdf.addImage(img, 'JPEG', imgX, imgY, imgSize, imgSize);
        } catch (error) {
          pdf.setFillColor(240, 240, 240);
          pdf.rect(imgX, imgY, imgSize, imgSize, 'F');
        }
      } else {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(imgX, imgY, imgSize, imgSize, 'F');
      }

      // Product details
      const textX = imgX + imgSize + 8;
      const textWidth = productWidth - imgSize - 18;

      // Name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40);
      const nameLines = pdf.splitTextToSize(product.name, textWidth);
      pdf.text(nameLines.slice(0, 1), textX, imgY + 6);

      // Description - 3 lines
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      const descLines = pdf.splitTextToSize(product.description, textWidth);
      const displayLines = descLines.slice(0, 3);
      pdf.text(displayLines, textX, imgY + 14);

      // Price
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(120, 90, 60);
      pdf.text(formatPrice(product.price), textX, imgY + imgSize - 2);
    }

    addFooter(pdf, pageIndex + 1, totalPages);
  }

  pdf.save(`${catalogTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
