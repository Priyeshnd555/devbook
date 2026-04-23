// =================================================================================================
// CONTEXT ANCHOR: DATE UTILITIES
// =================================================================================================
// PURPOSE: Provides utility functions for formatting dates into human-friendly relative strings
//          (e.g., "Today", "Yesterday", "2 days ago") for better UX.
// DEPENDENCIES: None (Pure JS Date manipulation).
// INVARIANTS: Input date strings are expected to be in "YYYY-MM-DD" format.
// =================================================================================================

/**
 * Formats a YYYY-MM-DD date string into a relative human-readable string.
 * @param dateStr The date string to format (YYYY-MM-DD).
 * @returns A string like "Today", "Yesterday", "Friday", "9 days ago (1 week)", or "1 month, 2 weeks ago".
 */
export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const now = new Date();
  
  // Reset time components to compare strictly by calendar days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - compareDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Get full weekday name (e.g., "Friday")
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    // User request: "for this week tasks it should say the day name"
    return weekday;
  } else if (diffDays < 30) {
    // User request: "say this many days before alon with how many weeks passsed"
    const weeks = Math.floor(diffDays / 7);
    return `${diffDays} days ago (${weeks} week${weeks > 1 ? 's' : ''})`;
  } else {
    // User request: "older than a month just say this many months and weeks old"
    // Using 30.44 days per month avg or just simple 30 for loose approximation
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    const weeks = Math.floor(remainingDays / 7);
    
    let result = `${months} month${months > 1 ? 's' : ''}`;
    if (weeks > 0) {
      result += `, ${weeks} week${weeks > 1 ? 's' : ''}`;
    }
    return result + " ago";
  }
}

/**
 * Formats a YYYY-MM-DD date string into a standard locale date string.
 * @param dateStr The date string to format.
 * @returns Localized date string (e.g., "Oct 12, 2023").
 */
export function formatFullDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
/**
 * Calculates the ISO week number for a given date.
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Returns an array of date objects for a week (Monday to Sunday) based on a week offset.
 * @param weekOffset Number of weeks away from current week (0 = current, 1 = next week, -1 = last week)
 */
export function getWeekDates(weekOffset: number = 0): { name: string, date: string, day: string, month: string, year: number, weekNumber: number }[] {
  const current = new Date();
  current.setDate(current.getDate() + (weekOffset * 7));
  
  const day = current.getDay();
  const monday = new Date(current);
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);

  const week = [];
  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    week.push({
      name: dayNames[i],
      day: nextDay.toLocaleDateString(undefined, { day: 'numeric' }),
      month: nextDay.toLocaleDateString(undefined, { month: 'short' }),
      year: nextDay.getFullYear(),
      date: nextDay.toISOString().split("T")[0],
      weekNumber: getWeekNumber(nextDay)
    });
  }

  return week;
}
