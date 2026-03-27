import { motion } from "framer-motion";
import { Clock, AlertTriangle, Info, Circle, ImageIcon, User, Users, CheckCircle2, PlayCircle, Timer, Mic } from "lucide-react";
import { useState, useEffect } from "react";

export default function TaskCard({ task, index = 0, onToggleDone, onTakeTask, isCommandBoard }: any) {
  const [imageExpanded, setImageExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (task.workingPerson && !task.done) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [task.workingPerson, task.done]);

  function getWorkingTime() {
    if (!task.takenAt) return "";
    const diff = Math.floor((now - new Date(task.takenAt).getTime()) / 1000);
    if (diff < 0) return "just now";
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}m ${secs}s`;
  }

  const priorityConfig = {
    critical: {
      label: "CRITICAL",
      icon: AlertTriangle,
      borderClass: "border-l-2 border-red-500",
      labelClass: "text-critical",
      iconClass: "text-critical",
      glowClass: "glow-critical",
      dotClass: "bg-critical",
    },
    medium: {
      label: "PRIORITY",
      icon: Info,
      borderClass: "border-l-2 border-blue-400",
      labelClass: "text-medium",
      iconClass: "text-medium",
      glowClass: "glow-medium",
      dotClass: "bg-medium",
    },
    normal: {
      label: "GENERAL",
      icon: Circle,
      borderClass: "border-l-2 border-gray-400",
      labelClass: "text-muted-foreground",
      iconClass: "text-muted-foreground",
      glowClass: "",
      dotClass: "bg-muted-foreground",
    },
  };

  const priorityKey = task.priority as 'critical' | 'medium' | 'normal';
  const config = priorityConfig[priorityKey] || priorityConfig.normal;
  const Icon = config.icon;

  function formatTimeAgo(date: Date): string {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }
  
  function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={`group relative border-l-[3px] ${config.borderClass} rounded-xl px-5 py-4 transition-all duration-300 glass hover:bg-secondary/20 ${config.glowClass} ${
        task.done ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Top meta row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase ${config.labelClass}`}>
                <Icon className="h-3 w-3" />
                {config.label}
              </span>
              <span className="text-border">·</span>
              <span className="text-[11px] text-muted-foreground font-code">{task.sender}</span>
              <span className="text-muted-foreground/40">→</span>
              {task.assignee ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  <User className="h-2.5 w-2.5" />
                  {task.assignee}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-full">
                  <Users className="h-2.5 w-2.5" />
                  All
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!task.done && task.priority !== "normal" && (
                <span className="text-[10px] font-code tabular-nums flex items-center gap-1 text-primary/60">
                  <Clock className="h-3 w-3" />
                  reminder
                </span>
              )}
              <span className="text-[11px] font-code tabular-nums text-muted-foreground/70" title={formatDate(task.createdAt)}>
                {formatTimeAgo(task.createdAt)}
              </span>
            </div>
          </div>

          {/* Audio first rendering - move above text if it's a voice task */}
          {task.imageUrl && task.imageUrl.match(/\.(mp3|wav|ogg|webm|mpeg|m4a|aac)$/i) && (
            <div className="mt-2 mb-4">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 backdrop-blur-sm flex flex-col gap-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Mic className="h-4 w-4 animate-pulse" />
                    </div>
                    Voice Directive
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                </div>
                <audio 
                  src={task.imageUrl} 
                  controls 
                  className="w-full h-10 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Message */}
          <p className={`text-sm leading-relaxed ${task.done ? "text-muted-foreground" : "text-foreground"} ${
            task.priority === "critical" && !task.done ? "font-semibold" : "font-normal"
          }`}>
            {task.message}
          </p>

          {/* Non-audio attachments */}
          {task.imageUrl && !task.imageUrl.match(/\.(mp3|wav|ogg|webm|mpeg|m4a|aac)$/i) && (
            <div className="mt-3">
              <button
                onClick={() => setImageExpanded(!imageExpanded)}
                className="flex items-center gap-1.5 text-[11px] text-primary/70 mb-2 hover:text-primary transition-colors font-medium"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                {imageExpanded ? "Hide attachment" : "View attachment"}
              </button>
              <motion.div
                animate={{ 
                  height: imageExpanded ? "auto" : 56, 
                  width: imageExpanded ? "100%" : 120 
                }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden rounded-lg cursor-pointer border border-border/20 group-hover:border-primary/30 transition-all"
                onClick={() => setImageExpanded(!imageExpanded)}
              >
                <div className="w-full h-full flex items-center justify-center bg-black/5">
                  {task.imageUrl.match(/\.(mp4|webm|mkv)$/i) ? (
                    <video src={task.imageUrl} controls className="w-full h-full object-contain" />
                  ) : (
                    <img src={task.imageUrl} alt="Task attachment" className="w-full h-full object-cover" />
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Action Area */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {task.done ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                  {task.completedAt && (
                    <span className="text-primary/60 font-code ml-1">
                      · {formatDate(task.completedAt)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {onToggleDone && (
                    <button
                      onClick={() => onToggleDone(task.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-primary text-xs font-semibold hover:bg-primary/20 hover:border-primary/40 transition-all duration-200 active:scale-95"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Complete
                    </button>
                  )}
                  
                  {isCommandBoard && !task.workingPerson && onTakeTask && (
                    <button
                      onClick={() => onTakeTask(task.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-500 text-xs font-semibold hover:bg-blue-500/20 hover:border-blue-500/40 transition-all duration-200 active:scale-95"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      Take Task
                    </button>
                  )}
                </div>
              )}
            </div>

            {!task.done && task.workingPerson && (
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded-lg border border-blue-400/20">
                  <User className="h-3 w-3" />
                  {task.workingPerson}
                </span>
                {task.takenAt && (
                  <span className="inline-flex items-center gap-1 font-code text-muted-foreground bg-secondary/40 px-2 py-1 rounded-lg whitespace-nowrap">
                    <Timer className="h-3 w-3" />
                    {getWorkingTime()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}