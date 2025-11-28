/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-16 00:57:27
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-11-24 17:27:36
 * @FilePath: /sensor-backend/src/routes/sensorRoutes.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import express from 'express';
import { getLatestXuzhouReading, getRecentXuzhouReadings, getConfiguration, querySensorData } from '../services/sensorService';

const router = express.Router();

// 获取徐州地区最新数据
router.get('/xuzhou/latest', async (req, res) => {
  try {
    const data = await getLatestXuzhouReading();
    data ? res.json(data) : res.status(404).json({ message: '无徐州地区数据' });
  } catch (error) {
    res.status(500).json({ message: '获取数据失败', error: (error as Error).message });
  }
});

// 获取徐州地区最近N条数据
router.get('/xuzhou/recent', async (req, res) => {
  try {
    const count = req.query.count ? parseInt(req.query.count as string) : 100;
    if (isNaN(count) || count <= 0) {
      return res.status(400).json({ message: 'count必须是正整数' });
    }
    const data = await getRecentXuzhouReadings(count);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: '获取数据失败', error: (error as Error).message });
  }
});

/**
 * @route   GET /api/sensors/query
 * @desc    查询传感器数据
 * @query   warehouse - 楼号（如 "2"）
 * @query   floor - 楼层索引（0开始）
 * @query   direction - 方向编码（"01" 或 "02"）
 * @query   location - 货位号（如 "13"）
 * @query   startDate - 起始日期（可选，YYYY-MM-DD）
 * @query   endDate - 结束日期（可选，YYYY-MM-DD）
 * @query   queryType - 查询类型（可选，"temperature" 或 "humidity"，默认 "temperature"）
 */
router.get('/query', async (req, res) => {
  try {
    const { warehouse, floor, direction, location, startDate, endDate, queryType } = req.query;

    // 验证必填参数
    if (!warehouse || !direction || !location) {
      return res.status(400).json({ message: '楼号、方向编码、货位号为必填参数' });
    }

    // 验证floor是否为数字
    const floorIndex = floor ? parseInt(floor as string) : 0;
    if (isNaN(floorIndex) || floorIndex < 0) {
      return res.status(400).json({ message: '楼层索引必须为非负整数' });
    }

    // 验证direction格式
    if (direction !== '01' && direction !== '02') {
      return res.status(400).json({ message: '方向编码必须为 "01" 或 "02"' });
    }

    // 验证日期格式（可选）
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && (typeof startDate !== 'string' || !dateRegex.test(startDate))) {
      return res.status(400).json({ message: '起始日期格式错误，应为 YYYY-MM-DD' });
    }
    if (endDate && (typeof endDate !== 'string' || !dateRegex.test(endDate))) {
      return res.status(400).json({ message: '结束日期格式错误，应为 YYYY-MM-DD' });
    }

    // 验证queryType
    const validQueryType = queryType === 'humidity' ? 'humidity' : 'temperature';

    // 调用服务层方法
    const results = await querySensorData(
      warehouse as string,
      floorIndex,
      direction as string,
      location as string,
      startDate as string | undefined,
      endDate as string | undefined,
      validQueryType
    );

    // 返回数据，即使为空也不返回404，让前端处理
    res.json(results);
  } catch (error) {
    console.error('查询传感器数据失败:', error);
    res.status(500).json({ message: '查询失败', error: (error as Error).message });
  }
});

router.get('/configuration', async (req, res) => {
  try {
    const results = await getConfiguration();
    res.json(results);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

export default router;