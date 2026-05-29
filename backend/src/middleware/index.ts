// 公司法务智慧管理系统 - 中间件统一导出
// 功能: 集中管理所有中间件，方便路由引用

export { authenticateToken, checkPermission, optionalAuth } from './authMiddleware';
export { AppError, Errors, errorHandler, notFoundHandler } from './errorHandler';
export { validate, commonSchemas, authSchemas, contractSchemas, caseSchemas, agentSchemas, knowledgeBaseSchemas, orderSchemas } from './validation';
export { requestTracker, requestLogger, requestBodyLogger } from './requestLogger';
export { uploadDocument, uploadImage, uploadAvatar, uploadGeneral, uploadKnowledgeDoc, handleMulterError } from './upload';
