/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-16 00:57:27
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-11-30 01:03:51
 * @FilePath: /sensor-backend/src/routes/sensorRoutes.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import express from 'express';
import { getLatestXuzhouReading, getRecentXuzhouReadings, querySensorData } from '../services/sensorService';
import { QuerySensorParams } from '../types';

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

// 查询传感器数据
router.get('/query', async (req, res) => {
  try {
    const { code, startDate, endDate, query, sensor } = req.query;

    if (!code || !startDate || !endDate) {
      return res.status(400).json({ message: '缺少必要参数：code, startDate, endDate' });
    }

    const params: QuerySensorParams = {
      code: code as string,
      startDate: startDate as string,
      endDate: endDate as string,
      query: query as 'temperature' | 'humidity',
      sensor: sensor ? parseInt(sensor as string) as 1 | 2 : 1
    };

    const data = await querySensorData(params);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: '查询数据失败', error: (error as Error).message });
  }
});

export default router;