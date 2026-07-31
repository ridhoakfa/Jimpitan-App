# 🏡 Jimpitan App - Aplikasi Manajemen Tabungan Komunitas

Aplikasi manajemen **Jimpitan** (arisan/tabungan komunitas) modern berbasis **React 18** dengan integrasi **Google Sheets** sebagai database. Sistem terintegrasi penuh dengan QR code scanning, transaksi real-time, dan manajemen user berbasis role (Admin & Petugas).

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi](#-teknologi)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Instalasi Cepat](#-instalasi-cepat)
- [Konfigurasi](#-konfigurasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Fitur Detail](#-fitur-detail)
- [API Integration](#-api-integration)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Fitur Utama

### 👤 Untuk Admin
- ✅ **Manajemen User** - Tambah, edit, hapus user + **Bulk Import dari Excel**
- ✅ **Manajemen Customer** - CRUD customer + **QR Code Generator** + **Bulk Import & Download QR**
- ✅ **Dashboard Analytics** - Statistik transaksi per RT, per petugas
- ✅ **Riwayat Lengkap** - View semua transaksi dari semua user dengan filter
- ✅ **Activity Log** - Tracking akivitas login dan operasi user
- ✅ **Export QR Codes** - Download QR dalam format ZIP (individual PNG files)
- ✅ **Konfigurasi Sistem** - Kelola nominal default, protected settings

### 👥 Untuk Petugas
- ✅ **Scan QR Code** - Scan pelanggan dengan `html5-qrcode` library
- ✅ **Input Transaksi** - Catat transaksi dengan nominal fleksibel
- ✅ **Riwayat Pribadi** - Lihat transaksi yang dicatat sendiri
- ✅ **QR Card Download** - Download QR card individual per pelanggan

### 🌐 Fitur Cross-Platform
- ✅ **Responsive Design** - Mobile-first, desktop-optimized
- ✅ **Dark Mode** - Toggle tema gelap/terang dengan persistent storage
- ✅ **Progressive Web App (PWA)** - Installable, offline-first, service worker
- ✅ **Token-Based Auth** - 7-day session expiry, auto-logout
- ✅ **Request Queue** - Max 3 concurrent requests, 30s cache TTL, exponential backoff retry
- ✅ **Modern UI** - Tailwind CSS 3, gradient backgrounds, smooth animations

---

## 🛠 Teknologi

### Frontend Stack
- **React 18.3.1** - UI framework
- **Vite 6.0.5** - Build tool dengan code splitting (react-vendor, qr-vendor, export-vendor)
- **React Router v7** - Client-side routing
- **Tailwind CSS 3** - Utility-first styling dengan dark mode
- **html5-qrcode** - QR code scanning
- **qrcode** & **qrcode.react** - QR code generation
- **html2canvas** - Canvas rendering untuk image export
- **XLSX & ExcelJS** - Excel file parsing
- **JSZip** - Dynamic ZIP compression
- **file-saver** - Browser file download

### Backend Stack
- **Google Apps Script** - Serverless backend
- **Google Sheets** - NoSQL database
- **JSONP** - GET request workaround untuk CORS
- **Fetch POST** - Mutation operations

### Architecture
- **Offline-First** - Cache layer dengan 30s TTL
- **Request Queue** - Max 3 concurrent, exponential backoff retry (3x)
- **Path Aliasing** - `@` → `./src`
- **Lazy Loading** - Code splitting untuk pages
- **Manual Chunk Splitting** - Optimized vendor bundles

---

## 📦 Persyaratan Sistem

- **Node.js** >= 16.x
- **npm** >= 8.x
- **Modern Browser** (Chrome, Firefox, Safari, Edge)
- **Google Account** - Untuk Apps Script & Sheets

---

## 🚀 Instalasi Cepat

### 1. Clone Repository
```bash
git clone <repo-url>
cd JimpReact
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Google Apps Script Backend
```bash
# 1. Go to https://script.google.com
# 2. Create new project
# 3. Copy paste files dari docs/appscript/:
#    - main_handlers.js (request router)
#    - auth.js (authentication)
#    - crud.js (user & customer CRUD + import handlers)
#    - customers.js (customer management)
#    - history.js (transaction history)
#    - submit.js (transaction submission)
#    - config.js (system configuration)
#    - utils.js (shared utilities)
# 4. Deploy as web app (Execute as: your account)
# 5. Copy deployment ID
```

### 4. Konfigurasi Environment
```bash
# Create .env file
cat > .env << EOF
VITE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_JSONP_TIMEOUT_MS=15000
VITE_REQUEST_MAX_CONCURRENT=3
VITE_REQUEST_CACHE_TTL_MS=30000
EOF
```

### 5. Setup Google Sheets Database
**Create spreadsheet dengan sheets:**
1. **Users** - Columns: ID, Name, Role, Username, Password, Token, Token_Expiry, Last_Login
2. **Customers** - Columns: ID, RT, Nama, QR_Hash, Total_Setoran, Last_Transaction
3. **History** - Columns: ID, Customer_ID, User_ID, Petugas, Nominal, Timestamp
4. **Config** - Columns: Key, Value (system configuration)
5. **Sessions** - Columns: Token, User_ID, Expiry (session tracking)

---

## ⚙️ Konfigurasi

### Environment Variables
```bash
# Google Apps Script deployment URL
VITE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec

# JSONP request timeout (ms)
VITE_JSONP_TIMEOUT_MS=15000

# Max concurrent requests
VITE_REQUEST_MAX_CONCURRENT=3

# Cache TTL (ms)
VITE_REQUEST_CACHE_TTL_MS=30000
```

### Frontend Routes
| Path | Role | Purpose |
|------|------|---------|
| `/` | All | Home/Landing |
| `/login` | Public | Login page |
| `/scanqr` | Petugas+ | Scan customer QR |
| `/submit?qrHash=xxx` | Petugas+ | Submit transaction |
| `/customers` | Admin | Manage customers |
| `/users` | Admin | Manage users |
| `/history` | Admin | View all transactions |
| `/myhistory` | Petugas+ | View own transactions |

---

## 🎯 Menjalankan Aplikasi

### Development Mode
```bash
npm run dev
# Opens http://localhost:3000 automatically
```

### Production Build
```bash
npm run build
npm run preview
```

### Linting
```bash
npm run lint
```

---

## 📱 Fitur Detail

### QR Code Management

**Generate QR untuk Customer:**
```javascript
// QR Hash di-generate di backend saat create customer
const qrHash = Utilities.computeDigest(
  Utilities.DigestAlgorithm.SHA_256, 
  customerId + timestamp
);
```

**Download Bulk QR:**
- Admin dapat download QR untuk semua customer atau per-RT
- Format: ZIP file berisi individual PNG images
- Naming: `Jimpitan_QR_[RT]_[Nama].png`
- Scale: 2x untuk quality tinggi

**Styling QR Card:**
- Gradient background (slate-50 to indigo-500)
- Top accent bar (indigo to purple)
- Logo emoji (🏡)
- Title: "Jimpitan"
- Customer name & RT
- QR code (300px)
- Instruction text

### Import Features

**Import Users dari Excel:**
- Columns: Nama, Username, Password, Role
- Auto-hash password (SHA-256)
- Duplicate detection (per username)
- Bulk insert ke Users sheet

**Import Customers dari Excel:**
- Columns: RT, Nama
- Auto-generate Customer ID (CUST-xxx)
- Auto-generate QR Hash (SHA-256)
- Duplicate detection (per RT+nama)
- Bulk insert ke Customers sheet

### Authentication Flow
1. User login dengan username & password
2. Backend generate token (7-day expiry)
3. Frontend store token di localStorage
4. Token di-verify setiap 30 menit
5. Token invalid → auto-logout + redirect `/login`

### Request Management
```javascript
// Queue
- Max 3 concurrent requests
- Exponential backoff retry (3x)
- Fail-safe dengan error handling

// Cache
- 30s TTL untuk GET operations
- Auto-invalidate setelah mutations
- Manual cache clear: requestCache.delete(key)
```

---

## 🔌 API Integration

### JSONP untuk GET Requests
```javascript
// Contoh: getCustomers
GET /exec?action=getCustomers&token=xxx&callback=cb_xxx

// Response
cb_xxx({
  status: 'success',
  data: [{id, blok, nama, qrHash, totalSetoran, lastTransaction}]
})
```

### Fetch POST untuk Mutations
```javascript
// Contoh: createCustomer
POST /exec
{
  "action": "createCustomer",
  "token": "xxx",
  "blok": "1",
  "nama": "Andi"
}

// Returns opaque response (no-cors mode)
// Success assumed jika no error thrown
```

### Available Actions

**GET (JSONP):**
- `getUsers` - Fetch semua user
- `getCustomers` - Fetch semua customer
- `getHistory` - Fetch transaction history
- `getConfig` - Fetch system config
- `login` - Authentication

**POST (Fetch):**
- `createUser` - Create user
- `updateUser` - Update user
- `deleteUser` - Delete user
- `importUsers` - Bulk import users
- `createCustomer` - Create customer
- `updateCustomer` - Update customer
- `deleteCustomer` - Delete customer
- `importCustomers` - Bulk import customers
- `submitTransaction` - Submit single transaction

---

## 📤 Deployment

### Vercel (Recommended)
```bash
# Connect GitHub repo ke Vercel
# Auto-deploy setiap push ke main

# Environment variables di Vercel settings:
VITE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
```

### Manual Build
```bash
npm run build
# Output: dist/
# Upload ke hosting (Netlify, GitHub Pages, etc.)
```

### Google Apps Script
1. Buat project baru di script.google.com
2. Copy files dari `docs/appscript/`
3. Deploy as web app (Execute as: your account)
4. Copy & paste deployment URL ke `.env`

---

## 🐛 Troubleshooting

### QR Codes tidak render
- ✅ Solution: Gunakan `QRCode.toDataURL()` untuk consistency
- ✅ Solution: Ensure `allowTaint: true` di html2canvas options

### Import users tidak muncul
- ✅ Verify admin token valid (tidak expired)
- ✅ Check Google Sheets Users sheet ada 8 columns
- ✅ Verify backend function `handleImportUsers` di-deploy
- ✅ Check network request berhasil (POST 200)

### Request timeout
- ✅ Increase `VITE_JSONP_TIMEOUT_MS` di .env
- ✅ Check internet connection
- ✅ Verify Google Sheets tidak terlalu banyak data

### Dark mode tidak persist
- ✅ Check localStorage enabled di browser
- ✅ Clear browser cache & reload

### Token invalid setelah login
- ✅ Token expiry set ke 7 hari
- ✅ Jika invalid, auto-logout dan re-login
- ✅ Check system clock sync dengan server

---

## 📝 Lisensi

MIT License - Free to use & modify

---

## 👨‍💻 Kontribusi

Contributions welcome! Please:
1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📞 Support

Untuk bantuan atau pertanyaan:
- 📧 Email: support@example.com
- 💬 Issues: GitHub Issues
- 📚 Docs: Check `/docs` folder

---

**Last Updated:** December 4, 2025  
**Version:** 2.0 (User Import + Bulk QR Download)
