import { useState, useEffect } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getTeam, getTasks } from "@/lib/api";

type Employee = {
  id: string;
  name: string;
  department: string;
  tasks: number;
  avatar: string;
  presence: "active" | "idle" | "offline";
};

const EmployeePanel = ({ onAddEmployee }: { onAddEmployee: () => void }) => {

  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const loadTeam = async () => {
      try {
        const team = await getTeam();
        const tasks = await getTasks();

        const formatted = team.map((emp: any, index: number) => {
          const taskCount = tasks.filter(
            (task: any) =>
              task.employee_name === emp.name &&
              task.status === "ongoing"
          ).length;

          const presences: ("active" | "idle" | "offline")[] = ["active", "idle", "active"];
          const presence = presences[index % presences.length];

          return {
            id: emp.$id || index.toString(),
            name: emp.name || "Unknown",
            department: emp.department || "General",
            tasks: taskCount,
            avatar: emp.name ? emp.name.charAt(0).toUpperCase() : "?",
            presence: presence
          };
        });

        setEmployees(formatted);
      } catch (err) {
        console.error("Error loading team:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
    const interval = setInterval(loadTeam, 15000); // 15s refresh
    return () => clearInterval(interval);

  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="p-4 h-full overflow-y-auto">

      <div className="flex justify-between items-center mb-4">

        <h3 className="font-semibold">
          Team ({employees.length})
        </h3>

        <Button size="sm" onClick={onAddEmployee}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>

      </div>

      <div className="space-y-2">

        {employees.map((emp) => (

          <div
            key={emp.id}
            onClick={() =>
              navigate(`/employee/${encodeURIComponent(emp.name)}`)
            }
            className="p-3 bg-card rounded-lg cursor-pointer hover:bg-accent"
          >

            <div className="flex items-center gap-3">

              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                {emp.avatar}
              </div>

              <div className="flex-1">

                <p className="font-medium">
                  {emp.name}
                </p>

                <p className="text-sm text-muted-foreground">
                  {emp.department}
                </p>

                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    emp.presence === "active" ? "bg-green-500 animate-pulse" : 
                    emp.presence === "idle" ? "bg-yellow-500" : "bg-gray-500"
                  }`} />
                  <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70">
                    {emp.presence === "active" ? "Working" : emp.presence === "idle" ? "Idle" : "Offline"}
                  </span>
                </div>

              </div>

              <div className="text-sm">
                {emp.tasks} tasks
              </div>

              <ChevronRight className="w-4 h-4" />

            </div>

          </div>

        ))}

      </div>

    </div>
  );
};

export default EmployeePanel;