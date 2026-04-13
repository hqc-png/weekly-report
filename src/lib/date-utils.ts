import {
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  endOfDay,
} from "date-fns";

/**
 * Get the current week's date range (Monday to Sunday)
 */
export function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

  return {
    start: startOfDay(start).toISOString(),
    end: endOfDay(end).toISOString(),
  };
}

/**
 * Format a date range for display
 */
export function formatDateRange(start: string, end: string): string {
  const startDate = parseISO(start);
  const endDate = parseISO(end);

  return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
}

/**
 * Get week number from date (ISO week)
 */
export function getWeekNumber(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

  return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
}
