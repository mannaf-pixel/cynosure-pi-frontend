import axios from 'axios';
import Cookies from 'js-cookie';

function getCompanyIdFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.company_id || null;
  } catch(e) {
    return null;
  }
}

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('cynosure_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    const companyId = getCompanyIdFromToken(token);
    if (companyId) {
      config.headers['X-Company-Id'] = String(companyId);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('cynosure_token');
      Cookies.remove('cynosure_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
export const API_BASE = 'http://127.0.0.1:8000';
