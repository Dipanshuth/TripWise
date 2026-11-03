const getApiBaseUrl = (): string => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (typeof envUrl === 'string' && envUrl.trim() !== '') {
        return envUrl.trim().replace(/\/$/, '');
    }
    // In production, default to same-origin proxy to prevent accidental localhost fallback
    if (envUrl === '' || import.meta.env.PROD) {
        return '';
    }
    // Local development fallback
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
            } catch(e) {
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
    service: string;
    phase: string;
}

export const checkBackendHealth = async (): Promise<HealthResponse> => {
    try {
        const response = await apiFetch('/api/health/');
        return await response.json();
    } catch (error) {
        console.error("Could not connect to backend:", error);
        throw error;
    }
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
