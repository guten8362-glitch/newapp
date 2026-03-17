import { AlertTriangle } from "lucide-react";

const alerts = [
  {
    message: "Server room temperature exceeding safe limits",
    time: "2 min ago",
    type: "high"
  },
  {
    message: "Client meeting rescheduled to 4pm",
    time: "10 min ago",
    type: "medium"
  },
  {
    message: "Network outage detected on Floor 3",
    time: "25 min ago",
    type: "high"
  }
];

const Alerts = () => {
  return (
    <div className="min-h-screen bg-background p-6">

      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="w-6 h-6 text-red-400" />
        <h1 className="text-2xl font-bold">Alerts</h1>
      </div>

      <div className="space-y-4">

        {alerts.map((alert, i) => (
          <div
            key={i}
            className="glass-card border border-border rounded-lg p-4 flex justify-between"
          >
            <div>
              <p className="text-sm font-semibold">
                {alert.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {alert.time}
              </p>
            </div>

            <span
              className={`text-xs px-2 py-1 rounded ${
                alert.type === "high"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {alert.type}
            </span>
          </div>
        ))}

      </div>

    </div>
  );
};

export default Alerts;