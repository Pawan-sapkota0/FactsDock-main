import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SEOMeta } from "@/components/common/SEOMeta";
import { PAGE_TEMPLATES, generateArticleSchema } from "@/lib/seo-utils";
import { getRecentlyPlayed } from "@/lib/recently-played";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CheckCircle2, Play, Search, Sparkles, X } from "lucide-react";

interface GameItem {
  id: string;
  title: string;
  description: string;
  categories: string[];
  tags: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  reward: number;
  levels: number;
  progress?: number;
  route?: string;
  featured?: boolean;
  labels: string[];
  popularity: number;
  rating: number;
  cover: string;
  instant: boolean;
  available: boolean;
}

const FILTERS = [
  "All Games",
  "Quiz",
  "Puzzle",
  "Memory",
  "Educational",
  "Word Games",
  "Brain Games",
  "Arcade",
  "Math",
  "Geography",
  "Science",
  "History",
];

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "played", label: "Most Played" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest Rated" },
  { value: "easy", label: "Easy First" },
  { value: "hard", label: "Hard First" },
];

const GAMES: GameItem[] = [
  {
    id: "capital-challenge",
    title: "Capital Challenge",
    description: "Identify the right capital before the timer runs out.",
    categories: ["Quiz", "Geography", "Educational"],
    tags: ["capitals", "world", "quick"],
    difficulty: "Easy",
    reward: 20,
    levels: 1,
    route: "/fun-zone/capitals",
    featured: true,
    labels: ["New"],
    popularity: 92,
    rating: 4.9,
    cover: "from-sky-500 to-cyan-500",
    instant: true,
    available: true,
  },
  {
    id: "flag-finder",
    title: "Flag Finder",
    description: "Match flags to countries in a fast-paced memory challenge.",
    categories: ["Memory", "Geography", "Brain Games"],
    tags: ["flags", "visual", "memory"],
    difficulty: "Medium",
    reward: 30,
    levels: 20,
    route: "/fun-zone/flags",
    featured: true,
    labels: ["🔥 Popular"],
    popularity: 88,
    rating: 4.7,
    cover: "from-emerald-500 to-teal-500",
    instant: false,
    available: true,
  },
  {
    id: "culture-quiz",
    title: "Culture Quiz",
    description:
      "Test your knowledge of traditions, festivals, and world cultures.",
    categories: ["Quiz", "History", "Educational"],
    tags: ["culture", "history", "events"],
    difficulty: "Medium",
    reward: 25,
    levels: 15,
    route: "/fun-zone/culture-quiz",
    featured: false,
    labels: ["⭐ Featured"],
    popularity: 80,
    rating: 4.8,
    cover: "from-violet-500 to-pink-500",
    instant: false,
    available: true,
  },
  {
    id: "memory-match",
    title: "Memory Match",
    description: "Pair matching cards and build recall power with every round.",
    categories: ["Memory", "Brain Games", "Arcade"],
    tags: ["cards", "recall", "focus"],
    difficulty: "Easy",
    reward: 15,
    levels: 25,
    featured: false,
    labels: ["🆕 New"],
    popularity: 68,
    rating: 4.5,
    cover: "from-amber-500 to-orange-500",
    route: "/fun-zone/memory",
    instant: false,
    available: true,
  },
  {
    id: "word-wizard",
    title: "Word Wizard",
    description: "Solve word puzzles, build vocabulary, and score bonus stars.",
    categories: ["Word Games", "Educational", "Brain Games"],
    tags: ["words", "spelling", "vocabulary"],
    difficulty: "Hard",
    reward: 35,
    levels: 30,
    route: "/fun-zone/word-wizard",
    featured: false,
    labels: [],
    popularity: 72,
    rating: 4.6,
    cover: "from-rose-500 to-fuchsia-500",
    instant: false,
    available: true,
  },
  {
    id: "number-navigator",
    title: "Number Navigator",
    description:
      "Solve fast math puzzles and climb through skill-based levels.",
    categories: ["Math", "Puzzle", "Educational"],
    tags: ["math", "logic", "speed"],
    difficulty: "Hard",
    reward: 40,
    levels: 18,
    featured: false,
    labels: ["🏆 Trending"],
    popularity: 76,
    rating: 4.4,
    cover: "from-indigo-500 to-blue-500",
    route: "/fun-zone/number-navigator",
    instant: false,
    available: true,
  },
  {
    id: "science-sprint",
    title: "Science Sprint",
    description: "Answer science questions in quickfire rounds and level up.",
    categories: ["Science", "Quiz", "Educational"],
    tags: ["science", "facts", "quick"],
    difficulty: "Medium",
    reward: 25,
    levels: 12,
    route: "/fun-zone/science-sprint",
    featured: false,
    labels: [],
    popularity: 65,
    rating: 4.3,
    cover: "from-lime-500 to-emerald-500",
    instant: false,
    available: true,
  },
];

const FunZone = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Games");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<GameItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const recentEntries = getRecentlyPlayed();
    const recentGames = recentEntries
      .map((entry) => {
        const game = GAMES.find((item) => item.id === entry.id);
        if (!game) return null;
        return {
          ...game,
          progress: entry.progress ?? game.progress ?? 100,
        };
      })
      .filter((game): game is GameItem => Boolean(game));
    setRecentlyPlayed(recentGames);
    const handler = () => {
      const entries = getRecentlyPlayed();
      const updated = entries
        .map((entry) => {
          const g = GAMES.find((item) => item.id === entry.id);
          if (!g) return null;
          return { ...g, progress: entry.progress ?? g.progress ?? 100 };
        })
        .filter((game): game is GameItem => Boolean(game));
      setRecentlyPlayed(updated);
    };

    window.addEventListener("wf:recently-played-updated", handler);
    return () =>
      window.removeEventListener("wf:recently-played-updated", handler);
  }, []);

  const filteredGames = useMemo(() => {
    const search = query.trim().toLowerCase();
    return GAMES.filter((game) => {
      const matchesFilter =
        activeFilter === "All Games" ||
        game.categories.some(
          (category) => category.toLowerCase() === activeFilter.toLowerCase(),
        ) ||
        game.tags.some(
          (tag) => tag.toLowerCase() === activeFilter.toLowerCase(),
        );

      const matchesSearch =
        !search ||
        game.title.toLowerCase().includes(search) ||
        game.description.toLowerCase().includes(search) ||
        game.categories.some((category) =>
          category.toLowerCase().includes(search),
        ) ||
        game.tags.some((tag) => tag.toLowerCase().includes(search));

      return matchesFilter && matchesSearch;
    }).sort((a, b) => {
      switch (sortBy) {
        case "played":
          return b.popularity - a.popularity;
        case "newest":
          return b.rating - a.rating;
        case "rating":
          return b.rating - a.rating;
        case "easy":
          return (
            ["Easy", "Medium", "Hard"].indexOf(a.difficulty) -
            ["Easy", "Medium", "Hard"].indexOf(b.difficulty)
          );
        case "hard":
          return (
            ["Hard", "Medium", "Easy"].indexOf(a.difficulty) -
            ["Hard", "Medium", "Easy"].indexOf(b.difficulty)
          );
        default:
          return b.popularity - a.popularity;
      }
    });
  }, [activeFilter, query, sortBy]);

  const featuredGames = useMemo(
    () => GAMES.filter((game) => game.featured),
    [],
  );

  const handleLaunch = (game: GameItem) => {
    if (!game.route || !game.available) return;
    setSelectedGame(null);
    window.requestAnimationFrame(() => navigate(game.route as string));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SEOMeta
        title={PAGE_TEMPLATES.funzone.title}
        description={PAGE_TEMPLATES.funzone.description}
        keywords={PAGE_TEMPLATES.funzone.keywords}
        ogImage={`${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`}
        structuredData={generateArticleSchema({
          headline: "Fun Zone - Game Library",
          description:
            "Browse a modern games library with search, filters, featured titles, and launching flow.",
          datePublished: new Date().toISOString(),
        })}
      />

      <Navbar />

      <main className="flex-1 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-10">
          <div className="space-y-4 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
              <Sparkles className="h-4 w-4" />
              Game Library
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                🎮 FunZone
              </h1>
              <p className="text-lg text-slate-400 sm:text-xl">
                Play, Learn & Have Fun
              </p>
            </div>
          </div>

          <div className="flex flex-row items-center gap-2 md:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search games, categories, or tags"
                className="h-14 rounded-[1.75rem] border border-white/10 bg-slate-900/95 px-14 text-white placeholder:text-slate-500 shadow-[0_20px_80px_-60px_rgba(14,165,233,0.35)] text-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/90 p-2 text-slate-300 transition hover:bg-slate-800"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <label htmlFor="sortBy" className="sr-only">
                Sort games
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-14 rounded-[1.75rem] border border-white/10 bg-slate-900/95 px-4 text-sm text-slate-100 outline-none transition hover:border-cyan-300 whitespace-nowrap"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {recentlyPlayed.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                    Recently played
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    Pick up where you left off
                  </h2>
                </div>
                <span className="text-sm text-slate-400">Resume fast</span>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2">
                {recentlyPlayed.map((game) => (
                  <div
                    key={game.id}
                    className="min-w-[260px] overflow-hidden rounded-[1.75rem] bg-slate-900/90 shadow-[0_20px_80px_-60px_rgba(14,165,233,0.3)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_90px_-40px_rgba(14,165,233,0.4)] group"
                  >
                    <div
                      className={`relative h-40 overflow-hidden ${game.cover}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                      <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                        <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/90">
                          {game.difficulty}
                        </span>
                        <Badge variant="secondary">{game.reward}⭐</Badge>
                      </div>
                      <div className="absolute inset-x-4 bottom-4">
                        <h3 className="text-xl font-semibold text-white">
                          {game.title}
                        </h3>
                        <p className="text-[11px] uppercase tracking-[0.25em] text-slate-300">
                          {game.categories.slice(0, 2).join(" • ")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4 px-4 py-5">
                      <p className="text-sm leading-6 text-slate-400">
                        {game.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-slate-400">
                          <span>Progress</span>
                          <span>{game.progress ?? 0}%</span>
                        </div>
                        <Progress
                          value={game.progress ?? 0}
                          className="h-2 rounded-full bg-slate-800"
                        />
                      </div>
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => handleLaunch(game)}
                        disabled={!game.available || !game.route}
                      >
                        {game.progress === 100 ? "Replay" : "Continue"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                  Featured
                </p>
                <h2 className="text-3xl font-semibold text-white">Hot games</h2>
              </div>
              <span className="text-sm text-slate-400">
                {filteredGames.length} games
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-3">
              {featuredGames.map((game) => (
                <div
                  key={game.id}
                  className="min-w-[300px] overflow-hidden rounded-[2rem] bg-slate-900/90 shadow-[0_20px_80px_-60px_rgba(14,165,233,0.3)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_90px_-40px_rgba(14,165,233,0.4)] group"
                >
                  <div
                    className={`relative h-44 overflow-hidden ${game.cover}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                    <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                      <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/90">
                        {game.difficulty}
                      </span>
                      {game.labels[0] && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-100">
                          {game.labels[0]}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-x-5 bottom-5 space-y-2">
                      <h3 className="text-2xl font-semibold text-white">
                        {game.title}
                      </h3>
                      <p className="text-sm text-slate-300">
                        {game.categories.join(" • ")}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 px-5 py-5">
                    <p className="text-sm leading-6 text-slate-400">
                      {game.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{game.reward}⭐</Badge>
                      <Badge variant="outline">{game.levels} levels</Badge>
                    </div>
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => handleLaunch(game)}
                      disabled={!game.available}
                    >
                      {game.available ? "Play now" : "Coming soon"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10" />

          <div className="flex flex-nowrap overflow-x-auto lg:flex-wrap gap-3 pb-2">
            {FILTERS.map((filter) => {
              const active = filter === activeFilter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
                    active
                      ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
                      : "bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/10" />

          {filteredGames.length === 0 ? (
            <div className="rounded-[2rem] bg-slate-900/90 p-12 text-center shadow-[0_30px_120px_-90px_rgba(14,165,233,0.45)]">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                No games found
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-white">
                Try a different keyword or filter
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Clear your search to reveal all available games in the FunZone
                library.
              </p>
              <Button
                variant="secondary"
                className="mt-6"
                onClick={() => setQuery("")}
              >
                Browse all games
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="group overflow-hidden rounded-[2rem] bg-slate-900/90 text-white shadow-[0_20px_80px_-60px_rgba(14,165,233,0.3)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_90px_-40px_rgba(14,165,233,0.4)]"
                >
                  <div
                    className={`relative h-44 overflow-hidden ${game.cover}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                    <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                      <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/90">
                        {game.difficulty}
                      </span>
                      <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/90">
                        {game.reward}⭐
                      </span>
                    </div>
                    {game.labels[0] && (
                      <div className="absolute left-5 top-16 rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-100">
                        {game.labels[0]}
                      </div>
                    )}
                    <div className="absolute inset-x-5 bottom-5 space-y-2">
                      <h3 className="text-xl font-semibold text-white">
                        {game.title}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-300">
                        {game.categories.slice(0, 2).join(" • ")}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 px-5 py-5">
                    <p className="text-sm leading-6 text-slate-400 min-h-[3rem]">
                      {game.description}
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                      {game.categories.slice(0, 2).map((category) => (
                        <span
                          key={category}
                          className="rounded-full bg-white/5 px-3 py-1"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                    {game.progress ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-slate-400">
                          <span>Progress</span>
                          <span>{game.progress}%</span>
                        </div>
                        <Progress
                          value={game.progress}
                          className="h-2 rounded-full bg-slate-800"
                        />
                      </div>
                    ) : null}
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => handleLaunch(game)}
                      disabled={!game.available}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {game.available ? "Play" : "Coming soon"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Dialog
        open={Boolean(selectedGame)}
        onOpenChange={(open) => !open && setSelectedGame(null)}
      >
        <DialogContent>
          {selectedGame && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>{selectedGame.title}</DialogTitle>
                <DialogDescription>
                  {selectedGame.description}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg from-slate-900 to-slate-700">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
                      Game preview
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">
                      {selectedGame.categories.join(" • ")}
                    </h3>
                  </div>
                  <Badge>{selectedGame.difficulty}</Badge>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-3xl border border-border bg-card p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Reward
                  </p>
                  <p className="text-2xl font-semibold">
                    {selectedGame.reward} stars
                  </p>
                </div>
                <div className="space-y-3 rounded-3xl border border-border bg-card p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Level count
                  </p>
                  <p className="text-2xl font-semibold">
                    {selectedGame.levels}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This game is part of the FunZone hub. Open the game to
                  continue the experience using existing app navigation.
                </p>
                <div className="space-y-3">
                  {Array.from({ length: Math.min(selectedGame.levels, 6) }).map(
                    (_, index) => {
                      const levelNumber = index + 1;
                      const isActive = levelNumber === 1;
                      return (
                        <div
                          key={levelNumber}
                          className={`flex items-center justify-between rounded-3xl border px-4 py-3 transition ${
                            isActive
                              ? "border-primary bg-primary/5"
                              : "border-border bg-muted"
                          }`}
                        >
                          <div>
                            <p className="font-medium">Level {levelNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {isActive
                                ? "Current"
                                : levelNumber <= 3
                                  ? "Unlocked"
                                  : "Locked"}
                            </p>
                          </div>
                          <div>
                            {isActive ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <span className="text-xs uppercase text-muted-foreground">
                                {levelNumber <= 3 ? "Open" : "Locked"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
              <DialogFooter className="flex gap-3">
                <Button
                  variant="default"
                  onClick={() => {
                    if (selectedGame) handleLaunch(selectedGame);
                  }}
                  disabled={!selectedGame.available || !selectedGame.route}
                >
                  {selectedGame.available ? "Launch game" : "Coming soon"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedGame(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FunZone;
