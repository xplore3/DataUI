import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types/error';
import { storage } from '../utils/storage';

const config: AxiosRequestConfig = {
  timeout: 3000000,
  headers: {
    'Content-Type': 'application/json',
  },
};

const AGENT_ID = import.meta.env.VITE_BASE_AGENT_ID;
const baseURL = `${import.meta.env.VITE_API_BASE_URL}/${AGENT_ID}`;

const api: AxiosInstance = axios.create({ baseURL, ...config });

// 请求日志拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 打印请求日志
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      params: config.params,
      data: config.data,
      headers: config.headers,
    });
    
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    // 打印响应日志
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`, {
      data: response.data,
      headers: response.headers,
    });
    
    if (response.status === 401) {
      storage.clear();
      window.location.href = '/';
      return response;
    }
    return response;
  },
  (error: AxiosError<ApiError>): Promise<never> => {
    console.error(`[API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });
    
    if (error.response?.status == 401) {
      storage.clear();
      window.location.href = '/';
    }
    /*if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED'
      || !navigator.onLine) {
      console.log('disconnected.');
      await new Promise<void>(resolve => {
        const handleOnline = () => {
          console.log('connected.');
          window.removeEventListener('online', handleOnline);
          resolve();
        };
        window.addEventListener('online', handleOnline);
      });

      if (error.config) {
        return axios.request(error.config);
      }
    }*/
    return Promise.reject(error);
  }
);

export default api;
