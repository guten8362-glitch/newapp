import { Search, Volume2, VolumeX, Moon, Sun, History } from "lucide-react";

interface CommandHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
  taskCount: number;
  pendingCount: number;
  ttsEnabled: boolean;
  onToggleTts: () => void;
}

export const CommandHeader = ({
  searchQuery,
  onSearchChange,
  isLightMode,
  onToggleTheme,
  pendingCount,
  ttsEnabled,
  onToggleTts,
}: CommandHeaderProps) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Status + Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary animate-pulse-glow" />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold tracking-tight">
              Command Board
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground tracking-wide">
              {dateStr} · {timeStr}
            </p>
          </div>
        </div>

        {/* Center: Search */}
        <div className="relative flex-1 max-w-sm hidden sm:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={14}
          />
          <input
            type="text"
            placeholder="Search tasks, employees..."
            className="w-full bg-secondary border border-border rounded-full py-1.5 pl-9 pr-4 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleTts}
            className={`p-2 rounded-lg transition-colors ${
              ttsEnabled
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-secondary"
            }`}
            title={ttsEnabled ? "Disable voice" : "Enable voice"}
          >
            {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            title="Toggle theme"
          >
            {isLightMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden px-4 pb-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={14}
          />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full bg-secondary border border-border rounded-full py-1.5 pl-9 pr-4 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
};
