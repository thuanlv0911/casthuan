export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  // Compare simple date string YYYY-MM-DD
  const formatCompare = (d: Date) => d.toISOString().split('T')[0];

  if (formatCompare(date) === formatCompare(today)) {
    return 'Hôm nay';
  } else if (formatCompare(date) === formatCompare(yesterday)) {
    return 'Hôm qua';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const getMonthYearString = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
};
