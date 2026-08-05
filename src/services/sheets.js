import { requestQueue, requestCache, retryWithBackoff } from "./requestManager";
import { measureAsync, apiMetrics } from "../utils/performance";
import { safeLog, maskObject, maskToken } from "../utils/security";

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || "";

if (!SCRIPT_URL) {
  console.warn('VITE_SCRIPT_URL tidak di-set. Pastikan file .env memiliki VITE_SCRIPT_URL');
}

// ==========================================================
// PERBAIKAN: TIMEOUT DIPERBESAR MENJADI 30 DETIK
// ==========================================================
const JSONP_TIMEOUT_MS = Number(import.meta.env.VITE_JSONP_TIMEOUT_MS) || 30000;

// Global token invalid handler
let tokenInvalidHandler = null;

export function setTokenInvalidHandler(handler) {
  tokenInvalidHandler = handler;
}

function handleTokenInvalid() {
  if (tokenInvalidHandler) {
    tokenInvalidHandler();
  }
}

// ==========================================================
// HELPER FUNCTION FOR JSONP WITH QUEUE & CACHE
// ==========================================================

function createJSONPRequest(action, params = {}, useCache = true) {
  // Generate cache key
  const cacheKey = `${action}_${JSON.stringify(params)}`;

  // Check cache first for GET operations
  if (
    useCache &&
    [
      "getUsers",
      "getCustomers",
      "getHistory",
      "getCustomerHistory",
      "getUserActivity",
      "getUserTransactions",
    ].includes(action)
  ) {
    const cached = requestCache.get(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }
  }

  // Queue the request with performance tracking
  return requestQueue.add(() =>
    measureAsync(`API-${action}`, () =>
      retryWithBackoff(
        () => {
          const startTime = performance.now();
          return new Promise((resolve, reject) => {
            const callbackName = `jsonp_callback_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;

            // ==========================================================
            // PERBAIKAN: SET TIMEOUT LEBIH PANJANG
            // ==========================================================
            const timeoutId = setTimeout(() => {
              if (window[callbackName]) {
                delete window[callbackName];
                if (script.parentNode) {
                  document.body.removeChild(script);
                }
                const duration = performance.now() - startTime;
                apiMetrics.track(action, duration, false);
                reject(new Error("Request timeout."));
              }
            }, JSONP_TIMEOUT_MS);

            window[callbackName] = (data) => {
              // Clear timeout
              clearTimeout(timeoutId);
              delete window[callbackName];
              if (script.parentNode) {
                document.body.removeChild(script);
              }

              const duration = performance.now() - startTime;

              if (data && data.status === "error") {
                apiMetrics.track(action, duration, false);
                const errorMsg = data.message || "Request failed";
                
                // Check if token is invalid or expired
                if (
                  errorMsg.toLowerCase().includes('token') && 
                  (errorMsg.toLowerCase().includes('invalid') || 
                   errorMsg.toLowerCase().includes('expired') ||
                   errorMsg.toLowerCase().includes('tidak valid') ||
                   errorMsg.toLowerCase().includes('kadaluarsa'))
                ) {
                  handleTokenInvalid();
                }
                
                reject(new Error(errorMsg));
              } else if (data) {
                apiMetrics.track(action, duration, true);
                // Cache successful GET operations
                if (
                  useCache &&
                  [
                    "getUsers",
                    "getCustomers",
                    "getHistory",
                    "getCustomerHistory",
                    "getUserActivity",
                    "getUserTransactions",
                  ].includes(action)
                ) {
                  requestCache.set(cacheKey, data);
                }
                resolve(data);
              } else {
                apiMetrics.track(action, duration, false);
                reject(new Error("Empty response from server"));
              }
            };

            const script = document.createElement("script");
            const queryParams = new URLSearchParams({
              action,
              callback: callbackName,
              ...params,
            });
            script.src = `${SCRIPT_URL}?${queryParams.toString()}`;
            script.async = true;

            script.onerror = () => {
              clearTimeout(timeoutId);
              delete window[callbackName];
              if (script.parentNode) {
                document.body.removeChild(script);
              }
              const duration = performance.now() - startTime;
              apiMetrics.track(action, duration, false);
              reject(new Error("Network error."));
            };

            document.body.appendChild(script);
          });
        },
        3, // Retry 3 kali
        1000 // Delay 1 detik
      )
    )
  );
}

// ==========================================================
// AUTH FUNCTIONS
// ==========================================================

export async function loginWithSheet(username, password) {
  try {
    const response = await createJSONPRequest("login", { username, password }, false);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function verifyToken(token) {
  try {
    const response = await createJSONPRequest("verifyToken", { token }, false);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function logoutFromSheet(token) {
  try {
    const response = await createJSONPRequest("logout", { token }, false);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getUsersFromSheet(token) {
  try {
    const response = await createJSONPRequest("getUsers", { token });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getUserActivity(token, role = "") {
  try {
    const response = await createJSONPRequest("getUserActivity", {
      token,
      role,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function createUserInSheet(token, userData) {
  // Invalidate cache after mutation
  requestCache.delete(`getUsers_${JSON.stringify({ token })}`);

  return requestQueue.add(() =>
    retryWithBackoff(
      async () => {
        if (!SCRIPT_URL) {
          throw new Error('SCRIPT_URL tidak di-set. Pastikan file .env memiliki VITE_SCRIPT_URL');
        }
        
        const payload = {
          action: "createUser",
          token: token,
          name: userData.name,
          username: userData.username,
          password: userData.password,
          role: userData.role,
        };
        
        await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        return {
          status: "success",
          message: "User berhasil ditambahkan",
        };
      },
      2,
      1000
    )
  );
}

export async function updateUserInSheet(token, userId, userData) {
  requestCache.delete(`getUsers_${JSON.stringify({ token })}`);

  return requestQueue.add(() =>
    retryWithBackoff(
      async () => {
        if (!SCRIPT_URL) {
          throw new Error('SCRIPT_URL tidak di-set');
        }
        
        const payload = {
          action: "updateUser",
          token: token,
          userId: userId,
          name: userData.name,
          username: userData.username,
          role: userData.role,
        };

        if (userData.password) {
          payload.password = userData.password;
        }

        await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        return {
          status: "success",
          message: "User berhasil diupdate",
        };
      },
      2,
      1000
    )
  );
}

export async function deleteUserInSheet(token, userId) {
  requestCache.delete(`getUsers_${JSON.stringify({ token })}`);

  return requestQueue.add(() =>
    retryWithBackoff(
      async () => {
        if (!SCRIPT_URL) {
          throw new Error('SCRIPT_URL tidak di-set');
        }
        
        const payload = {
          action: "deleteUser",
          token: token,
          userId: userId,
        };

        await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        return {
          status: "success",
          message: "User berhasil dihapus",
        };
      },
      2,
      1000
    )
  );
}

export async function bulkDeleteUsersInSheet(token, userIds) {
  requestCache.delete(`getUsers_${JSON.stringify({ token })}`);

  return createJSONPRequest(
    "bulkDeleteUsers",
    {
      token: token,
      userIds: JSON.stringify(userIds),
    },
    false
  );
}

// ==========================================================
// TRANSACTION FUNCTIONS
// ==========================================================

export async function submitToSheet(payload) {
  requestCache.clear();

  try {
    const response = await createJSONPRequest(
      "submitTransaction",
      {
        customer_id: payload.customer_id,
        id: payload.id,
        nama: payload.nama,
        nominal: payload.nominal,
        user_id: payload.user_id,
        petugas: payload.petugas,
        type: payload.type || 'daily'
      },
      false
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function fetchHistoryFromSheet() {
  try {
    const response = await createJSONPRequest("getHistory");
    if (Array.isArray(response)) {
      return response;
    } else if (Array.isArray(response?.data)) {
      return response.data;
    } else {
      return [];
    }
  } catch (error) {
    console.warn('fetchHistoryFromSheet error:', error);
    return [];
  }
}

export async function getUserTransactions(token) {
  if (!token) {
    throw new Error("Token tidak tersedia");
  }

  try {
    const response = await createJSONPRequest(
      "getUserTransactions",
      { token },
      false
    );

    if (response && response.status === "success") {
      return response;
    } else {
      throw new Error(response?.message || "Gagal mengambil data transaksi");
    }
  } catch (error) {
    throw error;
  }
}

export async function deleteTransaction(token, txid) {
  if (!token || !txid) {
    throw new Error("Token dan TXID diperlukan");
  }

  requestCache.delete(`getUserTransactions_${token}`);
  requestCache.delete("getHistory_{}");

  try {
    const response = await createJSONPRequest(
      "deleteTransaction",
      { token, txid },
      false
    );

    if (response && response.status === "success") {
      return response;
    } else {
      throw new Error(response?.message || "Gagal menghapus transaksi");
    }
  } catch (error) {
    throw error;
  }
}

// ==========================================================
// CUSTOMER MANAGEMENT FUNCTIONS
// ==========================================================

export async function getCustomersFromSheet(skipCache = false) {
  try {
    const response = await createJSONPRequest("getCustomers", {}, !skipCache);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getCustomerByQRHash(qrHash) {
  try {
    const response = await createJSONPRequest("getCustomerByQRHash", {
      qrHash,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getCustomerHistory(customerId) {
  try {
    const response = await createJSONPRequest("getCustomerHistory", {
      customerId,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function createCustomerInSheet(token, customerData) {
  requestCache.delete("getCustomers_{}");

  return requestQueue.add(() =>
    retryWithBackoff(
      async () => {
        if (!SCRIPT_URL) {
          throw new Error('SCRIPT_URL tidak di-set. Pastikan file .env memiliki VITE_SCRIPT_URL');
        }
        
        const payload = {
          action: "createCustomer",
          token: token,
          blok: customerData.blok,
          nama: customerData.nama,
        };
        
        await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        return {
          status: "success",
          message: "Customer berhasil ditambahkan",
        };
      },
      2,
      1000
    )
  );
}

export async function updateCustomerInSheet(token, customerId, customerData) {
  requestCache.delete("getCustomers_{}");

  return requestQueue.add(() =>
    retryWithBackoff(
      async () => {
        if (!SCRIPT_URL) {
          throw new Error('SCRIPT_URL tidak di-set');
        }
        
        const payload = {
          action: "updateCustomer",
          token: token,
          customerId: customerId,
          blok: customerData.blok,
          nama: customerData.nama,
        };

        await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        return {
          status: "success",
          message: "Customer berhasil diupdate",
        };
      },
      2,
      1000
    )
  );
}

export async function deleteCustomerInSheet(token, customerId) {
  requestCache.delete("getCustomers_{}");

  return requestQueue.add(() =>
    retryWithBackoff(
      async () => {
        if (!SCRIPT_URL) {
          throw new Error('SCRIPT_URL tidak di-set');
        }
        
        const payload = {
          action: "deleteCustomer",
          token: token,
          customerId: customerId,
        };

        await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        return {
          status: "success",
          message: "Customer berhasil dihapus",
        };
      },
      2,
      1000
    )
  );
}

export async function bulkDeleteCustomersInSheet(token, customerIds) {
  requestCache.delete("getCustomers_{}");

  return createJSONPRequest(
    "bulkDeleteCustomers",
    {
      token: token,
      customerIds: JSON.stringify(customerIds),
    },
    false
  );
}

export async function importCustomersFromSheet(token, customers) {
  requestCache.delete("getCustomers_{}");

  return requestQueue.add(() =>
    retryWithBackoff(
      async () => {
        if (!SCRIPT_URL) {
          throw new Error('SCRIPT_URL tidak di-set');
        }
        
        const payload = {
          action: "importCustomers",
          token: token,
          customers: customers,
        };

        await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        return {
          status: "success",
          message: `${customers.length} customer berhasil diimport`,
        };
      },
      2,
      1000
    )
  );
}

export async function importUsersFromSheet(token, users) {
  requestCache.delete("getUsers_{}");

  return requestQueue.add(() =>
    retryWithBackoff(
      async () => {
        if (!SCRIPT_URL) {
          throw new Error('SCRIPT_URL tidak di-set');
        }
        
        const payload = {
          action: "importUsers",
          token: token,
          users: users,
        };

        await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        return {
          status: "success",
          message: `${users.length} user berhasil diimport`,
        };
      },
      2,
      1000
    )
  );
}

export async function getUnpaidToday(token) {
  try {
    const response = await createJSONPRequest('getUnpaidToday', { token }, false);
    return response;
  } catch (error) {
    throw error;
  }
}

// ==========================================================
// CONFIG FUNCTIONS
// ==========================================================

export async function getConfig(token) {
  try {
    const response = await createJSONPRequest("getConfig", { token }, false);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function updateConfig(token, key, value) {
  try {
    const response = await createJSONPRequest(
      "updateConfig",
      {
        token: token,
        key: key,
        value: value,
      },
      false
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function verifyConfigPassword(token, password) {
  try {
    const response = await createJSONPRequest(
      "verifyConfigPassword",
      {
        token: token,
        password: password,
      },
      false
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function updateConfigPassword(token, currentPassword, newPassword) {
  try {
    const response = await createJSONPRequest(
      "updateConfigPassword",
      {
        token: token,
        currentPassword: currentPassword,
        newPassword: newPassword,
      },
      false
    );
    return response;
  } catch (error) {
    throw error;
  }
}