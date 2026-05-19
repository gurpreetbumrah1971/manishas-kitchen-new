const defaultApiUrl = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';
const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

export default API_URL;
