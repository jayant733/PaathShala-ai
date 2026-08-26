/** Format a datetime as human-readable relative time ("3 days ago", "in 5 days", "Just now") */
export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Color class for a mastery value 0..1 */
export function masteryColor(mastery: number): { text: string; bg: string; bar: string; badgeBg: string } {
  if (mastery >= 0.7) {
    return {
      text: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      bar: 'bg-emerald-500',
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
  }
  if (mastery >= 0.4) {
    return {
      text: 'text-amber-500',
      bg: 'bg-amber-500/10',
      bar: 'bg-amber-500',
      badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
  }
  return {
    text: 'text-rose-500',
    bg: 'bg-rose-500/10',
    bar: 'bg-rose-500',
    badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };
}

/** Format a decimal as a percentage string ("74%") */
export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Returns 'overdue', 'today', 'this_week', or 'later' for a due_date */
export function reviewUrgency(dueDateStr: string): 'overdue' | 'today' | 'this_week' | 'later' {
  const due = new Date(dueDateStr);
  const now = new Date();
  
  // Set both to start of day for comparison
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.ceil((dueDay - todayDay) / (1000 * 3600 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 7) return 'this_week';
  return 'later';
}

/** SM-2 ease factor descriptive label */
export function easeFactorLabel(ef: number): string {
  if (ef < 1.5) return 'Very Hard';
  if (ef < 2.0) return 'Hard';
  if (ef < 2.5) return 'Normal';
  if (ef < 3.0) return 'Easy';
  return 'Very Easy';
}
