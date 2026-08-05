import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import ImportUserModal from '../components/ImportUserModal';
import { getUsersFromSheet, createUserInSheet, updateUserInSheet, deleteUserInSheet, getUserActivity, importUsersFromSheet, bulkDeleteUsersInSheet } from '../services/sheets';

export default function Users({ onBack }) {
  const { currentUser, token } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    username: '',
    password: '',
    role: 'petugas'
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Bulk delete state
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);
  const [showDeleteResult, setShowDeleteResult] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Activity log
  const [showActivity, setShowActivity] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  
  // Import state
  const [showImportModal, setShowImportModal] = useState(false);

  const loadUsers = async () => {
    if (!token) {
      toast.error('Unauthorized: No token');
      return;
    }
    
    setLoading(true);
    try {
      const response = await getUsersFromSheet(token);
      if (response.status === 'success' && response.data) {
        setUsers(Array.isArray(response.data) ? response.data : []);
      } else {
        setUsers([]);
        toast.error(response.message || 'Gagal memuat users');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memuat data user');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    if (!token) {
      toast.error('Unauthorized: No token');
      return;
    }
    
    setLoadingActivity(true);
    setShowActivity(true);
    try {
      const response = await getUserActivity(token);
      if (response.status === 'success' && response.data) {
        setActivityData(Array.isArray(response.data) ? response.data : []);
        toast.info('Activity log dimuat');
      } else {
        setActivityData([]);
        toast.error(response.message || 'Gagal memuat activity');
      }
    } catch (err) {
      toast.error('Gagal memuat activity log');
      setActivityData([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showForm]);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !selectedRole || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const startAdd = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      name: '',
      username: '',
      password: '',
      role: 'petugas'
    });
    setFormError('');
    setShowForm(true);
  };

  const startEdit = (user) => {
    setIsEditing(true);
    setFormData({
      id: user.id,
      name: user.name,
      username: user.username,
      password: '',
      role: user.role
    });
    setFormError('');
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setFormData({
      id: '',
      name: '',
      username: '',
      password: '',
      role: 'petugas'
    });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Unauthorized: No token');
      return;
    }
    
    // Only admin can add/update users
    if (currentUser?.role !== 'admin') {
      toast.error('Hanya admin yang dapat mengelola user');
      return;
    }
    
    setFormError('');
    setIsSaving(true);

    try {
      if (isEditing) {
        // Update user
        const updates = {
          name: formData.name.trim(),
          username: formData.username.trim(),
          role: formData.role
        };
        if (formData.password?.trim()) {
          updates.password = formData.password.trim();
        }
        await updateUserInSheet(token, formData.id, updates);
        
        // Wait for backend to process
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success(`User berhasil diupdate! Data ${formData.name} telah diperbarui`);
      } else {
        // Validate required fields for create
        if (!formData.name.trim() || !formData.username.trim() || !formData.password.trim()) {
          throw new Error('Semua field harus diisi');
        }
        
        // Create user
        const userData = {
          name: formData.name.trim(),
          username: formData.username.trim(),
          password: formData.password.trim(),
          role: formData.role
        };
        
        await createUserInSheet(token, userData);
        
        // Wait for backend to process
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success(`User berhasil ditambahkan! ${formData.name} telah ditambahkan ke sistem`);
      }
      
      // Reload users to get updated list
      await loadUsers();
      cancelForm();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan user');
      toast.error(err.message || 'Gagal menyimpan user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (user) => {
    if (user.id === currentUser?.id) {
      toast.warning('Tidak dapat menghapus akun sendiri');
      return;
    }
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    if (!token) {
      toast.error('Unauthorized: No token');
      return;
    }
    
    // Only admin can delete users
    if (currentUser?.role !== 'admin') {
      toast.error('Hanya admin yang dapat menghapus user');
      return;
    }

    try {
      await deleteUserInSheet(token, userToDelete.id);
      
      // Wait for backend to process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`User berhasil dihapus! ${userToDelete.name} telah dihapus dari sistem`);
      
      // Reload users to get updated list
      await loadUsers();
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus user');
    }
  };

  const handleImportUsers = async (importedUsers) => {
    if (!token) {
      toast.error('Unauthorized: No token');
      return;
    }

    try {
      await importUsersFromSheet(token, importedUsers);
      toast.success(`${importedUsers.length} user berhasil diimport!`);
      setShowImportModal(false);
      
      // Wait a bit for backend to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force reload users list
      await loadUsers();
    } catch (err) {
      toast.error(err.message || 'Gagal mengimport users');
    }
  };

  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      // Don't allow selecting own account
      if (userId === currentUser?.id) {
        toast.warning('Tidak dapat menyeleksi akun sendiri');
        return;
      }
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size > 0) {
      setSelectedUserIds(new Set());
    } else {
      const selectableUserIds = filteredUsers
        .filter(u => u.id !== currentUser?.id)
        .map(u => u.id);
      setSelectedUserIds(new Set(selectableUserIds));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedUserIds.size === 0) {
      toast.warning('Pilih user yang akan dihapus');
      return;
    }
    setShowBulkDeleteConfirm(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (!token) {
      toast.error('Unauthorized: No token');
      return;
    }

    if (currentUser?.role !== 'admin') {
      toast.error('Hanya admin yang dapat menghapus user');
      return;
    }

    setIsDeleting(true);
    try {
      const userIdsToDelete = Array.from(selectedUserIds);
      const response = await bulkDeleteUsersInSheet(token, userIdsToDelete);
      
      // Wait for backend to process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set delete result for popup
      setDeleteResult({
        status: response.status,
        deleted: response.deleted || 0,
        excluded: response.excluded || [],
        totalRequested: response.totalRequested || userIdsToDelete.length
      });
      setShowDeleteResult(true);
      setShowBulkDeleteConfirm(false);
      setSelectedUserIds(new Set());
      
      // Reload users
      await loadUsers();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus users');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

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
                      👥 Manajemen User
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Total: {filteredUsers.length} user • Password di-hash SHA-256
                      {selectedUserIds.size > 0 && <span className="ml-2 font-semibold text-orange-600 dark:text-orange-400">• {selectedUserIds.size} dipilih</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button
                    onClick={loadUsers}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1"
                    title="Refresh data user"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                  {selectedUserIds.size > 0 && (
                    <button
                      onClick={handleBulkDeleteClick}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="hidden sm:inline">Hapus {selectedUserIds.size}</span>
                      <span className="sm:hidden">Hapus</span>
                    </button>
                  )}
                  <button
                    onClick={loadActivity}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Activity</span>
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span className="hidden sm:inline">Import</span>
                  </button>
                  <button
                    onClick={startAdd}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-red-500/80 to-orange-500/80 backdrop-blur-md hover:from-red-600 hover:to-orange-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1 border border-red-300/50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Tambah User</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Section */}
            {showActivity && (
              <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    User Activity Log
                  </h3>
                  <button onClick={() => setShowActivity(false)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {loadingActivity ? (
                  <div className="text-center py-4 text-sm text-indigo-600 dark:text-indigo-400">Memuat...</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activityData.map((activity, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{activity.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                            activity.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {activity.role}
                          </span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                          {formatDate(activity.lastLogin)}
                        </span>
                      </div>
                    ))}
                    {activityData.length === 0 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 text-xs py-4">
                        Belum ada aktivitas login
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama, username, atau ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all"
                />
                <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all"
                >
                  <option value="">Semua Role</option>
                  <option value="admin">Admin</option>
                  <option value="petugas">Petugas</option>
                </select>
                {paginatedUsers.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                      selectedUserIds.size > 0
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="hidden sm:inline">{selectedUserIds.size > 0 ? 'Batal Pilih' : 'Pilih Semua'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* User List */}
            <div className="space-y-1.5">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner loading text="Memuat data user..." />
                </div>
              ) : paginatedUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                  Tidak ada user ditemukan
                </div>
              ) : (
                paginatedUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => user.id !== currentUser?.id && toggleUserSelection(user.id)}
                    className={`rounded-lg p-2 border transition-all duration-200 cursor-pointer group ${
                      selectedUserIds.has(user.id)
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 shadow-md'
                        : 'bg-gradient-to-r from-slate-50/80 to-blue-50/50 dark:from-gray-700/50 dark:to-gray-600/50 border-slate-200/60 dark:border-gray-600/60 hover:shadow-md hover:bg-slate-100 dark:hover:from-gray-600/60 dark:hover:to-gray-550/60'
                    } ${user.id === currentUser?.id ? 'opacity-70 cursor-default' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex gap-2 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                              {user.name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <span>👤 {user.username}</span>
                            <span className="text-[10px]">ID: {user.id}</span>
                          </p>
                          {user.lastLogin && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Login terakhir: {formatDate(user.lastLogin)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => startEdit(user)}
                          className="px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-red-500/80 to-orange-500/80 backdrop-blur-md hover:from-red-600 hover:to-orange-600 rounded-md transition-all duration-200 flex items-center gap-1 border border-red-300/50"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.id === currentUser?.id}
                          className={`px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-md transition-all duration-200 flex items-center gap-1 ${
                            user.id === currentUser?.id 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:from-red-600 hover:to-rose-600'
                          }`}
                          title={user.id === currentUser?.id ? 'Tidak bisa hapus akun sendiri' : 'Hapus user'}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </div>
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={cancelForm}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          
          {/* Modal */}
          <div 
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500/80 to-orange-500/80 backdrop-blur-md p-5 text-white border-b border-red-300/50">
              <div className="flex items-center gap-3">
                <div className="bg-red-600/30 backdrop-blur-sm p-3 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isEditing ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    )}
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{isEditing ? 'Edit User' : 'Tambah User Baru'}</h3>
                  <p className="text-sm opacity-90 mt-0.5">{isEditing ? 'Perbarui informasi user' : 'Tambahkan user baru ke sistem'}</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Username"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="admin">Admin</option>
                      <option value="petugas">Petugas</option>
                    </select>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                      Password
                      {isEditing && <span className="text-xs text-gray-500 font-normal ml-2">(kosongkan jika tidak diubah)</span>}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Masukkan password"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!isEditing}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Password akan di-hash dengan SHA-256
                    </p>
                  </div>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={cancelForm}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2.5 font-semibold text-white bg-gradient-to-r from-red-500/80 to-orange-500/80 backdrop-blur-md hover:from-red-600 hover:to-orange-600 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border border-red-300/50"
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </span>
                    ) : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus User"
        message={`Apakah Anda yakin ingin menghapus user "${userToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />

      {/* Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setShowBulkDeleteConfirm(false)}></div>
          
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-500 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-red-600/20 p-3 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4v2m0 4v2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Hapus Multiple User</h3>
                  <p className="text-sm opacity-90 mt-0.5">Tindakan tidak dapat dibatalkan</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-5">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Apakah Anda yakin ingin menghapus <span className="font-bold text-red-600 dark:text-red-400">{selectedUserIds.size} user</span> yang dipilih?
              </p>
              
              {/* Action */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  onClick={handleBulkDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus Semua
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Result Modal */}
      {showDeleteResult && deleteResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all">
            {/* Header */}
            <div className={`p-5 text-white ${
              deleteResult.status === 'success' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-yellow-500 to-amber-500'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${
                  deleteResult.status === 'success'
                    ? 'bg-green-600/20'
                    : 'bg-yellow-600/20'
                }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {deleteResult.deleted > 0 ? 'Penghapusan Berhasil' : 'Info Penghapusan'}
                  </h3>
                  <p className="text-sm opacity-90 mt-0.5">
                    {deleteResult.deleted > 0
                      ? `${deleteResult.deleted} user telah dihapus`
                      : 'User tidak dapat dihapus'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-5">
              <div className="space-y-4">
                {/* Summary */}
                <div className={`grid gap-3 ${deleteResult.excluded.length > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {deleteResult.deleted}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 font-medium mt-1">
                      Dihapus
                    </p>
                  </div>
                  {deleteResult.excluded.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {deleteResult.excluded.length}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium mt-1">
                        Dikecualikan
                      </p>
                    </div>
                  )}
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {deleteResult.totalRequested}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium mt-1">
                      Diminta
                    </p>
                  </div>
                </div>

                {/* Excluded users list */}
                {deleteResult.excluded.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                      User yang Dikecualikan:
                    </p>
                    <div className="space-y-1">
                      {deleteResult.excluded.map((user, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>{user.name}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 italic">
                      (Anda tidak dapat menghapus akun Anda sendiri)
                    </p>
                  </div>
                )}

                {/* Success message */}
                {deleteResult.deleted > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      ✓ {deleteResult.deleted} user telah berhasil dihapus dari sistem
                    </p>
                  </div>
                )}

                {/* No deleted message */}
                {deleteResult.deleted === 0 && deleteResult.excluded.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      ⚠ Tidak ada user yang dihapus karena user yang dipilih adalah akun Anda sendiri
                    </p>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowDeleteResult(false)}
                  className="w-full px-4 py-2.5 font-semibold text-white bg-gradient-to-r from-red-500/80 to-orange-500/80 backdrop-blur-md hover:from-red-600 hover:to-orange-600 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 border border-red-300/50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import User Modal */}
      <ImportUserModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportUsers}
      />
    </div>
  );
}
