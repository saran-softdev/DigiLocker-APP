import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

// 1) Create the instance
//Laptop
const apiClient = axios.create({
  baseURL: 'http://192.168.31.202:5000/api',
});



//Mobile
// const apiClient = axios.create({
//   baseURL: 'http://192.168.204.52:5000/api',
// });

// 2) Attach interceptor to inject token
apiClient.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // — also log every request
    console.log(
      `➡️ [Request] ${config.method?.toUpperCase()} ${config.baseURL}${
        config.url
      }`,
      'Data:',
      config.data,
    );

    return config;
  },
  error => {
    console.error('⚠️ [Request Error]', error);
    return Promise.reject(error);
  },
);

// 3) Attach interceptor to log all responses & errors
apiClient.interceptors.response.use(
  response => {
    console.log(
      `✅ [Response] ${response.config.method?.toUpperCase()} ${
        response.config.baseURL
      }${response.config.url}`,
      'Status:',
      response.status,
      'Data:',
      response.data,
    );
    return response;
  },
  error => {
    const cfg = error.config || {};
    console.error(
      `❌ [Response Error] ${cfg.method?.toUpperCase()} ${cfg.baseURL}${
        cfg.url
      }`,
      'Status:',
      error.response?.status,
      'Data:',
      error.response?.data,
    );
    return Promise.reject(error);
  },
);

export default apiClient;
