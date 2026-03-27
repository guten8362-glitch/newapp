import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logoutUser } from "../lib/appwrite";
import {
  Send,
  Mic,
  ImagePlus,
  Search,
  Bell,
  Users,
  LayoutDashboard,
  Menu,
  X,
  Calendar,
  BarChart3,
  Download,
  Home,
  Plus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import TaskCard from "@/components/TaskCard";
import EmployeePanel from "@/components/EmployeePanel";
import AddEmployeeModal from "@/components/AddEmployeeModal";
import AudioRecorder from "@/components/AudioRecorder";
import { toast as sonnerToast } from "sonner";

import { getTasks, getTeam } from "../lib/api";
import { createTask } from "../lib/api";

export type Priority = "high" | "medium" | "low";

export type TaskItem = {
  id: string;
  sender: string;
  message: string;
  priority: string;   
  assignee?: string;
  createdAt: Date;
  done: boolean;
  completedAt?: Date;
  imageUrl?: string;
  workingPerson?: string | null;
  takenAt?: Date | null;
};

const Dashboard = () => {

  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showEmployees, setShowEmployees] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const [isListening, setIsListening] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [taskDeadline, setTaskDeadline] = useState(""); // New state for deadline
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false); // Toggle deadline picker

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const [team, setTeam] = useState<any[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("All");
  const [assigneePanelOpen, setAssigneePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
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

  /* ---------------- LOAD TASKS ---------------- */

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await getTasks();

        const formatted = data
          .filter((t: any) => t.status !== "completed")   // ✅ hide completed tasks
          .map((t: any) => ({
            id: t.$id,
            sender: t.employee_name || "System",
            message: t.description || t.title || "No description",
            priority: (t.priority || "low").toLowerCase() === "high" ? "critical" : (t.priority || "low").toLowerCase() === "medium" ? "medium" : "normal",
            assignee: t.employee_name,
            createdAt: new Date(t.$createdAt || Date.now()),
            done: false,
            imageUrl: t.url || null,
            workingPerson: typeof t.status === "string" && t.status.startsWith("taken|") ? t.status.split("taken|")[1] : null,
            takenAt: typeof t.status === "string" && t.status.startsWith("taken|") ? new Date(t.$updatedAt) : null
        }));

        setTasks(formatted);

      } catch (err) {
        console.error("Failed loading tasks", err);
      }
    }

    async function loadTeam() {
      try {
        const data = await getTeam();
        setTeam(data);
      } catch (err) {
        console.error("Failed loading team", err);
      }
    }

    loadTasks();
    loadTeam();
    const intervalId = setInterval(loadTasks, 15000);
    return () => clearInterval(intervalId);
  }, []);

  /* ---------------- FILTER ---------------- */

  const filteredTasks = tasks.filter((t) =>
    t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ---------------- CREATE TASK ---------------- */

  const handleSend = async () => {
    if (!message.trim() && !selectedFile && !isRecording) return;
    
    // If still recording, stop it first
    if (isRecording) {
      stopRecording();
      // We might need to wait for the blob, but let's assume the user stops then sends
    }

    try {
      let fileToUpload = selectedFile;
      let isVoiceTask = false;
      
      console.log("handleSend - message:", message);
      console.log("handleSend - chunks count:", chunksRef.current.length);

      // If we have a recorded audio blob, use it
      if (!fileToUpload && chunksRef.current.length > 0) {
        // Detect native type or fallback
        const blobType = chunksRef.current[0].type || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        console.log("Created blob:", blob.size, "type:", blobType);
        
        // Name it as .mp3 for UI preference, but keep internal type if possible
        fileToUpload = new File([blob], "voice-message.mp3", { type: blobType });
        isVoiceTask = true;
      }

      if (!message.trim() && !fileToUpload) {
        console.log("Nothing to send");
        return;
      }

      const newTask = await createTask({
        title: message || (isVoiceTask ? "Voice Command" : fileToUpload ? fileToUpload.name : "New Task"),
        description: message || (isVoiceTask ? "Voice recorded message" : "Task details"),
        employee_name: selectedAssignee,
        priority: priority,
        deadline: taskDeadline || "Not Set"
      }, fileToUpload || undefined);
      
      const taskItem: TaskItem = {
        id: newTask.$id || Date.now().toString(),
        sender: "You",
        message: message || (isVoiceTask ? "🎤 Voice Command" : `Attachment: ${fileToUpload?.name}`),
        priority: priority === "high" ? "critical" : priority === "medium" ? "medium" : "normal",
        assignee: selectedAssignee,
        createdAt: taskDeadline ? new Date(taskDeadline) : new Date(),
        done: false,
        imageUrl: newTask.url,
        workingPerson: null,
        takenAt: null
      };
      
      setTasks([taskItem, ...tasks]);
      setMessage("");
      setSelectedFile(null);
      setTaskDeadline("");
      setShowDeadlinePicker(false);
      setIsModalOpen(false); // Close modal on success
      chunksRef.current = []; // Clear chunks
      
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      sonnerToast.success("Task Created", {
        description: `Assigned to: ${selectedAssignee}`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to create task:", error);
      sonnerToast.error("Failed to create task");
    }
  };

const handleLogout = async () => {
  try {
    await logoutUser();
    localStorage.clear(); // Clear all stored data
    navigate("/login");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    toast({
      title: "Error",
      description: "Failed to logout",
      variant: "destructive",
    });
  }
};
  /* ---------------- FILE SELECT ---------------- */

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }

  };

  /* ---------------- VOICE & AUDIO RECORDING ---------------- */

  const startRecording = async () => {
    try {
      console.log("Attempting to start recording...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") 
        ? "audio/webm" 
        : MediaRecorder.isTypeSupported("audio/mp4") 
          ? "audio/mp4" 
          : "audio/wav";
      
      console.log("Using MIME type:", mimeType);
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log("Chunk received:", e.data.size);
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        console.log("Recording stopped. Total chunks:", chunksRef.current.length);
        setIsRecording(false);
        
        // AUTO-SEND: If we have chunks and it's a voice command, trigger send
        if (chunksRef.current.length > 0) {
          console.log("Auto-sending voice task...");
          setTimeout(() => handleSend(), 500); // Small delay to ensure blob is ready
        }
      };

      recorder.start(100); // Collect data more frequently
      setIsRecording(true);
      console.log("MediaRecorder started");
      
      startSpeechRecognition();
    } catch (err) {
      console.error("Failed to start recording:", err);
      sonnerToast.error("Microphone access denied or not supported");
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording...");
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setMessage(transcript);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleMicToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const handleAudioRecordingComplete = async (blob: Blob, selectedPriority: string) => {
    try {
      const file = new File([blob], "voice-command.mp3", { type: blob.type });
      
      const newTask = await createTask({
        title: "🎤 Voice Command",
        description: `Voice directive for ${selectedAssignee}`,
        employee_name: selectedAssignee,
        priority: selectedPriority,
        deadline: "Not Set"
      }, file);
      
      console.log("Task created successfully:", newTask.$id);
      
      const taskItem: TaskItem = {
        id: newTask.$id || Date.now().toString(),
        sender: "You",
        message: "🎤 Voice Command",
        priority: selectedPriority === "high" ? "critical" : selectedPriority === "medium" ? "medium" : "normal",
        assignee: selectedAssignee,
        createdAt: new Date(),
        done: false,
        imageUrl: newTask.url,
        workingPerson: null,
        takenAt: null
      };
      
      setTasks([taskItem, ...tasks]);
      sonnerToast.success("Voice Task Created", {
        description: `Assigned to: ${selectedAssignee}`,
      });
    } catch (err) {
      console.error("Failed to create voice task:", err);
      sonnerToast.error("Failed to create task from recording");
    }
  };

  /* ---------------- UI ---------------- */

  return (

    <div className="min-h-screen bg-background grid-bg">

      {/* HEADER */}
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left side - Menu button only (compass icon removed) */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/dashboard")}
              className="lg:hidden p-2 rounded-lg bg-primary/10 text-primary border border-primary/20"
            >
              <Home className="h-4 w-4" />
            </button>
            {deferredPrompt && (
              <button
                onClick={handleInstallApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide animate-pulse transition-all duration-200 bg-blue-500/10 text-blue-500 border border-blue-500/30 hover:bg-blue-500/20"
              >
                <Download className="h-3.5 w-3.5" />
                INSTALL APP
              </button>
            )}
          </div>

          {/* Right side - Icons properly aligned */}
          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              size="icon"
              onClick={() => navigate("/command-board")}
              className="relative hover:bg-primary/10 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
            </Button>


            <Button
              variant="glass"
              size="icon"
              onClick={() => navigate("/performance")}
              className="hover:bg-primary/10 transition-colors"
              title="Employee Performance"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>

            <Button
              variant="glass"
              size="icon"
              onClick={() => setShowEmployees(!showEmployees)}
              className="hover:bg-primary/10 transition-colors"
            >
              <Users className="w-4 h-4" />
            </Button>
          
          {/* Logout Button */}
          <Button
            variant="glass"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-red-500/10 transition-colors"
            title="Logout"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
          </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex">
        <main className="flex-1 p-4 space-y-4 max-w-3xl mx-auto w-full">

          {/* NEW COMMAND TRIGGER */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="neon" 
                className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
              >
                <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20">
                  <Plus className="w-5 h-5" />
                </div>
                NEW COMMAND / TASK
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden rounded-3xl shadow-2xl">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                  Create New Command
                </DialogTitle>
              </DialogHeader>
              
              <div className="px-6 py-2 space-y-6 max-h-[80vh] overflow-y-auto pb-8">
                {/* Employee Selector - Vertical */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                    <Users className="w-3 h-3" /> Assign To Team Member
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setSelectedAssignee("All")}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                        selectedAssignee === "All" 
                          ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10" 
                          : "bg-secondary/40 border-border/50 text-muted-foreground hover:bg-secondary/60"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold italic tracking-tighter">ALL</div>
                      <span className="text-sm font-medium">Assign to All Team</span>
                    </button>
                    {team.map((emp) => (
                      <button
                        key={emp.$id}
                        onClick={() => setSelectedAssignee(emp.name)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                          selectedAssignee === emp.name 
                            ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10" 
                            : "bg-secondary/40 border-border/50 text-muted-foreground hover:bg-secondary/60"
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold uppercase">
                          {emp.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{emp.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority & Deadline */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Priority</label>
                    <div className="flex bg-secondary/40 p-1 rounded-xl border border-border/50">
                      {(["high", "medium", "low"] as Priority[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPriority(p)}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                            priority === p 
                              ? "bg-background text-primary shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Deadline</label>
                    <button
                      onClick={() => setShowDeadlinePicker(!showDeadlinePicker)}
                      className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-secondary/40 border border-border/50 text-[10px] font-medium text-muted-foreground hover:bg-secondary/60 transition-all"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {taskDeadline ? new Date(taskDeadline).toLocaleDateString() : "Set Time"}
                    </button>
                  </div>
                </div>

                {/* Deadline Picker Input */}
                {showDeadlinePicker && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <input
                      type="datetime-local"
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="w-full p-3 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </motion.div>
                )}

                {/* Message Area */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Task Details</label>
                  <div className="relative group">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe the task or use voice command..."
                      className="min-h-[120px] bg-secondary/40 border-border/50 rounded-2xl p-4 text-sm focus-visible:ring-primary/50 group-hover:border-primary/30 transition-all"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="glass"
                        size="icon"
                        onClick={handleFileSelect}
                        className="w-10 h-10 rounded-xl hover:bg-white/10"
                      >
                        <ImagePlus className="w-5 h-5" />
                      </Button>
                      <Button
                        type="button"
                        variant={isRecording ? "neon" : "glass"}
                        size="icon"
                        onClick={handleMicToggle}
                        className={cn("w-10 h-10 rounded-xl", isRecording && "animate-pulse")}
                      >
                        <Mic className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* File preview */}
                {selectedFile && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 p-3 rounded-xl border border-border/50">
                    <span className="flex-1 truncate">📎 {selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="text-red-400 p-1 hover:bg-red-400/10 rounded-lg transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {isRecording && (
                   <div className="flex items-center gap-3 bg-primary/10 p-3 rounded-xl border border-primary/20 animate-pulse">
                     <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Recording Audio...</span>
                   </div>
                )}

                <Button 
                  onClick={handleSend} 
                  variant="neon" 
                  className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-primary to-blue-500 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  ASSIGN TASK
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* QUICK AUDIO RECORDER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
            <AudioRecorder 
              onRecordingComplete={handleAudioRecordingComplete} 
              className="max-w-none shadow-none border-dashed bg-primary/5 border-primary/20"
            />
          </motion.div>

          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* TASK LIST */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Live Task Feed ({filteredTasks.length})
            </h2>

            <AnimatePresence>
              {filteredTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <TaskCard task={task} index={i} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </main>

        {/* Employee Panel - Desktop */}
        <AnimatePresence>
          {showEmployees && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:block border-l border-border h-[calc(100vh-3.5rem)]"
            >
              <EmployeePanel onAddEmployee={() => setShowAddEmployee(true)} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Employee Panel - Mobile overlay */}
        <AnimatePresence>
          {showEmployees && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed inset-y-0 right-0 w-full max-w-sm z-50 lg:hidden bg-background border-l border-border"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Team</h2>
                <button onClick={() => setShowEmployees(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <EmployeePanel onAddEmployee={() => setShowAddEmployee(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ADD EMPLOYEE MODAL */}
      <AddEmployeeModal
        open={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
      />

    </div>
  );

};

export default Dashboard;