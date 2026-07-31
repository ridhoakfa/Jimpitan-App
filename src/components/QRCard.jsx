import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

// ============================================
// LOAD LOGO MITRAWISESA (di-cache)
// ============================================
let cachedLogo = null;
let logoLoading = false;
let logoCallbacks = [];

function loadLogo() {
  return new Promise((resolve) => {
    if (cachedLogo) {
      resolve(cachedLogo);
      return;
    }
    if (logoLoading) {
      logoCallbacks.push(resolve);
      return;
    }
    logoLoading = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedLogo = img;
      logoLoading = false;
      logoCallbacks.forEach(cb => cb(img));
      logoCallbacks = [];
      resolve(img);
    };
    img.onerror = () => {
      console.warn('Logo MITRAWISESA tidak ditemukan, lanjut tanpa logo');
      cachedLogo = null;
      logoLoading = false;
      logoCallbacks.forEach(cb => cb(null));
      logoCallbacks = [];
      resolve(null);
    };
    img.src = '/mitrawisesa.png';
  });
}

export default function QRCard({ customer, onClose }) {
  const canvasRefSimple = useRef(null);
  const canvasRefSubmit = useRef(null);
  const [imageDataUrlSimple, setImageDataUrlSimple] = useState('');
  const [imageDataUrlSubmit, setImageDataUrlSubmit] = useState('');
  const [selectedType, setSelectedType] = useState('simple');
  const [copied, setCopied] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Load logo saat komponen mount
  useEffect(() => {
    loadLogo().then(() => setLogoLoaded(true));
  }, []);

  useEffect(() => {
    if (customer && customer.qrHash) {
      if (canvasRefSimple.current) {
        QRCode.toCanvas(
          canvasRefSimple.current,
          customer.qrHash,
          {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
          },
          (error) => {}
        );
        QRCode.toDataURL(
          customer.qrHash,
          {
            width: 600,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
          },
          (error, url) => {
            if (!error) setImageDataUrlSimple(url);
          }
        );
      }

      const submitUrl = `${window.location.origin}/submit?qr=${customer.qrHash}`;
      if (canvasRefSubmit.current) {
        QRCode.toCanvas(
          canvasRefSubmit.current,
          submitUrl,
          {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
          },
          (error) => {}
        );
        QRCode.toDataURL(
          submitUrl,
          {
            width: 600,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
          },
          (error, url) => {
            if (!error) setImageDataUrlSubmit(url);
          }
        );
      }
    }
  }, [customer, selectedType]);

  const handleCopy = async () => {
    const textToCopy = selectedType === 'simple'
      ? customer.qrHash
      : `${window.location.origin}/submit?qr=${customer.qrHash}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {}
  };

  // ============================================
  // FUNGSI GAMBAR LOGO DI CARD (header saja)
  // ============================================
  function drawLogoOnCard(ctx, canvasWidth, canvasHeight, logoImg) {
    if (!logoImg) return;
    const logoSize = 100;
    const centerX = canvasWidth / 2;
    const centerY = 120; // tengah lingkaran

    // Lingkaran background putih dengan bayangan
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

    // Border lingkaran (gunakan warna aksen)
    ctx.strokeStyle = '#6366f1'; // bisa diganti dengan warna favorit
    ctx.lineWidth = 3;
    ctx.stroke();

    // Clip logo ke dalam lingkaran
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
    ctx.clip();

    // Gambar logo di tengah
    const x = centerX - logoSize / 2;
    const y = centerY - logoSize / 2;
    ctx.drawImage(logoImg, x, y, logoSize, logoSize);
    ctx.restore();

    // Opsional: tambahkan efek "glow" kecil
    ctx.shadowColor = 'rgba(99,102,241,0.3)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'transparent';
    ctx.stroke();
    ctx.restore();
  }

  // ============================================
  // HANDLE DOWNLOAD
  // ============================================
  const handleDownload = async () => {
    const logoImg = await loadLogo();
    const cardCanvas = document.createElement('canvas');
    const ctx = cardCanvas.getContext('2d');
    cardCanvas.width = 800;
    cardCanvas.height = 1000;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, cardCanvas.height);
    bgGradient.addColorStop(0, '#f8fafc');
    bgGradient.addColorStop(1, '#e0e7ff');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, cardCanvas.width, cardCanvas.height);

    // Border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeRect(30, 30, cardCanvas.width - 60, cardCanvas.height - 60);

    // Accent bar
    const accentGradient = ctx.createLinearGradient(0, 50, 0, 150);
    accentGradient.addColorStop(0, '#6366f1');
    accentGradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = accentGradient;
    ctx.fillRect(50, 50, cardCanvas.width - 100, 8);

    // Logo di header (MITRAWISESA)
    drawLogoOnCard(ctx, cardCanvas.width, cardCanvas.height, logoImg);

    // Title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Jimpitan', cardCanvas.width / 2, 210);

    // Divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 240);
    ctx.lineTo(600, 240);
    ctx.stroke();

    // Customer name card
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    ctx.fillRect(80, 270, cardCanvas.width - 160, 90);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 38px Arial';
    ctx.fillText(customer.nama, cardCanvas.width / 2, 315);
    ctx.fillStyle = '#64748b';
    ctx.font = '26px Arial';
    ctx.fillText(`📍 RT ${customer.blok}`, cardCanvas.width / 2, 350);

    // QR container
    const qrSize = 400;
    const qrX = (cardCanvas.width - qrSize) / 2;
    const qrY = 400;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 8;
    ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // QR Code
    const qrImage = new Image();
    qrImage.src = selectedType === 'simple' ? imageDataUrlSimple : imageDataUrlSubmit;
    await new Promise((resolve) => {
      qrImage.onload = () => {
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        // TIDAK ADA LOGO DI TENGAH QR
        // Footer
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(80, 860, cardCanvas.width - 160, 80);
        ctx.fillStyle = '#475569';
        ctx.font = '24px Arial';
        ctx.fillText('Scan QR untuk mencatat', cardCanvas.width / 2, 900);
        ctx.font = 'bold 26px Arial';
        ctx.fillStyle = '#6366f1';
        ctx.fillText('Jimpitan', cardCanvas.width / 2, 930);
        resolve();
      };
      qrImage.onerror = () => resolve();
    });

    cardCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `Jimpitan_QR_RT${customer.blok}_${customer.nama}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  // ============================================
  // HANDLE PRINT
  // ============================================
  const handlePrint = async () => {
    const logoImg = await loadLogo();
    const cardCanvas = document.createElement('canvas');
    const ctx = cardCanvas.getContext('2d');
    cardCanvas.width = 800;
    cardCanvas.height = 1000;

    // (sama seperti handleDownload)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, cardCanvas.height);
    bgGradient.addColorStop(0, '#f8fafc');
    bgGradient.addColorStop(1, '#e0e7ff');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, cardCanvas.width, cardCanvas.height);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeRect(30, 30, cardCanvas.width - 60, cardCanvas.height - 60);
    const accentGradient = ctx.createLinearGradient(0, 50, 0, 150);
    accentGradient.addColorStop(0, '#6366f1');
    accentGradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = accentGradient;
    ctx.fillRect(50, 50, cardCanvas.width - 100, 8);
    drawLogoOnCard(ctx, cardCanvas.width, cardCanvas.height, logoImg);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Jimpitan', cardCanvas.width / 2, 210);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 240);
    ctx.lineTo(600, 240);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    ctx.fillRect(80, 270, cardCanvas.width - 160, 90);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 38px Arial';
    ctx.fillText(customer.nama, cardCanvas.width / 2, 315);
    ctx.fillStyle = '#64748b';
    ctx.font = '26px Arial';
    ctx.fillText(`RT ${customer.blok}`, cardCanvas.width / 2, 350);
    const qrSize = 400;
    const qrX = (cardCanvas.width - qrSize) / 2;
    const qrY = 400;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 8;
    ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const qrImage = new Image();
    qrImage.src = selectedType === 'simple' ? imageDataUrlSimple : imageDataUrlSubmit;
    await new Promise((resolve) => {
      qrImage.onload = () => {
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(80, 860, cardCanvas.width - 160, 80);
        ctx.fillStyle = '#475569';
        ctx.font = '24px Arial';
        ctx.fillText('Scan QR untuk mencatat', cardCanvas.width / 2, 900);
        ctx.font = 'bold 26px Arial';
        ctx.fillStyle = '#6366f1';
        ctx.fillText('Jimpitan', cardCanvas.width / 2, 930);
        resolve();
      };
      qrImage.onerror = () => resolve();
    });

    const printImageUrl = cardCanvas.toDataURL('image/png');
    const printWindow = window.open('', '', 'width=800,height=1000');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${customer.nama}</title>
          <style>
            body { margin:0; padding:20px; display:flex; justify-content:center; align-items:center; min-height:100vh; }
            img { max-width:100%; height:auto; box-shadow:0 4px 6px rgba(0,0,0,0.1); }
            @media print { body { padding:0; } @page { margin:0; size:portrait; } }
          </style>
        </head>
        <body><img src="${printImageUrl}" alt="QR Card" /></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  if (!customer) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-xl shadow-2xl max-w-md w-full max-h-[95vh] flex flex-col border border-white/30 dark:border-gray-700/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex justify-between items-center p-6 pb-4 border-b border-red-200/50 dark:border-red-900/30 sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            📱 QR Code Customer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 flex-shrink-0 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {/* Customer Info */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4 mb-4">
            <div className="text-sm opacity-90 mb-1">Nama Customer</div>
            <div className="text-xl font-bold mb-2">{customer.nama}</div>
            <div className="flex justify-between text-sm">
              <div><span className="opacity-75">RT:</span> <strong>{customer.blok}</strong></div>
              <div><span className="opacity-75">ID:</span> <strong>{customer.id}</strong></div>
            </div>
          </div>

          {/* QR Type Selector */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSelectedType('simple')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedType === 'simple'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              📝 QR Hash
            </button>
            <button
              onClick={() => setSelectedType('submit')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedType === 'submit'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              🔗 QR Submit
            </button>
          </div>

          {/* QR Code Canvas */}
          <div className="flex justify-center mb-4 bg-white p-6 rounded-lg">
            {selectedType === 'simple' ? (
              <canvas ref={canvasRefSimple}></canvas>
            ) : (
              <canvas ref={canvasRefSubmit}></canvas>
            )}
          </div>

          {/* QR Content Display */}
          <div className="mb-4 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {selectedType === 'simple' ? 'QR Hash' : 'Submit URL'}
            </div>
            <button
              onClick={handleCopy}
              className="w-full font-mono text-xs md:text-sm font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded break-all transition-colors cursor-pointer group relative"
              title="Klik untuk copy"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="flex-1 text-left">
                  {selectedType === 'simple'
                    ? customer.qrHash
                    : `${window.location.origin}/submit?qr=${customer.qrHash}`}
                </span>
                {copied ? (
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
            </button>
            {copied && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
                ✓ Berhasil dicopy!
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>

          {/* Info Text */}
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            💡 Scan QR code ini saat melakukan transaksi Jimpitan
          </div>
        </div>
      </div>
    </div>
  );
}