import axios from "axios";

const api = axios.create({ withCredentials: true });

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = "/auth/login";
    }
    return Promise.reject(err);
  }
);

export default api;
