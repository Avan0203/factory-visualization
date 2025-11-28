import { pool } from '../config/db';
import { SensorReading } from '../models/SensorReading';

/**
 * 获取徐州地区最新的温湿度数据
 */
export const getLatestXuzhouReading = async (): Promise<SensorReading | null> => {
  try {
    // 筛选baseorgname前两个字为"徐州"的最新数据
    const [rows] = await pool.execute(
      `SELECT * FROM tdwd_scg_fqua_tempwet_collect 
       WHERE LEFT(baseorgname, 2) = '徐州' 
       ORDER BY recordtime DESC LIMIT 1`
    );

    return Array.isArray(rows) && rows.length > 0 ? (rows[0] as SensorReading) : null;
  } catch (error) {
    console.error('获取最新数据失败:', error);
    throw error;
  }
};

/**
 * 获取徐州地区最近N条数据
 */
export const getRecentXuzhouReadings = async (count: number = 100): Promise<SensorReading[]> => {
  try {
    const validCount = Math.max(1, Math.min(1000, count)); // 限制1-1000条
    const [rows] = await pool.execute(
      `SELECT * FROM tdwd_scg_fqua_tempwet_collect 
       WHERE LEFT(baseorgname, 2) = '徐州' 
       ORDER BY recordtime DESC LIMIT ?`,
      [validCount]
    );

    return Array.isArray(rows) ? (rows as SensorReading[]) : [];
  } catch (error) {
    console.error('获取最近数据失败:', error);
    throw error;
  }
};


// 临时统计结构：buildingCode -> floor -> direction -> Set<position>
type TParamStatistics = {
  [buildingCode: string]: {
    name: string;
    code: string;
    floors: Map<number, Map<string, Set<number>>>; // floor -> direction -> Set<position>
  };
}

// 返回给前端的配置结构
type TStatistics = {
  [buildingCode: string]: {
    name: string;
    code: string;
    floors: Array<{ [direction: string]: number[] }>; // 数组索引表示楼层，每个元素是方向到货位号数组的映射
  };
}
/**
 * 获取配置信息
 * 返回统计信息（总楼数、每个楼的层数）和映射关系（baseorgcode -> {name, buildingCode}）
 */
export const getConfiguration = async (): Promise<{
  statistics: TStatistics
}> => {
  try {
    // 查询徐州地区所有有效数据
    const [rows] = await pool.execute(
      `SELECT baseorgcode, baseorgname, location 
       FROM tdwd_scg_fqua_tempwet_collect 
       WHERE LEFT(baseorgname, 2) = '徐州' 
       AND baseorgcode IS NOT NULL 
       AND location IS NOT NULL`
    );


    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        statistics:{},
      };
    }

    // 临时统计结构：buildingCode -> floor -> direction -> Set<position>
    const tempStatistics: TParamStatistics = {};

    // 遍历数据，解析location字段并统计
    for (const row of rows as any[]) {
      const { baseorgcode, baseorgname, location } = row;

      // 解析location：楼号-楼层-方向编码-货位号
      const parts = location.split('-');
      if (parts.length < 4) {
        continue; // 跳过格式不正确的数据
      }

      const buildingCode = parts[0]; // 仓库楼号（字符串，作为key）
      const floor = +parts[1];       // 楼层（数字）
      const direction = parts[2];    // 库方向编码（01, 02等）
      const position = +parts[3];    // 货位号（数字）

      // 验证数据有效性
      if (isNaN(floor) || isNaN(position) || !direction) {
        continue; // 跳过无效的数据
      }

      // 初始化楼号统计
      if (!tempStatistics[buildingCode]) {
        tempStatistics[buildingCode] = {
          name: baseorgname,
          code: baseorgcode,
          floors: new Map(),
        };
      }

      const building = tempStatistics[buildingCode];

      // 初始化楼层统计
      if (!building.floors.has(floor)) {
        building.floors.set(floor, new Map());
      }

      const floorMap = building.floors.get(floor)!;

      // 初始化方向统计
      if (!floorMap.has(direction)) {
        floorMap.set(direction, new Set());
      }

      // 添加货位号（Set自动去重）
      floorMap.get(direction)!.add(position);
    }

    // 转换为最终返回格式
    const statistics: TStatistics = {};

    for (const [buildingCode, buildingData] of Object.entries(tempStatistics)) {
      // 获取所有楼层号并排序
      const floorNumbers = Array.from(buildingData.floors.keys()).sort((a, b) => a - b);
      
      // 构建楼层数组，索引从0开始连续（第1层=索引0，第2层=索引1，以此类推）
      const floors: Array<{ [direction: string]: number[] }> = [];
      
      for (const floorNum of floorNumbers) {
        const floorMap = buildingData.floors.get(floorNum)!;
        const floorData: { [direction: string]: number[] } = {};
        
        // 遍历该楼层的所有方向
        for (const [direction, positionSet] of floorMap.entries()) {
          // 将Set转为数组并排序
          floorData[direction] = Array.from(positionSet).sort((a, b) => a - b);
        }
        
        // 使用push方法，让数组索引从0开始连续
        floors.push(floorData);
      }

      statistics[buildingCode] = {
        name: buildingData.name,
        code: buildingData.code,
        floors,
      };
    }

    return {
      statistics
    };
  } catch (error) {
    console.error('获取配置失败:', error);
    throw error;
  }
};

/**
 * 查询传感器数据
 * @param warehouse 楼号（如 "2"）
 * @param floor 楼层索引（0开始，需要+1转换为实际楼层）
 * @param direction 方向编码（"01" 或 "02"）
 * @param location 货位号（如 "13"）
 * @param startDate 起始日期（YYYY-MM-DD）
 * @param endDate 结束日期（YYYY-MM-DD）
 * @param queryType 查询类型（"temperature" 或 "humidity"）
 * @returns 按时间排序的传感器数据数组
 */
export const querySensorData = async (
  warehouse: string,
  floor: number,
  direction: string,
  location: string,
  startDate?: string,
  endDate?: string,
  queryType: 'temperature' | 'humidity' = 'temperature'
): Promise<SensorReading[]> => {
  try {
    // 构建location字符串：楼号-实际楼层-方向编码-货位号
    // floor是索引（0,1,2...），需要+1转换为实际楼层（1,2,3...）
    const actualFloor = floor + 1;
    const locationPattern = `${warehouse}-${actualFloor}-${direction}-${location}`;

    // 构建SQL查询
    let sql = `
      SELECT recordtime, temperature, humidity, location, baseorgname
      FROM tdwd_scg_fqua_tempwet_collect
      WHERE location = ?
      AND LEFT(baseorgname, 2) = '徐州'
    `;
    const params: any[] = [locationPattern];

    // 添加时间范围过滤
    if (startDate) {
      sql += ` AND DATE(recordtime) >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND DATE(recordtime) <= ?`;
      params.push(endDate);
    }

    // 按时间升序排序
    sql += ` ORDER BY recordtime ASC`;

    const [rows] = await pool.execute(sql, params);

    return Array.isArray(rows) ? (rows as SensorReading[]) : [];
  } catch (error) {
    console.error('查询传感器数据失败:', error);
    throw error;
  }
};