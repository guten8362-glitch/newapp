import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Minus, Sparkles, Brain, ListChecks, Calendar, Zap, Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { getTeam, createTask, getEmployeeProfile } from "../lib/api";
import { useSpeech } from "@/hooks/useSpeech";

const AITaskAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chat, setChat] = useState<{ role: "user" | "ai"; content: string; type?: "plan" | "assignment" | "info" }[]>([
    { role: "ai", content: "I'm your AI Task Assistant! Type 'Plan my day' or say 'Assign [task] to [name]' to manage your team." },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { speak, setEnabled, isSpeaking } = useSpeech();

  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [isSecure, setIsSecure] = useState(true);

  // Initial check for secure context and speech enablement
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSecure(window.isSecureContext);
      if (!window.isSecureContext && window.location.hostname !== "localhost") {
        console.warn("Speech recognition/Microphone requires a secure context (HTTPS or localhost).");
      }
      // Enable speech synthesis automatically
      setEnabled(true);
    }
    
    return () => {
      // Cleanup
      setIsListening(false);
      setIsProcessing(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // HYBRID: Auto-listen when opened
  useEffect(() => {
    if (isOpen && !isMinimized && !isListening && !isProcessing && !isSpeaking && permissionStatus !== "denied") {
      const timer = setTimeout(() => {
        toggleMic();
      }, 500); // Small delay for animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // CONTINUOUS: Auto-restart/start mic after AI finishes
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && !isMinimized && !isListening && !isProcessing && !isSpeaking && permissionStatus === "granted") {
      timer = setTimeout(() => {
        toggleMic();
      }, 1000); 
    }
    return () => clearTimeout(timer);
  }, [isOpen, isMinimized, isListening, isProcessing, isSpeaking, permissionStatus]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, isOpen, isMinimized]);

  const requestPermission = async () => {
    if (!isSecure && window.location.hostname !== "localhost") {
      setPermissionStatus("denied");
      toast.error("Microphone blocked: Browser requires HTTPS or localhost for voice features.", {
        duration: 8000
      });
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus("granted");
      return true;
    } catch (err: any) {
      console.error("Mic permission error:", err);
      setPermissionStatus("denied");
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error("Microphone access denied. Please click the 'Lock' icon in your browser address bar to reset permissions.");
      } else {
        toast.error("Could not access microphone. Ensure no other app is using it.");
      }
      return false;
    }
  };

  const toggleMic = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (permissionStatus !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setPermissionStatus("denied");
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        setMessage(transcript);
        handleVoiceCommand(transcript);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Recognition start error:", err);
      setIsListening(false);
    }
  };

  const generatePlan = () => {
    setIsProcessing(true);
    setChat(prev => [...prev, { role: "user", content: "Plan my day" }]);
    
    setTimeout(() => {
      const planContent = "Based on your current tasks, I recommend this order:\n1. 🚨 High Priority: Market analysis (Deadline: 2 PM)\n2. 📈 Medium Priority: Sync with design team\n3. ☕ Low Priority: Internal documentation";
      setChat(prev => [...prev, { 
        role: "ai", 
        content: planContent,
        type: "plan"
      }]);
      speak(planContent);
      setIsProcessing(false);
    }, 1200);
  };

  const handleVoiceCommand = (cmd: string) => {
    if (!cmd.trim()) return;
    processMessage(cmd);
    setMessage("");
  };

  const processMessage = async (input: string) => {
    setIsProcessing(true);
    try {
      const lowerInput = input.toLowerCase();

      // 1. Check for "How many tasks" query
      if (lowerInput.includes("how many tasks") || lowerInput.includes("tasks assigned to") || lowerInput.includes("task count")) {
        try {
          const team = await getTeam();
          const targetEmployee = team.find((e: any) => lowerInput.includes(e.name.toLowerCase()));
          
          if (targetEmployee) {
            const profile = await getEmployeeProfile(targetEmployee.name);
            const response = `${targetEmployee.name} has ${profile.assigned_tasks} ongoing tasks assigned.`;
            
            setChat(prev => [...prev, 
              { role: "user", content: input },
              { 
                role: "ai", 
                content: response,
                type: "info"
              }
            ]);
            speak(response);
            return;
          }
        } catch (err) {
          console.error("Query error:", err);
        }
      }

      // 2. Check for "Plan my day"
      if (lowerInput.includes("plan my day")) {
        generatePlan();
        return;
      }

      // 3. Task Assignment
      const assignRegex = /(?:assign\s+)?(.+)\s+to\s+(.+)/i;
      const match = input.match(assignRegex);

      if (match && !lowerInput.startsWith("plan")) {
        const taskTitle = match[1].trim();
        const employeeName = match[2].trim();

        if (taskTitle.length > 2) {
          try {
            const team = await getTeam();
            const employee = team.find((e: any) => 
              e.name.toLowerCase() === employeeName.toLowerCase() ||
              e.name.toLowerCase().includes(employeeName.toLowerCase())
            );

            if (employee) {
              let detectedPriority: "high" | "medium" | "low" = "medium";
              if (lowerInput.includes("urgent") || lowerInput.includes("high priority") || lowerInput.includes("critical")) {
                detectedPriority = "high";
              } else if (lowerInput.includes("low priority") || lowerInput.includes("whenever")) {
                detectedPriority = "low";
              }

              await createTask({
                title: taskTitle,
                description: `Assigned via AI Voice Assistant: ${taskTitle}`,
                employee_name: employee.name,
                priority: detectedPriority,
                deadline: "As soon as possible"
              });

              setChat(prev => [...prev, 
                { role: "user", content: input },
                { 
                  role: "ai", 
                  content: `Understood. I've assigned "${taskTitle}" to ${employee.name} with ${detectedPriority} priority.`,
                  type: "assignment"
                }
              ]);
              speak(`I've assigned the task to ${employee.name}. Anything else?`);
              toast.success(`Task assigned to ${employee.name}`);
              return;
            }
          } catch (error) {
            console.error("Assignment error:", error);
          }
        }
      }

      // Default chat behavior
      setChat(prev => [...prev, { role: "user", content: input }]);
      const defaultResponse = "I'm not sure how to handle that yet. Try asking: 'How many tasks does Sarah have?' or 'Assign market analysis to John.'";
      setChat(prev => [...prev, { role: "ai", content: defaultResponse }]);
      speak(defaultResponse);
    } catch (err) {
      console.error("Critical AI Assistant error:", err);
      toast.error("Assistant encountered an error.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = () => {
    if (!message.trim() || isProcessing) return;
    processMessage(message);
    setMessage("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full bg-primary shadow-[0_0_30px_rgba(var(--primary),0.5)] flex items-center justify-center p-0 overflow-hidden group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary via-indigo-600 to-purple-500 group-hover:rotate-12 transition-transform duration-500" />
              <Bot className="w-8 h-8 text-white relative z-10" />
              <Sparkles className="absolute top-2 right-2 w-4 h-4 text-yellow-300 animate-pulse" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: 1,
              height: isMinimized ? "auto" : "580px",
              width: "400px"
            }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="glass-card rounded-[2.5rem] border border-white/20 overflow-hidden flex flex-col shadow-2xl backdrop-blur-3xl bg-black/60"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-primary/30 to-indigo-600/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl ring-2 ring-white/20">
                  <Brain className={`w-7 h-7 text-white ${isProcessing ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                    AI Task Assistant <Sparkles className="w-4 h-4 text-yellow-400" />
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      permissionStatus === "granted" ? "bg-green-500 animate-pulse" : 
                      permissionStatus === "denied" ? "bg-red-500" : "bg-white/30"
                    }`} />
                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                      {!isSecure && window.location.hostname !== "localhost" ? "Insecure Mode" :
                       permissionStatus === "granted" ? "Voice Ready" : 
                       permissionStatus === "denied" ? "Voice Denied" : "Voice Standby"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/10 rounded-2xl transition-colors text-white/70"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-2xl transition-colors text-white/70"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            {!isMinimized && (
              <>
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide"
                >
                  {permissionStatus === "denied" && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl text-[10px] text-red-400 font-medium text-center mb-4 flex flex-col gap-1">
                      <span>Microphone access denied or blocked by insecure origin.</span>
                      {!isSecure && window.location.hostname !== "localhost" && (
                        <span className="text-white/60">Note: Browser requires **localhost** or **HTTPS** for microphone.</span>
                      )}
                      <button 
                        onClick={() => {
                          setPermissionStatus("prompt");
                          requestPermission();
                        }}
                        className="mt-1 text-primary hover:underline underline-offset-2"
                      >
                        Try enabling again
                      </button>
                    </div>
                  )}
                  {chat.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-xl ${
                          msg.role === "user"
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-white/10 border border-white/20 text-gray-200 rounded-tl-none backdrop-blur-xl"
                        } ${msg.type === "plan" ? "border-yellow-400/40 bg-yellow-400/10" : ""}
                          ${msg.type === "assignment" ? "border-green-400/40 bg-green-400/10" : ""}`}
                      >
                        {msg.type === "plan" && (
                          <div className="flex items-center gap-2 mb-2 text-yellow-400 font-bold uppercase text-[10px] tracking-widest">
                            <ListChecks className="w-3 h-3" /> Efficiency Plan
                          </div>
                        )}
                        {msg.type === "assignment" && (
                          <div className="flex items-center gap-2 mb-2 text-green-400 font-bold uppercase text-[10px] tracking-widest">
                            <Zap className="w-3 h-3" /> Auto Assigned
                          </div>
                        )}
                        {msg.content.split('\n').map((line, k) => (
                          <p key={k} className={line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') ? 'mt-3 font-semibold text-white' : ''}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 border border-white/20 p-4 rounded-3xl rounded-tl-none flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-xs text-white/50">Processing command...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="px-6 pb-2 flex gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    disabled={isProcessing}
                    onClick={generatePlan}
                    className="rounded-full text-[10px] h-8 border-yellow-400/30 text-yellow-400 font-bold bg-yellow-400/10 hover:bg-yellow-400/20"
                  >
                    🚀 Plan my day
                  </Button>
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-white/10">
                  <div className="flex gap-2 items-center bg-white/5 p-2.5 rounded-[1.5rem] border border-white/20 ring-1 ring-white/10 group focus-within:ring-primary/50 transition-all">
                    
                    <button
                      onClick={toggleMic}
                      className={`p-2.5 rounded-xl transition-all ${
                        isListening 
                          ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30" 
                          : permissionStatus === "denied"
                          ? "text-red-500/40 cursor-not-allowed"
                          : "text-white/40 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      disabled={isProcessing}
                      placeholder={
                        isListening ? "Listening... (Talk now)" : 
                        permissionStatus === "denied" ? "Mic Access Denied" :
                        "Press mic to talk or type..."
                      }
                      className="flex-1 bg-transparent border-none px-2 py-1 text-sm text-white focus:outline-none placeholder:text-white/20 disabled:opacity-50"
                    />
                    
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim() || isProcessing}
                      size="icon"
                      className="rounded-xl h-11 w-11 shadow-2xl shadow-primary/30 active:scale-95 transition-transform"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AITaskAssistant;
