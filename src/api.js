// In production (same-origin deploy), defaults to relative /api.
// In development, set REACT_APP_BACKEND_URL=http://localhost:5000/api
export const API_BASE = process.env.REACT_APP_BACKEND_URL || "/api";
