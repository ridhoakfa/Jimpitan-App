# Dokumentasi API Mobile - Jimpitan App

**Terakhir diperbarui:** 1 Desember 2025  
**Versi API:** 2.0

## 📱 Gambaran Umum

API Mobile Jimpitan dirancang khusus untuk aplikasi mobile yang digunakan oleh **petugas** di lapangan. API ini menggunakan sistem autentikasi terpisah dengan **Mobile Token** yang berbeda dari Web Token.

### Karakteristik Mobile API:
- ✅ **Hanya untuk role Petugas**
- ✅ **Token terpisah** dari Web App (kolom I & J di sheet Users)
- ✅ **Token berlaku 7 hari**
- ✅ **Format response: JSON murni** (bukan JSONP)
- ✅ **Endpoint: POST only** untuk semua operasi

---

## 🔐 Autentikasi

### Struktur Token Mobile

Token mobile disimpan di Google Sheet **Users** pada kolom:
- **Kolom I:** Token Mobile (string 32 karakter)
- **Kolom J:** Token Mobile Expiry (ISO timestamp)

### Persyaratan:
- Username harus ada di sheet Users
- Role harus **petugas** (admin tidak bisa login via mobile)
- Password harus cocok dengan hash yang tersimpan

---

## 📚 Daftar Endpoint

### Base URL
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

### Endpoint Mobile

| Endpoint | Method | Autentikasi | Deskripsi |
|----------|--------|-------------|-----------|
| `mobileLogin` | POST | ❌ Tidak | Login dan dapatkan mobile token |
| `mobileLogout` | POST | ✅ Ya | Logout dan hapus mobile token |
| `mobileScanQR` | POST | ✅ Ya | Scan QR code dan dapatkan data customer |
| `mobileSubmitTransaction` | POST | ✅ Ya | Submit transaksi setoran |
| `mobileGetHistory` | POST | ✅ Ya | Lihat riwayat transaksi sendiri |
| `mobileGetSummary` | POST | ✅ Ya | Lihat ringkasan statistik |
| `mobileDeleteTransaction` | POST | ✅ Ya | Hapus transaksi sendiri |

---

## 🔑 1. Login Mobile

Login khusus untuk petugas dan mendapatkan mobile token.

### Request

**Endpoint:** `mobileLogin`  
**Method:** POST

```json
{
  "action": "mobileLogin",
  "username": "udin",
  "password": "password123"
}
```

### Response Success

```json
{
  "status": "success",
  "message": "Login mobile berhasil",
  "data": {
    "id": "USR-002",
    "name": "Udin",
    "role": "petugas",
    "username": "udin",
    "mobileToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "tokenExpiry": "2025-12-08T10:00:00.000Z",
    "lastLogin": "2025-12-01T10:00:00.000Z"
  }
}
```

### Response Error

```json
{
  "status": "error",
  "message": "Mobile app hanya dapat diakses oleh petugas"
}
```

**Catatan:**
- Hanya petugas yang bisa login via mobile
- Token berlaku 7 hari dari waktu login
- Simpan `mobileToken` di storage aplikasi mobile untuk request berikutnya

---

## 🚪 2. Logout Mobile

Logout dan hapus mobile token dari server.

### Request

**Endpoint:** `mobileLogout`  
**Method:** POST

```json
{
  "action": "mobileLogout",
  "mobileToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

### Response Success

```json
{
  "status": "success",
  "message": "Logout mobile berhasil"
}
```

**Catatan:**
- Hapus `mobileToken` dari storage aplikasi setelah logout
- Token yang sudah di-logout tidak bisa digunakan lagi

---

## 📷 3. Scan QR Code

Scan QR code customer dan dapatkan data lengkap customer.

### Request

**Endpoint:** `mobileScanQR`  
**Method:** POST

```json
{
  "action": "mobileScanQR",
  "mobileToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "qrHash": "A1B2C3D4E5"
}
```

### Response Success

```json
{
  "status": "success",
  "data": {
    "id": "CUST-001",
    "blok": "A-12",
    "nama": "Budi Santoso",
    "qrHash": "A1B2C3D4E5",
    "createdAt": "2025-01-15T08:00:00.000Z",
    "totalSetoran": 150000,
    "lastTransaction": "2025-12-01T09:30:00.000Z"
  },
  "user": {
    "id": "USR-002",
    "name": "Udin"
  }
}
```

### Response Error - QR Tidak Ditemukan

```json
{
  "status": "error",
  "message": "Customer dengan QR Hash tersebut tidak ditemukan"
}
```

### Response Error - Token Invalid

```json
{
  "status": "error",
  "message": "Mobile token sudah kadaluarsa"
}
```

**Catatan:**
- QR Hash adalah 10 karakter uppercase (contoh: A1B2C3D4E5)
- Data customer termasuk total setoran dan transaksi terakhir

---

## 💰 4. Submit Transaksi

Submit transaksi setoran dari petugas.

### Request

**Endpoint:** `mobileSubmitTransaction`  
**Method:** POST

```json
{
  "action": "mobileSubmitTransaction",
  "mobileToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "customer_id": "CUST-001",
  "id": "A-12",
  "nama": "Budi Santoso",
  "nominal": 5000
}
```

### Response Success

```json
{
  "status": "success",
  "message": "Transaksi berhasil ditambahkan",
  "data": {
    "txid": "0123",
    "timestamp": "2025-12-01T10:15:00.000Z",
    "customer_id": "CUST-001",
    "blok": "A-12",
    "nama": "Budi Santoso",
    "nominal": 5000,
    "petugas": "Udin",
    "user_id": "USR-002"
  }
}
```

### Response Error - Data Tidak Lengkap

```json
{
  "status": "error",
  "message": "Data tidak lengkap: customer_id, id (RT), nama, dan nominal harus diisi"
}
```

### Response Error - Nominal Invalid

```json
{
  "status": "error",
  "message": "Nominal harus lebih dari 0"
}
```

**Catatan:**
- `customer_id`: ID customer (CUST-xxx) dari hasil scan QR
- `id`: ID RT customer (contoh: RT 1, RT 2)
- `nama`: Nama customer
- `nominal`: Jumlah setoran dalam rupiah (harus > 0)
- `user_id` dan `petugas` otomatis diambil dari token

---

## 📋 5. Lihat Riwayat Transaksi

Lihat riwayat transaksi yang dilakukan oleh petugas sendiri.

### Request

**Endpoint:** `mobileGetHistory`  
**Method:** POST

```json
{
  "action": "mobileGetHistory",
  "mobileToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "limit": 50
}
```

**Parameter:**
- `limit` (optional): Jumlah maksimal transaksi yang ditampilkan. Default: 100

### Response Success

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "USR-002",
      "name": "Udin"
    },
    "transactions": [
      {
        "txid": "0125",
        "timestamp": "2025-12-01T10:15:00.000Z",
        "customer_id": "CUST-001",
        "blok": "A-12",
        "nama": "Budi Santoso",
        "nominal": 5000,
        "user_id": "USR-002",
        "petugas": "Udin"
      },
      {
        "txid": "0124",
        "timestamp": "2025-12-01T09:30:00.000Z",
        "customer_id": "CUST-002",
        "blok": "B-05",
        "nama": "Siti Aminah",
        "nominal": 10000,
        "user_id": "USR-002",
        "petugas": "Udin"
      }
    ],
    "summary": {
      "totalTransactions": 2,
      "totalNominal": 15000,
      "limit": 50
    }
  }
}
```

**Catatan:**
- Transaksi diurutkan dari terbaru ke terlama
- Hanya menampilkan transaksi milik petugas yang login
- Summary memberikan total transaksi dan nominal

---

## 📊 6. Lihat Ringkasan Statistik

Lihat ringkasan statistik transaksi petugas.

### Request

**Endpoint:** `mobileGetSummary`  
**Method:** POST

```json
{
  "action": "mobileGetSummary",
  "mobileToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

### Response Success

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "USR-002",
      "name": "Udin"
    },
    "summary": {
      "totalTransactions": 45,
      "totalNominal": 225000,
      "todayTransactions": 8,
      "todayNominal": 40000
    }
  }
}
```

**Catatan:**
- `totalTransactions`: Total semua transaksi petugas
- `totalNominal`: Total nominal semua transaksi
- `todayTransactions`: Transaksi hari ini saja
- `todayNominal`: Nominal transaksi hari ini

---

## 🗑️ 7. Hapus Transaksi

Hapus transaksi yang dilakukan oleh petugas sendiri.

### Request

**Endpoint:** `mobileDeleteTransaction`  
**Method:** POST

```json
{
  "action": "mobileDeleteTransaction",
  "mobileToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "txid": "0125"
}
```

### Response Success

```json
{
  "status": "success",
  "message": "Transaksi berhasil dihapus",
  "data": {
    "txid": "0125",
    "deletedBy": "Udin"
  }
}
```

### Response Error - Bukan Transaksi Sendiri

```json
{
  "status": "error",
  "message": "Anda hanya bisa menghapus transaksi Anda sendiri"
}
```

### Response Error - TXID Tidak Ditemukan

```json
{
  "status": "error",
  "message": "Transaksi tidak ditemukan"
}
```

**Catatan:**
- Petugas hanya bisa menghapus transaksi milik sendiri
- Total setoran customer akan otomatis dikurangi setelah transaksi dihapus
- Transaksi yang sudah dihapus tidak bisa dikembalikan

---

## ⚠️ Error Handling

### Error Response Format

Semua error menggunakan format yang sama:

```json
{
  "status": "error",
  "message": "Deskripsi error"
}
```

### Kode Error Umum

| Message | Penyebab | Solusi |
|---------|----------|--------|
| `Mobile token tidak ditemukan` | Token tidak dikirim | Kirim `mobileToken` di request |
| `Mobile token sudah kadaluarsa` | Token expired (>7 hari) | Login ulang |
| `Mobile token tidak valid` | Token salah/tidak ada di database | Login ulang |
| `Mobile app hanya dapat diakses oleh petugas` | User bukan petugas | Gunakan akun petugas |
| `Username atau password salah` | Kredensial salah | Cek username/password |
| `Data tidak lengkap` | Parameter required kosong | Lengkapi semua field required |
| `Nominal harus lebih dari 0` | Nominal ≤ 0 | Input nominal > 0 |

---

## 🔄 Alur Penggunaan Mobile App

### 1. Login Flow

```
┌─────────────┐
│  Buka App   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Input Username  │
│ & Password      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐     ┌──────────────┐
│ POST mobileLogin├────►│ Simpan Token │
└─────────────────┘     └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Main Screen │
                        └──────────────┘
```

### 2. Submit Transaction Flow

```
┌────────────────┐
│  Main Screen   │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Scan QR Code  │
└───────┬────────┘
        │
        ▼
┌────────────────────┐     ┌──────────────────┐
│ POST mobileScanQR  ├────►│ Tampilkan Detail │
└────────────────────┘     │    Customer      │
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │ Input Nominal  │
                           └────────┬───────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │ POST mobileSubmitTransaction│
                    └───────────────┬───────────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │ Tampilkan      │
                           │ Konfirmasi     │
                           └────────────────┘
```

### 3. History Flow

```
┌────────────────┐
│  Main Screen   │
└───────┬────────┘
        │
        ▼
┌────────────────────┐
│ Pilih Menu History │
└───────┬────────────┘
        │
        ▼
┌─────────────────────┐     ┌──────────────────┐
│ POST mobileGetHistory├────►│ Tampilkan List   │
└─────────────────────┘     │   Transaksi      │
                            └────────┬─────────┘
                                     │
                       ┌─────────────┴──────────────┐
                       │                            │
                       ▼                            ▼
              ┌────────────────┐         ┌──────────────────┐
              │ Lihat Detail   │         │ Hapus Transaksi  │
              └────────────────┘         │ (dengan confirm) │
                                        └──────────────────┘
```

---

## 🔧 Implementasi di Mobile App

### Headers yang Dibutuhkan

```javascript
{
  "Content-Type": "application/json"
}
```

### Contoh Implementasi (JavaScript/React Native)

```javascript
// Base URL
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// Login
async function login(username, password) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'mobileLogin',
      username,
      password,
    }),
  });
  
  const data = await response.json();
  
  if (data.status === 'success') {
    // Simpan token
    await AsyncStorage.setItem('mobileToken', data.data.mobileToken);
    return data.data;
  } else {
    throw new Error(data.message);
  }
}

// Scan QR
async function scanQR(qrHash) {
  const mobileToken = await AsyncStorage.getItem('mobileToken');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'mobileScanQR',
      mobileToken,
      qrHash,
    }),
  });
  
  return await response.json();
}

// Submit Transaction
async function submitTransaction(customer_id, id, nama, nominal) {
  const mobileToken = await AsyncStorage.getItem('mobileToken');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'mobileSubmitTransaction',
      mobileToken,
      customer_id,
      id,
      nama,
      nominal,
    }),
  });
  
  return await response.json();
}

// Get History
async function getHistory(limit = 100) {
  const mobileToken = await AsyncStorage.getItem('mobileToken');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'mobileGetHistory',
      mobileToken,
      limit,
    }),
  });
  
  return await response.json();
}
```

---

## 📝 Catatan Penting

1. **Token Management:**
   - Token mobile berbeda dengan token web
   - Token disimpan di kolom I & J (bukan kolom F & G seperti web)
   - Token berlaku 7 hari, setelah itu harus login ulang
   - Satu user bisa punya 2 token aktif (web + mobile)

2. **Security:**
   - Semua endpoint mobile memerlukan `mobileToken` (kecuali login)
   - Token diperiksa setiap request
   - Petugas hanya bisa akses data transaksi sendiri

3. **Data Validation:**
   - Nominal harus > 0
   - QR Hash harus 10 karakter
   - Semua field required harus diisi

4. **Offline Support:**
   - Simpan token di local storage/AsyncStorage
   - Implement queue untuk submit transaction saat offline
   - Sync data saat kembali online

---

## 🆘 Troubleshooting

### Token Expired
**Masalah:** Response `Mobile token sudah kadaluarsa`  
**Solusi:** Logout dan login ulang untuk mendapatkan token baru

### Tidak Bisa Login
**Masalah:** Response `Mobile app hanya dapat diakses oleh petugas`  
**Solusi:** Pastikan role user di sheet adalah "petugas", bukan "admin"

### QR Tidak Ditemukan
**Masalah:** Response `Customer dengan QR Hash tersebut tidak ditemukan`  
**Solusi:** 
- Pastikan QR Hash benar (10 karakter uppercase)
- Cek apakah customer sudah terdaftar di sheet Customers
- Pastikan QR Hash di kolom D sheet Customers

### Transaksi Tidak Bisa Dihapus
**Masalah:** Response `Anda hanya bisa menghapus transaksi Anda sendiri`  
**Solusi:** Petugas hanya bisa hapus transaksi yang dibuat sendiri

---

## 📞 Support

Jika ada pertanyaan atau masalah, hubungi:
- **Email:** ${VITE_DEV_EMAIL}
- **WhatsApp:** ${VITE_DEV_WHATSAPP}

---

**© 2025 Jimpitan App - Mobile API Documentation**
