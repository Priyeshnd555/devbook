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
 * @returns A string like "Today", "Yesterday", "5 days ago (Wed)", etc.
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
  
  // Get weekday name (e.g., "Monday", "Tue")
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    // e.g., "3 days ago (Wed)"
    return `${diffDays} days ago (${weekday})`;
  } else if (diffDays < 14) {
    // e.g., "Last Tue" or "9 days ago (Tue)" - clarity is key
    return `Last ${date.toLocaleDateString(undefined, { weekday: 'long' })}`;
  } else if (diffDays < 30) {
    // Keep it vague for older stuff, or revert to "3 weeks ago"
    return `${Math.floor(diffDays / 7)} weeks ago`;
  } else {
    // Fallback for older dates (or implement months if needed)
    return formatFullDate(dateStr);
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
