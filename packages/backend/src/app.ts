/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-29 21:56:54
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-12-02 14:12:42
 * @FilePath: /factory-visualization/packages/backend/src/app.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import sensorRoutes from './routes/sensorRoutes';
import { testDbConnection } from './config/db';

export * from './types';

// 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 3500;

// 允许跨域
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // 允许的源列表（开发环境）
    const allowedOrigins = [
      'http://localhost:3200',  // 前端开发服务器
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3200',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];
    
    // 开发环境：允许所有本地源，或者允许没有origin的请求（如Postman、curl等）
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // 临时允许所有，生产环境应改为 callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
// 解析JSON请求
app.use(express.json());

// 注册路由
app.use('/api/sensors', sensorRoutes);

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: '正常', time: new Date().toLocaleString() });
});

// 创建HTTP服务器
const httpServer = http.createServer(app);

// 启动服务，监听0.0.0.0以允许局域网访问
httpServer.listen(Number(port), '0.0.0.0', async () => {
  console.log(`🚀 HTTP服务器启动成功：http://0.0.0.0:${port}`);
  console.log(`   局域网访问地址：http://<本机IP>:${port}`);
  await testDbConnection(); // 测试数据库连接
});