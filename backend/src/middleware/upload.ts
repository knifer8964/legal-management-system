// 公司法务智慧管理系统 - 文件上传中间件
// 功能: multer 配置、文件类型过滤、大小限制

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';
import { Errors } from './errorHandler';

// 允许的文件类型
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
  ],
  archive: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ],
};

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_MIME_TYPES.document,
  ...ALLOWED_MIME_TYPES.image,
  ...ALLOWED_MIME_TYPES.archive,
];

// 文件大小限制
const FILE_SIZE_LIMITS = {
  document: 50 * 1024 * 1024,  // 50MB
  image: 10 * 1024 * 1024,     // 10MB
  avatar: 2 * 1024 * 1024,     // 2MB
  default: 20 * 1024 * 1024,   // 20MB
};

// 存储配置
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    // 生成唯一文件名: 时间戳-随机hash-原始名
    const ext = path.extname(file.originalname);
    const hash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    cb(null, `${timestamp}-${hash}${ext}`);
  },
});

// 文件类型过滤
function fileFilter(allowedTypes: string[]) {
  return (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  };
}

// ===== 预配置的上传中间件 =====

// 文档上传（合同、法律文书等）
export const uploadDocument = multer({
  storage,
  fileFilter: fileFilter(ALLOWED_MIME_TYPES.document),
  limits: {
    fileSize: FILE_SIZE_LIMITS.document,
    files: 5,  // 最多5个文件
  },
});

// 图片上传
export const uploadImage = multer({
  storage,
  fileFilter: fileFilter(ALLOWED_MIME_TYPES.image),
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 10,
  },
});

// 头像上传
export const uploadAvatar = multer({
  storage,
  fileFilter: fileFilter(ALLOWED_MIME_TYPES.image),
  limits: {
    fileSize: FILE_SIZE_LIMITS.avatar,
    files: 1,
  },
});

// 通用上传（所有允许类型）
export const uploadGeneral = multer({
  storage,
  fileFilter: fileFilter(ALL_ALLOWED_TYPES),
  limits: {
    fileSize: FILE_SIZE_LIMITS.default,
    files: 10,
  },
});

// 知识库文档上传（含压缩包）
export const uploadKnowledgeDoc = multer({
  storage,
  fileFilter: fileFilter([
    ...ALLOWED_MIME_TYPES.document,
    ...ALLOWED_MIME_TYPES.archive,
    ...ALLOWED_MIME_TYPES.image,
  ]),
  limits: {
    fileSize: FILE_SIZE_LIMITS.document,
    files: 20,
  },
});

// Multer 错误处理中间件（需放在路由之后、全局错误之前）
export function handleMulterError(err: any, _req: Request, _res: any, next: any) {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return next(Errors.badRequest('文件大小超过限制'));
      case 'LIMIT_FILE_COUNT':
        return next(Errors.badRequest('文件数量超过限制'));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(Errors.badRequest('上传字段名不正确'));
      default:
        return next(Errors.badRequest(`上传错误: ${err.message}`));
    }
  }

  if (err.message?.includes('不支持的文件类型')) {
    return next(Errors.badRequest(err.message));
  }

  next(err);
}
