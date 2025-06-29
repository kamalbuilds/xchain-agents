// API Configuration for Eliza Client
export const API_CONFIG = {
  // Use environment variable if available, otherwise fallback to localhost for development
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',

  // API endpoints
  ENDPOINTS: {
    EVENTS: '/events',
    AGENTS: '/agents',
    CHAT: '/chat',
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function for API calls with proper error handling
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = buildApiUrl(endpoint);

  const defaultOptions: RequestInit = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    mode: 'cors',
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};