export interface RecentlyPlayedEntry {
  id: string;
  playedAt: number;
  progress?: number;
}

const STORAGE_KEY = "funzone_recent_games";
const MAX_RECENTLY_PLAYED = 5;

export const getRecentlyPlayed = (): RecentlyPlayedEntry[] => {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const entries = JSON.parse(raw) as RecentlyPlayedEntry[];
    if (!Array.isArray(entries)) return [];

    return entries
      .filter(
        (entry): entry is RecentlyPlayedEntry =>
          entry &&
          typeof entry.id === "string" &&
          typeof entry.playedAt === "number" &&
          (entry.progress === undefined || typeof entry.progress === "number"),
      )
      .sort((a, b) => b.playedAt - a.playedAt)
      .slice(0, MAX_RECENTLY_PLAYED);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

export const saveRecentlyPlayed = (game: {
  id: string;
  playedAt?: number;
  progress?: number;
}) => {
  if (typeof window === "undefined") return [];

  const now = game.playedAt ?? Date.now();
  const current = getRecentlyPlayed();
  const next = [
    { id: game.id, playedAt: now, progress: game.progress },
    ...current.filter((entry) => entry.id !== game.id),
  ].slice(0, MAX_RECENTLY_PLAYED);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  try {
    // Notify other parts of the app that recently played list changed
    window.dispatchEvent(new CustomEvent("wf:recently-played-updated", { detail: next }));
  } catch {
    // ignore if dispatch fails in non-browser environments
  }
  return next;
};
