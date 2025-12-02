/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-12-02
 * @Description: SSE传感器数据推送 composable
 */
import { ref, onUnmounted } from 'vue';
import { subscribeSensorData, getSSEStreamUrl, SubscribeParams } from '../api/sensor';
import { SSEPushResponse } from 'backend';

export function useSensorSSE() {
  const data = ref<SSEPushResponse | null>(null);
  const isConnected = ref(false);
  const error = ref<string | null>(null);
  
  let eventSource: EventSource | null = null;
  let clientId: string | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 5000; // 3秒

  /**
   * 连接SSE流
   */
  const connect = async (params: SubscribeParams) => {
    try {
      // 先断开旧连接
      disconnect();

      // 设置订阅
      const response = await subscribeSensorData(params);
      clientId = response.clientId;

      // 获取SSE流URL
      const streamUrl = getSSEStreamUrl(clientId);

      // 创建EventSource连接
      eventSource = new EventSource(streamUrl);
      reconnectAttempts = 0;

      // 监听连接成功
      eventSource.addEventListener('connected', (event: MessageEvent) => {
        console.log('[SSE] 连接成功:', event.data);
        isConnected.value = true;
        error.value = null;
        reconnectAttempts = 0;
      });

      // 监听数据推送
      eventSource.addEventListener('data', (event: MessageEvent) => {
        try {
          const pushData: SSEPushResponse = JSON.parse(event.data);
          data.value = pushData;
          console.log('[SSE] 收到数据:', pushData);
          if (pushData.type === 'floor') {
            console.log(`[SSE] 楼层数据: ${Object.keys(pushData.data).length} 个货位`);
          } else {
            console.log(`[SSE] 仓库数据: ${Object.keys(pushData.data).length} 个仓库`);
          }
        } catch (err) {
          console.error('[SSE] 解析数据失败:', err);
        }
      });

      // 监听服务器发送的自定义错误消息
      eventSource.addEventListener('error', (event: MessageEvent) => {
        // 如果是服务器发送的自定义错误消息，会有data属性
        if ('data' in event && event.data) {
          try {
            const errorData = JSON.parse(event.data);
            error.value = errorData.message || '获取数据失败';
            console.error('[SSE] 服务器错误:', errorData);
          } catch (err) {
            // 忽略解析错误
          }
        }
      });

      // 监听原生连接错误（通过onerror）
      eventSource.onerror = (event: Event) => {
        const source = event.target as EventSource;
        console.error('[SSE] 连接错误, readyState:', source.readyState);
        
        // 如果连接关闭，尝试重连
        if (source.readyState === EventSource.CLOSED) {
          error.value = 'SSE连接已关闭';
          isConnected.value = false;
          scheduleReconnect(params);
        } else if (source.readyState === EventSource.CONNECTING) {
          console.log('[SSE] 正在重连...');
        }
      };

    } catch (err) {
      console.error('[SSE] 连接失败:', err);
      error.value = (err as Error).message || '连接失败';
      isConnected.value = false;
      scheduleReconnect(params);
    }
  };

  /**
   * 安排重连
   */
  const scheduleReconnect = (params: SubscribeParams) => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('[SSE] 达到最大重连次数，停止重连');
      error.value = '连接失败，已达到最大重连次数';
      return;
    }

    reconnectAttempts++;
    console.log(`[SSE] ${reconnectDelay / 1000}秒后尝试第${reconnectAttempts}次重连...`);

    reconnectTimer = setTimeout(() => {
      console.log(`[SSE] 开始第${reconnectAttempts}次重连...`);
      connect(params);
    }, reconnectDelay);
  };

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    isConnected.value = false;
    clientId = null;
    reconnectAttempts = 0;
  };

  /**
   * 更新订阅参数（重新连接）
   */
  const updateSubscription = async (params: SubscribeParams) => {
    disconnect();
    await connect(params);
  };

  // 组件卸载时清理
  onUnmounted(() => {
    disconnect();
  });

  return {
    data,
    isConnected,
    error,
    connect,
    disconnect,
    updateSubscription
  };
}

