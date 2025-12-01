/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-12-01
 * @Description: Socket.io 客户端连接管理
 */
import { io, Socket } from 'socket.io-client';

// 实时数据消息类型
export interface RealTimeDataMessage {
  type: 'real_time_data';
  data: any;
  time: string;
}

// Socket 事件回调类型
export type RealTimeDataCallback = (message: RealTimeDataMessage) => void;
export type ConnectCallback = () => void;
export type DisconnectCallback = (reason: string) => void;
export type ErrorCallback = (error: Error) => void;

// 动态获取Socket.io服务器地址
// 参考 request.ts 的逻辑，确保与HTTP API使用相同的地址
const getSocketServerURL = (): string => {
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

class SocketService {
  private socket: Socket | null = null;
  private serverURL: string;
  private isConnecting: boolean = false;

  constructor() {
    this.serverURL = getSocketServerURL();
  }

  /**
   * 连接到Socket.io服务器
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('Socket.io已连接，无需重复连接');
      return;
    }

    if (this.isConnecting) {
      console.log('Socket.io正在连接中...');
      return;
    }

    this.isConnecting = true;
    console.log('正在连接Socket.io服务器:', this.serverURL);

    // 创建Socket.io连接
    this.socket = io(this.serverURL, {
      transports: ['websocket', 'polling'], // 支持WebSocket和轮询
      reconnection: true, // 自动重连
      reconnectionDelay: 1000, // 重连延迟1秒
      reconnectionAttempts: 5, // 最多重连5次
      timeout: 20000 // 连接超时20秒
    });

    // 连接成功
    this.socket.on('connect', () => {
      console.log('✅ Socket.io连接成功:', this.socket?.id);
      this.isConnecting = false;
    });

    // 连接错误
    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Socket.io连接失败:', error);
      this.isConnecting = false;
    });

    // 断开连接
    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket.io断开连接:', reason);
      this.isConnecting = false;
    });
  }

  /**
   * 断开Socket.io连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      console.log('Socket.io已断开连接');
    }
  }

  /**
   * 监听实时数据
   * @param callback 回调函数
   */
  onRealTimeData(callback: RealTimeDataCallback): void {
    if (!this.socket) {
      console.warn('Socket.io未连接，请先调用connect()');
      return;
    }

    this.socket.on('real_time_data', (message: RealTimeDataMessage) => {
      callback(message);
    });
  }

  /**
   * 取消监听实时数据
   */
  offRealTimeData(): void {
    if (this.socket) {
      this.socket.off('real_time_data');
    }
  }

  /**
   * 监听连接事件
   * @param callback 回调函数
   */
  onConnect(callback: ConnectCallback): void {
    if (!this.socket) {
      console.warn('Socket.io未连接，请先调用connect()');
      return;
    }

    this.socket.on('connect', callback);
  }

  /**
   * 监听断开连接事件
   * @param callback 回调函数
   */
  onDisconnect(callback: DisconnectCallback): void {
    if (!this.socket) {
      console.warn('Socket.io未连接，请先调用connect()');
      return;
    }

    this.socket.on('disconnect', callback);
  }

  /**
   * 监听错误事件
   * @param callback 回调函数
   */
  onError(callback: ErrorCallback): void {
    if (!this.socket) {
      console.warn('Socket.io未连接，请先调用connect()');
      return;
    }

    this.socket.on('connect_error', callback);
  }

  /**
   * 发送消息到服务器
   * @param event 事件名称
   * @param data 数据
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn('Socket.io未连接，无法发送消息');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 获取Socket实例（用于高级用法）
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// 创建单例实例
const socketService = new SocketService();

export default socketService;

