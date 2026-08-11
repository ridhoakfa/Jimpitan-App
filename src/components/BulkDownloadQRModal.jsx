import { useState, useMemo } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { 
  generateQRCards, 
  createZipFromCards, 
  createPDFFromCards,
  downloadZIP, 
  downloadPDF,
  getUniqueBloks 
} from '../utils/qrGenerator';

export default function BulkDownloadQRModal({ isOpen, onClose, customers }) {
  const [downloadMode, setDownloadMode] = useState('all'); // 'all' or 'byBlok'
  const [selectedBlok, setSelectedBlok] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [outputFormat, setOutputFormat] = useState('zip'); // 'zip' or 'pdf'

  const uniqueBloks = useMemo(() => getUniqueBloks(customers), [customers]);

  const customersToDownload = useMemo(() => {
    if (downloadMode === 'all') {
      return customers;
    } else if (downloadMode === 'byBlok' && selectedBlok) {
      return customers.filter(c => String(c.blok).trim() === selectedBlok);
    }
    return [];
  }, [customers, downloadMode, selectedBlok]);

  async function handleDownload() {
    if (customersToDownload.length === 0) {
      alert('Tidak ada customer untuk didownload');
      return;
    }

    try {
      setGenerating(true);
      setProgress({ current: 0, total: customersToDownload.length });
      
      // Generate QR cards
      const cards = await generateQRCards(customersToDownload, (current, total) => {
        setProgress({ current, total });
      });
      
      if (cards.length === 0) {
        alert('Gagal generate QR cards');
        return;
      }

      if (outputFormat === 'zip') {
        // ZIP mode
        const zipBlob = await createZipFromCards(
          cards,
          downloadMode === 'all' 
            ? 'qr-semua-customers' 
            : `qr-blok-${selectedBlok}`
        );

        const filename = downloadMode === 'all'
          ? `qr-semua-${new Date().toISOString().split('T')[0]}.zip`
          : `qr-blok-${selectedBlok}-${new Date().toISOString().split('T')[0]}.zip`;

        downloadZIP(zipBlob, filename);
      } else {
        // PDF mode (4 per halaman)
        const pdfBlob = await createPDFFromCards(cards, 'QR Jimpitan');
        
        const filename = downloadMode === 'all'
          ? `qr-semua-${new Date().toISOString().split('T')[0]}.pdf`
          : `qr-blok-${selectedBlok}-${new Date().toISOString().split('T')[0]}.pdf`;

        downloadPDF(pdfBlob, filename);
      }
      
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setGenerating(false);
      setProgress({ current: 0, total: 0 });
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-xl shadow-2xl max-w-md w-full p-6 border border-white/30 dark:border-gray-700/30">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            📥 Download QR Code
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {generating && <LoadingSpinner text={`Generate QR cards... (${progress.current}/${progress.total})`} />}

        {!generating && (
          <div className="space-y-4">
            {/* Mode Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Pilih Mode Download
              </label>

              {/* All Button */}
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors"
                style={{
                  borderColor: downloadMode === 'all' ? '#3b82f6' : '#d1d5db',
                  backgroundColor: downloadMode === 'all' ? '#eff6ff' : 'transparent'
                }}>
                <input
                  type="radio"
                  name="downloadMode"
                  value="all"
                  checked={downloadMode === 'all'}
                  onChange={(e) => setDownloadMode(e.target.value)}
                  className="w-4 h-4"
                />
                <div className="ml-3">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    📋 Semua Customer
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {customers.length} QR cards
                  </div>
                </div>
              </label>

              {/* By Blok Button */}
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors"
                style={{
                  borderColor: downloadMode === 'byBlok' ? '#3b82f6' : '#d1d5db',
                  backgroundColor: downloadMode === 'byBlok' ? '#eff6ff' : 'transparent'
                }}>
                <input
                  type="radio"
                  name="downloadMode"
                  value="byBlok"
                  checked={downloadMode === 'byBlok'}
                  onChange={(e) => {
                    setDownloadMode(e.target.value);
                    setSelectedBlok('');
                  }}
                  className="w-4 h-4"
                />
                <div className="ml-3">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    🏢 Berdasarkan RT
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Pilih RT tertentu
                  </div>
                </div>
              </label>
            </div>

            {/* Blok Selection */}
            {downloadMode === 'byBlok' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Pilih RT <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBlok}
                  onChange={(e) => setSelectedBlok(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">-- Pilih RT --</option>
                  {uniqueBloks.map((blok) => {
                    const count = customers.filter(c => String(c.blok).trim() === blok).length;
                    return (
                      <option key={blok} value={blok}>
                        {blok} ({count} customer)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* ========================================================== */}
            {/* FORMAT OUTPUT: ZIP vs PDF */}
            {/* ========================================================== */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Format Output
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOutputFormat('zip')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    outputFormat === 'zip'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  📦 ZIP (Individual)
                </button>
                <button
                  onClick={() => setOutputFormat('pdf')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    outputFormat === 'pdf'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  📄 PDF (4 per halaman)
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {outputFormat === 'zip' 
                  ? 'Download file PNG individual dalam ZIP' 
                  : 'Download PDF A4 dengan 4 QR per halaman'}
              </p>
            </div>

            {/* Info */}
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-700 dark:text-red-300">
              <h3 className="font-semibold mb-1">ℹ️ Informasi:</h3>
              <ul className="text-xs space-y-1">
                <li>• <strong>ZIP:</strong> File PNG individual, fleksibel untuk berbagai keperluan</li>
                <li>• <strong>PDF (4 per halaman):</strong> Layout A4 dengan 2 kolom x 2 baris siap cetak</li>
                <li>• Nama file: Jimpitan_QR_RT[Nama].png</li>
              </ul>
            </div>

            {/* Stats */}
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                📊 Summary:
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {customersToDownload.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                QR cards akan didownload dalam format {outputFormat.toUpperCase()}
                {outputFormat === 'pdf' && ` (${Math.ceil(customersToDownload.length / 4)} halaman)`}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDownload}
                disabled={downloadMode === 'byBlok' && !selectedBlok}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download {outputFormat === 'zip' ? 'ZIP' : 'PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}