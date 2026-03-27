import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Clock, 
  ChevronLeft,
  Trophy,
  Target,
  Zap,
  Star
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getTeam, getTasks } from "../lib/api";
import { AnimatedBackground } from "@/components/AnimatedBackground";

type PerformanceStat = {
  id: string;
  name: string;
  department: string;
  completed: number;
  ongoing: number;
  score: number;
  rank: number;
  priorityBonus: number;
};

const Performance = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PerformanceStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateStats = async () => {
      try {
        const team = await getTeam();
        const allTasks = await getTasks();

        const calculated = team.map((member: any) => {
          const memberTasks = allTasks.filter((t: any) => t.employee_name === member.name);
          const completed = memberTasks.filter((t: any) => t.status === "completed").length;
          const ongoing = memberTasks.filter((t: any) => t.status === "ongoing").length;
          
          // Bonus for high priority completed tasks
          const highPriorityCompleted = memberTasks.filter(
            (t: any) => t.status === "completed" && t.priority?.toLowerCase() === "high"
          ).length;

          const total = completed + ongoing;
          const baseScore = total > 0 ? (completed / total) * 100 : 0;
          const priorityBonus = highPriorityCompleted * 5;
          const finalScore = Math.min(100, Math.round(baseScore + priorityBonus));

          return {
            id: member.$id,
            name: member.name,
            department: member.department || "General",
            completed,
            ongoing,
            score: finalScore,
            priorityBonus,
            rank: 0 // Placeholder for sorting
          };
        });

        // Sort by score for ranking
        const sorted = calculated.sort((a, b) => b.score - a.score).map((s, index) => ({
          ...s,
          rank: index + 1
        }));

        setStats(sorted);
      } catch (err) {
        console.error("Failed to load performance stats:", err);
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Button
              variant="glass"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary" />
                Performance Analytics
              </h1>
              <p className="text-white/40 font-medium">Real-time employee efficiency tracking</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10">
            <div className="text-right">
              <p className="text-[10px] uppercase font-black tracking-widest text-primary">Team Average</p>
              <p className="text-2xl font-black text-white">
                {stats.length > 0 ? Math.round(stats.reduce((acc, s) => acc + s.score, 0) / stats.length) : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Performer Card */}
            {stats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="lg:col-span-1 glass-card p-8 rounded-[2.5rem] border-primary/30 relative overflow-hidden flex flex-col items-center justify-center text-center bg-primary/5"
              >
                <div className="absolute top-0 right-0 p-6">
                  <Trophy className="w-12 h-12 text-yellow-500/20" />
                </div>
                
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-black text-primary border-4 border-primary/50 shadow-2xl shadow-primary/20">
                    {stats[0].name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-500 p-2 rounded-full shadow-lg">
                    <Star className="w-4 h-4 text-white fill-current" />
                  </div>
                </div>

                <h2 className="text-2xl font-black text-white mb-1">{stats[0].name}</h2>
                <p className="text-primary font-bold uppercase tracking-widest text-xs mb-6">Top Performer • {stats[0].department}</p>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Score</p>
                    <p className="text-2xl font-black text-white">{stats[0].score}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Completed</p>
                    <p className="text-2xl font-black text-green-400">{stats[0].completed}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Leaderboard Table */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Efficiency Rankings
              </h3>
              
              <AnimatePresence>
                {stats.map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card p-5 rounded-2xl border border-white/5 hover:border-white/20 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-black text-white/20 w-6">#{member.rank}</div>
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-white group-hover:bg-primary/20 transition-colors">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white leading-none mb-1">{member.name}</p>
                        <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">{member.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="hidden sm:flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-bold text-white/70">{member.completed} Done</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs font-bold text-white/70">{member.ongoing} Active</span>
                        </div>
                      </div>

                      <div className="relative">
                        <svg className="w-14 h-14 transform -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-white/5"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={150.7}
                            strokeDashoffset={150.7 - (150.7 * member.score) / 100}
                            className="text-primary transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-black">{member.score}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Performance;
