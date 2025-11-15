export function prettyString(input: string): string {
  if (!input) return "";
  const withSpaces = String(input)
    .replace(/[_\-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return withSpaces
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatUnixSecondsToDate(sec: number): string {
  if (!sec && sec !== 0) return "";
  const d = new Date(sec * 1000);
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit"
    }).format(d);
  } catch {
    return d.toISOString().slice(5, 10); // MM-DD
  }
}

export function formatUnixSecondsToMonthDayTime(sec: number): string {
  if (!sec && sec !== 0) return "";
  const d = new Date(sec * 1000);
  try {
    const part1 = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit"
    }).format(d);
    const part2 = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(d);
    return `${part1}, ${part2}`;
  } catch {
    return d.toISOString();
  }
}


