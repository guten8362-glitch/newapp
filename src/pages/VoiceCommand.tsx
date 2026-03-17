import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Send, CheckCircle2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { createTask } from "../lib/api"; // ✅ Import the same createTask function

// ✅ This is just for avatar/display, but we'll use the actual name from URL
const EMPLOYEES: Record<string, any> = {
  "1": { name: "Alex Chen", department: "Engineering", avatar: "AC" },
  "2": { name: "Maya Rodriguez", department: "Design", avatar: "MR" },
  "3": { name: "Jordan Lee", department: "Operations", avatar: "JL" },
  "4": { name: "Sam Patel", department: "IT Support", avatar: "SP" },
  "5": { name: "Riley Kim", department: "Marketing", avatar: "RK" },
  "6": { name: "Taylor Swift", department: "HR", avatar: "TS" },
};

// ✅ Priority options
type Priority = "high" | "medium" | "low";

const VoiceCommand = () => {
  const { id } = useParams(); // This is the employee name (e.g., "SAM", "AK", "Alex Chen")
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // ✅ Get employee display info if available, otherwise use the name from URL
  const emp = EMPLOYEES[id || ""] || { 
    name: id || "Unknown", 
    department: "Employee", 
    avatar: id?.charAt(0).toUpperCase() || "?" 
  };
  
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [taskAssigned, setTaskAssigned] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  
  // ✅ File upload states - exactly like Dashboard
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setAudioLevel(0);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const startListening = async () => {
    try {
      // Start audio visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 255);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();

      // Start speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setTranscript(finalTranscript || interimTranscript);
        };

        recognition.onerror = () => stopListening();
        recognition.onend = () => {
          // Don't stop if we're still supposed to be listening
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsListening(true);
      setTranscript("");
      setTaskAssigned(false);
    } catch {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please allow microphone permissions.",
        variant: "destructive",
      });
      setIsListening(false);
    }
  };

  // ✅ File handling functions - exactly like Dashboard
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ Updated assignTask to handle files
  const assignTask = async (taskText: string) => {
    const textToUse = taskText || manualInput;
    if (!textToUse.trim() && !selectedFile) return;
    
    try {
      stopListening();
      
      // Use the actual employee name from URL (id) for database
      const employeeName = id || "Unknown";
      
      console.log(`Assigning task to: ${employeeName} with priority: ${priority}`);
      
      // Create task in database using the same function as Dashboard
      const newTask = await createTask({
        title: textToUse || (selectedFile ? selectedFile.name : "File attachment"),
        description: textToUse || "",
        employee_name: employeeName,
        priority: priority,
        deadline: "Not Set"
      }, selectedFile || undefined);
      
      setTaskAssigned(true);
      toast({
        title: "Task Assigned!",
        description: `Task assigned to ${employeeName} with ${priority} priority`,
      });
      
      // Redirect back to employee profile after 2 seconds
      setTimeout(() => {
        navigate(`/employee/${encodeURIComponent(employeeName)}`);
      }, 2000);
    } catch (error) {
      console.error("Failed to assign task:", error);
      toast({
        title: "Error",
        description: "Failed to assign task",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
    };
  }, []);

  const sphereScale = 1 + audioLevel * 0.6;
  const glowIntensity = 20 + audioLevel * 80;
  const ringCount = 3;

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => navigate(`/employee/${encodeURIComponent(id || "")}`)}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
      </motion.button>

      {/* Employee info - shows the actual employee name */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 text-center z-10"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Assigning to</p>
        <p className="text-sm font-semibold text-foreground mt-1">{emp?.name || id}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{emp?.department || "Employee"}</p>
      </motion.div>

      {/* ✅ Priority Selector - Exactly like Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-24 z-10 flex gap-2"
      >
        {(["high", "medium", "low"] as Priority[]).map((p) => (
          <Button
            key={p}
            variant={priority === p ? "neon" : "glass"}
            size="sm"
            onClick={() => setPriority(p)}
            className={`capitalize px-6 ${priority === p ? "ring-2 ring-primary/50" : ""}`}
          >
            {p}
          </Button>
        ))}
      </motion.div>

      {/* ✅ File upload button - Exactly like Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-32 z-10"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,audio/*"
        />
        <Button
          variant="glass"
          size="sm"
          onClick={handleFileSelect}
          className="gap-2"
        >
          <ImagePlus className="w-4 h-4" />
          {selectedFile ? "File selected" : "Attach Image/Audio"}
        </Button>
      </motion.div>

      {/* ✅ File preview - Exactly like Dashboard */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-36 z-10 flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-lg"
          >
            <span className="truncate max-w-[200px]">📎 {selectedFile.name}</span>
            <button
              onClick={clearSelectedFile}
              className="text-red-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success state */}
      <AnimatePresence>
        {taskAssigned && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center z-20 bg-background/80 backdrop-blur-sm"
          >
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
              >
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto neon-glow" />
              </motion.div>
              <p className="text-lg font-semibold text-primary neon-text">Task Assigned!</p>
              <p className="text-sm text-muted-foreground">Redirecting to {emp?.name || id}...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Sphere */}
      <div className="relative flex items-center justify-center">
        {Array.from({ length: ringCount }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-primary/20"
            style={{ width: 200 + i * 60, height: 200 + i * 60 }}
            animate={{
              rotate: 360,
              scale: isListening ? 1 + audioLevel * 0.15 * (i + 1) : 1,
            }}
            transition={{
              rotate: { duration: 8 + i * 4, repeat: Infinity, ease: "linear" },
              scale: { duration: 0.1 },
            }}
          />
        ))}

        {isListening &&
          Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`p-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-primary"
              animate={{
                x: Math.cos((i * Math.PI * 2) / 12) * (80 + audioLevel * 60),
                y: Math.sin((i * Math.PI * 2) / 12) * (80 + audioLevel * 60),
                opacity: [0.3, 1, 0.3],
                scale: [0.5, 1 + audioLevel, 0.5],
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}

        <motion.div
          animate={{
            scale: sphereScale,
            boxShadow: `0 0 ${glowIntensity}px ${glowIntensity / 2}px hsl(var(--primary) / 0.4), 0 0 ${glowIntensity * 2}px ${glowIntensity}px hsl(var(--primary) / 0.15), inset 0 0 ${glowIntensity / 2}px hsl(var(--primary) / 0.3)`,
          }}
          transition={{ duration: 0.08 }}
          className="w-36 h-36 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent border border-primary/40 flex items-center justify-center cursor-pointer relative z-10"
          onClick={() => (isListening ? stopListening() : startListening())}
        >
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/40 to-primary/5 border border-primary/30 flex items-center justify-center"
            animate={{ scale: isListening ? [1, 1.08, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isListening ? (
              <Mic className="w-8 h-8 text-primary" />
            ) : (
              <MicOff className="w-8 h-8 text-muted-foreground" />
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Status text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-sm text-muted-foreground"
      >
        {isListening ? (
          <span className="text-primary neon-text animate-pulse">Listening... Speak your task</span>
        ) : (
          "Tap the sphere to start voice command"
        )}
      </motion.p>

      {/* Live transcript */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 max-w-sm mx-auto glass-card rounded-xl p-4 text-center"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Transcript</p>
            <p className="text-sm text-foreground">{transcript}</p>
            <Button
              variant="neon"
              size="sm"
              className="mt-3"
              onClick={() => assignTask(transcript)}
            >
              <Send className="w-3 h-3 mr-1" /> Assign This Task
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual input fallback */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 w-full max-w-sm px-4"
      >
        <div className="flex gap-2">
          <input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && assignTask(manualInput)}
            placeholder="Or type a task manually..."
            className="flex-1 h-10 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
          <Button variant="neon" size="icon" onClick={() => assignTask(manualInput)}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Waveform bar */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center gap-0.5 mt-6"
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-primary/60 rounded-full"
                animate={{ height: [4, 4 + audioLevel * 30 + Math.random() * 10, 4] }}
                transition={{ duration: 0.3 + Math.random() * 0.2, repeat: Infinity, delay: i * 0.03 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceCommand;