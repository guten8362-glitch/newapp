import { useState, useEffect, useCallback, useRef } from "react";
import TaskCard from "@/components/TaskCard";
import { useSpeech } from "@/hooks/useSpeech";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getTasks, completeTask } from "../lib/api";

// Simple Command Header
const CommandHeader = ({ 
  searchQuery, 
  onSearchChange, 
  isDarkMode, 
  onToggleTheme,
  ttsEnabled,
  onToggleTts 
}: any) => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Command Board
          </h1>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTts}
            className={`p-2 rounded-lg transition-colors ${
              ttsEnabled 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-300'
            }`}
          >
            {ttsEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <div className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-300 text-sm font-mono">
            {timeStr}
          </div>
        </div>
      </div>
    </header>
  );
};

// Simple Animated Background
const AnimatedBackground = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className={`absolute inset-0 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-950 to-black' 
          : 'bg-gradient-to-br from-white via-gray-50 to-gray-100'
      }`} />
      
      {/* Grid pattern */}
      <div className={`absolute inset-0 ${
        isDarkMode 
          ? 'bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]' 
          : 'bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)]'
      } bg-[size:40px_40px]`} />
      
      {/* Floating particles */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-1 h-1 rounded-full ${
            isDarkMode ? 'bg-green-500/20' : 'bg-green-600/10'
          } animate-float-particle`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 10}s`
          }}
        />
      ))}
    </div>
  );
};

// Main Component
const CommandBoard = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [ttsEnabled, setTtsEnabled] = useState(false); // Voice OFF by default
  const [loading, setLoading] = useState(true);
  const { speak, setEnabled } = useSpeech();
  
  // Refs for tracking
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousTasksRef = useRef<any[]>([]);

  // Voice enabled effect - only runs when ttsEnabled changes
  useEffect(() => {
    setEnabled(ttsEnabled);
  }, [ttsEnabled, setEnabled]);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Function to load tasks
  const loadTasks = useCallback(async (skipVoice: boolean = true) => {
    try {
      const data = await getTasks();

      if (Array.isArray(data)) {
        const mapped = data
          .filter((t: any) => t.status !== "completed")
          .map((t: any) => ({
            id: t.$id,
            sender: t.employee_name || "You",
            message: t.description || t.title || "No description",
            priority: (t.priority || "medium").toLowerCase(),
            timestamp: t.deadline || "No deadline",
            url: t.url,
            done: false
          }));

        // Check for new tasks (only if voice is enabled and we're not skipping voice)
        if (ttsEnabled && !skipVoice && previousTasksRef.current.length > 0) {
          const newTasks = mapped.filter(
            newTask => !previousTasksRef.current.some(oldTask => oldTask.id === newTask.id)
          );
          
          newTasks.forEach(task => {
            speak(`New task: ${task.message}`);
          });
        }

        setTasks(mapped);
        previousTasksRef.current = mapped;
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [ttsEnabled, speak]);

  // Initial load
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await loadTasks(true); // Skip voice on initial load
    };
    initialLoad();
  }, []);

  // Set up 30-second refresh interval
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set new interval to refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      loadTasks(false); // Don't skip voice on refresh (will announce if enabled)
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadTasks]); // Re-run if loadTasks changes

  const handleToggleTts = useCallback(() => {
    setTtsEnabled((prev) => {
      const newState = !prev;
      if (newState) {
        toast.success("Voice enabled");
        setTimeout(() => speak("Voice enabled"), 500);
      } else {
        speechSynthesis.cancel();
        toast.info("Voice disabled");
      }
      return newState;
    });
  }, [speak]);

  const handleToggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      await completeTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      // Also update previousTasksRef to keep it in sync
      previousTasksRef.current = previousTasksRef.current.filter(t => t.id !== taskId);
      toast.success("Task completed");
      if (ttsEnabled) speak("Task completed");
    } catch (error) {
      console.error("Failed to complete task:", error);
      toast.error("Failed to complete task");
    }
  }, [ttsEnabled, speak]);

  const filteredTasks = tasks
    .filter((t) => {
      const q = searchQuery.toLowerCase();
      return (
        t.message.toLowerCase().includes(q) ||
        t.sender.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      if (order[a.priority] !== order[b.priority])
        return order[a.priority] - order[b.priority];
      return 0;
    });

  return (
    <div className={`min-h-screen relative transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-950' : 'bg-white'
    }`}>
      <AnimatedBackground isDarkMode={isDarkMode} />

      <div className="relative z-10">
        <CommandHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          ttsEnabled={ttsEnabled}
          onToggleTts={handleToggleTts}
        />

        <main className="max-w-4xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="relative">
                  <TaskCard task={task} isDarkMode={isDarkMode} />
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="absolute top-4 right-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Complete
                  </button>
                </div>
              ))}

              {filteredTasks.length === 0 && (
                <div className="text-center py-20 text-gray-900 dark:text-gray-400">
                  No tasks found
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px); opacity: 0; }
        }
        .animate-float-particle {
          animation: float-particle linear infinite;
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default CommandBoard;