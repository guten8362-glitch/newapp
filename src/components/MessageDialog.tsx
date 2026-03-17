import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type MessageDialogProps = {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  employeeAvatar: string;
};

type ChatMessage = {
  id: string;
  text: string;
  sender: "you" | "them";
  time: string;
};

const MessageDialog = ({ open, onClose, employeeName, employeeAvatar }: MessageDialogProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", text: `Hey! How can I help you?`, sender: "them", time: "Just now" },
  ]);
  const { toast } = useToast();

  const handleSend = () => {
    if (!message.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: "you",
      time: "Just now",
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage("");

    // Simulate reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Got it! I'll get on that right away.",
          sender: "them",
          time: "Just now",
        },
      ]);
    }, 1500);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md glass-card rounded-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: "80vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {employeeAvatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{employeeName}</p>
                <p className="text-xs text-primary">Online</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === "you" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.sender === "you"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                  <p className={`text-[10px] mt-1 ${msg.sender === "you" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {msg.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 h-10 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <Button variant="neon" size="icon" onClick={handleSend}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MessageDialog;
