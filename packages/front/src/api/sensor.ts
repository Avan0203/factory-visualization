/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-24
 * @Description: 传感器相关 API
 */
import request from './request';

/**
 * 配置信息响应类型
 */
export interface ConfigurationResponse {
  statistics: {
    [buildingCode: string]: {
      name: string;
      code: string;
      floors: Array<{ [direction: string]: number[] }>; // 数组索引表示楼层，每个元素是方向到货位号数组的映射
    };
  };
}

/**
 * 获取配置信息
 * 返回统计信息（总楼数、每个楼的层数）和映射关系（baseorgcode -> {name, buildingCode}）
 */
export const getConfiguration = async (): Promise<ConfigurationResponse> => {
  try {
    // 添加时间戳参数，避免304缓存问题
    const timestamp = new Date().getTime();
    const result = await request.get<ConfigurationResponse>(`/api/sensors/configuration?t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return result;
  } catch (error) {
    // 如果是因为304数据为空导致的错误，尝试不带缓存头重新请求
    if (error.message && error.message.includes('304')) {
      const result = await request.get<ConfigurationResponse>('/api/sensors/configuration', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        // 强制不使用缓存
        params: {
          _t: new Date().getTime()
        }
      });
      return result;
    }
    throw error;
  }
};

/**
 * 传感器数据项
 */
export interface SensorDataItem {
  recordtime: string | Date;
  temperature: number;
  humidity: number;
  location: string;
  baseorgname: string;
}

/**
 * 查询传感器数据参数
 */
export interface QuerySensorDataParams {
  warehouse: string;        // 楼号
  floor: number;            // 楼层索引（0开始）
  direction: string;        // 方向编码（01/02）
  location: string;         // 货位号
  dataRange?: string[];     // 日期范围 [开始日期, 结束日期]
  queryType?: 'temperature' | 'humidity';  // 查询类型
}

/**
 * 查询传感器数据
 */
export const querySensorData = async (params: QuerySensorDataParams): Promise<SensorDataItem[]> => {
  const { warehouse, floor, direction, location, dataRange, queryType } = params;
  
  const queryParams: Record<string, string> = {
    warehouse,
    floor: String(floor),
    direction,
    location
  };
  
  if (dataRange) {
    queryParams.dataRange = dataRange.join(',');
  }
  if (queryType) {
    queryParams.queryType = queryType;
  }
  
  const result = await request.get<SensorDataItem[]>('/api/sensors/query', {
    params: queryParams
  });
  
  return result;
};

