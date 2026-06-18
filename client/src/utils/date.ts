/**
 * Date utility functions for ExpenseIQ
 */

/**
 * Formats a date into a standard format.
 * e.g., Date -> "20 May 2026"
 */
export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats a date to show time.
 * e.g., Date -> "10:30 AM"
 */
export const formatTime = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Formats a date relative to now.
 * e.g. "Today", "Yesterday", "2 days ago"
 */
export const formatRelative = (date: Date | string | number): string => {
  const d = new Date(date);
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Check if actually today or yesterday due to hour boundaries
    if (d.getDate() === now.getDate()) {
      return 'Today';
    }
    return 'Yesterday';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
};

/**
 * Returns start and end dates for the current week.
 */
export const getWeekRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const start = new Date(now.setDate(diff));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Returns start and end dates for the current month.
 */
export const getMonthRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

/**
 * Returns start and end dates for the current quarter.
 */
export const getQuarterRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
  return { start, end };
};

/**
 * Checks if a scheduled payment is overdue.
 * Due date is compared to the current date.
 */
export const isOverdue = (dueDate: Date | string | number): boolean => {
  const due = new Date(dueDate);
  const now = new Date();
  // Clear time components for pure date comparison
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return due.getTime() < now.getTime();
};

/**
 * Gets days remaining until target date
 */
export const getDaysRemaining = (targetDate: Date | string | number): number => {
  const target = new Date(targetDate);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? 0 : diffDays;
};
