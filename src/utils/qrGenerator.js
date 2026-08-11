import QRCode from 'qrcode';
import jsPDF from 'jspdf';

/**
 * Generate individual QR card images using canvas rendering
 * Dengan logo MITRAWISESA & palet warna modern (sama dengan QRCard)
 * Footer identitas KKN dengan layout terpisah
 */
export async function generateQRCards(customers, onProgress = null) {
  const cards = [];
  const total = customers.length;

  const logoImage = await loadLogo();

  for (let index = 0; index < customers.length; index++) {
    const customer = customers[index];
    
    if (onProgress) {
      onProgress(index + 1, total);
    }

    try {
      if (!customer.nama || !customer.blok || !customer.qrHash) {
        console.warn(`Skipping customer ${customer.id} - missing required fields`);
        continue;
      }

      const cardCanvas = document.createElement('canvas');
      const ctx = cardCanvas.getContext('2d');
      
      cardCanvas.width = 800;
      cardCanvas.height = 1080;
      
      // ==========================================================
      // BACKGROUND GRADIENT (sama dengan QRCard)
      // ==========================================================
      const bgGradient = ctx.createLinearGradient(0, 0, 0, cardCanvas.height);
      bgGradient.addColorStop(0, '#f8fafc');
      bgGradient.addColorStop(1, '#e0e7ff');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, cardCanvas.width, cardCanvas.height);
      
      // BORDER
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.strokeRect(30, 30, cardCanvas.width - 60, cardCanvas.height - 60);
      
      // ACCENT BAR
      const accentGradient = ctx.createLinearGradient(0, 50, 0, 150);
      accentGradient.addColorStop(0, '#6366f1');
      accentGradient.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = accentGradient;
      ctx.fillRect(50, 50, cardCanvas.width - 100, 8);
      
      // LOGO DI HEADER
      if (logoImage) {
        const logoSize = 100;
        const centerX = cardCanvas.width / 2;
        const centerY = 120;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.arc(centerX, centerY, 55, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
        ctx.clip();
        const x = centerX - logoSize / 2;
        const y = centerY - logoSize / 2;
        ctx.drawImage(logoImage, x, y, logoSize, logoSize);
        ctx.restore();

        ctx.shadowColor = 'rgba(99,102,241,0.3)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = 'transparent';
        ctx.stroke();
        ctx.restore();
      }
      
      // TITLE "Jimpitan"
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Jimpitan', cardCanvas.width / 2, 225);
      
      // Garis separator
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(200, 250);
      ctx.lineTo(600, 250);
      ctx.stroke();
      
      // CUSTOMER CARD
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.roundRect(80, 275, cardCanvas.width - 160, 90, 12);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 38px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(customer.nama, cardCanvas.width / 2, 310);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '26px Arial';
      ctx.fillText(`RT ${customer.blok}`, cardCanvas.width / 2, 350);
      
      // QR CODE
      const qrSize = 400;
      const qrX = (cardCanvas.width - qrSize) / 2;
      const qrY = 400;
      
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 8;
      ctx.beginPath();
      ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 12);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      const qrDataUrl = await new Promise((resolve) => {
        QRCode.toDataURL(customer.qrHash, {
          width: 600,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        }, (error, url) => {
          if (!error) resolve(url);
          else resolve(null);
        });
      });
      
      if (qrDataUrl) {
        const qrImage = new Image();
        qrImage.src = qrDataUrl;
        await new Promise((resolve) => {
          qrImage.onload = () => {
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
            resolve();
          };
          qrImage.onerror = () => resolve();
        });
      }
      
      // FOOTER ATAS
      ctx.fillStyle = '#f1f5f9';
      ctx.shadowColor = 'rgba(0,0,0,0.05)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      ctx.roundRect(60, 860, cardCanvas.width - 120, 80, 10);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.fillStyle = '#475569';
      ctx.font = '22px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Scan QR untuk mencatat', cardCanvas.width / 2, 885);
      
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 26px Arial';
      ctx.fillText('Jimpitan', cardCanvas.width / 2, 920);
      
      // FOOTER BAWAH
      ctx.fillStyle = '#e2e8f0';
      ctx.shadowColor = 'rgba(0,0,0,0.03)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 1;
      ctx.beginPath();
      ctx.roundRect(60, 950, cardCanvas.width - 120, 80, 10);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.fillStyle = '#475569';
      ctx.font = '18px Arial';
      ctx.textBaseline = 'middle';
      ctx.fillText('Dibuat oleh KKN-R UNDIP Tim II 2025/2026', cardCanvas.width / 2, 975);
      
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Ridho Akbar Fadhilah (Statistika)', cardCanvas.width / 2, 1005);
      
      // CONVERT TO BLOB
      const blob = await new Promise((resolve) => {
        cardCanvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 0.95);
      });
      
      if (blob) {
        const filename = `Jimpitan_QR_RT${customer.blok}_${customer.nama}.png`;
        cards.push({
          filename: sanitizeFilename(filename),
          blob,
          nama: customer.nama,
          blok: customer.blok
        });
      }
    } catch (error) {
      console.error(`Failed to generate card for ${customer.id}:`, error);
    }
  }

  return cards;
}

/**
 * Load logo image from public folder
 */
function loadLogo() {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('Logo MITRAWISESA tidak ditemukan, lanjut tanpa logo');
      resolve(null);
    };
    img.src = '/mitrawisesa.png';
  });
}

/**
 * RoundRect polyfill
 */
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r === 'number') r = [r];
    const radii = r.map(v => Math.min(v, Math.min(w, h) / 2));
    const tl = radii[0] || 0;
    const tr = radii[1] || tl || 0;
    const br = radii[2] || tl || 0;
    const bl = radii[3] || tl || 0;
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    this.closePath();
    return this;
  };
}

/**
 * Create ZIP file from card images
 */
export async function createZipFromCards(cards, zipName = 'qr-codes') {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  for (const card of cards) {
    zip.file(card.filename, card.blob);
  }
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * ==========================================================
 * FUNGSI BARU: Create PDF with 4 QR cards per page
 * ==========================================================
 */
export async function createPDFFromCards(cards, title = 'QR Jimpitan') {
  const { jsPDF } = await import('jspdf');
  
  // Ukuran A4 dalam mm (210 x 297)
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const gapX = 10;
  const gapY = 10;
  
  // Hitung ukuran setiap card (2 kolom, 2 baris)
  const cardWidth = (pageWidth - (margin * 2) - gapX) / 2;
  const cardHeight = (pageHeight - (margin * 2) - gapY) / 2;
  
  // Posisi setiap card
  const positions = [
    { x: margin, y: margin },                     // kiri atas
    { x: margin + cardWidth + gapX, y: margin },  // kanan atas
    { x: margin, y: margin + cardHeight + gapY }, // kiri bawah
    { x: margin + cardWidth + gapX, y: margin + cardHeight + gapY } // kanan bawah
  ];

  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Loop per 4 cards
  for (let i = 0; i < cards.length; i += 4) {
    const pageCards = cards.slice(i, i + 4);
    
    // Jika bukan halaman pertama, tambah halaman baru
    if (i > 0) {
      doc.addPage();
    }
    
    // Tambahkan header di setiap halaman (opsional)
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`QR Jimpitan - Halaman ${Math.floor(i/4) + 1}`, pageWidth / 2, 10, { align: 'center' });
    
    // Tempatkan 4 card
    for (let j = 0; j < pageCards.length; j++) {
      const card = pageCards[j];
      const pos = positions[j];
      
      // Konversi blob ke data URL
      const imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(card.blob);
      });
      
      // Hitung proporsi gambar (800x1080) -> rasio 0.74
      const imgWidth = cardWidth;
      const imgHeight = cardWidth * (1080 / 800); // proporsional
      
      // Tambahkan ke PDF
      doc.addImage(
        imageUrl,
        'PNG',
        pos.x,
        pos.y,
        imgWidth,
        imgHeight
      );
    }
  }
  
  return doc.output('blob');
}

/**
 * Download ZIP file
 */
export function downloadZIP(blob, filename = 'qr-codes.zip') {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Download PDF file
 */
export function downloadPDF(blob, filename = 'qr-codes.pdf') {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
  const lastDot = filename.lastIndexOf('.');
  const name = lastDot > 0 ? filename.substring(0, lastDot) : filename;
  const ext = lastDot > 0 ? filename.substring(lastDot) : '';
  const sanitized = name
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
  return sanitized + ext;
}

/**
 * Get unique bloks
 */
export function getUniqueBloks(customers) {
  const bloks = [...new Set(customers.map(c => String(c.blok).trim()))];
  return bloks.sort((a, b) => {
    const aNum = parseInt(a, 10);
    const bNum = parseInt(b, 10);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    return a.localeCompare(b);
  });
}