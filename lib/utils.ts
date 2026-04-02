export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return "hace " + mins + " min";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return "hace " + hrs + "h";
  return "hace " + Math.floor(hrs / 24) + "d";
}
