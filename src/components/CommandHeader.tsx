import { Search, Wifi, WifiOff, Volume2, VolumeX, Sun, Moon, History, LogOut, Monitor, Smartphone, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface CommandHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
  taskCount: number;
  pendingCount: number;
  ttsEnabled: boolean;
  onToggleTts: () => void;
  isLive: boolean;
  onToggleLive: () => void;
  viewMode?: "desktop" | "mobile";
  onToggleView?: () => void;
  onLogout?: () => void;
}

export function CommandHeader({
  searchQuery,
  onSearchChange,
  isLightMode,
  onToggleTheme,
  taskCount,
  pendingCount,
  ttsEnabled,
  onToggleTts,
  isLive,
  onToggleLive,
  viewMode,
  onToggleView,
  onLogout,
}: CommandHeaderProps) {
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };
    
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const isHistoryPage = location.pathname === "/history";

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 glass-strong w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center glow-primary">
            <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-display font-bold tracking-tight text-foreground">
              Command Board
            </h1>
            <p className="text-[11px] font-code text-muted-foreground tracking-wide">
              {dateStr} · {timeStr}
            </p>
          </div>
        </div>

        {/* Search */}
        <div
          className={`flex-1 min-w-[200px] max-w-md flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-300 ${
            isFocused
              ? "border-primary/40 bg-primary/5 glow-primary"
              : "border-border/30 bg-secondary/20"
          }`}
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search tasks, employees..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 shrink-0 w-full md:w-auto">
          {/* Install App button overrides if PWA installable */}
          {deferredPrompt && (
            <button
              onClick={handleInstallApp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium tracking-wide animate-pulse transition-all duration-200 bg-blue-500/10 text-blue-500 border border-blue-500/30 hover:bg-blue-500/20"
            >
              <Download className="h-3.5 w-3.5" />
              INSTALL APP
            </button>
          )}

          {/* History / Board toggle */}
          <button
            onClick={() => navigate(isHistoryPage ? "/" : "/history")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all duration-200 bg-secondary/30 text-muted-foreground border border-border/30 hover:bg-secondary/50 hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" />
            {isHistoryPage ? "Board" : "History"}
          </button>

          {/* Live toggle */}
          <button
            onClick={onToggleLive}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all duration-200 ${
              isLive
                ? "bg-primary/10 text-primary border border-primary/25 glow-primary"
                : "bg-secondary/30 text-muted-foreground border border-border/30"
            }`}
          >
            {isLive ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {isLive ? "LIVE" : "PAUSED"}
          </button>

          {/* TTS toggle */}
          <button
            onClick={onToggleTts}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all duration-200 ${
              ttsEnabled
                ? "bg-primary/10 text-primary border border-primary/25 glow-primary"
                : "bg-secondary/30 text-muted-foreground border border-border/30"
            }`}
          >
            {ttsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {ttsEnabled ? "VOICE" : "MUTE"}
          </button>

          {/* View toggle */}
          {!isHistoryPage && onToggleView && viewMode && (
            <button
              onClick={onToggleView}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all duration-200 ${
                viewMode === "desktop"
                  ? "bg-primary/10 text-primary border border-primary/25 glow-primary"
                  : "bg-secondary/30 text-muted-foreground border border-border/30"
              }`}
            >
              {viewMode === "desktop" ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
              {viewMode === "desktop" ? "GRID" : "LIST"}
            </button>
          )}

          {/* Pending counter */}
          <div className="px-3 py-2 rounded-xl bg-secondary/30 border border-border/30 text-xs font-code font-semibold tabular-nums text-foreground">
            {pendingCount}<span className="text-muted-foreground/60">/{taskCount}</span>
          </div>

          {/* Theme */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {isLightMode ? <Moon className="h-4 w-4 text-foreground" /> : <Sun className="h-4 w-4 text-foreground" />}
          </button>

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 hover:border-destructive/30 transition-all duration-200"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
