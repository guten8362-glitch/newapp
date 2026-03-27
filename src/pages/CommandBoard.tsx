import { useState, useEffect, useCallback, useRef } from "react";
import TaskCard from "@/components/TaskCard";
import { CommandHeader } from "@/components/CommandHeader";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useSpeech } from "@/hooks/useSpeech";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { getTasks, completeTask, startWorking } from "../lib/api";
import { logoutUser } from "../lib/appwrite";
import { useNavigate } from "react-router-dom";

type Task = {
  id: string;
  message: string;
  priority: "critical" | "medium" | "normal";
  sender: string;
  assignee: string;
  createdAt: Date;
  imageUrl: string | null;
  done: boolean;
  completedAt?: Date;
  workingPerson?: string | null;
  takenAt?: Date | null;
};

type ApiTask = {
  $id: string;
  description?: string;
  title?: string;
  priority?: string;
  employee_name?: string;
  $createdAt?: string | number | Date;
  $updatedAt?: string | number | Date;
  url?: string;
  status?: string;
};

const REMINDER_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

const CommandBoard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLightMode, setIsLightMode] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [readingTask, setReadingTask] = useState<Task | null>(null);
  const navigate = useNavigate();

  // Persist voice state
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    return localStorage.getItem("ttsEnabled") === "true";
  });

  const { speak, setEnabled, playNotificationSound } = useSpeech();

  const lastReminderRef = useRef<number>(Date.now());
  const lastSpokenTaskIds = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitialLoad = useRef(true);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle("light", isLightMode);
  }, [isLightMode]);

  // Enable TTS
  useEffect(() => {
    setEnabled(ttsEnabled);
  }, [ttsEnabled, setEnabled]);

  // Toggle voice
  const handleToggleTts = useCallback(() => {
    setTtsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("ttsEnabled", String(next));

      if (next) {
        toast.success("Voice enabled");
      } else {
        speechSynthesis.cancel();
        toast.info("Voice disabled");
      }

      return next;
    });
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
      toast.success("Logged out successfully");
    } catch {
      toast.error("Logout failed");
    }
  };

  const loadTasks = useCallback(async () => {
    if (!isLive) return;

    try {
      const data = await getTasks();

      const mapped = data
        .filter((t: ApiTask) => t.status !== "completed")
        .map((t: ApiTask) => {
          let workingPerson = null;
          let takenAt = null;

          if (t.status && t.status.startsWith("taken|")) {
            workingPerson = t.status.split("|")[1];
            takenAt = new Date(t.$updatedAt || Date.now());
          }

          return {
            id: t.$id,
            message: t.description || t.title || "Unknown Task",
            priority: (t.priority || "medium") === "high" ? "critical" : (t.priority || "medium") === "medium" ? "medium" : "normal",
            sender: t.employee_name || "System",
            assignee: t.employee_name || "",
            createdAt: new Date(t.$createdAt || Date.now()),
            imageUrl: t.url || null,
            done: false,
            workingPerson,
            takenAt,
          };
        });

      // Prevent pop-up/speech for all tasks on page reload
      if (isInitialLoad.current) {
        mapped.forEach((t) => lastSpokenTaskIds.current.add(t.id));
        isInitialLoad.current = false;
      }

      // Merge with currently marked "done" tasks
      setTasks((prev) => {
        const doneTasks = prev.filter((p) => p.done);

        // Return existing done tasks + new mapped tasks that are not in done list
        const mappedNotDone = mapped.filter((m) => !doneTasks.find((d) => d.id === m.id));

        return [...doneTasks, ...(mappedNotDone as Task[])];
      });
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [isLive]);

  useEffect(() => {
    loadTasks();
    intervalRef.current = setInterval(loadTasks, 15000);
    return () => clearInterval(intervalRef.current);
  }, [loadTasks]);

  // SPEAK NEW TASKS (Wait for sound to finish)
  useEffect(() => {
    if (!ttsEnabled) return;

    // Identify truly new tasks that haven't been spoken yet
    const newTasksToSpeak = tasks
      .filter((t) => !lastSpokenTaskIds.current.has(t.id) && !t.done)
      .sort((a, b) => {
        const order: Record<string, number> = { critical: 0, medium: 1, normal: 2 };
        if (order[a.priority] !== order[b.priority]) {
          return order[a.priority] - order[b.priority];
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    if (newTasksToSpeak.length > 0) {
      // 1. Play notification sound immediately
      playNotificationSound();

      // 2. Mark tasks as seen immediately to avoid double triggers in subsequent renders
      newTasksToSpeak.forEach((task) => {
        lastSpokenTaskIds.current.add(task.id);
      });

      // 3. Wait 2 seconds before speaking to avoid overlapping with the sound
      setTimeout(() => {
        // Double check if TTS is still enabled when the timeout fires
        if (!localStorage.getItem("ttsEnabled") || localStorage.getItem("ttsEnabled") === "false") return;

        newTasksToSpeak.forEach((task) => {
          speak(
            task.message,
            task.priority,
            task.assignee,
            `New Task. ${task.message}`,
            () => setReadingTask(task),
            () => setReadingTask(null)
          );
        });
      }, 2000);
    }

    // Safety: ensure all existing tasks are marked as seen so they don't trigger "new" logic later
    tasks.forEach(t => {
      if (!lastSpokenTaskIds.current.has(t.id)) {
        lastSpokenTaskIds.current.add(t.id);
      }
    });

  }, [tasks, speak, ttsEnabled, playNotificationSound]);

  // REMINDER (ONLY CRITICAL)
  useEffect(() => {
    if (!ttsEnabled) return;

    const interval = setInterval(() => {
      const now = Date.now();

      if (now - lastReminderRef.current >= REMINDER_INTERVAL_MS) {
        lastReminderRef.current = now;

        const criticalTasks = tasks.filter(
          (t) => !t.done && t.priority === "critical"
        );

        if (criticalTasks.length > 0) {
          speak(
            `Reminder. You have ${criticalTasks.length} critical pending tasks`,
            "critical",
            undefined,
            `Reminder. You have ${criticalTasks.length} critical pending tasks`
          );

          criticalTasks.forEach((task) => {
            speak(task.message, "critical", task.assignee, task.message);
          });
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [tasks, speak, ttsEnabled]);

  // Toggle complete
  const toggleDone = useCallback(async (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, done: true, completedAt: new Date() }
          : t
      )
    );

    try {
      await completeTask(id);
      toast.success("Task completed");
      if (ttsEnabled) speak("Task completed", "normal", "System");
    } catch {
      toast.error("Failed to complete task on server");
      // Revert locally if failed
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, done: false, completedAt: undefined }
            : t
        )
      );
    }
  }, [ttsEnabled, speak]);

  const handleTakeTask = useCallback(async (id: string) => {
    try {
      const { getCurrentUser } = await import("../lib/appwrite");
      const user = await getCurrentUser();

      let identity = user?.name || user?.email || localStorage.getItem("userName") || localStorage.getItem("userEmail") || "User";

      // Fallback clean-up if the assigned identity is an email address
      if (identity.includes("@")) {
        identity = identity.split("@")[0];
      }

      // Optimistic update
      setTasks(prev => prev.map(t =>
        t.id === id ? { ...t, workingPerson: identity, takenAt: new Date() } : t
      ));

      const { startWorking } = await import("../lib/api");
      await startWorking(id, identity);
      toast.success("Task taken successfully");
    } catch {
      toast.error("Failed to take task");
    }
  }, []);

  const activeTasks = tasks.filter((t) => !t.done);

  const filteredTasks = activeTasks
    .filter((t) => {
      const q = searchQuery.toLowerCase();
      return (
        t.message.toLowerCase().includes(q) ||
        (t.assignee && t.assignee.toLowerCase().includes(q)) ||
        t.sender.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, medium: 1, normal: 2 };
      if (order[a.priority] !== order[b.priority]) {
        return order[a.priority] - order[b.priority];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  const highTasks = filteredTasks.filter((t) => t.priority === "critical");
  const mediumTasks = filteredTasks.filter((t) => t.priority === "medium");
  const lowTasks = filteredTasks.filter((t) => t.priority === "normal");

  const pendingCount = activeTasks.length;

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />

      <AnimatePresence>
        {readingTask && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 bg-background/95 backdrop-blur-md"
          >
            <div className={`p-8 rounded-2xl border-2 text-center max-w-4xl w-full shadow-2xl ${readingTask.priority === "critical" ? "border-critical/50 shadow-critical/20" :
              readingTask.priority === "medium" ? "border-medium/50 shadow-medium/20" : "border-normal/50"
              }`}>
              <h1 className="text-4xl font-bold mb-6 text-foreground uppercase tracking-wider">New Task Announcement</h1>
              <div className="text-3xl text-foreground font-medium mb-8">
                {readingTask.message}
              </div>
              {readingTask.imageUrl && (
                <div className="w-full relative h-[400px] md:h-[600px] rounded-lg overflow-hidden border border-border mt-4 flex items-center justify-center bg-black/10">
                  {readingTask.imageUrl.match(/\.(mp4|webm|mkv)$/i) ? (
                    <video src={readingTask.imageUrl} autoPlay loop muted className="w-full h-full object-contain" />
                  ) : readingTask.imageUrl.match(/\.(mp3|wav|ogg|webm|mpeg)$/i) ? (
                    <audio src={readingTask.imageUrl} controls className="w-2/3" />
                  ) : (
                    <img src={readingTask.imageUrl} alt="attachment" className="w-full h-full object-contain" />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <CommandHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLightMode={isLightMode}
          onToggleTheme={() => setIsLightMode((v) => !v)}
          taskCount={tasks.length}
          pendingCount={pendingCount}
          ttsEnabled={ttsEnabled}
          onToggleTts={handleToggleTts}
          isLive={isLive}
          onToggleLive={() => setIsLive((v) => !v)}
          onLogout={handleLogout}
        />

        <main className="w-full px-10 py-8">
          {loading ? (
            <div className="text-center py-20 text-lg text-muted-foreground flex flex-col items-center gap-4">
              <div className="h-8 w-8 rounded-full border-r-2 border-primary animate-spin" />
              Loading Tasks...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-10">
                {/* HIGH */}
                <div>
                  <h2 className="text-critical text-2xl font-bold mb-6">
                    HIGH ({highTasks.length})
                  </h2>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {highTasks.map((task, i) => (
                        <TaskCard key={task.id} task={task} index={i} onToggleDone={toggleDone} onTakeTask={handleTakeTask} isCommandBoard={true} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* MEDIUM */}
                <div>
                  <h2 className="text-medium text-2xl font-bold mb-6">
                    MEDIUM ({mediumTasks.length})
                  </h2>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {mediumTasks.map((task, i) => (
                        <TaskCard key={task.id} task={task} index={i} onToggleDone={toggleDone} onTakeTask={handleTakeTask} isCommandBoard={true} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* LOW */}
                <div>
                  <h2 className="text-normal font-bold mb-6 text-2xl text-muted-foreground">
                    LOW ({lowTasks.length})
                  </h2>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {lowTasks.map((task, i) => (
                        <TaskCard key={task.id} task={task} index={i} onToggleDone={toggleDone} onTakeTask={handleTakeTask} isCommandBoard={true} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {filteredTasks.length === 0 && !loading && (
                <div className="col-span-3 text-center py-20 text-muted-foreground text-lg">
                  No tasks found.
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CommandBoard;