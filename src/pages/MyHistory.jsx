import React, { useEffect, useState, useMemo } from 'react';
import { getUserTransactions, deleteTransaction } from '../services/sheets';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';

const ITEMS_PER_PAGE = 10;

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
}

function formatDateTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString('id-ID', { hour12: false });
}

export default function MyHistory({ onBack }) {
  const { currentUser, token } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!token) {
        setError('Token tidak tersedia');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      const timeoutId = setTimeout(() => {
        if (active) {
          setError('Request timeout - coba refresh halaman');
          setLoading(false);
        }
      }, 20000);

      try {
        const res = await getUserTransactions(token);
        clearTimeout(timeoutId);
        
        if (!active) return;
        
        if (!res || res.status !== 'success') {
          throw new Error(res && res.message ? res.message : 'Gagal memuat riwayat');
        }
        
        const rows = Array.isArray(res.data?.transactions) ? res.data.transactions : 
                     Array.isArray(res.data) ? res.data : [];
        
        const cleaned = rows.map(r => ({
          txid: String(r.txid || ''),
          timestamp: String(r.timestamp || ''),
          customer_id: String(r.customer_id || ''),
          blok: String(r.blok || r.id || ''),
          nama: String(r.nama || ''),
          nominal: Number(r.nominal || r.amount || 0),
          user_id: String(r.user_id || ''),
          petugas: String(r.petugas || currentUser?.name || ''),
          type: String(r.type || 'daily')
        }));
        
        setTransactions(cleaned);
      } catch (e) {
        clearTimeout(timeoutId);
        if (!active) return;
        setError(e.message);
        setTransactions([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    
    load();
    return () => { active = false; };
  }, [token]);

  // Handle Delete
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
        // Refresh data
        const res = await getUserTransactions(token);
        if (res && res.status === 'success') {
          const rows = Array.isArray(res.data?.transactions) ? res.data.transactions : [];
          const cleaned = rows.map(r => ({
            txid: String(r.txid || ''),
            timestamp: String(r.timestamp || ''),
            customer_id: String(r.customer_id || ''),
            blok: String(r.blok || r.id || ''),
            nama: String(r.nama || ''),
            nominal: Number(r.nominal || r.amount || 0),
            user_id: String(r.user_id || ''),
            petugas: String(r.petugas || currentUser?.name || ''),
            type: String(r.type || 'daily')
          }));
          setTransactions(cleaned);
        }
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let data = transactions;
    if (term) {
      data = data.filter(t => (
        (t.nama && String(t.nama).toLowerCase().includes(term)) ||
        (t.blok && String(t.blok).toLowerCase().includes(term))
      ));
    }
    data = [...data].sort((a, b) => {
      const at = new Date(a.timestamp || 0).getTime();
      const bt = new Date(b.timestamp || 0).getTime();
      if (isNaN(at) || isNaN(bt)) {
        return sortDesc ? String(b.txid).localeCompare(String(a.txid)) : String(a.txid).localeCompare(String(b.txid));
      }
      return sortDesc ? bt - at : at - bt;
    });
    return data;
  }, [transactions, search, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const summary = useMemo(() => {
    const count = filtered.length;
    const totalNominal = filtered.reduce((acc, t) => {
      const num = Number(t.nominal);
      return acc + (Number.isNaN(num) ? 0 : num);
    }, 0);
    return { count, totalNominal };
  }, [filtered]);

  return (
    <PageLayout title="Riwayat Saya" onBack={onBack}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-4 sm:p-6">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-4">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau RT"
              className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg w-full sm:w-64 bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={() => setSortDesc(s => !s)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              {sortDesc ? 'Terbaru ↓' : 'Terlama ↑'}
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner loading text="Memuat data..." />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-sm text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </div>
          )}

          {/* Transaction Cards */}
          {!loading && !error && (
            <>
              {paged.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-400 dark:text-slate-500 mb-2">
                    <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Data transaksi belum ada</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Transaksi Anda akan muncul di sini</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {paged.map(t => (
                    <div 
                      key={t.txid} 
                      className="p-4 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">
                              {t.nama || 'Tanpa Nama'}
                            </p>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded font-mono">
                              #{t.txid}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            RT: {t.blok || '-'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            Petugas: {t.petugas || '-'}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Tipe: {t.type === 'daily' ? 'Harian' : t.type === 'monthly' ? 'Bulanan' : 'Tahunan'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteClick(t)}
                          className="text-xs text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                        {formatCurrency(t.nominal)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(t.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </> 
          )}

          {/* Summary & Pagination */}
          {!loading && !error && paged.length > 0 && (
            <>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mb-4 pb-4 border-b border-slate-200 dark:border-gray-700">
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ‹ Prev
                  </button>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next ›
                  </button>
                </div>
              )}

              <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Total Transaksi:</span>
                    <span className="ml-2 text-slate-900 dark:text-white font-bold">{summary.count}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Total Nominal:</span>
                    <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold">
                      {formatCurrency(summary.totalNominal)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirm Dialog Delete */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus"
        message={`Yakin ingin menghapus transaksi untuk "${selectedTransaction?.nama || ''}" (Rp ${selectedTransaction?.nominal?.toLocaleString() || 0})?`}
        confirmText="Hapus"
        cancelText="Batal"
      />
    </PageLayout>
  );
}