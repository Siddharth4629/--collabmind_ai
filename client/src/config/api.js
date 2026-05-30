// Step 6–8: production backend URL from client/.env (VITE_API_URL)
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
