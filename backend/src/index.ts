// 公司法务智慧管理系统 - 后端入口文件
// 创建时间: 2026-05-28
// 技术栈: Node.js + Express + TypeScript + Prisma + SQLite

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler, requestTracker, requestLogger } from './middleware';
import routes from './routes';

// 加载环境变量
dotenv.config();

// 初始化 Prisma 客户端
export const prisma = new PrismaClient();

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
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求追踪与日志
app.use(requestTracker);
app.use(requestLogger);

// 登录接口严格限流（防暴力破解）
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: '登录尝试过于频繁，请 15 分钟后再试' } },
  skipSuccessfulRequests: true,
});

// 通用限流
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  message: '请求过于频繁，请稍后再试',
});
app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/', limiter);

// 健康检查
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API 路由
app.use('/api/v1', routes);

// 404 + 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    await prisma.$connect();
    logger.info('✅ 数据库连接成功 (SQLite)');
    
    // 启动 HTTP 服务器
    app.listen(PORT, () => {
      logger.info('🚀 服务器启动成功', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
      });
      console.log('✅ 公司法务智慧管理系统后端已启动');
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
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} 信号接收，准备关闭服务器...`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 启动
startServer();
