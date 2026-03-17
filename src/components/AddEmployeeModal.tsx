import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createEmployee } from "../lib/api";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onEmployeeAdded?: () => void;
}

const AddEmployeeModal = ({ open, onClose, onEmployeeAdded }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await createEmployee({
        name,
        email,
        department: department || "General"
      });
      
      toast({ title: "Success", description: "Employee added successfully" });
      setName("");
      setEmail("");
      setDepartment("");
      onClose();
      if (onEmployeeAdded) onEmployeeAdded();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to add employee", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass-card rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Add Employee</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@command.io"
                  className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">DEPARTMENT</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Engineering"
                  className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm mt-1"
                />
              </div>

              <Button 
                variant="neon" 
                className="w-full" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Employee"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddEmployeeModal;