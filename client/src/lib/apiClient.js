import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      (status === 401
        ? "Unauthorized, please login again."
        : status === 404
        ? "Not found."
        : "An error occurred.");

    if (status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      // Optional redirect: window.location.href = '/login';
    }

    return Promise.reject({ status, message });
  }
);

export default apiClient;