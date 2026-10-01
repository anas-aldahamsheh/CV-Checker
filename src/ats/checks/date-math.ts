import type { ResumeRole, TimelineGap } from "@/ats/contracts/analysis";

const monthMap: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9,
  october: 9, nov: 10, november: 10, dec: 11, december: 11
};

export function parseResumeDate(value: string | null, now = new Date()): Date | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (/^(present|current|now|حتى الآن|الحالي)$/.test(trimmed)) {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const iso = trimmed.match(/^(\d{4})[-/](\d{1,2})$/);
  if (iso) {
    const month = Number(iso[2]);
    return month >= 1 && month <= 12 ? new Date(Number(iso[1]), month - 1, 1) : null;
  }
  const year = trimmed.match(/^\d{4}$/);
  if (year) return new Date(Number(year[0]), 0, 1);
  const named = trimmed.match(/^([a-z]+)\s+(\d{4})$/);
  if (named && monthMap[named[1]] !== undefined) {
    return new Date(Number(named[2]), monthMap[named[1]], 1);
  }
  return null;
}

export function totalRoleMonths(roles: ResumeRole[], now = new Date()): number | null {
  const ranges = roles
    .map((role) => {
      const start = parseResumeDate(role.startDate, now);
      const end = parseResumeDate(role.endDate, now);
      if (!start || !end || end < start) return null;
      return [start.getFullYear() * 12 + start.getMonth(), end.getFullYear() * 12 + end.getMonth() + 1] as const;
    })
    .filter((range): range is readonly [number, number] => range !== null)
    .sort((a, b) => a[0] - b[0]);

  if (!ranges.length) return null;
  const merged: Array<[number, number]> = [];
  for (const [start, end] of ranges) {
    const last = merged.at(-1);
    if (!last || start > last[1]) merged.push([start, end]);
    else last[1] = Math.max(last[1], end);
  }
  return merged.reduce((total, [start, end]) => total + end - start, 0);
}

export function detectEmploymentGaps(roles: ResumeRole[], thresholdMonths = 6, now = new Date()): TimelineGap[] {
  if (roles.length < 2) return [];

  const parsed = roles
    .map((role) => ({
      title: role.title,
      company: role.company,
      start: parseResumeDate(role.startDate, now),
      end: parseResumeDate(role.endDate, now),
      origEnd: role.endDate,
      origStart: role.startDate,
    }))
    .filter((r) => r.start && r.end)
    .sort((a, b) => a.start!.getTime() - b.start!.getTime());

  if (parsed.length < 2) return [];

  const gaps: TimelineGap[] = [];
  for (let i = 0; i < parsed.length - 1; i++) {
    const currentEnd = parsed[i].end!;
    const nextStart = parsed[i + 1].start!;
    const diffMonths = (nextStart.getFullYear() - currentEnd.getFullYear()) * 12 + (nextStart.getMonth() - currentEnd.getMonth());
    if (diffMonths > thresholdMonths) {
      gaps.push({
        start: parsed[i].origEnd || `${currentEnd.getFullYear()}-${currentEnd.getMonth() + 1}`,
        end: parsed[i + 1].origStart || `${nextStart.getFullYear()}-${nextStart.getMonth() + 1}`,
        months: diffMonths,
      });
    }
  }
  return gaps;
}

export function checkReverseChronologicalOrder(roles: ResumeRole[], now = new Date()): { isChronological: boolean; issue?: string } {
  if (roles.length < 2) return { isChronological: true };
  const dates = roles.map((r) => parseResumeDate(r.startDate, now));

  for (let i = 0; i < dates.length - 1; i++) {
    const current = dates[i];
    const next = dates[i + 1];
    if (current && next && current.getTime() < next.getTime()) {
      return {
        isChronological: false,
        issue: `"${roles[i + 1].title}" (${roles[i + 1].startDate}) appears after "${roles[i].title}" (${roles[i].startDate}). In standard ATS format, your most recent role should be first.`,
      };
    }
  }
  return { isChronological: true };
}
