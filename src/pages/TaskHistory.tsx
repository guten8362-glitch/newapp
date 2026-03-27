import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  ChevronLeft,
  CheckCircle2,
  Clock,
  FileText,
  Trash2,
  Calendar as CalendarIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getTasks } from "../lib/api";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { format, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

interface Task {
  $id: string;
  $updatedAt: string;
  status: string;
  description?: string;
  title?: string;
  employee_name: string;
  priority: string;
}

const TaskHistory = () => {
  const navigate = useNavigate();
  const [allCompletedTasks, setAllCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const allTasks = await getTasks();
        const completed = (allTasks as any[])
          .filter((t) => t.status === "completed")
          .sort((a, b) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime()) as Task[];

        setAllCompletedTasks(completed);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Filter tasks based on selected date
  const filteredTasks = useMemo(() => {
    if (!selectedDate) return [];
    return allCompletedTasks.filter((task) =>
      isSameDay(new Date(task.$updatedAt), selectedDate)
    );
  }, [allCompletedTasks, selectedDate]);

  // Find all dates that have tasks to highlight them
  const highlightDays = useMemo(() => {
    return allCompletedTasks.map(task => new Date(task.$updatedAt));
  }, [allCompletedTasks]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="glass"
              size="icon"
              onClick={() => navigate("/command-board")}
              className="rounded-full h-10 w-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                <History className="w-6 h-6 text-primary" />
                Task History
              </h1>
              <p className="text-white/40 text-sm font-medium tracking-wide">Archived records of recent victories</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase text-primary tracking-widest">
              Total: {allCompletedTasks.length} Completed
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="flex-1 flex gap-8 overflow-hidden">
            {/* Left Side: Calendar */}
            <div className="w-[350px] shrink-0 space-y-4">
              <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-6 px-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    Filter by Date
                  </span>
                </div>

                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-xl border-none p-0"
                  modifiers={{
                    hasTask: highlightDays
                  }}
                  modifiersClassNames={{
                    hasTask: "text-primary font-bold"
                  }}
                  classNames={{
                    day_selected: "bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all scale-110 shadow-lg shadow-primary/20",
                    day_today: "text-primary border border-primary/20",
                    caption_label: "text-sm font-black uppercase tracking-widest mb-4",
                    head_cell: "text-[10px] font-black uppercase text-white/20 w-9",
                    day: "h-9 w-9 text-[11px] font-bold text-white/60 hover:bg-white/5 hover:text-white transition-colors rounded-xl",
                  }}
                />
              </div>

              {selectedDate && (
                <div className="glass-card p-5 rounded-2xl border border-white/5 bg-primary/5 border-primary/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Viewing records for</p>
                  <p className="text-sm font-black text-white">{format(selectedDate, 'MMMM d, yyyy')}</p>
                </div>
              )}
            </div>

            {/* Right Side: Task List */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {filteredTasks.length > 0 ? (
                    <div className="space-y-4 pb-8">
                      {filteredTasks.map((task, i) => (
                        <motion.div
                          key={task.$id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: i * 0.05 }}
                          className="glass-card p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between group hover:bg-white/[0.05] transition-all"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-white/90 group-hover:text-white transition-colors">
                                {task.description || task.title}
                              </h3>
                              <div className="flex items-center gap-4 mt-1 text-[10px] uppercase font-black tracking-tight text-white/30">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Completed {format(new Date(task.$updatedAt), 'HH:mm')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  Assigned to {task.employee_name}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`px-2 py-1 rounded bg-white/5 text-[8px] font-black uppercase tracking-widest border border-white/5 ${task.priority === 'high' ? 'text-red-400 border-red-500/20' : 'text-white/40'
                              }`}>
                              {task.priority || 'medium'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center opacity-20 py-20"
                    >
                      <Trash2 className="w-16 h-16 mb-4" />
                      <p className="font-black uppercase tracking-widest text-center">
                        No missions completed<br />on this date
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskHistory;