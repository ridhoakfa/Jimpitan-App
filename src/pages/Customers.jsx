import { useState, useEffect, useMemo } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import QRCard from '../components/QRCard';
import ImportCustomerModal from '../components/ImportCustomerModal';
import BulkDownloadQRModal from '../components/BulkDownloadQRModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getCustomersFromSheet,
  createCustomerInSheet,
  updateCustomerInSheet,
  deleteCustomerInSheet,
  importCustomersFromSheet,
  bulkDeleteCustomersInSheet,
} from '../services/sheets';

export default function Customers({ onBack }) {
  const { currentUser, token } = useAuth();
  const toast = useToast();

  // State management
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchBlok, setSearchBlok] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState({
    blok: '',
    nama: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // QR Code display
  const [showQRCard, setShowQRCard] = useState(false);
  const [qrCustomer, setQrCustomer] = useState(null);

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);

  // Bulk download QR modal
  const [showBulkDownloadQR, setShowBulkDownloadQR] = useState(false);

  // Bulk delete state
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);
  const [showDeleteResult, setShowDeleteResult] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers(skipCache = false) {
    try {
      setLoading(true);
      const response = await getCustomersFromSheet(skipCache);
      
      if (response.status === 'success') {
        
        // Sanitize customer data - ensure all properties are strings
        const sanitizedData = (response.data || []).map(customer => ({
          ...customer,
          id: customer.id || '',
          blok: customer.blok || '',
          nama: customer.nama || '',
          qrHash: customer.qrHash || '',
          createdAt: customer.createdAt || '',
          totalSetoran: customer.totalSetoran || 0,
          lastTransaction: customer.lastTransaction || null
        }));
        
        setCustomers(sanitizedData);
      } else {
        toast.error(response.message || 'Gagal memuat data customer');
        setCustomers([]); // Set empty array on error
      }
    } catch (error) {
      toast.error('Error memuat data customer', error.message);
      setCustomers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Safety checks untuk null/undefined
      const customerName = customer?.nama || '';
      const customerBlok = customer?.blok || '';
      
      const nameMatch = customerName.toString().toLowerCase().includes(searchName.toLowerCase());
      const blokMatch = customerBlok.toString().toLowerCase().includes(searchBlok.toLowerCase());
      return nameMatch && blokMatch;
    });
  }, [customers, searchName, searchBlok]);

  // Paginate filtered customers
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchBlok]);

  // Form handlers
  function handleCreate() {
    setFormMode('create');
    setCurrentCustomer(null);
    setFormData({ blok: '', nama: '' });
    setShowForm(true);
  }

  function handleEdit(customer) {
    setFormMode('edit');
    setCurrentCustomer(customer);
    setFormData({
      blok: customer.blok,
      nama: customer.nama,
    });
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setCurrentCustomer(null);
    setFormData({ blok: '', nama: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation - Convert to string first
    const blokStr = String(formData.blok || '').trim();
    const namaStr = String(formData.nama || '').trim();
    
    if (!blokStr || !namaStr) {
      toast.error('RT dan nama harus diisi');
      return;
    }

    if (!token) {
      toast.error('Token tidak ditemukan, silakan login ulang');
      return;
    }

    if (currentUser?.role !== 'admin') {
      toast.error('Hanya admin yang dapat mengelola customer');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare data with string values
      const submitData = {
        blok: blokStr,
        nama: namaStr
      };

      let response;
      if (formMode === 'create') {
        response = await createCustomerInSheet(token, submitData);
      } else {
        response = await updateCustomerInSheet(token, currentCustomer.id, submitData);
      }

      if (response.status === 'success') {
        toast.success(
          formMode === 'create' ? 'Customer berhasil ditambahkan' : 'Customer berhasil diupdate'
        );
        handleCloseForm();
        await loadCustomers();
      } else {
        toast.error(response.message || 'Operasi gagal');
      }
    } catch (error) {
      toast.error('Error saat menyimpan customer', error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteClick(customer) {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  }

  async function handleDeleteConfirm() {
    if (!customerToDelete || !token) return;

    try {
      const response = await deleteCustomerInSheet(token, customerToDelete.id);
      
      if (response.status === 'success') {
        toast.success('Customer berhasil dihapus');
        setShowDeleteConfirm(false);
        setCustomerToDelete(null);
        await loadCustomers(true);
      } else {
        toast.error(response.message || 'Operasi gagal');
      }
    } catch (error) {
      toast.error('Error saat hapus customer', error.message);
    }
  }

  // ==========================================================
  // FUNGSI UNTUK MENUTUP MODAL KONFIRMASI HAPUS
  // ==========================================================
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setCustomerToDelete(null);
  };

  function toggleCustomerSelection(customerId) {
    const newSelected = new Set(selectedCustomerIds);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomerIds(newSelected);
  }

  function toggleSelectAllCustomers() {
    if (selectedCustomerIds.size > 0) {
      setSelectedCustomerIds(new Set());
    } else {
      const selectableCustomerIds = paginatedCustomers.map(c => c.id);
      setSelectedCustomerIds(new Set(selectableCustomerIds));
    }
  }

  function handleBulkDeleteClick() {
    if (selectedCustomerIds.size === 0) {
      toast.warning('Pilih customer yang akan dihapus');
      return;
    }
    setShowBulkDeleteConfirm(true);
  }

  async function handleBulkDeleteConfirm() {
    if (!token) {
      toast.error('Unauthorized: No token');
      return;
    }

    setIsDeleting(true);
    try {
      const customerIdsToDelete = Array.from(selectedCustomerIds);
      const response = await bulkDeleteCustomersInSheet(token, customerIdsToDelete);
      
      if (!response) {
        throw new Error('No response from server');
      }
      
      // Wait for backend to process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set delete result for popup
      setDeleteResult({
        status: response.status,
        deleted: response.deleted || 0,
        excluded: response.excluded || [],
        totalRequested: response.totalRequested || customerIdsToDelete.length
      });
      setShowDeleteResult(true);
      setShowBulkDeleteConfirm(false);
      setSelectedCustomerIds(new Set());
      
      // Reload customers - make sure this completes
      try {
        await loadCustomers(true);
      } catch (reloadErr) {
        console.error('Error reloading customers:', reloadErr);
        toast.error('Gagal me-refresh data customers');
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      toast.error(err.message || 'Gagal menghapus customers');
      setShowBulkDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleShowQR(customer) {
    setQrCustomer(customer);
    setShowQRCard(true);
  }

  function handleCloseQR() {
    setShowQRCard(false);
    setQrCustomer(null);
  }

  async function handleImportCustomers(customersToImport) {
    if (!token) {
      toast.error('Token tidak ditemukan, silakan login ulang');
      return;
    }

    if (currentUser?.role !== 'admin') {
      toast.error('Hanya admin yang dapat mengimport customer');
      return;
    }

    try {
      const response = await importCustomersFromSheet(token, customersToImport);
      
      if (response.status === 'success') {
        toast.success(`Import berhasil: ${customersToImport.length} customer ditambahkan`);
        await loadCustomers();
      } else {
        toast.error(response.message || 'Gagal mengimport customer');
      }
    } catch (error) {
      toast.error('Error saat mengimport customer', error.message);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-red-50 via-white/40 to-red-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900 transition-colors duration-300">
        <div className="flex-1 overflow-auto p-3 md:p-4">
          <div className="max-w-4xl mx-auto">
            <LoadingSpinner text="Memuat data customer..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 via-white/40 to-red-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900 transition-colors duration-300">
      <div className="flex-1 overflow-auto p-3 md:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-300/50 dark:shadow-none border border-slate-200/60 dark:border-gray-700/60 p-4 md:p-5">
            
            {/* Header */}
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
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
                    <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 text-transparent bg-clip-text mb-1">
                      📦 Manajemen Customer
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Total: {filteredCustomers.length} customer • Halaman {currentPage} dari {totalPages || 1}
                      {selectedCustomerIds.size > 0 && <span className="ml-2 font-semibold text-orange-600 dark:text-orange-400">• {selectedCustomerIds.size} dipilih</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => loadCustomers(true)}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1"
                    title="Refresh data customer"
                  >
                    <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                  {selectedCustomerIds.size > 0 && (
                    <button
                      onClick={handleBulkDeleteClick}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="hidden sm:inline">Hapus {selectedCustomerIds.size}</span>
                      <span className="sm:hidden">Hapus</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowBulkDownloadQR(true)}
                    disabled={customers.length === 0}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download QR codes"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="hidden sm:inline">Download QR</span>
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1"
                    title="Import customer dari file Excel"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="hidden sm:inline">Import</span>
                  </button>
                  <button
                    onClick={handleCreate}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-red-500/80 to-orange-500/80 backdrop-blur-md hover:from-red-600 hover:to-orange-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1 border border-red-300/50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Tambah</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
      {/* Stats Info */}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        Total: <strong>{customers.length}</strong> customer • Halaman {currentPage} dari {totalPages || 1}
      </div>

      {/* Search Filters */}
      {customers.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 relative w-full">
            <input
              type="text"
              placeholder="Cari nama customer..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex-1 relative w-full">
            <input
              type="text"
              placeholder="Cari RT..."
              value={searchBlok}
              onChange={(e) => setSearchBlok(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {(searchName || searchBlok) && (
              <button
                onClick={() => {
                  setSearchName('');
                  setSearchBlok('');
                }}
                className="flex-1 sm:flex-initial px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                Reset
              </button>
            )}
            <button
              onClick={toggleSelectAllCustomers}
              className={`flex-1 sm:flex-initial px-4 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                selectedCustomerIds.size > 0
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
              }`}
              title={selectedCustomerIds.size > 0 ? 'Batal Pilih' : 'Pilih Semua'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {selectedCustomerIds.size > 0 ? `Pilih (${selectedCustomerIds.size})` : 'Pilih Semua'}
            </button>
          </div>
        </div>
      )}

      {/* Filter Results Info */}
      {customers.length > 0 && (
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Menampilkan {filteredCustomers.length} dari {customers.length} customer
        </div>
      )}

      {/* Empty State */}
      {customers.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Belum Ada Customer
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Tambahkan customer pertama untuk mulai menggunakan sistem Jimpitan
          </p>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-red-500/80 to-orange-500/80 backdrop-blur-md hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-colors border border-red-300/50"
          >
            Tambah Customer Pertama
          </button>
        </div>
      )}

      {/* No Results State */}
      {customers.length > 0 && filteredCustomers.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Tidak Ada Hasil
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Coba ubah kata kunci pencarian Anda
          </p>
        </div>
      )}

      {/* Customer Grid */}
      {filteredCustomers.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
            {paginatedCustomers.map((customer) => {
              // Safety check untuk data customer
              if (!customer || !customer.id) return null;
              
              return (
              <div
                key={customer.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Card Header - Selectable Title */}
                <div
                  onClick={() => toggleCustomerSelection(customer.id)}
                  className={`bg-gradient-to-r from-red-500 to-red-600 p-3 text-white text-center cursor-pointer hover:shadow-md transition-all ${
                    selectedCustomerIds.has(customer.id)
                      ? 'from-red-500 to-red-600 ring-2 ring-white ring-inset'
                      : 'hover:from-red-600 hover:to-red-700'
                  }`}
                  title={selectedCustomerIds.has(customer.id) ? 'Batal Pilih' : 'Pilih Customer'}
                >
                  <div className="text-xs opacity-75 mb-1">RT {customer.blok || '-'}</div>
                  <div className="text-lg font-bold mb-1">{customer.id || '-'}</div>
                  <div className="text-sm font-semibold">{customer.nama || '-'}</div>
                </div>

                {/* Card Body */}
                <div className="p-3">
                  {/* QR Hash - Center */}
                  <div className="mb-3 text-center">
                    <div className="font-mono text-lg bg-gradient-to-r from-red-100 to-white dark:from-red-900/30 dark:to-gray-900/30 px-3 py-2 rounded-lg font-bold text-red-700 dark:text-red-300">
                      {customer.qrHash || '-'}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                      <div className="text-xs text-green-600 dark:text-green-400">Total</div>
                      <div className="text-sm font-bold text-green-700 dark:text-green-300">
                        Rp {(customer.totalSetoran || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                      <div className="text-xs text-red-600 dark:text-red-400">Terakhir Pencatatan</div>
                      <div className="text-xs font-semibold text-red-700 dark:text-red-300">
                        {customer.lastTransaction
                          ? new Date(customer.lastTransaction).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) + ', ' + new Date(customer.lastTransaction).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleShowQR(customer)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                      title="Lihat QR Code"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      QR
                    </button>
                    <button
                      onClick={() => handleEdit(customer)}
                      className="px-3 py-2 bg-gradient-to-r from-red-500/80 to-orange-500/80 backdrop-blur-md hover:from-red-600 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 border border-red-300/50"
                      title="Edit Customer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(customer)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                      title="Hapus Customer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            )})}
          </div>

          {/* Pagination - Fixed at bottom */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                ‹ Prev
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-400 px-3">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next ›
              </button>
            </div>
          )}
        </>
      )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseForm}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {formMode === 'create' ? '➕ Tambah Customer' : '✏️ Edit Customer'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Blok Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  RT / ID Wilayah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.blok}
                  onChange={(e) => setFormData({ ...formData, blok: e.target.value })}
                  placeholder="Contoh: RT 1, RT 2, dst"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Nama Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama customer"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Info Text */}
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-700 dark:text-red-300">
                💡 QR Code akan otomatis dibuat setelah customer ditambahkan
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500/80 to-orange-500/80 backdrop-blur-md hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-300/50"
                >
                  {submitting ? 'Menyimpan...' : formMode === 'create' ? 'Tambah' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* KONFIRMASI HAPUS — PERBAIKAN: gunakan onClose, bukan onCancel */}
      {/* ========================================================== */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Hapus Customer"
        message={
          customerToDelete
            ? `Apakah Anda yakin ingin menghapus customer "${customerToDelete.nama}" (RT: ${customerToDelete.blok})? Tindakan ini tidak dapat dibatalkan.`
            : ''
        }
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        onClose={handleCancelDelete}   // <-- PERBAIKAN: onCancel → onClose
        type="danger"
      />

      {/* QR Code Modal */}
      {showQRCard && qrCustomer && <QRCard customer={qrCustomer} onClose={handleCloseQR} />}

      {/* Import Customer Modal */}
      <ImportCustomerModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCustomers}
      />

      {/* Bulk Download QR Modal */}
      <BulkDownloadQRModal
        isOpen={showBulkDownloadQR}
        onClose={() => setShowBulkDownloadQR(false)}
        customers={customers}
      />

      {/* Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowBulkDeleteConfirm(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-3xl">⚠️</span> Hapus {selectedCustomerIds.size} Customer?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Apakah Anda yakin ingin menghapus {selectedCustomerIds.size} customer yang dipilih? Tindakan ini tidak dapat dibatalkan.
            </p>
            
            {isDeleting && (
              <div className="flex flex-col items-center justify-center mb-6">
                <svg className="w-12 h-12 text-red-500 animate-spin mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="text-sm text-gray-600 dark:text-gray-400">Menghapus customer...</p>
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Result Modal */}
      {showDeleteResult && deleteResult && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteResult(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              {deleteResult.status === 'success' ? (
                <span className="text-4xl">✅</span>
              ) : (
                <span className="text-4xl">⚠️</span>
              )}
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {deleteResult.status === 'success' ? 'Penghapusan Berhasil' : 'Penghapusan Selesai'}
              </h2>
            </div>

            {/* Result Statistics */}
            <div className="space-y-3 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-600 dark:text-green-400">Dihapus</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {deleteResult.deleted}
                </div>
              </div>

              {deleteResult.excluded && deleteResult.excluded.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Dikecualikan</div>
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {deleteResult.excluded.length}
                  </div>
                  <div className="mt-2 text-xs space-y-1">
                    {deleteResult.excluded.map((item, idx) => (
                      <div key={idx} className="text-yellow-700 dark:text-yellow-400">
                        • {item.name || item.id} - {item.reason || 'Alasan tidak tersedia'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <div className="text-sm text-red-600 dark:text-red-400">Total Diminta</div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {deleteResult.totalRequested}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDeleteResult(false)}
              className="w-full px-4 py-2 bg-gradient-to-r from-red-500/80 to-orange-500/80 backdrop-blur-md hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-colors border border-red-300/50"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}