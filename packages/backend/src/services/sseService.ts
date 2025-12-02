/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-12-02
 * @Description: SSE单例服务，用于推送传感器数据
 */
import { Response } from 'express';
import { getLatestReadingsByWarehouseFloor, getWarehouseStatus } from './sensorService';
import { SubscribeParams, SSEPushResponse } from '../types';

interface ClientConnection {
  id: string;
  response: Response;
  subscribeParams: SubscribeParams;
  interval: number;
  timer?: NodeJS.Timeout;
}

interface ClientConfig {
  subscribeParams: SubscribeParams;
  interval: number;
}

/**
 * SSE单例服务
 */
class SSEService {
  private static instance: SSEService;
  private clients: Map<string, ClientConnection> = new Map();
  private clientConfigs: Map<string, ClientConfig> = new Map(); // 存储客户端配置
  private clientIdCounter: number = 0;

  private constructor() {
    // 私有构造函数，确保单例
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): SSEService {
    if (!SSEService.instance) {
      SSEService.instance = new SSEService();
    }
    return SSEService.instance;
  }

  /**
   * 设置客户端配置（通过POST接口调用）
   * @param subscribeParams 订阅参数
   * @returns 客户端ID
   */
  public setClientConfig(subscribeParams: SubscribeParams): string {
    const clientId = `client_${Date.now()}_${++this.clientIdCounter}`;
    
    const config: ClientConfig = {
      subscribeParams,
      interval: Math.max(1000, subscribeParams.interval) // 最小间隔1秒
    };

    this.clientConfigs.set(clientId, config);
    
    if (subscribeParams.type === 'floor') {
      console.log(`[SSE] 设置客户端配置: ${clientId}, 类型: 楼层, 区域: ${subscribeParams.warehouse}-${subscribeParams.floor}, 间隔: ${subscribeParams.interval}ms`);
    } else {
      console.log(`[SSE] 设置客户端配置: ${clientId}, 类型: 仓库, 仓库号: ${subscribeParams.warehouses.join(',')}, 间隔: ${subscribeParams.interval}ms`);
    }
    
    return clientId;
  }

  /**
   * 添加客户端连接（通过GET接口调用）
   * @param response Express Response对象
   * @param clientId 客户端ID
   * @returns 是否成功
   */
  public addClient(response: Response, clientId: string): boolean {
    const config = this.clientConfigs.get(clientId);
    if (!config) {
      return false;
    }

    // 如果该客户端已经连接，先移除旧连接
    if (this.clients.has(clientId)) {
      this.removeClient(clientId);
    }
    
    // 设置SSE响应头
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no'); // 禁用nginx缓冲

    // 发送初始连接消息
    this.sendMessage(response, 'connected', { clientId });

    const client: ClientConnection = {
      id: clientId,
      response,
      subscribeParams: config.subscribeParams,
      interval: config.interval
    };

    this.clients.set(clientId, client);

    // 开始推送数据
    this.startPushing(client);

    // 处理客户端断开连接
    response.on('close', () => {
      this.removeClient(clientId);
    });

    if (config.subscribeParams.type === 'floor') {
      console.log(`[SSE] 客户端连接: ${clientId}, 类型: 楼层, 区域: ${config.subscribeParams.warehouse}-${config.subscribeParams.floor}, 间隔: ${config.interval}ms`);
    } else {
      console.log(`[SSE] 客户端连接: ${clientId}, 类型: 仓库, 仓库号: ${config.subscribeParams.warehouses.join(',')}, 间隔: ${config.interval}ms`);
    }
    
    return true;
  }

  /**
   * 开始推送数据
   */
  private async startPushing(client: ClientConnection) {
    const pushData = async () => {
      try {
        // 检查连接是否仍然有效
        if (!this.clients.has(client.id)) {
          return;
        }

        let response: SSEPushResponse;

        if (client.subscribeParams.type === 'floor') {
          // 楼层查询
          const warehouseFloor = `${client.subscribeParams.warehouse}-${client.subscribeParams.floor}`;
          console.log(`[SSE] 查询区域: ${warehouseFloor} (仓库: ${client.subscribeParams.warehouse}, 楼层: ${client.subscribeParams.floor})`);
          const data = await getLatestReadingsByWarehouseFloor(warehouseFloor);
          console.log(`[SSE] 查询结果: ${Object.keys(data).length} 个货位`);
          response = { type: 'floor', data };
        } else {
          // 仓库查询
          console.log(`[SSE] 查询仓库状态，仓库号: ${client.subscribeParams.warehouses.join(',')}`);
          const data = await getWarehouseStatus(client.subscribeParams.warehouses);
          console.log(`[SSE] 查询结果: ${Object.keys(data).length} 个仓库`);
          response = { type: 'warehouse', data };
        }

        // 发送数据
        this.sendMessage(client.response, 'data', response);
      } catch (error) {
        console.error(`[SSE] 推送数据失败 (${client.id}):`, error);
        // 发送错误消息
        this.sendMessage(client.response, 'error', { 
          message: '获取数据失败', 
          error: (error as Error).message 
        });
      }
    };

    // 立即推送一次
    await pushData();

    // 设置定时推送
    client.timer = setInterval(pushData, client.interval);
  }

  /**
   * 发送SSE消息
   */
  private sendMessage(response: Response, event: string, data: any) {
    try {
      const jsonData = JSON.stringify(data);
      response.write(`event: ${event}\n`);
      response.write(`data: ${jsonData}\n\n`);
    } catch (error) {
      console.error(`[SSE] 发送消息失败:`, error);
    }
  }

  /**
   * 移除客户端连接
   */
  private removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      // 清除定时器
      if (client.timer) {
        clearInterval(client.timer);
      }
      this.clients.delete(clientId);
      console.log(`[SSE] 客户端断开: ${clientId}`);
    }
    // 注意：不删除配置，以便客户端可以重连
  }

  /**
   * 删除客户端配置（包括连接和配置）
   */
  public removeClientConfig(clientId: string) {
    this.removeClient(clientId);
    this.clientConfigs.delete(clientId);
    console.log(`[SSE] 删除客户端配置: ${clientId}`);
  }

  /**
   * 更新客户端配置
   */
  public updateClientConfig(clientId: string, subscribeParams: SubscribeParams) {
    const config = this.clientConfigs.get(clientId);
    if (config) {
      config.subscribeParams = subscribeParams;
      config.interval = Math.max(1000, subscribeParams.interval);
      if (subscribeParams.type === 'floor') {
        console.log(`[SSE] 更新客户端配置: ${clientId}, 类型: 楼层, 区域: ${subscribeParams.warehouse}-${subscribeParams.floor}, 间隔: ${subscribeParams.interval}ms`);
      } else {
        console.log(`[SSE] 更新客户端配置: ${clientId}, 类型: 仓库, 仓库号: ${subscribeParams.warehouses.join(',')}, 间隔: ${subscribeParams.interval}ms`);
      }
    }

    // 如果客户端已连接，更新连接并重启推送
    const client = this.clients.get(clientId);
    if (client) {
      // 清除旧的定时器
      if (client.timer) {
        clearInterval(client.timer);
      }

      // 更新连接配置
      client.subscribeParams = subscribeParams;
      client.interval = Math.max(1000, subscribeParams.interval);

      // 重新开始推送
      this.startPushing(client);
    }
  }

  /**
   * 获取当前连接的客户端数量
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * 关闭所有连接
   */
  public closeAll() {
    for (const clientId of this.clients.keys()) {
      this.removeClient(clientId);
    }
  }
}

export default SSEService.getInstance();

