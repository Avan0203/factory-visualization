import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getLatestXuzhouReading } from './sensorService';

let io: SocketIOServer | null = null;

/**
 * 初始化Socket.io服务
 * @param httpServer Express HTTP服务器实例
 */
export const initWebSocketServer = (httpServer: HTTPServer) => {
  // 创建Socket.io实例，挂载到HTTP服务器
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // 允许所有来源（生产环境建议配置具体域名）
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'] // 支持WebSocket和轮询
  });

  // 客户端连接时
  io.on('connection', (socket: Socket) => {
    console.log('新客户端连接Socket.io:', socket.id);
    
    // 给新连接的客户端发送当前最新数据
    sendLatestData(socket);

    // 接收客户端消息（可选）
    socket.on('message', (message: any) => {
      console.log(`收到客户端消息 [${socket.id}]:`, message);
    });

    // 客户端断开连接时
    socket.on('disconnect', (reason: string) => {
      console.log(`客户端断开Socket.io连接 [${socket.id}]:`, reason);
    });
  });

  console.log('✅ Socket.io服务器启动成功');
  console.log('   与HTTP服务器共用端口');
};

/**
 * 向单个客户端发送最新数据
 */
const sendLatestData = async (socket: Socket) => {
  try {
    const data = await getLatestXuzhouReading();
    if (data) {
      socket.emit('real_time_data', {
        type: 'real_time_data', // 消息类型
        data: data,             // 温湿度数据
        time: new Date().toLocaleString() // 发送时间
      });
    }
  } catch (error) {
    console.error('发送数据给客户端失败:', error);
  }
};

/**
 * 向所有连接的客户端广播最新数据
 */
export const broadcastLatestData = async () => {
  if (!io) {
    console.warn('Socket.io服务器未初始化');
    return;
  }

  try {
    const data = await getLatestXuzhouReading();
    if (data) {
      const message = {
        type: 'real_time_data',
        data: data,
        time: new Date().toLocaleString()
      };

      // 向所有连接的客户端广播
      io.emit('real_time_data', message);
    }
  } catch (error) {
    console.error('广播数据失败:', error);
  }
};
