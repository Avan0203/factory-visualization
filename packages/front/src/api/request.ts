/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-24
 * @Description: Axios 请求配置
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';

// 动态获取API基础URL
// 如果设置了环境变量VITE_API_BASE_URL，优先使用
// 否则根据当前页面的hostname动态构建（支持局域网访问）
const getApiBaseURL = (): string => {
  // 优先使用环境变量配置
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 获取当前页面的主机信息
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const port = import.meta.env.VITE_API_PORT || '3500';
  
  // 如果当前页面是localhost或127.0.0.1，使用localhost
  // 否则使用当前页面的hostname（支持局域网访问）
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}`;
  }
  
  // 使用当前页面的hostname（支持局域网访问）
  return `${protocol}//${hostname}:${port}`;
};

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  // 允许304状态码，因为304也表示成功（使用缓存）
  validateStatus: (status) => {
    return status >= 200 && status < 400; // 包括200-399，即包括304
  }
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 等认证信息
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 304 Not Modified 时，response.data 可能为空
    // 这种情况下，浏览器会使用缓存的响应体，但axios可能不会自动处理
    if (response.status === 304 && !response.data) {
      // 如果response.data为空，说明axios没有正确处理304的缓存数据
      // 返回一个特殊标记，让调用方知道需要重新请求
      return Promise.reject(new Error('304响应但数据为空，请重新请求'));
    }
    return response.data;
  },
  (error) => {
    // 统一错误处理
    const message = error.response?.data?.message || error.message || '请求失败';
    ElMessage.error(message);
    return Promise.reject(error);
  }
);

// 封装 request 方法
// 注意：响应拦截器已经返回了 response.data，所以这里直接返回即可
const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return instance.get<T>(url, config) as Promise<T>;
  },
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance.post<T>(url, data, config) as Promise<T>;
  },
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance.put<T>(url, data, config) as Promise<T>;
  },
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return instance.delete<T>(url, config) as Promise<T>;
  }
};

export default request;

