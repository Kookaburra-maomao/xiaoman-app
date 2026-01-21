import { Plan, PlanKeepTime } from '@/types/plan';

// 获取周一的日期
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 周一
  return new Date(d.setDate(diff));
};

// 获取周日的日期
const getWeekEnd = (date: Date): Date => {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
};

// 格式化日期为 MM月DD日（用于显示）
const formatDateShort = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

// 格式化日期为 YYYY年MM月DD日（用于排序和比较）
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

// 格式化日期为 YYYY年MM月
const formatDateMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}年${month}月`;
};

// 格式化日期为 YYYY年
const formatDateYear = (date: Date): string => {
  const year = date.getFullYear();
  return `${year}年`;
};

// 计算当前周期的完成次数（用于plan.tsx）
export const calculateFinishTimes = (plan: Plan): number => {
  if (plan.cycle === 'no') {
    return 0;
  }

  const now = new Date();
  let startDate: Date;

  switch (plan.cycle) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate = getWeekStart(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      return 0;
  }

  return plan.records.filter((record) => {
    const recordDate = new Date(record.gmt_create);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate >= startDate;
  }).length;
};

// 计算完成目标的周期数（用于plan-manage.tsx）
export const calculateFinishTimesForHistory = (plan: Plan): number => {
  if (plan.cycle === 'no' || !plan.records || plan.records.length === 0) {
    return 0;
  }

  // 生成 planKeepTimes 数组
  const planKeepTimes: PlanKeepTime[] = [];
  const keepTimesMap = new Map<string, number>();

  plan.records.forEach((record) => {
    const recordDate = new Date(record.gmt_create);
    let key: string;

    switch (plan.cycle) {
      case 'day':
        key = formatDate(recordDate);
        break;
      case 'week': {
        const weekStart = getWeekStart(recordDate);
        const weekEnd = getWeekEnd(recordDate);
        key = `${formatDate(weekStart)}~${formatDate(weekEnd)}`;
        break;
      }
      case 'month':
        key = formatDateMonth(recordDate);
        break;
      case 'year':
        key = formatDateYear(recordDate);
        break;
      default:
        return;
    }

    const currentTimes = keepTimesMap.get(key) || 0;
    keepTimesMap.set(key, currentTimes + 1);
  });

  // 转换为数组
  keepTimesMap.forEach((times, key) => {
    planKeepTimes.push({ key, times });
  });

  // 计算完成目标的周期数
  let finishTimes = 0;
  planKeepTimes.forEach((item) => {
    if (item.times >= plan.times) {
      finishTimes += 1;
    }
  });

  return finishTimes;
};

// 计算坚持时间和次数（用于plan.tsx）
export const calculateKeepTimes = (plan: Plan): { keepTimes: number; totalTimes: number } => {
  if (plan.cycle === 'no') {
    return { keepTimes: 0, totalTimes: plan.records.length };
  }

  const planKeepTimes: PlanKeepTime[] = [];
  const now = new Date();

  plan.records.forEach((record) => {
    const recordDate = new Date(record.gmt_create);
    let key: string;

    switch (plan.cycle) {
      case 'day':
        key = formatDate(recordDate);
        break;
      case 'week':
        key = formatDate(getWeekStart(recordDate));
        break;
      case 'month':
        key = formatDate(new Date(recordDate.getFullYear(), recordDate.getMonth(), 1));
        break;
      case 'year':
        key = formatDate(new Date(recordDate.getFullYear(), 0, 1));
        break;
      default:
        key = '';
    }

    const existing = planKeepTimes.find((item) => item.key === key);
    if (existing) {
      existing.times += 1;
    } else {
      planKeepTimes.push({ key, times: 1 });
    }
  });

  return {
    keepTimes: planKeepTimes.length,
    totalTimes: plan.records.length,
  };
};

// 获取详细的完成记录列表
export const getPlanKeepTimesList = (plan: Plan): PlanKeepTime[] => {
  if (plan.cycle === 'no' || !plan.records || plan.records.length === 0) {
    return [];
  }

  // 生成 planKeepTimes 数组
  const planKeepTimes: PlanKeepTime[] = [];
  const keepTimesMap = new Map<string, number>();

  plan.records.forEach((record) => {
    const recordDate = new Date(record.gmt_create);
    let key: string;

    switch (plan.cycle) {
      case 'day':
        key = formatDateShort(recordDate);
        break;
      case 'week': {
        const weekStart = getWeekStart(recordDate);
        const weekEnd = getWeekEnd(recordDate);
        key = `${formatDateShort(weekStart)}-${formatDateShort(weekEnd)}`;
        break;
      }
      case 'month':
        key = formatDateMonth(recordDate);
        break;
      case 'year':
        key = formatDateYear(recordDate);
        break;
      default:
        return;
    }

    const currentTimes = keepTimesMap.get(key) || 0;
    keepTimesMap.set(key, currentTimes + 1);
  });

  // 转换为数组并按时间排序（最新的在前）
  keepTimesMap.forEach((times, key) => {
    planKeepTimes.push({ key, times });
  });

  // 按 key 排序（日期字符串可以直接比较）
  planKeepTimes.sort((a, b) => {
    // 提取日期部分进行比较（处理周的范围格式）
    const dateA = a.key.split('-')[0] || a.key.split('~')[0] || a.key;
    const dateB = b.key.split('-')[0] || b.key.split('~')[0] || b.key;
    // 转换为可比较的格式（提取月份和日期）
    const parseDate = (str: string) => {
      const match = str.match(/(\d+)月(\d+)日/);
      if (match) {
        const month = parseInt(match[1]);
        const day = parseInt(match[2]);
        return month * 100 + day;
      }
      // 处理年月格式
      const yearMatch = str.match(/(\d+)年(\d+)月/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const month = parseInt(yearMatch[2]);
        return year * 10000 + month * 100;
      }
      // 处理年份格式
      const yearOnlyMatch = str.match(/(\d+)年/);
      if (yearOnlyMatch) {
        return parseInt(yearOnlyMatch[1]) * 10000;
      }
      return 0;
    };
    return parseDate(dateB) - parseDate(dateA); // 降序，最新的在前
  });

  return planKeepTimes;
};

