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
