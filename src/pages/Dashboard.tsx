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
  Calendar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import TaskCard from "@/components/TaskCard";
import EmployeePanel from "@/components/EmployeePanel";
import AddEmployeeModal from "@/components/AddEmployeeModal";

import { getTasks } from "../lib/api";
import { createTask } from "../lib/api";

export type Priority = "high" | "medium" | "low";

export type TaskItem = {
  id: string;
  sender: string;
  message: string;
  priority: Priority;
  timestamp: string;
  completed?: boolean;
  url?: string;
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

  const navigate = useNavigate();
  const { toast } = useToast();

  /* ---------------- LOAD TASKS ---------------- */

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await getTasks();

        const formatted = data
          .filter((t: any) => t.status !== "completed")   // ✅ hide completed tasks
          .map((t: any) => ({
            id: t.$id,
            sender: t.employee_name,
            message: t.description || t.title || "No description",
            priority: (t.priority || "low").toLowerCase() as Priority,
            timestamp: t.deadline || "No deadline",
            completed: false,
            url: t.url
        }));

        setTasks(formatted);

      } catch (err) {
        console.error("Failed loading tasks", err);
      }
    }

    loadTasks();

  }, []);

  /* ---------------- FILTER ---------------- */

  const filteredTasks = tasks.filter((t) =>
    t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ---------------- CREATE TASK ---------------- */

  const handleSend = async () => {
  if (!message.trim() && !selectedFile) return;
  
  try {
    // ✅ USE FLASK BACKEND FOR ALL TASKS (with or without file)
    const newTask = await createTask({
      title: message || (selectedFile ? selectedFile.name : "File attachment"),
      description: message || "",
      employee_name: "You",
      priority: priority,
      deadline: taskDeadline || "Not Set"  // Use deadline if set
    }, selectedFile || undefined);  // Pass file if selected
    
    // Add to local state
    const taskItem: TaskItem = {
      id: newTask.$id || Date.now().toString(),
      sender: "You",
      message: message || `📎 ${selectedFile?.name}`,
      priority,
      timestamp: taskDeadline || "Just now", // Show deadline if set
      completed: false,
      url: newTask.url  // URL comes from backend after storage upload
    };
    
    setTasks([taskItem, ...tasks]);
    setMessage("");
    setSelectedFile(null);
    setTaskDeadline(""); // Reset deadline
    setShowDeadlinePicker(false); // Hide deadline picker
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    toast({ title: "Task Created", description: `Priority: ${priority}` });
  } catch (error) {
    console.error("Failed to create task:", error);
    toast({ 
      title: "Error", 
      description: "Failed to create task", 
      variant: "destructive" 
    });
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

  /* ---------------- VOICE ---------------- */

  const handleMic = () => {

    if (isListening) {

      setIsListening(false);

      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }

      return;

    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {

      toast({
        title: "Not Supported",
        description: "Speech recognition not supported",
        variant: "destructive"
      });

      return;

    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {

      let transcript = "";

      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setMessage(transcript);

    };

    recognition.onend = () => {

      setIsListening(false);
      recognitionRef.current = null;

    };

    recognition.start();

    recognitionRef.current = recognition;

    setIsListening(true);

  };

  /* ---------------- UI ---------------- */

  return (

    <div className="min-h-screen bg-background grid-bg">

      {/* HEADER */}
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left side - Menu button only (compass icon removed) */}
          <div className="flex items-center gap-3">
            
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

          {/* COMMAND INPUT */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4 space-y-3"
          >
            <div className="flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Enter command or task..."
                className="flex-1 h-11 px-4 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />

              <Button variant="glass" size="icon" onClick={handleMic} title="Voice input">
                <Mic className="w-4 h-4" />
              </Button>

              <Button variant="glass" size="icon" onClick={handleFileSelect} title="Attach file">
                <ImagePlus className="w-4 h-4" />
              </Button>

              <Button variant="neon" size="icon" onClick={handleSend} title="Send">
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,audio/*"
            />

            {/* File preview */}
            {selectedFile && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary p-2 rounded">
                <span>📎 {selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="text-red-400">✕</button>
              </div>
            )}

            {/* Deadline Button and Picker */}
            <div className="flex items-center gap-2">
              <Button
                variant="glass"
                size="sm"
                onClick={() => setShowDeadlinePicker(!showDeadlinePicker)}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                {taskDeadline ? "Change Deadline" : "Set Deadline"}
              </Button>
              
              {taskDeadline && (
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                  📅 {new Date(taskDeadline).toLocaleDateString()} at {new Date(taskDeadline).toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Deadline Picker */}
            <AnimatePresence>
              {showDeadlinePicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    type="datetime-local"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => {
                        setTaskDeadline("");
                        setShowDeadlinePicker(false);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Priority selector */}
            <div className="flex gap-2">
              {(["high", "medium", "low"] as Priority[]).map((p) => (
                <Button
                  key={p}
                  variant={priority === p ? "neon" : "glass"}
                  size="sm"
                  onClick={() => setPriority(p)}
                  className="flex-1 capitalize"
                >
                  {p}
                </Button>
              ))}
            </div>
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
                  <TaskCard task={task} />
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