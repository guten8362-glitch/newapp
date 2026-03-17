import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Image as ImageIcon } from "lucide-react";

const priorityStyles = {
  high: "border-l-priority-high bg-priority-high/5 shadow-[0_0_15px_hsl(var(--priority-high)/0.3),0_0_30px_hsl(var(--priority-high)/0.1)]",
  medium: "border-l-priority-medium bg-priority-medium/5",
  low: "border-l-priority-low bg-priority-low/5",
};

const priorityDot = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

type Props = {
  task: any;
  isDarkMode?: boolean; // Add this prop
};

const TaskCard = ({ task, isDarkMode = true }: Props) => {

  const [showMedia, setShowMedia] = useState(false);

  const hasMedia = task.url && task.url.includes("storage");

  // Dynamic text colors based on theme
  const textColor = isDarkMode ? 'text-white' : 'text-black';
  const secondaryTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';
  const mutedTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const senderColor = isDarkMode ? 'text-white' : 'text-black font-bold';
  const priorityBadgeBg = isDarkMode ? 'bg-secondary' : 'bg-gray-200';
  const priorityBadgeText = isDarkMode ? 'text-muted-foreground' : 'text-gray-800';

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 4 }}
      className={`glass-card rounded-xl p-4 border-l-4 ${priorityStyles[task.priority]} transition-colors ${
        isDarkMode ? 'bg-gray-900/90' : 'bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">

        <div className="flex-1 min-w-0 space-y-1.5">

          {/* HEADER */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${priorityDot[task.priority]}`} />

            <span className={`text-sm font-semibold ${senderColor}`}>
              {task.sender}
            </span>

            <span className={`text-[10px] uppercase font-bold tracking-wider ${priorityBadgeText} px-1.5 py-0.5 ${priorityBadgeBg} rounded`}>
              {task.priority}
            </span>
          </div>

          {/* MESSAGE */}
          <p className={`text-sm ${secondaryTextColor} leading-relaxed`}>
            {task.message}
          </p>

          {/* ATTACHMENT */}
          {hasMedia && (
            <div className="mt-2">
              <button
                onClick={() => setShowMedia(!showMedia)}
                className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                {showMedia ? "Hide Attachment" : "Show Attachment"}
              </button>

              {showMedia && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border">
                  <img
                    src={task.url}
                    alt="Task attachment"
                    className="max-h-64 w-auto rounded-lg cursor-pointer"
                    onClick={() => window.open(task.url, "_blank")}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const audioPlayer = document.createElement("audio");
                      audioPlayer.controls = true;
                      audioPlayer.src = task.url;
                      audioPlayer.className = "w-full";
                      e.currentTarget.parentNode?.appendChild(audioPlayer);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* TIME */}
          <div className={`flex items-center gap-1.5 text-xs ${mutedTextColor}`}>
            <Clock className="w-3 h-3" />
            {task.timestamp}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;