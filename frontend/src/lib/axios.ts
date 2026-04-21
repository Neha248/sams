import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
});

const debugLog = (payload: {
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data: Record<string, unknown>;
}) => {
  // #region agent log
  fetch('http://127.0.0.1:7751/ingest/4bc5d103-f0ec-4d7a-a700-f6a66261b995', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'c57656',
    },
    body: JSON.stringify({
      sessionId: 'c57656',
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

api.interceptors.request.use((config) => {
  debugLog({
    runId: 'post-fix',
    hypothesisId: 'H1-H3',
    location: 'src/lib/axios.ts:request',
    message: 'Outgoing API request',
    data: {
      baseURL: config.baseURL ?? 'unset',
      url: config.url ?? 'unset',
      method: config.method ?? 'unset',
    },
  });
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    debugLog({
      runId: 'post-fix',
      hypothesisId: 'H1-H2-H4',
      location: 'src/lib/axios.ts:responseError',
      message: 'API error response',
      data: {
        status: error?.response?.status ?? 'no-status',
        message: error?.response?.data?.message ?? 'no-message',
        requestUrl: error?.config?.url ?? 'no-url',
        baseURL: error?.config?.baseURL ?? 'no-base-url',
      },
    });
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error.response?.data?.message || 'Something went wrong');
  }
);

export default api;
