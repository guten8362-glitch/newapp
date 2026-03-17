import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ListTodo,
  CheckCircle2,
  Send,
  UserPlus,
  Clock,
  ChevronDown,
  Calendar,
  ImagePlus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import MessageDialog from "@/components/MessageDialog";
import { getEmployeeProfile, createTask } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  online: "text-status-online",
  busy: "text-status-busy",
  offline: "text-status-offline"
};

const priorityDot: Record<string, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low"
};

const priorityGlow: Record<string, string> = {
  high: "shadow-[0_0_12px_hsl(var(--priority-high)/0.4)]",
  medium: "",
  low: ""
};

type Priority = "high" | "medium" | "low";

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTasks, setShowTasks] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  
  // Task assignment states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskMessage, setTaskMessage] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadEmployee() {
      try {
        const employeeName = decodeURIComponent(id || "");
        const data = await getEmployeeProfile(employeeName);

        if (!data || !data.name) {
          setEmployee(null);
          return;
        }

        const nameParts = data.name.split(" ");
        const avatar = nameParts
          .map((n: string) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();

        setEmployee({
          name: data.name,
          department: data.department || "General",
          status: "online",
          avatar,
          assigned: data.assigned_tasks ?? 0,
          completed: data.completed_tasks ?? 0,
          email: data.email || "",
          ongoing: (data.ongoing || []).map((task: any) => ({
            id: task.$id,
            message: task.title || task.description || "No description",
            priority: (task.priority || "low").toLowerCase(),
            timestamp: task.deadline
              ? new Date(task.deadline).toLocaleDateString()
              : "No deadline"
          })),
          completedTasks: (data.completed || []).map((task: any) => ({
            id: task.$id,
            message: task.title || task.description || "No description",
            priority: (task.priority || "low").toLowerCase(),
            timestamp: task.deadline
              ? new Date(task.deadline).toLocaleDateString()
              : "No deadline"
          }))
        });
      } catch (err) {
        console.error("Failed loading employee", err);
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) loadEmployee();
  }, [id]);

  // File handling
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit task assignment
  const handleAssignTask = async () => {
    if (!taskMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task description",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Assigning task:", {
        message: taskMessage,
        priority: taskPriority,
        deadline: taskDeadline,
        hasFile: !!selectedFile
      });

      // Create task with optional file and deadline
      const newTask = await createTask(
        {
          title: taskMessage,
          description: taskMessage,
          employee_name: employee.name,
          priority: taskPriority,
          deadline: taskDeadline || "Not Set"
        },
        selectedFile || undefined // Pass file if selected, otherwise undefined
      );

      console.log("Task assigned successfully:", newTask);

      // Reset form
      setTaskMessage("");
      setTaskPriority("medium");
      setTaskDeadline("");
      setSelectedFile(null);
      setShowTaskForm(false);
      
      toast({
        title: "Success",
        description: "Task assigned successfully!"
      });
      
      // Refresh employee data
      const updatedData = await getEmployeeProfile(employee.name);
      const nameParts = updatedData.name.split(" ");
      const avatar = nameParts
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

      setEmployee({
        name: updatedData.name,
        department: updatedData.department || "General",
        status: "online",
        avatar,
        assigned: updatedData.assigned_tasks ?? 0,
        completed: updatedData.completed_tasks ?? 0,
        email: updatedData.email || "",
        ongoing: (updatedData.ongoing || []).map((task: any) => ({
          id: task.$id,
          message: task.title || task.description || "No description",
          priority: (task.priority || "low").toLowerCase(),
          timestamp: task.deadline
            ? new Date(task.deadline).toLocaleDateString()
            : "No deadline"
        })),
        completedTasks: (updatedData.completed || []).map((task: any) => ({
          id: task.$id,
          message: task.title || task.description || "No description",
          priority: (task.priority || "low").toLowerCase(),
          timestamp: task.deadline
            ? new Date(task.deadline).toLocaleDateString()
            : "No deadline"
        }))
      });
      
    } catch (error) {
      console.error("Failed to assign task:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign task",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tasksToShow = employee?.ongoing || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid-bg p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-background grid-bg p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Employee not found</p>
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg p-4">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,audio/*"
        />

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>

        {/* Employee Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary neon-glow">
              {employee.avatar}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{employee.name}</h1>
              <p className="text-sm text-muted-foreground">{employee.department}</p>
              <p className={`text-xs font-medium capitalize ${statusColors[employee.status]}`}>● {employee.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <ListTodo className="w-5 h-5 text-primary mx-auto" />
              <p className="text-2xl font-bold text-foreground">{employee.assigned}</p>
              <p className="text-xs text-muted-foreground">Ongoing Tasks</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <CheckCircle2 className="w-5 h-5 text-status-online mx-auto" />
              <p className="text-2xl font-bold text-foreground">{employee.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>

          <div className="flex gap-3">
  <Button
    variant="glass"
    className="flex-1"
    onClick={() => setShowTaskForm(!showTaskForm)}
  >
    <UserPlus className="w-4 h-4" /> {showTaskForm ? "Cancel" : "Assign Task"}
  </Button>
</div>
        </motion.div>

        {/* Task Assignment Form */}
        <AnimatePresence>
          {showTaskForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card rounded-xl p-5 space-y-4"
            >
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Assign New Task to {employee.name}
              </h3>
              
              {/* Task Description */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Task Description *</label>
                <textarea
                  value={taskMessage}
                  onChange={(e) => setTaskMessage(e.target.value)}
                  placeholder="Enter task description..."
                  className="w-full p-3 rounded-lg bg-secondary border border-border text-foreground text-sm min-h-[80px] focus:outline-none focus:border-primary/50"
                  required
                />
              </div>

              {/* Priority Selector */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                <div className="flex gap-2">
                  {(["high", "medium", "low"] as Priority[]).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={taskPriority === p ? "neon" : "glass"}
                      onClick={() => setTaskPriority(p)}
                      className="flex-1 capitalize"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Deadline Picker */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Deadline (Optional)</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="datetime-local"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="flex-1 p-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* File Attachment */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Attachment (Optional)</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    onClick={handleFileSelect}
                    className="flex items-center gap-2"
                  >
                    <ImagePlus className="w-4 h-4" />
                    {selectedFile ? "Change file" : "Attach file"}
                  </Button>
                  
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-xs bg-secondary/50 p-2 rounded-lg flex-1">
                      <span className="truncate text-foreground">📎 {selectedFile.name}</span>
                      <button
                        onClick={clearSelectedFile}
                        className="text-red-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="neon"
                  onClick={handleAssignTask}
                  disabled={isSubmitting || !taskMessage.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Assigning...
                    </div>
                  ) : (
                    "Assign Task"
                  )}
                </Button>
                <Button
                  variant="glass"
                  onClick={() => setShowTaskForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ongoing Tasks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setShowTasks(!showTasks)}
            className="flex items-center justify-between w-full glass-card rounded-xl p-4 hover:bg-secondary/30 transition-colors"
          >
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-primary" />
              Ongoing Tasks ({tasksToShow.length})
            </span>
            <motion.div animate={{ rotate: showTasks ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showTasks && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-2 mt-2"
              >
                {tasksToShow.length > 0 ? (
                  tasksToShow.map((task: any, i: number) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`glass-card rounded-lg p-3 border-l-4 ${
                        task.priority === "high"
                          ? "border-l-priority-high bg-priority-high/5"
                          : task.priority === "medium"
                          ? "border-l-priority-medium bg-priority-medium/5"
                          : "border-l-priority-low bg-priority-low/5"
                      } ${priorityGlow[task.priority]}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${priorityDot[task.priority]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{task.message}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            {task.timestamp}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No ongoing tasks for this employee
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Completed Tasks Section */}
        {employee.completedTasks?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-status-online" />
                Completed Tasks ({employee.completedTasks.length})
              </h3>
              <div className="space-y-2">
                {employee.completedTasks.map((task: any, i: number) => (
                  <div key={task.id || i} className="text-xs text-muted-foreground line-through opacity-60">
                    {task.message}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <MessageDialog
        open={showMessage}
        onClose={() => setShowMessage(false)}
        employeeName={employee.name}
        employeeAvatar={employee.avatar}
      />
    </div>
  );
};

export default EmployeeProfile;