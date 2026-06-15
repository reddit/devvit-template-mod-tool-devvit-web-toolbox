export function getIsoWeekKey(date: Date): string {
  // Convert to UTC midnight date to avoid local timezone drift.
  const utcDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  // ISO week algorithm: shift to nearest Thursday.
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );

  // Example format: 2026-W18
  return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
