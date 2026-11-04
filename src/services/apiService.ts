export const getApiBaseUrl = (): string => {
    // 1. In production builds or on any deployed/remote hostname,
    // ALWAYS use the same-origin Vercel rewrite proxy ('')
    if (import.meta.env.PROD) {
        return '';
    }
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return '';
    }

    // 2. Local development fallback
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl === '') {
        return '';
    }
    if (typeof envUrl === 'string' && envUrl.trim() !== '') {
        return envUrl.trim().replace(/\/$/, '');
    }
    return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

function getCookie(name: string) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add credentials
    const fetchOptions: RequestInit = {
        ...options,
        credentials: 'include',
    };

    // Add CSRF token for mutations
    if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())) {
        let csrfToken = getCookie('csrftoken');
        if (!csrfToken) {
            // Try fetching it
            await fetch(`${API_BASE_URL}/api/auth/csrf/`, { credentials: 'include' });
            csrfToken = getCookie('csrftoken');
        }
        
        fetchOptions.headers = {
            ...options.headers,
            'X-CSRFToken': csrfToken || '',
        };
    }

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
        let errorMsg = 'Network response was not ok';
        try {
            const text = await response.text();
            try {
                const err = JSON.parse(text);
                if (err.errors) {
                    if (typeof err.errors === 'object') {
                        errorMsg = Object.values(err.errors).flat().join(' ');
                    } else {
                        errorMsg = String(err.errors);
                    }
                }
            } catch {
                // If it's HTML (like 403 CSRF page), just show status
                errorMsg = `Error ${response.status}: ${response.statusText}`;
            }
        } catch(e) {
            console.error('Failed to read error response:', e);
        }
        throw new Error(errorMsg);
    }
    return response;
};

// --- AUTH ENDPOINTS ---
export const getCurrentUser = async () => {
    const res = await apiFetch('/api/auth/me/');
    return res.json();
};
export const login = async (data: any) => {
    const res = await apiFetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
};
export const register = async (data: any) => {
    const res = await apiFetch('/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
};
export const logout = async () => {
    const res = await apiFetch('/api/auth/logout/', { method: 'POST' });
    return res.json();
};
export const getProfile = async () => {
    const res = await apiFetch('/api/auth/profile/');
    return res.json();
};
export const updateProfile = async (data: any) => {
    const res = await apiFetch('/api/auth/profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
};


// --- EXISTING ENDPOINTS ---
export interface HealthResponse {
    status: string;
    database?: string;
    service?: string;
    phase?: string;
    [key: string]: any;
}

export interface HealthCheckOptions {
    timeoutMs?: number;
    signal?: AbortSignal;
    forceRefresh?: boolean;
}

export const isBackendHealthy = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    const status = String(data.status || '').trim().toLowerCase();
    const database = String(data.database || '').trim().toLowerCase();
    return status === 'ok' && database === 'connected';
};

let inFlightHealthCheck: Promise<HealthResponse> | null = null;
let lastHealthCheckResult: { data: HealthResponse; timestamp: number } | null = null;
const HEALTH_CACHE_TTL_MS = 30000; // Cache valid response for 30 seconds to prevent unnecessary repeated requests

export const checkBackendHealth = async (options: HealthCheckOptions = {}): Promise<HealthResponse> => {
    const { timeoutMs = 30000, signal, forceRefresh = false } = options;

    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    // Return cached response if within TTL and not forcing refresh
    if (!forceRefresh && lastHealthCheckResult) {
        const age = Date.now() - lastHealthCheckResult.timestamp;
        if (age < HEALTH_CACHE_TTL_MS) {
            return lastHealthCheckResult.data;
        }
    }

    // Reuse existing in-flight request if one is currently pending
    let pendingPromise = inFlightHealthCheck;
    if (forceRefresh || !pendingPromise) {
        const executeCheck = async (): Promise<HealthResponse> => {
            const controller = new AbortController();
            let timeoutTimer: ReturnType<typeof setTimeout> | undefined;

            if (timeoutMs > 0) {
                timeoutTimer = setTimeout(() => {
                    controller.abort(new Error(`Health check timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            }

            try {
                const response = await apiFetch('/api/health/', {
                    signal: controller.signal,
                });
                const data: HealthResponse = await response.json();

                // Only cache healthy responses
                if (isBackendHealthy(data)) {
                    lastHealthCheckResult = { data, timestamp: Date.now() };
                } else {
                    lastHealthCheckResult = null;
                }

                return data;
            } catch (error) {
                lastHealthCheckResult = null;
                console.error("Could not connect to backend:", error);
                throw error;
            } finally {
                if (timeoutTimer) {
                    clearTimeout(timeoutTimer);
                }
            }
        };

        pendingPromise = executeCheck().finally(() => {
            inFlightHealthCheck = null;
        });
        inFlightHealthCheck = pendingPromise;
    }

    if (!signal) {
        return pendingPromise;
    }

    // If caller provided an abort signal, reject if caller aborts without canceling the shared fetch
    return new Promise<HealthResponse>((resolve, reject) => {
        const onAbort = () => {
            signal.removeEventListener('abort', onAbort);
            reject(new DOMException('Aborted', 'AbortError'));
        };
        signal.addEventListener('abort', onAbort);

        pendingPromise!
            .then((res) => {
                signal.removeEventListener('abort', onAbort);
                resolve(res);
            })
            .catch((err) => {
                signal.removeEventListener('abort', onAbort);
                reject(err);
            });
    });
};

export const getDestinations = async () => {
    const response = await apiFetch('/api/destinations/');
    return response.json();
};

export const getDestination = async (id: string | number) => {
    const response = await apiFetch(`/api/destinations/${id}/`);
    return response.json();
};

export const getPlaces = async (destinationId: string | number) => {
    const response = await apiFetch(`/api/destinations/${destinationId}/places/`);
    return response.json();
};

export const getAccommodations = async (destinationId: string | number) => {
    const response = await apiFetch(`/api/destinations/${destinationId}/accommodations/`);
    return response.json();
};

export const getTransport = async (origin: string, destination: string) => {
    const response = await apiFetch(`/api/transport/?origin=${origin}&destination=${destination}`);
    return response.json();
};

export const createTrip = async (data: any) => {
    const response = await apiFetch('/api/trips/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
};

export const getTrips = async () => {
    const response = await apiFetch('/api/trips/');
    return response.json();
};

export const getTrip = async (id: string | number) => {
    const response = await apiFetch(`/api/trips/${id}/`);
    return response.json();
};

export const updateTrip = async (id: string | number, data: any) => {
    const response = await apiFetch(`/api/trips/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
};

export const deleteTrip = async (id: string | number) => {
    await apiFetch(`/api/trips/${id}/`, { method: 'DELETE' });
    return true;
};

export const calculateTrip = async (id: string | number) => {
    const response = await apiFetch(`/api/trips/${id}/calculate/`, { method: 'POST' });
    return response.json();
};

export const addPlaceToTrip = async (tripId: string | number, placeId: string | number) => {
    const response = await apiFetch(`/api/trips/${tripId}/places/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: placeId })
    });
    return response.json();
};

export const removePlaceFromTrip = async (tripId: string | number, placeId: string | number) => {
    await apiFetch(`/api/trips/${tripId}/places/${placeId}/`, { method: 'DELETE' });
    return true;
};

// --- SEARCH ENDPOINTS ---
export const searchDestinations = async (query: string) => {
    const res = await apiFetch(`/api/search/destinations/?q=${encodeURIComponent(query)}`);
    return res.json();
};

export const searchPlaces = async (query: string, destinationId?: string | number) => {
    let url = `/api/search/places/?q=${encodeURIComponent(query)}`;
    if (destinationId) url += `&destination=${destinationId}`;
    const res = await apiFetch(url);
    return res.json();
};

export const searchAccommodations = async (filters: Record<string, string>) => {
    const params = new URLSearchParams(filters).toString();
    const res = await apiFetch(`/api/search/accommodations/?${params}`);
    return res.json();
};

export const searchTransport = async (filters: Record<string, string>) => {
    const params = new URLSearchParams(filters).toString();
    const res = await apiFetch(`/api/search/transport/?${params}`);
    return res.json();
};

// --- REPORTS ENDPOINTS ---
const downloadFile = async (endpoint: string, filename: string) => {
    const res = await apiFetch(endpoint);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

export const downloadTripCSV = async (tripId: number | string) => {
    await downloadFile(`/api/reports/trips/${tripId}/csv/`, `tripwise_trip_${tripId}.csv`);
};

export const downloadExpenseCSV = async (tripId: number | string) => {
    await downloadFile(`/api/reports/trips/${tripId}/expenses/csv/`, `tripwise_expenses_${tripId}.csv`);
};

export const downloadTripPDF = async (tripId: number | string) => {
    await downloadFile(`/api/reports/trips/${tripId}/pdf/`, `tripwise_trip_${tripId}.pdf`);
};

export const downloadExpensePDF = async (tripId: number | string) => {
    await downloadFile(`/api/reports/trips/${tripId}/expenses/pdf/`, `tripwise_expenses_${tripId}.pdf`);
};
