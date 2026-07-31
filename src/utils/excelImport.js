import * as XLSX from 'xlsx';

/**
 * Parse Excel file and extract customer data
 * Expected columns: RT, Nama (or similar variations)
 * @param {File} file - Excel file
 * @returns {Promise<Array>} Array of {blok, nama} objects
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Parse and validate data
        const customers = jsonData
          .map((row) => {
            // Try to find blok and nama columns (case-insensitive)
            const blokKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('blok') || 
              key.toLowerCase().includes('block') ||
              key.toLowerCase().includes('no') ||
              key.toLowerCase().includes('rt')
            );
            const namaKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('nama') || 
              key.toLowerCase().includes('name')
            );
            
            const blok = row[blokKey] ? String(row[blokKey]).trim() : '';
            const nama = row[namaKey] ? String(row[namaKey]).trim() : '';
            
            return { blok, nama };
          })
          .filter(customer => customer.blok && customer.nama); // Filter out empty rows
        
        if (customers.length === 0) {
          reject(new Error('Tidak ada data customer yang valid. Pastikan file memiliki kolom "RT" dan "Nama"'));
        } else {
          resolve(customers);
        }
      } catch (error) {
        reject(new Error(`Gagal membaca file Excel: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Gagal membaca file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate customer data before import
 * @param {Array} customers - Array of {blok, nama} objects
 * @returns {Object} {valid: boolean, errors: Array}
 */
export function validateCustomerData(customers) {
  const errors = [];
  const seen = new Set();
  
  customers.forEach((customer, index) => {
    const lineNumber = index + 2; // +2 because header is row 1, data starts at row 2
    
    if (!customer.blok) {
      errors.push(`Baris ${lineNumber}: RT tidak boleh kosong`);
    }
    if (!customer.nama) {
      errors.push(`Baris ${lineNumber}: Nama tidak boleh kosong`);
    }
    
    const key = `${customer.blok}-${customer.nama}`.toLowerCase();
    if (seen.has(key)) {
      errors.push(`Baris ${lineNumber}: Duplikasi RT "${customer.blok}" dan Nama "${customer.nama}"`);
    }
    seen.add(key);
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse Excel file and extract user data
 * Expected columns: Nama/Name, Username, Password, Role
 * @param {File} file - Excel file
 * @returns {Promise<Array>} Array of {name, username, password, role} objects
 */
export async function parseUserExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Parse and validate data
        const users = jsonData
          .map((row) => {
            // Try to find column keys (case-insensitive)
            const nameKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('nama') || 
              key.toLowerCase().includes('name')
            );
            const usernameKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('username')
            );
            const passwordKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('password') ||
              key.toLowerCase().includes('pwd')
            );
            const roleKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('role')
            );
            
            const name = row[nameKey] ? String(row[nameKey]).trim() : '';
            const username = row[usernameKey] ? String(row[usernameKey]).trim() : '';
            const password = row[passwordKey] ? String(row[passwordKey]).trim() : '';
            const role = row[roleKey] ? String(row[roleKey]).trim().toLowerCase() : 'petugas';
            
            return { name, username, password, role };
          })
          .filter(user => user.name && user.username && user.password); // Filter out empty rows
        
        if (users.length === 0) {
          reject(new Error('Tidak ada data user yang valid. Pastikan file memiliki kolom "Nama", "Username", dan "Password"'));
        } else {
          resolve(users);
        }
      } catch (error) {
        reject(new Error(`Gagal membaca file Excel: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Gagal membaca file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate user data before import
 * @param {Array} users - Array of {name, username, password, role} objects
 * @returns {Object} {valid: boolean, errors: Array}
 */
export function validateUserData(users) {
  const errors = [];
  const seen = new Set();
  
  users.forEach((user, index) => {
    const lineNumber = index + 2; // +2 because header is row 1, data starts at row 2
    
    if (!user.name) {
      errors.push(`Baris ${lineNumber}: Nama tidak boleh kosong`);
    }
    if (!user.username) {
      errors.push(`Baris ${lineNumber}: Username tidak boleh kosong`);
    }
    if (!user.password) {
      errors.push(`Baris ${lineNumber}: Password tidak boleh kosong`);
    }
    if (user.role && !['admin', 'petugas'].includes(user.role)) {
      errors.push(`Baris ${lineNumber}: Role harus "admin" atau "petugas", bukan "${user.role}"`);
    }
    
    if (seen.has(user.username)) {
      errors.push(`Baris ${lineNumber}: Duplikasi username "${user.username}"`);
    }
    seen.add(user.username);
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
