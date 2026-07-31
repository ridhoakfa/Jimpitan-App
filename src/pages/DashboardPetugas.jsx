import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getUnpaidToday } from '../services/sheets';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export default function DashboardPetugas() {
  const { token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('belum'); // 'semua', 'belum', 'sudah'

  useEffect(() => {
    if (!token) {
      toast.error('Silakan login terlebih dahulu');
      navigate('/login');
      return;
    }
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUnpaidToday(token);
      console.log('📊 Response getUnpaidToday:', result);
      
      if (result.status === 'success') {
        setData(result.data);
      } else {
        setError(result.message || 'Gagal memuat data');
        toast.error(result.message || 'Gagal memuat data');
      }
    } catch (err) {
      console.error('❌ Error loadData:', err);
      setError('Terjadi kesalahan saat memuat data: ' + err.message);
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && token) {
        loadData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loading, token]);

  // Data dari backend
  const unpaidCustomers = data?.unpaid || [];
  const paidCustomers = data?.paid || [];
  const allCustomers = data?.allCustomers || [];

  // Filter berdasarkan status
  let displayCustomers = [];
  if (filterStatus === 'semua') {
    displayCustomers = allCustomers;
  } else if (filterStatus === 'belum') {
    displayCustomers = unpaidCustomers;
  } else if (filterStatus === 'sudah') {
    displayCustomers = paidCustomers;
  }

  // Filter pencarian
  const filteredCustomers = displayCustomers.filter(c =>
    c.nama?.toLowerCase().includes(search.toLowerCase()) ||
    String(c.blok).includes(search)
  );

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner loading text="Memuat data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">❌</div>
          <h3 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
            Gagal Memuat Data
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            🔄 Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const totalUnpaid = data?.totalUnpaid || 0;
  const totalPaid = data?.totalPaid || 0;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header dengan Info */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              📋 Tugas Hari Ini
            </h1>
            {data && (
              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                <span className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full text-blue-700 dark:text-blue-300">
                  {dayNames[data.day - 1]}, {data.date}
                </span>
                <span className="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full text-red-700 dark:text-red-300">
                  Belum setor: {totalUnpaid} rumah
                </span>
                <span className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-green-700 dark:text-green-300">
                  Sudah setor: {totalPaid} rumah
                </span>
                {!data.isJimpitan && (
                  <span className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full text-yellow-700 dark:text-yellow-300">
                    ⚠️ Hari Minggu libur
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setFilterStatus('semua')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filterStatus === 'semua'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterStatus('belum')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filterStatus === 'belum'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Belum Setor
          </button>
          <button
            onClick={() => setFilterStatus('sudah')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filterStatus === 'sudah'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Sudah Setor
          </button>
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau RT..."
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {filterStatus === 'sudah'
              ? 'Belum ada customer yang sudah setor hari ini.'
              : filterStatus === 'belum' && data?.isJimpitan
              ? 'Semua rumah sudah setor hari ini!'
              : 'Hari Minggu libur, tidak ada tugas jimpitan.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate('/scanqr')}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm">
                    {cust.nama}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    RT {cust.blok}
                  </p>
                </div>
                {/* Badge status dengan warna sesuai */}
                {cust.paid ? (
                  <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                    ✅ Sudah
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full">
                    ❌ Belum
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                <span>Total keseluruhan: Rp {cust.totalSetoran?.toLocaleString() || 0}</span>
                <br />
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  Hari ini: Rp {cust.todaySetoran?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info refresh otomatis */}
      <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
        Data otomatis diperbarui setiap 30 detik
      </div>
    </div>
  );
}