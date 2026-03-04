/**
 * 统一的认证 Hook
 * 现在使用 JWT 认证系统
 */

import { useJwtAuth } from '@/contexts/JwtAuthContext';

// 重新导出 JWT 认证 hook，保持接口兼容
export const useAuth = useJwtAuth;
