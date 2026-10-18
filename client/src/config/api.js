// Dynamic API configuration for Local and Production environments
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
export const API_BASE = `${API_URL}/api`;
