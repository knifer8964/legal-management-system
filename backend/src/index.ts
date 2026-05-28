// 公司法务智慧管理系统 - 后端入口文件
// 创建时间: 2026-05-28
// 技术栈: Node.js + Express + TypeScript + Prisma

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import redis from 'redis';
import jwt from 'jsonwebtoken';
import winston from 'winston';
import rateLimit from 'express-rate-limit';

// 加载环境变量
dotenv.config();

// 初始化 Prisma 客户端
export const prisma = new PrismaClient();

// 初始化 Redis 客户端
export const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// 初始化 Winston 日志
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// 创建 Express 应用
const app: Express = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 限制 100 次请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API 路由（待实现）
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: '公司法务智慧管理系统 API v1.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      contracts: '/api/v1/contracts',
      cases: '/api/v1/cases',
      agents: '/api/v1/agents',
      tasks: '/api/v1/tasks'
    }
  });
});

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
async function startServer() {
  try {
    // 连接 Redis
    await redisClient.connect();
    logger.info('✅ Redis 连接成功');
    
    // 测试数据库连接
    await prisma.$connect();
    logger.info('✅ 数据库连接成功');
    
    // 启动 HTTP 服务器
    app.listen(PORT, () => {
      logger.info(`🚀 服务器启动成功`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
      });
      console.log(`✅ 公司法务智慧管理系统后端已启动`);
      console.log(`   - 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   - 端口: ${PORT}`);
      console.log(`   - API文档: http://localhost:${PORT}/api/v1`);
      console.log(`   - 健康检查: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('❌ 服务器启动失败', error);
    process.exit(1);
  }
}

// 优雅退出
process.on('SIGTERM', async () => {
  logger.info('SIGTERM 信号接收，准备关闭服务器...');
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT 信号接收，准备关闭服务器...');
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

// 启动
startServer();
