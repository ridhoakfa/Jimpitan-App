import QRCode from 'qrcode';

/**
 * Generate individual QR card images using canvas rendering
 * Dengan logo MITRAWISESA & palet warna Karang Taruna
 * Tambahan footer identitas KKN dengan layout terpisah
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
      cardCanvas.height = 1080; // tinggi ditambah untuk footer
      
      // ============================================
      // BACKGROUND
      // ============================================
      ctx.fillStyle = '#efede1';
      ctx.fillRect(0, 0, cardCanvas.width, cardCanvas.height);
      
      // BORDER
      ctx.strokeStyle = '#201b19';
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 20, cardCanvas.width - 40, cardCanvas.height - 40);
      
      // TOP ACCENT BAR
      ctx.fillStyle = '#c42a48';
      ctx.fillRect(40, 40, cardCanvas.width - 80, 12);
      
      // LOGO
      if (logoImage) {
        const logoSize = 100;
        const logoX = (cardCanvas.width - logoSize) / 2;
        const logoY = 70;
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
      } else {
        ctx.fillStyle = '#201b19';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏡', cardCanvas.width / 2, 120);
      }
      
      // TITLE
      ctx.fillStyle = '#201b19';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('JIMPITAN', cardCanvas.width / 2, 210);
      
      ctx.fillStyle = '#69641e';
      ctx.font = '18px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Karang Taruna Dukuh Mojorejo', cardCanvas.width / 2, 240);
      
      ctx.strokeStyle = '#acaa42';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(150, 260);
      ctx.lineTo(650, 260);
      ctx.stroke();
      
      // CUSTOMER CARD
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(32, 27, 25, 0.1)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.roundRect(60, 280, cardCanvas.width - 120, 90, 12);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.fillStyle = '#201b19';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(customer.nama, cardCanvas.width / 2, 315);
      
      ctx.fillStyle = '#35300c';
      ctx.font = '24px Arial';
      ctx.fillText(`📍 RT ${customer.blok}`, cardCanvas.width / 2, 355);
      
      // QR CODE
      const qrSize = 360;
      const qrX = (cardCanvas.width - qrSize) / 2;
      const qrY = 400;
      
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(32, 27, 25, 0.15)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 6;
      ctx.beginPath();
      ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30, 10);
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
            dark: '#201b19',
            light: '#ffffff'
          }
        }, (error, url) => {
          if (!error) {
            resolve(url);
          } else {
            console.error('QR generation error:', error);
            resolve(null);
          }
        });
      });
      
      if (qrDataUrl) {
        const qrImage = new Image();
        qrImage.src = qrDataUrl;
        await new Promise((resolve) => {
          qrImage.onload = () => {
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
            
            // Logo di tengah QR
            if (logoImage) {
              const logoQrSize = 60;
              const logoQrX = qrX + (qrSize - logoQrSize) / 2;
              const logoQrY = qrY + (qrSize - logoQrSize) / 2;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(logoQrX + logoQrSize/2, logoQrY + logoQrSize/2, logoQrSize/2 + 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.drawImage(logoImage, logoQrX, logoQrY, logoQrSize, logoQrSize);
            }
            
            // ============================================
            // FOOTER - BAGIAN ATAS (Scan QR + MITRAWISESA)
            // ============================================
            ctx.fillStyle = '#acaa42';
            ctx.shadowColor = 'rgba(32, 27, 25, 0.05)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 2;
            ctx.beginPath();
            ctx.roundRect(60, 870, cardCanvas.width - 120, 80, 10);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.fillStyle = '#201b19';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Scan QR untuk mencatat jimpitan', cardCanvas.width / 2, 900);
            
            ctx.fillStyle = '#c42a48';
            ctx.font = 'bold 26px Arial';
            ctx.fillText('MITRAWISESA', cardCanvas.width / 2, 935);
            
            // ============================================
            // FOOTER - BAGIAN BAWAH (Identitas KKN)
            // ============================================
            ctx.fillStyle = '#d4d0b8'; // warna sedikit lebih gelap dari background
            ctx.shadowColor = 'rgba(32, 27, 25, 0.03)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetY = 1;
            ctx.beginPath();
            ctx.roundRect(60, 960, cardCanvas.width - 120, 70, 10);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.fillStyle = '#35300c';
            ctx.font = '16px Arial';
            ctx.textBaseline = 'middle';
            ctx.fillText('Dibuat oleh KKN-R UNDIP Tim II 2025/2026', cardCanvas.width / 2, 988);
            
            ctx.fillStyle = '#201b19';
            ctx.font = 'bold 18px Arial';
            ctx.fillText('Ridho Akbar Fadhilah (Statistika)', cardCanvas.width / 2, 1015);
            
            resolve();
          };
          qrImage.onerror = () => {
            console.error('QR image load failed');
            resolve();
          };
        });
      }
      
      const blob = await new Promise((resolve) => {
        cardCanvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 0.95);
      });
      
      if (blob) {
        const filename = `Jimpitan_QR_RT${customer.blok}_${customer.nama}.png`;
        cards.push({
          filename: sanitizeFilename(filename),
          blob
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
    img.src = '/mitrawisesa.PNG';
  });
}

/**
 * RoundRect polyfill untuk Canvas
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