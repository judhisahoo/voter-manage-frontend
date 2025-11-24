// src/lib/axios.ts
import axios, { AxiosRequestConfig, AxiosError } from "axios";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";

interface RequestConfig extends AxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest", // CSRF Protection
  },
  withCredentials: true, // Send cookies with requests
});

// Request Interceptor - Add Security Headers
axiosInstance.interceptors.request.use(
  (config: RequestConfig) => {
    // Add metadata for performance tracking
    config.metadata = { startTime: Date.now() };

    // 1. Add Authorization Token
    const token = Cookies.get("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Add unique Request ID for tracking
    config.headers["X-Request-ID"] = uuidv4();

    // 3. Add CSRF Token (if available from response headers)
    const csrfToken = Cookies.get("XSRF-TOKEN");
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }

    // 4. Add Timestamp to prevent replay attacks
    config.headers["X-Request-Time"] = new Date().toISOString();

    // 5. Add API version
    config.headers["X-API-Version"] = "1";

    // 6. Add User Agent info
    config.headers["X-Client-Platform"] = "web";

    // 7. Check token expiration
    const tokenExpiry = Cookies.get("token_expiry");
    if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry)) {
      Cookies.remove("access_token");
      Cookies.remove("user");
      window.location.href = "/login";
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Config Error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle Security & Errors
axiosInstance.interceptors.response.use(
  (response: any) => {
    // Calculate request duration
    const duration = Date.now() - (response.config.metadata?.startTime || 0);

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("✅ API Response:", {
        status: response.status,
        url: response.config.url,
        duration: `${duration}ms`,
        requestId: response.config.headers["X-Request-ID"],
      });
    }

    // Store CSRF token from response if available
    const csrfToken = response.headers["x-csrf-token"];
    if (csrfToken) {
      Cookies.set("XSRF-TOKEN", csrfToken, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }

    return response;
  },
  (error: AxiosError) => {
    const duration = Date.now() - (error.config?.metadata?.startTime || 0);
    const requestId = error.config?.headers["X-Request-ID"];

    // 1. Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.error("❌ Unauthorized - Redirecting to login");
      Cookies.remove("access_token");
      Cookies.remove("user");
      window.location.href = "/login";
    }

    // 2. Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error("❌ Access Denied - Insufficient permissions");
      window.location.href = "/dashboard";
    }

    // 3. Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      console.error("❌ Rate Limited - Please wait before retrying");
    }

    // 4. Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error("❌ Server Error - Please try again later");
    }

    // Log error securely
    if (process.env.NODE_ENV === "development") {
      console.error("❌ API Error:", {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        duration: `${duration}ms`,
        requestId,
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
