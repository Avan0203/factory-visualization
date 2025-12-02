import { pool } from '../config/db';
import { SensorReading } from '../models/SensorReading';
import { QuerySensorParams, QuerySensorResult, QueryTableParams, QueryTableResult, TableRow, SensorPushResult, WarehousePushResult } from '../types';

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


/**
 * 查询传感器数据
 * @param params 查询参数
 * @returns 按日期排序的传感器数据数组
 */
export const querySensorData = async (params: QuerySensorParams): Promise<QuerySensorResult[]> => {
  try {
    const { code, startDate, endDate, sensor } = params;

    // 验证参数
    if (!code || !startDate || !endDate) {
      throw new Error('缺少必要参数：code, startDate, endDate');
    }

    const sensorType = sensor === 1 ? '环境传感器' : '包芯传感器';

    // 添加调试日志
    console.log('查询参数:', { code, sensorType, startDate, endDate });

    // 查询数据库：按日期分组，计算每天的平均温度和平均湿度
    // 注意：code对应location字段
    // 使用DATE()函数提取日期部分，确保格式统一为YYYY-MM-DD
    // 如果recorddate为空或格式不对，使用recordtime的日期部分
    const [rows] = await pool.execute(
      `SELECT 
        DATE(COALESCE(NULLIF(recorddate, ''), recordtime)) as recorddate,
        AVG(temperature) as avg_temperature,
        AVG(humidity) as avg_humidity
      FROM tdwd_scg_fqua_tempwet_collect 
      WHERE location = ?
        AND remark = ?
        AND baseorgname LIKE '徐州%'
        AND DATE(COALESCE(NULLIF(recorddate, ''), recordtime)) >= ?
        AND DATE(COALESCE(NULLIF(recorddate, ''), recordtime)) <= ?
      GROUP BY DATE(COALESCE(NULLIF(recorddate, ''), recordtime))
      ORDER BY DATE(COALESCE(NULLIF(recorddate, ''), recordtime)) ASC`,
      [code, sensorType, startDate, endDate]
    );

    console.log('查询结果数量:', Array.isArray(rows) ? rows.length : 0);
    if (Array.isArray(rows) && rows.length > 0) {
      console.log('第一条数据示例:', rows[0]);
    } else {
      // 如果没有查询到数据，尝试查询一下是否有匹配location和remark的数据（不限制日期）
      const [testRows] = await pool.execute(
        `SELECT location, remark, baseorgname, recorddate, COUNT(*) as cnt
         FROM tdwd_scg_fqua_tempwet_collect 
         WHERE location = ? AND remark = ? AND baseorgname LIKE '徐州%'
         GROUP BY location, remark, baseorgname, recorddate
         LIMIT 5`,
        [code, sensorType]
      );
      console.log('测试查询（不限制日期）结果:', testRows);
    }

    // 将查询结果转换为Map，方便查找
    const dataMap = new Map<string, any>();
    if (Array.isArray(rows)) {
      for (const row of rows as any[]) {
        // recorddate已经是DATE()函数处理后的日期格式，确保格式为YYYY-MM-DD
        let dateStr = row.recorddate;
        // 如果recorddate是Date对象，转换为字符串
        if (dateStr instanceof Date) {
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else if (typeof dateStr === 'string' && dateStr.includes(' ')) {
          // 如果还是包含时间的字符串，提取日期部分
          dateStr = dateStr.split(' ')[0];
        }
        dataMap.set(dateStr, {
          temperature: row.avg_temperature ? Number(row.avg_temperature.toFixed(2)) : 0,
          humidity: row.avg_humidity ? Number(row.avg_humidity.toFixed(2)) : 0
        });
      }
    }
    console.log('dataMap大小:', dataMap.size);
    console.log('dataMap keys:', Array.from(dataMap.keys()));

    // 生成日期范围内的所有日期
    // 使用本地时间处理，避免时区问题
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    const result: QuerySensorResult[] = [];

    // 遍历日期范围内的每一天
    const currentDate = new Date(start);
    while (currentDate <= end) {
      // 格式化为 YYYY-MM-DD
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (dataMap.has(dateStr)) {
        // 有数据，根据query参数决定返回温度还是湿度
        const data = dataMap.get(dateStr);

        // 如果query参数不明确，返回所有数据
        result.push({
          recordTime: dateStr,
          temperature: data.temperature,
          humidity: data.humidity
        });
      } else {
        // 没有数据，返回0
        result.push({
          recordTime: dateStr,
          temperature: 0,
          humidity: 0
        });
      }

      // 移动到下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  } catch (error) {
    console.error('查询传感器数据失败:', error);
    throw error;
  }
};

export const queryTableData = async (param: QueryTableParams): Promise<QueryTableResult> => {
  try {
    const { code, startDate, endDate, sensor, pageSize, pageNum } = param;

    // 验证参数
    if (!code || !startDate || !endDate) {
      throw new Error('缺少必要参数：code, startDate, endDate');
    }

    // 验证分页参数
    const validPageSize = Math.max(1, Math.floor(pageSize || 15));
    const validPageNum = Math.max(1, Math.floor(pageNum || 1));
    const offset = (validPageNum - 1) * validPageSize;

    const sensorType = sensor === 1 ? '环境传感器' : '包芯传感器';

    // 查询总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM tdwd_scg_fqua_tempwet_collect 
       WHERE location = ?
         AND remark = ?
         AND baseorgname LIKE '徐州%'
         AND DATE(COALESCE(NULLIF(recorddate, ''), recordtime)) >= ?
         AND DATE(COALESCE(NULLIF(recorddate, ''), recordtime)) <= ?`,
      [code, sensorType, startDate, endDate]
    );

    const total = Array.isArray(countRows) && countRows.length > 0 
      ? (countRows[0] as any).total 
      : 0;

    // 查询分页数据
    // 注意：LIMIT 和 OFFSET 不能使用占位符，需要直接拼接（已确保是整数，避免 SQL 注入）
    const [rows] = await pool.execute(
      `SELECT 
         DATE(COALESCE(NULLIF(recorddate, ''), recordtime)) as date,
         TIME(recordtime) as time,
         temperature,
         humidity,
         voltage,
         cjqbh
       FROM tdwd_scg_fqua_tempwet_collect 
       WHERE location = ?
         AND remark = ?
         AND baseorgname LIKE '徐州%'
         AND DATE(COALESCE(NULLIF(recorddate, ''), recordtime)) >= ?
         AND DATE(COALESCE(NULLIF(recorddate, ''), recordtime)) <= ?
       ORDER BY recordtime ASC
       LIMIT ${validPageSize} OFFSET ${offset}`,
      [code, sensorType, startDate, endDate]
    );

    // 转换数据格式
    const data: TableRow[] = [];
    if (Array.isArray(rows)) {
      for (const row of rows as any[]) {
        // 处理日期格式
        let dateStr = row.date;
        if (dateStr instanceof Date) {
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else if (typeof dateStr === 'string' && dateStr.includes(' ')) {
          dateStr = dateStr.split(' ')[0];
        }

        // 处理时间格式
        let timeStr = row.time;
        if (timeStr instanceof Date) {
          const hours = String(timeStr.getHours()).padStart(2, '0');
          const minutes = String(timeStr.getMinutes()).padStart(2, '0');
          const seconds = String(timeStr.getSeconds()).padStart(2, '0');
          timeStr = `${hours}:${minutes}:${seconds}`;
        } else if (typeof timeStr === 'string' && timeStr.includes('.')) {
          // 如果时间包含毫秒，只取时分秒部分
          timeStr = timeStr.split('.')[0];
        }

        data.push({
          date: dateStr,
          time: timeStr || '',
          temperature: row.temperature ? Number(Number(row.temperature).toFixed(2)) : 0,
          humidity: row.humidity ? Number(Number(row.humidity).toFixed(2)) : 0,
          voltage: row.voltage != null ? Number(Number(row.voltage).toFixed(2)) : 0,
          cjqbh: row.cjqbh || ''
        });
      }
    }

    // 计算总页数
    const totalPage = Math.ceil(Number(total) / validPageSize);

    return {
      data,
      total: Number(total),
      totalPage,
      pageSize: validPageSize,
      pageNum: validPageNum
    };
  } catch (error) {
    console.error('查询表格数据失败:', error);
    throw error;
  }
}

/**
 * 根据warehouse-floor前缀查询所有location的最新数据
 * @param warehouseFloorPrefix 例如 "1号楼-2层"
 * @returns 以location为key的温湿度数据对象
 */
export const getLatestReadingsByWarehouseFloor = async (warehouseFloorPrefix: string): Promise<SensorPushResult> => {
  try {
    const searchPattern = `${warehouseFloorPrefix}%`;
    console.log(`[查询] 查询前缀: ${searchPattern}`);
    
    // 先查询一下有哪些location匹配该前缀（用于调试）
    const [testRows] = await pool.execute(
      `SELECT DISTINCT location 
       FROM tdwd_scg_fqua_tempwet_collect 
       WHERE location LIKE ? AND baseorgname LIKE '徐州%'
       ORDER BY location
       LIMIT 20`,
      [searchPattern]
    );
    console.log(`[查询] 匹配的location数量: ${Array.isArray(testRows) ? testRows.length : 0}`);
    if (Array.isArray(testRows) && testRows.length > 0) {
      console.log(`[查询] 匹配的location示例:`, (testRows as any[]).slice(0, 5).map((r: any) => r.location));
    }
    
    // 查询所有以warehouseFloorPrefix开头的location的最新数据
    // 步骤1: 先筛选 location LIKE '楼号-楼层%' 的所有记录
    // 步骤2: 对每个不同的 location，找到该 location 的最新一条数据（按 recordtime DESC）
    // 使用子查询 + INNER JOIN 确保每个 location 只返回一条最新记录
    const [rows] = await pool.execute(
      /*sql*/`SELECT t1.location, t1.temperature, t1.humidity, t1.recordtime, t1.remark, t1.temppass, t1.thpass
       FROM tdwd_scg_fqua_tempwet_collect t1
       INNER JOIN (
         SELECT location, MAX(recordtime) as max_recordtime
         FROM tdwd_scg_fqua_tempwet_collect
         WHERE location LIKE ? AND baseorgname LIKE '徐州%'
         GROUP BY location
       ) t2 ON t1.location = t2.location AND t1.recordtime = t2.max_recordtime
       WHERE t1.baseorgname LIKE '徐州%'
       ORDER BY t1.location`,
      [searchPattern]
    );

    console.log(`[查询] 查询到 ${Array.isArray(rows) ? rows.length : 0} 条记录`);

    const result: SensorPushResult = {};
    
    if (Array.isArray(rows)) {
      for (const row of rows as any[]) {
        const location = row.location;
        if (!location) {
          console.warn('[查询] 发现空location，跳过');
          continue;
        }
        
        // 判断传感器类型：remark为"环境传感器"则为1，否则为2
        const remark: 1 | 2 = row.remark === '环境传感器' ? 1 : 2;
        
        // 格式化记录时间
        let dataStr = '';
        if (row.recordtime) {
          const recordTime = row.recordtime instanceof Date 
            ? row.recordtime 
            : new Date(row.recordtime);
          dataStr = recordTime.toISOString();
        }

        result[location] = {
          temperature: row.temperature != null ? Number(Number(row.temperature).toFixed(2)) : 0,
          humidity: row.humidity != null ? Number(Number(row.humidity).toFixed(2)) : 0,
          data: dataStr,
          remark,
          temppass: row.temppass === 'N' ? false : true,
          thpass: row.thpass === 'N' ? false : true
        };
      }
    }

    console.log(`[查询] 返回 ${Object.keys(result).length} 个货位的数据`);
    console.log(`[查询] 货位列表:`, Object.keys(result));

    return result;
  } catch (error) {
    console.error('查询楼层最新数据失败:', error);
    throw error;
  }
}

/**
 * 查询多个仓库的状态（所有楼层所有货位的temppass和thpass）
 * @param warehouses 仓库号数组，例如 ["01", "02", "03"]
 * @returns 以仓库号为key的状态对象
 */
export const getWarehouseStatus = async (warehouses: string[]): Promise<WarehousePushResult> => {
  try {
    
    const result: WarehousePushResult = {};
    
    // 对每个仓库进行查询
    for (const warehouse of warehouses) {
      const warehousePrefix = `${warehouse}%`;
      
      // 查询该仓库所有location的最新数据
      // 对于每个location，获取最新的temppass和thpass
      const [rows] = await pool.execute(
        `SELECT t1.location, t1.temppass, t1.thpass, t1.recordtime
         FROM tdwd_scg_fqua_tempwet_collect t1
         INNER JOIN (
           SELECT location, MAX(recordtime) as max_recordtime
           FROM tdwd_scg_fqua_tempwet_collect
           WHERE location LIKE ? AND baseorgname LIKE '徐州%'
           GROUP BY location
         ) t2 ON t1.location = t2.location AND t1.recordtime = t2.max_recordtime
         WHERE t1.baseorgname LIKE '徐州%'`,
        [warehousePrefix]
      );

      // 统计该仓库的状态
      let allTempPass = true;
      let allThPass = true;
      let hasData = false;
      let maxRecordTime: Date | null = null;

      if (Array.isArray(rows)) {
        for (const row of rows as any[]) {
          hasData = true;
          // 如果任何一个货位的temppass为'N'，则该仓库温度不正常
          if (row.temppass === 'N') {
            allTempPass = false;
          }
          // 如果任何一个货位的thpass为'N'，则该仓库湿度不正常
          if (row.thpass === 'N') {
            allThPass = false;
          }
          
          // 记录最新的时间
          if (row.recordtime) {
            const recordTime = row.recordtime instanceof Date 
              ? row.recordtime 
              : new Date(row.recordtime);
            if (!maxRecordTime || recordTime > maxRecordTime) {
              maxRecordTime = recordTime;
            }
          }
        }
      }

      // 格式化时间
      let dataStr = '';
      if (maxRecordTime) {
        dataStr = maxRecordTime.toISOString();
      }

      // 如果没有数据，默认状态为正常
      result[warehouse] = {
        temppass: hasData ? allTempPass : true,
        thpass: hasData ? allThPass : true,
        data: dataStr
      };
    }

    console.log(`[查询] 返回 ${Object.keys(result).length} 个仓库的状态`);
    console.log(`[查询] 仓库状态:`, result);

    return result;
  } catch (error) {
    console.error('查询仓库状态失败:', error);
    throw error;
  }
}