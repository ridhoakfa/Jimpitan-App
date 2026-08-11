import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { fetchHistoryFromSheet, deleteTransaction } from '../services/sheets';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ============================================
// FUNGSI CUT-OFF UNTUK FRONTEND (sama dengan backend)
// ============================================
function getJimpitanDate(date) {
  const d = date || new Date();
  const hours = d.getHours();
  if (hours < 3) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

function getJimpitanDateString(date) {
  const d = getJimpitanDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================

export default function History({ onBack }) {
  const { currentUser, token } = useAuth();
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [periode, setPeriode] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [tipe, setTipe] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await fetchHistoryFromSheet();
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        setTransactions([]);
        toast.error('Format data tidak valid');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memuat data riwayat');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleDeleteClick = (tx) => {
    setSelectedTransaction(tx);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTransaction) return;
    if (!token) {
      toast.error('Token tidak ditemukan, silakan login ulang');
      setShowDeleteConfirm(false);
      return;
    }
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteTransaction(token, selectedTransaction.txid);
      if (result.status === 'success') {
        toast.success('Transaksi berhasil dihapus');
        setShowDeleteConfirm(false);
        setSelectedTransaction(null);
        await loadTransactions();
      } else {
        toast.error(result.message || 'Gagal menghapus transaksi');
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menghapus');
      console.error(err);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setSelectedTransaction(null);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch =
      tx.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.petugas?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesType = true;
    if (tipe !== 'all') {
      matchesType = tx.type === tipe;
    }

    let matchesPeriode = true;
    const txDate = new Date(tx.timestamp);
    if (!isNaN(txDate.getTime())) {
      const txJimpitan = getJimpitanDate(new Date(tx.timestamp));
      const now = new Date();
      const nowJimpitan = getJimpitanDate(new Date());

      if (periode === 'hari') {
        const todayStr = getJimpitanDateString();
        const txStr = getJimpitanDateString(txDate);
        matchesPeriode = txStr === todayStr;
      } else if (periode === 'minggu') {
        const startOfWeek = new Date(nowJimpitan);
        startOfWeek.setDate(nowJimpitan.getDate() - nowJimpitan.getDay() + 1);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        matchesPeriode = txJimpitan >= startOfWeek && txJimpitan <= endOfWeek;
      } else if (periode === 'bulan') {
        const startOfMonth = new Date(nowJimpitan.getFullYear(), nowJimpitan.getMonth(), 1);
        const endOfMonth = new Date(nowJimpitan.getFullYear(), nowJimpitan.getMonth() + 1, 0);
        matchesPeriode = txJimpitan >= startOfMonth && txJimpitan <= endOfMonth;
      } else if (periode === 'tahun') {
        const startOfYear = new Date(nowJimpitan.getFullYear(), 0, 1);
        const endOfYear = new Date(nowJimpitan.getFullYear(), 11, 31);
        matchesPeriode = txJimpitan >= startOfYear && txJimpitan <= endOfYear;
      } else if (periode === 'custom') {
        if (customStart && customEnd) {
          const start = new Date(customStart);
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          matchesPeriode = txJimpitan >= start && txJimpitan <= end;
        }
      }
    }

    return matchesSearch && matchesType && matchesPeriode;
  }).sort((a, b) => {
    const dateA = new Date(a.timestamp || a.waktu).getTime();
    const dateB = new Date(b.timestamp || b.waktu).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + (Number(tx.nominal) || 0), 0);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, periode, tipe, customStart, customEnd, sortOrder]);

  const resetFilters = () => {
    setSearchTerm('');
    setPeriode('');
    setTipe('all');
    setCustomStart('');
    setCustomEnd('');
    setSortOrder('desc');
  };

  const exportToPDF = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Laporan Transaksi Jimpitan', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let periodeText = 'Semua Periode';
      if (periode === 'hari') periodeText = 'Hari Ini';
      else if (periode === 'minggu') periodeText = 'Minggu Ini';
      else if (periode === 'bulan') periodeText = 'Bulan Ini';
      else if (periode === 'tahun') periodeText = 'Tahun Ini';
      else if (periode === 'custom') periodeText = `${customStart} s.d ${customEnd}`;
      doc.text(`Periode: ${periodeText}`, 105, 22, { align: 'center' });
      const exportDate = new Date().toLocaleString('id-ID');
      doc.text(`Dicetak: ${exportDate}`, 105, 28, { align: 'center' });

      const tableData = filteredTransactions.map((item, index) => [
        index + 1,
        item.id || '-',
        item.nama || '-',
        item.type || 'daily',
        `Rp${Number(item.nominal || 0).toLocaleString('id-ID')}`,
        formatDateTime(item.timestamp),
        item.petugas || '-',
      ]);

      const total = filteredTransactions.reduce((sum, item) => sum + Number(item.nominal || 0), 0);

      autoTable(doc, {
        startY: 35,
        head: [['No', 'RT', 'Nama', 'Tipe', 'Nominal', 'Waktu', 'Petugas']],
        body: tableData,
        foot: [['', '', '', 'TOTAL', `Rp${total.toLocaleString('id-ID')}`, '', '']],
        theme: 'striped',
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
        },
        footStyles: {
          fillColor: [229, 231, 235],
          textColor: 0,
          fontStyle: 'bold',
        },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'center', cellWidth: 20 },
          2: { cellWidth: 40 },
          3: { halign: 'center', cellWidth: 20 },
          4: { halign: 'right', cellWidth: 30 },
          5: { cellWidth: 40 },
          6: { cellWidth: 30 },
        },
      });

      const filename = `Jimpitan_${periodeText.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      doc.save(filename);
      toast.success('PDF berhasil diexport');
    } catch (error) {
      toast.error('Gagal export PDF: ' + error.message);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportToExcel = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }
    setIsExportingExcel(true);
    try {
      const excelData = filteredTransactions.map((item, index) => ({
        'No': index + 1,
        'RT': item.id || '-',
        'Nama': item.nama || '-',
        'Tipe': item.type || 'daily',
        'Nominal': Number(item.nominal || 0),
        'Waktu': formatDateTime(item.timestamp),
        'Petugas': item.petugas || '-',
      }));

      const total = filteredTransactions.reduce((sum, item) => sum + Number(item.nominal || 0), 0);
      excelData.push({
        'No': '',
        'RT': '',
        'Nama': 'TOTAL',
        'Tipe': '',
        'Nominal': total,
        'Waktu': '',
        'Petugas': '',
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      worksheet['!cols'] = [
        { wch: 5 },
        { wch: 10 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Jimpitan');

      let periodeText = 'Semua_Periode';
      if (periode === 'hari') periodeText = 'Hari_Ini';
      else if (periode === 'minggu') periodeText = 'Minggu_Ini';
      else if (periode === 'bulan') periodeText = 'Bulan_Ini';
      else if (periode === 'tahun') periodeText = 'Tahun_Ini';
      else if (periode === 'custom') periodeText = `${customStart}_s.d_${customEnd}`;
      const filename = `Jimpitan_${periodeText}_${Date.now()}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('Excel berhasil diexport');
    } catch (error) {
      toast.error('Gagal export Excel: ' + error.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-white via-red-50/20 to-white/80 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900 transition-colors duration-300">
      <div className="flex-1 overflow-auto p-3 md:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-300/50 dark:shadow-none border border-slate-200/60 dark:border-gray-700/60 p-4 md:p-5">
            
            {/* Header */}
            <div className="mb-4">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  {onBack && (
                    <button
                      onClick={onBack}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                      title="Kembali"
                    >
                      <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500 text-transparent bg-clip-text mb-1">
                      Riwayat Transaksi
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {filteredTransactions.length} transaksi • {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={exportToPDF}
                    disabled={filteredTransactions.length === 0 || isExportingPDF}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {isExportingPDF ? 'Export...' : 'PDF'}
                  </button>
                  <button
                    onClick={exportToExcel}
                    disabled={filteredTransactions.length === 0 || isExportingExcel}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {isExportingExcel ? 'Export...' : 'Excel'}
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================== */}
            {/* FILTER — PERBAIKAN MOBILE: 2 KOLOM DI HP, 4 DI DESKTOP */}
            {/* ========================================================== */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama, RT, atau petugas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                />
                <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Grid: 2 kolom di HP, 4 kolom di tablet/desktop */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <select
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  className="col-span-2 md:col-span-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                >
                  <option value="">Semua Periode</option>
                  <option value="hari">Hari Ini</option>
                  <option value="minggu">Minggu Ini</option>
                  <option value="bulan">Bulan Ini</option>
                  <option value="tahun">Tahun Ini</option>
                  <option value="custom">Custom</option>
                </select>

                <select
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value)}
                  className="col-span-2 md:col-span-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="daily">Harian</option>
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-2 py-1.5 text-xs font-medium bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortOrder === 'desc' ? 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12' : 'M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4'} />
                  </svg>
                  {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
                </button>

                <button
                  onClick={resetFilters}
                  className="px-2 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/30 transition-all"
                >
                  Reset Filter
                </button>
              </div>

              {periode === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Transaction List */}
            <div className="space-y-1.5">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner loading text="Memuat data..." />
                </div>
              ) : paginatedTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                  Tidak ada transaksi ditemukan
                </div>
              ) : (
                paginatedTransactions.map((tx) => (
                  <div
                    key={tx.txid || tx.timestamp}
                    className="bg-gradient-to-r from-slate-50/80 to-blue-50/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg p-2 border border-slate-200/60 dark:border-gray-600/60 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                          {tx.nama}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          RT {tx.id} • {tx.petugas}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-blue-600 dark:text-blue-400">
                          {formatCurrency(tx.nominal)}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          {tx.type === 'daily' ? 'Harian' : tx.type === 'monthly' ? 'Bulanan' : 'Tahunan'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatDateTime(tx.timestamp || tx.waktu)}
                      </div>
                      <button
                        onClick={() => handleDeleteClick(tx)}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                        title="Hapus transaksi"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-gray-700">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ‹
                </button>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog Delete */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Hapus Transaksi"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        message={`Apakah Anda yakin ingin menghapus transaksi untuk "${selectedTransaction?.nama || ''}" (Rp ${selectedTransaction?.nominal?.toLocaleString() || 0})?`}
        additionalInfo={selectedTransaction?.petugas ? `Petugas: ${selectedTransaction.petugas}` : ''}
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
}