import axios, { AxiosError, AxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const DEFAULT_ENDPOINT = "192.168.18.26:8000";
const CONFIG_URL = "https://reverse-http.onrender.com/appConfig";

let currentEndpoint = DEFAULT_ENDPOINT;

const api = axios.create({
  baseURL: `http://${DEFAULT_ENDPOINT}`,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export const initializeApiConfig = async (maxRetries = 3, retryDelay = 60000): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching app config (attempt ${attempt}/${maxRetries})...`);
      const response = await axios.get<{ appName: string; endpoint: string }>(CONFIG_URL, {
        timeout: 30000,
      });
      
      if (response.data?.endpoint) {
        currentEndpoint = response.data.endpoint;
        api.defaults.baseURL = `http://${currentEndpoint}`;
        console.log(`API endpoint set to: http://${currentEndpoint}`);
        return true;
      }
    } catch (error) {
      console.log(`Config fetch failed (attempt ${attempt}): ${error}`);
      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  console.log(`Using default endpoint: http://${DEFAULT_ENDPOINT}`);
  return false;
};

export const getApiEndpoint = () => currentEndpoint;

let isRefreshing = false;
let failedQueue: {
  resolve: (value?: any) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use(
  async (config: any) => {
    const token = await SecureStore.getItemAsync("accessToken");
    console.log("Attaching token to request:", token);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: any) => {
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 498 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!refreshToken) throw new Error("No refresh token found");

        const refreshResponse = await axios.get<{ newToken: string }>(
          `http://${currentEndpoint}/auth/refresh`,
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          },
        );

        const newAccessToken = refreshResponse.data.newToken;
        await SecureStore.setItemAsync("accessToken", newAccessToken);

        processQueue(null, newAccessToken);
        isRefreshing = false;

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
