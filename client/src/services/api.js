import axios from 'axios';

// The live backend. A production build never talks to localhost, even if the host's settings say so.
const LIVE_API_URL = 'https://relife-spark.onrender.com/api';
const configuredUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL =
  import.meta.env.PROD && (!configuredUrl || configuredUrl.includes('localhost'))
    ? LIVE_API_URL
    : configuredUrl || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // The hosted backend sleeps when idle and can take ~50 s to wake up, so allow for that.
  timeout: 60000,
});

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      // Server returned error status code
      errorMessage = error.response.data?.message || `Server Error (${error.response.status})`;
    } else if (error.request) {
      // Request made but no response (server down or network issue)
      errorMessage = 'Unable to connect to the ReLife-Spark backend server. Please verify the server is running on port 5000.';
    } else {
      errorMessage = error.message;
    }

    return Promise.reject({
      message: errorMessage,
      raw: error,
      status: error.response?.status,
      errors: error.response?.data?.errors,
    });
  }
);

export default apiClient;

