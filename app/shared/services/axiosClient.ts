import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { logout } from "./auth";

// ✅ Create Axios instance
const axiosClient = axios.create({
  baseURL: "http://192.168.1.8:8082", // 'https://127.0.0.1:8000', // 🔹 Change this to your API base
  timeout: 10000, // optional timeout (ms)
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor
axiosClient.interceptors.request.use(
  async (config) => {
    // If using async storage or secure storage for tokens:
    // const token = await AsyncStorage.getItem('authToken');
    const token = await SecureStore.getItemAsync("access_token"); // replace this with your token retrieval logic

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Optionally log requests in dev mode
    if (__DEV__) {
      console.log(
        "📤 API Request:",
        config.method?.toUpperCase(),
        config.url,
        config.data ?? ""
      );
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log("📥 API Response:", response.status, response.config.url);
    }
    return response.data;
  },
  async (error) => {
    if (!error.response) {
      console.error("🌐 Network error — check backend IP");
    } else if (error.response.status === 401) {
      console.warn("🔒 Unauthorized");
      await logout();
    } else {
      console.error("❌ API Error:", error.response.data);
    }

    return Promise.reject(error);
  }
);

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync("access_token", token);
};
export const getToken = async () => {
  return await SecureStore.getItemAsync("access_token");
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync("access_token");
};

export default axiosClient;
