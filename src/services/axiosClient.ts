import { useUserStore } from "@/app/stores/userStore";
import axios from "axios";

// ✅ Create Axios instance
const axiosClient = axios.create({
  baseURL: "http://192.168.1.35:8082", // "https://uacrapi.hellokidney.ai", //
  timeout: 50000, // optional timeout (ms)
  headers: {
    Accept: "application/json",
  },
});

// ✅ Request interceptor
axiosClient.interceptors.request.use(
  async (config) => {
    // If using async storage or secure storage for tokens:
    // const token = await AsyncStorage.getItem('authToken');
    const token = useUserStore.getState().user?.token; // replace this with your token retrieval logic

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Optionally log requests in dev mode
    if (__DEV__) {
      console.log(
        "📤 API Request:",
        config.method?.toUpperCase(),
        config.url,
        config.data ?? "",
      );
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  },
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
    // if (!error.response) {
    //   console.error("🌐 Network error — check backend IP " + error);
    // } else if (error.response.status === 401) {
    //   console.warn("🔒 Unauthorized");
    //   // await handleLogout()
    //   throw error;
    // } else {
    //   console.error("❌ API Error:", error.response.data);
    // }

    console.log("FULL ERROR:", error);

    if (error.response) {
      console.log("STATUS:", error.response.status);
      console.log("DATA:", error.response.data);
    } else if (error.request) {
      console.log("NO RESPONSE RECEIVED");
    } else {
      console.log("ERROR MESSAGE:", error.message);
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
