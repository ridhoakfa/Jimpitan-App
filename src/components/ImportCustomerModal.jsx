import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { parseExcelFile, validateCustomerData } from '../utils/excelImport';

export default function ImportCustomerModal({ isOpen, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState('upload'); // 'upload' or 'preview'
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setErrors(['Format file tidak didukung. Gunakan .xlsx atau .csv']);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
  }

  async function handlePreview() {
    if (!file) {
      setErrors(['Pilih file terlebih dahulu']);
      return;
    }

    try {
      setLoading(true);
      setErrors([]);
      const customers = await parseExcelFile(file);
      const validation = validateCustomerData(customers);

      if (!validation.valid) {
        setErrors(validation.errors);
        setPreviewData([]);
        return;
      }

      setPreviewData(customers);
      setStep('preview');
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmImport() {
    if (previewData.length === 0) return;

    try {
      setImporting(true);
      await onImport(previewData);
      
      // Reset and close
      setFile(null);
      setPreviewData([]);
      setErrors([]);
      setStep('upload');
      onClose();
    } catch (error) {
      setErrors([error.message]);
      setImporting(false);
    }
  }

  function handleClose() {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setStep('upload');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-white/30 dark:border-gray-700/30">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            📥 Import Customer dari Excel
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && <LoadingSpinner text="Membaca file..." />}

        {/* Upload Step */}
        {!loading && step === 'upload' && (
          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-sm text-red-700 dark:text-red-300">
              <h3 className="font-semibold mb-2">📋 Format File yang Diperlukan:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Kolom 1: <strong>RT</strong> (RT / ID Wilayah)</li>
                <li>Kolom 2: <strong>Nama</strong> (Nama Lengkap Customer)</li>
                <li>Format: Excel (.xlsx) atau CSV</li>
                <li>Baris pertama dapat berisi header</li>
              </ul>
            </div>

            {/* File Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Pilih File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
              />
              {file && (
                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                  ✓ File terpilih: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">❌ Error:</h3>
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handlePreview}
                disabled={!file}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview Data
              </button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-sm text-green-700 dark:text-green-300">
              <h3 className="font-semibold mb-2">✓ Data Valid</h3>
              <p>Siap untuk import <strong>{previewData.length}</strong> customer baru</p>
            </div>

            {/* Preview Table */}
            <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 font-semibold">#</th>
                    <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 font-semibold">RT</th>
                    <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 font-semibold">Nama</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 20).map((customer, idx) => (
                    <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{customer.blok}</td>
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{customer.nama}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 20 && (
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                  ... dan {previewData.length - 20} customer lainnya
                </div>
              )}
            </div>

            {/* Warnings */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
              <h3 className="font-semibold mb-1">⚠️ Perhatian:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Customer dengan nama + RT yang sama akan diabaikan</li>
                <li>QR Code akan otomatis dibuat untuk customer baru</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep('upload')}
                disabled={importing}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kembali
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Mengimport...
                  </>
                ) : (
                  <>
                    ✓ Konfirmasi Import
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
