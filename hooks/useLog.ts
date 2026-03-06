/**
 * 日志打点 Hook
 */

import { LOG_POSITIONS, logByPosition } from '@/services/logService';
import { useAuth } from './useAuth';

export const useLog = () => {
  const { user } = useAuth();

  const log = (
    positionKey: keyof typeof LOG_POSITIONS,
    extraInfo?: Record<string, any>
  ) => {
    if (user?.id) {
      logByPosition(positionKey, user.id, extraInfo);
    }
  };

  return { log };
};
