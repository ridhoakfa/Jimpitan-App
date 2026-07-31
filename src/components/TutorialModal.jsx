import { useState } from 'react';

const TUTORIALS = {
  admin: [
    {
      id: 'users',
      title: '👥 Manajemen Users',
      description: 'Kelola pengguna sistem (Admin & Petugas)',
      steps: [
        {
          title: 'Melihat Daftar Users',
          content: 'Buka menu Users untuk melihat semua pengguna yang terdaftar di sistem.',
          tips: '💡 Gunakan fitur pencarian untuk mencari user tertentu'
        },
        {
          title: 'Menambah User Baru',
          content: 'Klik tombol "Tambah User", isi form dengan username, password, nama lengkap, dan pilih role (Admin/Petugas).',
          tips: '⚠️ Username harus unik dan tidak boleh sama dengan user lain'
        },
        {
          title: 'Mengedit User',
          content: 'Klik tombol edit (✏️) pada user yang ingin diubah, lalu ubah data yang diperlukan.',
          tips: '🔐 Password bisa dikosongkan jika tidak ingin mengubahnya'
        },
        {
          title: 'Menghapus User',
          content: 'Klik tombol hapus (🗑️) pada user yang ingin dihapus, lalu konfirmasi penghapusan.',
          tips: '⚠️ Data yang sudah dihapus tidak bisa dikembalikan'
        }
      ]
    },
    {
      id: 'customers',
      title: '📋 Manajemen Customer',
      description: 'Kelola data nasabah jimpitan',
      steps: [
        {
          title: 'Melihat Daftar Customer',
          content: 'Akses menu Customers untuk melihat semua nasabah yang terdaftar.',
          tips: '🔍 Gunakan pencarian berdasarkan nama atau RT'
        },
        {
          title: 'Menambah Customer Baru (Manual atau Import Excel)',
          content: 'Klik "Tambah Customer" untuk input manual satu per satu, atau klik "Import" untuk upload file Excel dengan banyak data sekaligus (format: kolom RT dan Nama).',
          tips: '📊 Import Excel sangat berguna untuk menginput 75+ customer sekaligus'
        },
        {
          title: 'Melihat QR Code',
          content: 'Klik tombol "Lihat QR" untuk menampilkan QR Code customer. Ada 2 jenis: QR Hash (untuk scan) dan QR Submit (direct link).',
          tips: '💾 QR Code bisa didownload (PNG) atau langsung diprint'
        },
        {
          title: 'Download QR (Individu atau Bulk)',
          content: 'Untuk satu customer, klik "Download QR" di modal. Untuk banyak customer, gunakan tombol "Download QR" di halaman Customers, pilih "Semua" atau "Berdasarkan RT", lalu download ZIP berisi semua QR.',
          tips: '🎨 QR Card sudah terdesain dengan logo Karang Taruna dan info customer'
        },
        {
          title: 'Copy QR Hash/URL',
          content: 'Klik pada text hash/URL untuk copy ke clipboard, berguna untuk berbagi via chat.',
          tips: '✅ Akan muncul notifikasi "Berhasil dicopy"'
        }
      ]
    },
    {
      id: 'history',
      title: '📊 Riwayat Transaksi',
      description: 'Lihat dan kelola semua transaksi yang tercatat',
      steps: [
        {
          title: 'Melihat Semua Transaksi',
          content: 'Menu History menampilkan semua transaksi dari semua petugas dan customer, lengkap dengan tipe transaksi (Harian, Bulanan, Tahunan).',
          tips: '📅 Data diurutkan dari transaksi terbaru'
        },
        {
          title: 'Filter Periode (Hari/Minggu/Bulan/Tahun/Custom)',
          content: 'Gunakan filter periode untuk mempersempit data: Hari Ini, Minggu Ini, Bulan Ini, Tahun Ini, atau Custom dengan rentang tanggal spesifik.',
          tips: '🗓️ Filter "Hari Ini" mengikuti cut-off jam 3 pagi (transaksi dini hari dianggap hari sebelumnya)'
        },
        {
          title: 'Filter Tipe Transaksi',
          content: 'Pilih tipe transaksi: Semua, Harian, Bulanan, atau Tahunan. Berguna untuk memisahkan iuran reguler dengan iuran khusus (perantau).',
          tips: '📋 Transaksi bulanan/tahunan tidak mempengaruhi dashboard "Tugas Hari Ini"'
        },
        {
          title: 'Export ke Excel atau PDF',
          content: 'Klik tombol "PDF" atau "Excel" untuk download laporan sesuai filter yang sedang aktif. Hasil export mencakup semua kolom termasuk Tipe Transaksi.',
          tips: '📄 Export PDF cocok untuk arsip, Excel untuk analisis data lebih lanjut'
        },
        {
          title: 'Hapus Transaksi',
          content: 'Klik 🗑️ Hapus pada transaksi yang ingin dihapus. Admin bisa menghapus semua transaksi, petugas hanya bisa menghapus transaksi sendiri.',
          tips: '⚠️ Konfirmasi akan muncul sebelum penghapusan untuk mencegah kesalahan'
        }
      ]
    },
    {
      id: 'scanqr',
      title: '📱 Scan QR Code',
      description: 'Scan QR customer untuk transaksi cepat',
      steps: [
        {
          title: 'Membuka Scanner',
          content: 'Akses menu Scan QR, izinkan akses kamera jika diminta browser.',
          tips: '📷 Pastikan kamera berfungsi dengan baik dan pencahayaan cukup'
        },
        {
          title: 'Scan QR Code',
          content: 'Arahkan kamera ke QR Code customer. Sistem akan otomatis mendeteksi dan berpindah ke halaman Submit dengan data customer sudah terisi.',
          tips: '✨ QR Code terdeteksi otomatis, data customer langsung terisi'
        },
        {
          title: 'Input Nominal & Submit',
          content: 'Di halaman Submit, input nominal (bisa klik tombol Rp 500 untuk cepat atau ketik manual) lalu klik Submit. Setelah berhasil, otomatis redirect ke Riwayat Saya.',
          tips: '💰 Nominal default 500, bisa diubah sesuai kebutuhan. Untuk bulanan/tahunan, pilih tipe di atas form'
        }
      ]
    },
    {
      id: 'submit',
      title: '💰 Input Nominal Transaksi',
      description: 'Input nominal setelah scan QR, dengan pilihan tipe transaksi',
      steps: [
        {
          title: 'Data Customer Otomatis',
          content: 'Setelah scan QR berhasil, halaman Submit akan terbuka dengan data customer sudah terisi otomatis (nama dan RT).',
          tips: '✨ Tidak perlu pilih customer manual, data sudah siap'
        },
        {
          title: 'Pilih Tipe Transaksi',
          content: 'Pilih tipe: Harian (untuk iuran rutin), Bulanan, atau Tahunan (untuk iuran khusus seperti perantau).',
          tips: '📋 Tipe Harian akan dicek double entry dan libur Minggu, tipe lain tidak'
        },
        {
          title: 'Input Nominal (Bisa Klik Tombol Cepat)',
          content: 'Masukkan nominal setoran. Tersedia tombol cepat Rp 500 (default) untuk mempercepat input. Bisa juga mengetik nominal lain, misal 1000, 2000, atau 15000 untuk iuran bulanan.',
          tips: '💵 Default 500, ketik manual jika nominal berbeda'
        },
        {
          title: 'Submit & Redirect',
          content: 'Klik Submit untuk menyimpan. Data tersimpan dengan TXID unik dan otomatis redirect ke Riwayat Saya.',
          tips: '📝 Transaksi langsung masuk ke riwayat Anda dengan tipe yang dipilih'
        }
      ]
    },
    {
      id: 'dashboard',
      title: '📋 Tugas Hari Ini',
      description: 'Lihat daftar rumah yang sudah/belum setor hari ini (untuk semua pengguna)',
      steps: [
        {
          title: 'Melihat Status Hari Ini',
          content: 'Menu ini menampilkan semua rumah dengan status setoran hari ini. Header menunjukkan jumlah "Belum setor" dan "Sudah setor".',
          tips: '📊 Berguna untuk memantau progres jimpitan harian'
        },
        {
          title: 'Filter Status (Semua/Belum/Sudah)',
          content: 'Gunakan filter status untuk melihat semua customer, hanya yang belum setor, atau hanya yang sudah setor.',
          tips: '🔍 Filter "Semua" menampilkan status dengan badge warna (merah=belum, hijau=sudah)'
        },
        {
          title: 'Cari Nama atau RT',
          content: 'Gunakan kotak pencarian untuk mencari customer tertentu berdasarkan nama atau RT.',
          tips: '🔎 Memudahkan jika ingin mengecek satu rumah tertentu'
        },
        {
          title: 'Total Setoran Hari Ini',
          content: 'Setiap card customer menampilkan "Total keseluruhan" dan "Hari ini" (total setoran hari ini).',
          tips: '💰 "Hari ini" menunjukkan berapa yang sudah disetor customer pada hari ini saja'
        },
        {
          title: 'Data Otomatis Refresh',
          content: 'Data dashboard otomatis diperbarui setiap 30 detik. Bisa juga klik tombol "Refresh" untuk update manual.',
          tips: '🔄 Pastikan data selalu terkini tanpa perlu refresh halaman'
        }
      ]
    }
  ],
  petugas: [
    {
      id: 'scanqr',
      title: '📱 Scan QR Code',
      description: 'Scan QR customer untuk transaksi cepat',
      steps: [
        {
          title: 'Akses Scanner',
          content: 'Pilih menu "Scan QR" dari homepage atau navigasi. Izinkan akses kamera browser jika diminta.',
          tips: '📷 Pastikan pencahayaan cukup untuk hasil scan optimal'
        },
        {
          title: 'Proses Scanning',
          content: 'Arahkan kamera ke QR Code customer. Scanner akan otomatis mendeteksi dan memproses QR.',
          tips: '⚡ Tidak perlu menekan tombol, deteksi otomatis'
        },
        {
          title: 'Auto-Navigate ke Submit',
          content: 'Setelah QR terdeteksi, sistem otomatis membuka halaman Submit dengan data customer sudah terisi.',
          tips: '✨ Tinggal pilih tipe transaksi, masukkan nominal, dan submit'
        },
        {
          title: 'Validasi QR',
          content: 'Sistem hanya menerima QR Code valid dengan format 10 karakter hexadecimal (hash).',
          tips: '❌ QR Code tidak valid akan ditolak dengan pesan error'
        }
      ]
    },
    {
      id: 'submit',
      title: '💰 Input Nominal Transaksi',
      description: 'Input nominal setelah scan QR, dengan pilihan tipe',
      steps: [
        {
          title: 'Data Customer Terisi Otomatis',
          content: 'Setelah scan QR berhasil, halaman Submit terbuka otomatis dengan data customer sudah terisi (nama dan RT).',
          tips: '✨ Tidak perlu pilih customer manual, semuanya otomatis'
        },
        {
          title: 'Pilih Tipe Transaksi',
          content: 'Pilih tipe: Harian (untuk iuran rutin), Bulanan, atau Tahunan (untuk iuran khusus).',
          tips: '📋 Tipe Harian: tidak bisa double di hari yang sama dan libur Minggu'
        },
        {
          title: 'Input Nominal (Klik Tombol Cepat)',
          content: 'Masukkan nominal setoran. Klik tombol "Rp 500" untuk cepat, atau ketik manual jika nominal berbeda.',
          tips: '💵 Default 500, bisa diubah sesuai kebutuhan'
        },
        {
          title: 'Submit Transaksi',
          content: 'Klik tombol Submit untuk menyimpan. Transaksi akan tersimpan dengan TXID unik dan tipe yang dipilih.',
          tips: '✅ Notifikasi sukses akan muncul jika berhasil'
        },
        {
          title: 'Redirect ke Riwayat Saya',
          content: 'Setelah submit berhasil, sistem otomatis mengarahkan ke halaman Riwayat Saya untuk melihat transaksi terbaru.',
          tips: '📝 Transaksi langsung tampil di riwayat Anda'
        }
      ]
    },
    {
      id: 'myhistory',
      title: '📝 Riwayat Saya',
      description: 'Lihat transaksi yang Anda input sendiri',
      steps: [
        {
          title: 'Melihat Riwayat Pribadi',
          content: 'Menu Riwayat Saya menampilkan semua transaksi yang DI-INPUT oleh akun Anda saja, termasuk tipe transaksi (Harian/Bulanan/Tahunan).',
          tips: '👤 Hanya transaksi Anda yang tampil, bukan semua petugas'
        },
        {
          title: 'Detail Transaksi',
          content: 'Setiap kartu menampilkan TXID, Nama Customer, RT, Nominal, Tipe, dan Waktu transaksi.',
          tips: '🏷️ TXID adalah ID unik untuk setiap transaksi'
        },
        {
          title: 'Cari Berdasarkan Nama atau RT',
          content: 'Gunakan kotak pencarian untuk menemukan transaksi tertentu dari customer yang Anda catat.',
          tips: '🔎 Cari berdasarkan nama customer atau RT'
        },
        {
          title: 'Hapus Transaksi (Hanya Milik Sendiri)',
          content: 'Klik tombol hapus (🗑️) untuk menghapus transaksi yang salah input. Petugas hanya bisa menghapus transaksi yang dicatat sendiri.',
          tips: '⚠️ Konfirmasi akan muncul sebelum penghapusan, data tidak bisa dikembalikan'
        }
      ]
    },
    {
      id: 'dashboard',
      title: '📋 Tugas Hari Ini',
      description: 'Lihat daftar rumah yang sudah/belum setor hari ini',
      steps: [
        {
          title: 'Melihat Status Hari Ini',
          content: 'Menu ini menampilkan semua rumah dengan status setoran hari ini. Header menunjukkan jumlah "Belum setor" dan "Sudah setor".',
          tips: '📊 Berguna untuk memantau progres jimpitan harian'
        },
        {
          title: 'Filter Status (Semua/Belum/Sudah)',
          content: 'Gunakan filter status untuk melihat semua customer, hanya yang belum setor, atau hanya yang sudah setor.',
          tips: '🔍 Filter "Semua" menampilkan status dengan badge warna (merah=belum, hijau=sudah)'
        },
        {
          title: 'Cari Nama atau RT',
          content: 'Gunakan kotak pencarian untuk mencari customer tertentu berdasarkan nama atau RT.',
          tips: '🔎 Memudahkan jika ingin mengecek satu rumah tertentu'
        },
        {
          title: 'Total Setoran Hari Ini',
          content: 'Setiap card customer menampilkan "Total keseluruhan" dan "Hari ini" (total setoran hari ini).',
          tips: '💰 "Hari ini" menunjukkan berapa yang sudah disetor customer pada hari ini saja'
        },
        {
          title: 'Data Otomatis Refresh',
          content: 'Data dashboard otomatis diperbarui setiap 30 detik. Bisa juga klik tombol "Refresh" untuk update manual.',
          tips: '🔄 Pastikan data selalu terkini tanpa perlu refresh halaman'
        }
      ]
    }
  ]
};

export default function TutorialModal({ isOpen, onClose, userRole = 'petugas' }) {
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const tutorials = TUTORIALS[userRole] || TUTORIALS.petugas;
  const activeTutorial = selectedTutorial ? tutorials.find(t => t.id === selectedTutorial) : null;

  const handleSelectTutorial = (tutorialId) => {
    setSelectedTutorial(tutorialId);
    setCurrentStep(0);
  };

  const handleBack = () => {
    setSelectedTutorial(null);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (activeTutorial && currentStep < activeTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setSelectedTutorial(null);
    setCurrentStep(0);
    onClose();
  };

  // Fungsi untuk menampilkan title tanpa icon di card
  const getDisplayTitle = (title) => {
    // Hapus icon (emoji) dari awal title
    return title.replace(/^[^\s]+\s/, '');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-white/30 dark:border-gray-700/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div>
            <h2 className="text-2xl font-bold">
              Tutorial Penggunaan
            </h2>
            <p className="text-sm text-red-100 mt-1">
              {userRole === 'admin' ? 'Panduan untuk Administrator' : 'Panduan untuk Petugas'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedTutorial ? (
            // Tutorial Selection Menu
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Pilih Fitur yang Ingin Dipelajari:
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Klik salah satu menu di bawah untuk melihat panduan lengkap penggunaannya
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutorials.map((tutorial) => {
                  const icon = tutorial.title.split(' ')[0]; // Ambil icon dari title
                  const displayTitle = getDisplayTitle(tutorial.title);
                  return (
                    <button
                      key={tutorial.id}
                      onClick={() => handleSelectTutorial(tutorial.id)}
                      className="group bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 hover:from-red-50 hover:to-white dark:hover:from-red-900/30 dark:hover:to-gray-900/30 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500 transition-all duration-200 hover:shadow-xl hover:scale-105 text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-4xl flex-shrink-0">
                          {icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {displayTitle}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {tutorial.description}
                          </p>
                          <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-semibold">
                            <span>{tutorial.steps.length} Langkah</span>
                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">💡</div>
                  <div>
                    <h5 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Tips Penggunaan</h5>
                    <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                      <li>• Setiap tutorial dilengkapi dengan langkah-langkah detail</li>
                      <li>• Perhatikan tips di setiap langkah untuk hasil maksimal</li>
                      <li>• Praktikkan langsung sambil membaca tutorial</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Tutorial Steps Display
            activeTutorial && (
              <div>
                {/* Tutorial Header */}
                <div className="mb-6">
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 text-sm font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali ke Menu
                  </button>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl">{activeTutorial.title.split(' ')[0]}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        {getDisplayTitle(activeTutorial.title)}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {activeTutorial.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Langkah {currentStep + 1} dari {activeTutorial.steps.length}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round(((currentStep + 1) / activeTutorial.steps.length) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / activeTutorial.steps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Step Content */}
                <div className="bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-900/20 rounded-xl p-6 border border-red-200 dark:border-red-700 mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {currentStep + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        {activeTutorial.steps[currentStep].title}
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {activeTutorial.steps[currentStep].content}
                      </p>
                    </div>
                  </div>

                  {/* Tips */}
                  {activeTutorial.steps[currentStep].tips && (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <p className="text-sm text-amber-900 dark:text-amber-300 font-medium">
                        {activeTutorial.steps[currentStep].tips}
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Dots */}
                <div className="flex justify-center gap-2 mb-6">
                  {activeTutorial.steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentStep
                          ? 'bg-blue-500 w-8'
                          : index < currentStep
                          ? 'bg-blue-300 dark:bg-blue-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4">
                  <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                      currentStep === 0
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Sebelumnya
                  </button>

                  {currentStep < activeTutorial.steps.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
                    >
                      Selanjutnya
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={handleBack}
                      className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Selesai
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Butuh bantuan? Hubungi admin</span>
            </div>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
            >
              Tutup Tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}