/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-16 00:57:27
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-12-21 11:13:24
 * @FilePath: /sensor-backend/src/routes/sensorRoutes.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import express from 'express';
import { querySensorData, queryTableData } from '../services/sensorService';
import { QuerySensorParams, QueryTableParams, SubscribeParams, SubscribeFloorParams, SubscribeWarehouseParams, SensorItem } from '../types';
import sseService from '../services/sseService';

const router = express.Router();

// 获取徐州地区最新数据


// 查询传感器数据
router.post('/query', async (req, res) => {
  try {
    const { startDate, endDate, items } = req.body;

    // 验证必要参数
    if (!startDate || !endDate) {
      return res.status(400).json({ message: '缺少必要参数：startDate, endDate' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: '缺少必要参数：items (必须为非空数组)' });
    }

    // 验证每个item的必要参数
    for (const item of items) {
      if (!item.code || !item.query || item.sensor === undefined) {
        return res.status(400).json({ message: '缺少必要参数：每个item必须包含 code, query, sensor' });
      }
      item.sensor = item.sensor ? +item.sensor as 1 | 2 : 1;
    }

    const data = await querySensorData({
      startDate: startDate as string,
      endDate: endDate as string,
      items: items as SensorItem[]
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: '查询数据失败', error: (error as Error).message });
  }
});

// 查询表格数据（分页）
router.get('/table', async (req, res) => {
  try {
    const { code, startDate, endDate, sensor, pageSize, pageNum } = req.query;

    if (!code || !startDate || !endDate) {
      return res.status(400).json({ message: '缺少必要参数：code, startDate, endDate' });
    }

    const params: QueryTableParams = {
      code: code as string,
      startDate: startDate as string,
      endDate: endDate as string,
      sensor: sensor ? parseInt(sensor as string) as 1 | 2 : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 15,
      pageNum: pageNum ? parseInt(pageNum as string) : 1
    };

    const data = await queryTableData(params);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: '查询表格数据失败', error: (error as Error).message });
  }
});

// 设置SSE订阅参数（POST接口）
router.post('/subscribe', async (req, res) => {
  try {
    const { type, warehouse, floor, warehouses, interval } = req.body;

    if (!type || (type !== 'warehouse' && type !== 'floor')) {
      return res.status(400).json({ message: '缺少必要参数：type (必须为 "warehouse" 或 "floor")' });
    }

    const validInterval = Math.max(1000, parseInt(interval) || 5000); // 默认5秒，最小1秒

    let subscribeParams: SubscribeParams;

    if (type === 'floor') {
      // 楼层查询
      if (!warehouse || !floor) {
        return res.status(400).json({ message: '楼层查询缺少必要参数：warehouse, floor' });
      }
      subscribeParams = {
        type: 'floor',
        warehouse: warehouse as string,
        floor: floor as string,
        interval: validInterval
      } as SubscribeFloorParams;
    } else {
      // 仓库查询
      if (!warehouses || !Array.isArray(warehouses) || warehouses.length === 0) {
        return res.status(400).json({ message: '仓库查询缺少必要参数：warehouses (必须为非空数组)' });
      }
      subscribeParams = {
        type: 'warehouse',
        warehouses: warehouses as string[],
        interval: validInterval
      } as SubscribeWarehouseParams;
    }

    const clientId = sseService.setClientConfig(subscribeParams);

    res.json({
      clientId,
      message: '订阅配置已设置',
      streamUrl: `/api/sensors/stream?clientId=${clientId}`
    });
  } catch (error) {
    res.status(500).json({ message: '设置订阅失败', error: (error as Error).message });
  }
});

// SSE数据流接口（GET接口）
router.get('/stream', async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ message: '缺少必要参数：clientId' });
    }

    const success = sseService.addClient(res, clientId as string);
    
    if (!success) {
      return res.status(404).json({ message: '客户端配置不存在，请先调用POST /api/sensors/subscribe' });
    }

    // 注意：不要在这里调用res.end()，SSE连接需要保持打开
  } catch (error) {
    console.error('SSE连接错误:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'SSE连接失败', error: (error as Error).message });
    }
  }
});

export default router;