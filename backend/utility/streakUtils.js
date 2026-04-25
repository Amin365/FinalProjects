/**
 * Calculates the longest consecutive reading streak from an array of dates.
 * @param {Date[]|string[]} dates
 * @returns {number} longest streak in days
 */
export function calcLongestStreak(dates) {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)))].sort();
  let max = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    cur = diff === 1 ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return max;
}

/**
 * Calculates pages read from a single DailyReport document.
 * @param {{ pagesFrom?: number, pagesTo?: number }} report
 * @returns {number}
 */
export function calcPagesRead(report) {
  return Math.max(0, (report.pagesTo || 0) - (report.pagesFrom || 0));
}
