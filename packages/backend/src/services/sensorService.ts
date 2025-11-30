import { pool } from '../config/db';
import { SensorReading } from '../models/SensorReading';
import { QuerySensorParams, QuerySensorResult, QueryTableParams, QueryTableResult, TableRow } from '../types';

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