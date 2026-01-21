/**
 * 日期工具函数
 */

// 获取当前日期所在周的周一
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 调整为周一
  return new Date(d.setDate(diff));
};

// 获取当前日期所在月的1号
export const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// 获取当前日期所在年的1月1日
export const getYearStart = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1);
};

// 格式化日期为 YYYYMMDD
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// 格式化日期为 YYYY年MM月DD日
export const formatDateFull = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

// 格式化日期显示（用于创建计划）
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
};

// 获取某年某月的天数
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

// 生成年份数组（当前年份到未来10年）
export const generateYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = 0; i <= 10; i++) {
    years.push(currentYear + i);
  }
  return years;
};

// 生成月份数组（1-12）
export const generateMonths = (): number[] => {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
};

// 生成日期数组
export const generateDays = (year: number, month: number): number[] => {
  const daysCount = getDaysInMonth(year, month);
  const days: number[] = [];
  for (let i = 1; i <= daysCount; i++) {
    days.push(i);
  }
  return days;
};

