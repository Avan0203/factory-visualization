/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-24
 * @Description: 传感器相关 API
 */
import request from './request';
import { QuerySensorParams, QuerySensorResult } from 'backend';

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
export const querySensorData = async (params: any): Promise<QuerySensorResult[]> => {
  const { warehouse, floor, direction, location, dataRange, queryType, sensorType } = params;

  // 格式化日期为 YYYY-MM-dd 格式
  const startDate = formatDate(dataRange[0]);
  const endDate = formatDate(dataRange[1]);

  const queryParams: QuerySensorParams = {
    code:`${warehouse}-${floor}-${direction}-${location}`,
    startDate,
    endDate,
    query:queryType,
    sensor:sensorType,
  }
  
  const result = await request.get<QuerySensorResult[]>('/api/sensors/query', {
    params: queryParams
  });
  
  return result;
};

