/**
 * 计划数据刷新事件管理
 */

type PlanRefreshCallback = () => void;

// 存储所有监听器的数组
const listeners: PlanRefreshCallback[] = [];

/**
 * 触发计划数据刷新事件
 */
export const emitPlanRefresh = () => {
  // 调用所有注册的监听器
  listeners.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      console.error('计划刷新事件回调执行失败:', error);
    }
  });
};

/**
 * 监听计划数据刷新事件
 * @param callback 刷新回调函数
 * @returns 取消监听的函数
 */
export const onPlanRefresh = (callback: PlanRefreshCallback): (() => void) => {
  // 将回调添加到监听器数组
  listeners.push(callback);
  
  // 返回取消监听的函数
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};
