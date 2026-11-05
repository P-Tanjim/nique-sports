export async function downloadReceiptPdf(orderNo) {
  if (typeof document === 'undefined') return;

  const node = document.getElementById('receipt-pdf-root');
  if (!node) {
    throw new Error('Receipt element not found');
  }

  // Dynamic imports so they never load for normal visitors
  const [html2canvasModule, jspdfModule] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  const html2canvas = html2canvasModule.default || html2canvasModule.html2canvas || html2canvasModule;
  const JsPdfClass = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;

  // 1. Wait for document fonts to be ready
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  // 2. Wait until every <img> inside the node has loaded
  const images = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    }),
  );

  // 3. Render canvas
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    onclone: (doc) => {
      const el = doc.getElementById('receipt-pdf-root');
      if (el) {
        el.style.position = 'static';
        el.style.left = '0';
      }
    },
  });

  // 4. Create single page jsPDF document
  const pdfWidth = 100;
  const pdfHeight = (100 * canvas.height) / canvas.width;

  const pdf = new JsPdfClass({
    orientation: 'portrait',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  });

  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`NiqueSports-Receipt-${orderNo}.pdf`);
}

