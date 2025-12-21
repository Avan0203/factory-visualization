/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-24
 * @Description: 传感器相关 API
 */
import request from './request';
import { QuerySensorParams, QuerySensorResult, QueryTableParams, QueryTableResult, SensorPushResult, SSEPushResponse } from 'backend';

/**
 * 格式化日期为 YYYY-MM-dd 格式
 */
const formatDate = (date: string | Date): string => {
  if (!date) return '';

  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  // 检查日期是否有效
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date:', date);
    return '';
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * 查询传感器数据
 */
export const querySensorData = async (params: any): Promise<QuerySensorResult[][]> => {
  const { dataRange, items } = params;

  // 格式化日期为 YYYY-MM-dd 格式
  const startDate = formatDate(dataRange[0]);
  const endDate = formatDate(dataRange[1]);

  const sensorItems = items.map(({ warehouse, floor, direction, location, queryType, sensorType }) => ({
    code: `${warehouse}-${floor}-${direction}-${location}`,
    query: queryType,
    sensor: sensorType,
  }));

  const queryParams: QuerySensorParams = {
    startDate,
    endDate,
    items: sensorItems,
  }

  const result = await request.post<QuerySensorResult[][]>('/api/sensors/query', queryParams);

  return result;
};


export const queryTableData = async (params: any): Promise<QueryTableResult> => {
  const { warehouse, floor, direction, location, dataRange, pageSize, pageNum, sensorType } = params;
  const startDate = formatDate(dataRange[0]);
  const endDate = formatDate(dataRange[1]);

  const queryParams: QueryTableParams = {
    code: `${warehouse}-${floor}-${direction}-${location}`,
    startDate,
    endDate,
    sensor: sensorType,
    pageSize,
    pageNum,
  }

  const result = await request.get<QueryTableResult>('/api/sensors/table', {
    params: queryParams
  });

  return result;
}

/**
 * SSE订阅参数 - 楼层查询
 */
export interface SubscribeFloorParams {
  type: 'floor';
  warehouse: string;  // 例如 "01"
  floor: string;      // 例如 "1"
  interval: number;  // 推送间隔（毫秒）
}

/**
 * SSE订阅参数 - 仓库查询
 */
export interface SubscribeWarehouseParams {
  type: 'warehouse';
  warehouses: string[];  // 例如 ["01", "02", "03", ...]
  interval: number;      // 推送间隔（毫秒）
}

/**
 * SSE订阅参数（联合类型）
 */
export type SubscribeParams = SubscribeFloorParams | SubscribeWarehouseParams;

/**
 * SSE订阅响应
 */
export interface SubscribeResponse {
  clientId: string;
  message: string;
  streamUrl: string;
}

/**
 * 设置SSE订阅
 */
export const subscribeSensorData = async (params: SubscribeParams): Promise<SubscribeResponse> => {
  const result = await request.post<SubscribeResponse>('/api/sensors/subscribe', params);
  return result;
};

/**
 * 获取SSE流URL
 */
export const getSSEStreamUrl = (clientId: string): string => {
  // 使用与request相同的逻辑获取API基础URL
  let baseURL: string;
  if (import.meta.env.VITE_API_BASE_URL) {
    baseURL = import.meta.env.VITE_API_BASE_URL;
  } else {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const port = import.meta.env.VITE_API_PORT || '3500';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      baseURL = `http://localhost:${port}`;
    } else {
      baseURL = `${protocol}//${hostname}:${port}`;
    }
  }
  return `${baseURL}/api/sensors/stream?clientId=${clientId}`;
};
