import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Zap, Building2, Crown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { loginUser, getCurrentUser } from "../lib/appwrite";

const GridBackground = () => (
  <div className="absolute inset-0 grid-bg overflow-hidden">
    <div className="absolute inset-0 scan-line" />
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/30"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1.5, 0.5],
        }}
        transition={{
          duration: 2 + Math.random() * 3,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

type UserRole = "company" | "owner" | null;

const roleConfig = {
  company: { icon: Building2, label: "Company Dashboard", desc: "Access team management & tasks", redirect: "/command-board" },
  owner: { icon: Crown, label: "Prime User / Owner", desc: "Full admin control & analytics", redirect: "/dashboard" },
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if already logged in
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const savedRole = localStorage.getItem('userRole') as UserRole;
        if (savedRole === 'owner') {
          setSelectedRole('owner');
          // Auto-redirect to dashboard if already logged in as owner
          navigate('/dashboard');
        } else if (savedRole === 'company') {
          navigate('/command-board');
        }
      }
    } catch (error) {
      console.log("No active session");
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    
    // If company is selected, go directly (no login needed)
    if (role === 'company') {
      localStorage.setItem('userRole', 'company');
      navigate('/command-board');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast({
        title: "Role Required",
        description: "Please select a role to continue",
        variant: "destructive",
      });
      return;
    }

    if (!email || !password) {
      toast({
        title: "Fields Required",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Login with Appwrite
      const user = await loginUser(email, password);
      
      // Store user role
      localStorage.setItem("userRole", selectedRole);
      localStorage.setItem("userEmail", user.email || "");
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name || "Owner"}!`,
      });

      navigate("/dashboard");
      
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-background p-4">
      <GridBackground />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card rounded-2xl p-8 space-y-8">
          {/* Logo */}
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center neon-glow">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Smart Priority <span className="text-primary neon-text">Command</span>
            </h1>
            <p className="text-muted-foreground text-sm">Select your access level</p>
          </motion.div>

          {/* Role Selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3"
          >
            {(["company", "owner"] as const).map((role) => {
              const config = roleConfig[role];
              const Icon = config.icon;
              const isSelected = selectedRole === role;
              return (
                <motion.button
                  key={role}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleRoleSelect(role)}
                  className={`relative p-4 rounded-xl border text-left transition-all duration-300 ${
                    isSelected
                      ? "border-primary/60 bg-primary/10 neon-glow"
                      : "border-border bg-secondary/50 hover:border-primary/30"
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {config.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{config.desc}</p>
                  {role === 'company' && (
                    <span className="absolute bottom-2 right-2 text-[8px] text-green-500">
                      No login
                    </span>
                  )}
                  {isSelected && (
                    <motion.div
                      layoutId="role-indicator"
                      className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"
                      initial={false}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Form - only show after owner role selection */}
          <AnimatePresence>
            {selectedRole === 'owner' && (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleLogin}
                className="space-y-5 overflow-hidden"
              >
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                      placeholder="owner@command.io"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-10 pr-10 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Test credentials hint - remove in production */}
                <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded-lg">
                  <p className="font-medium mb-1">Test credentials:</p>
                  <p>Email: test@command.io</p>
                  <p>Password: password123</p>
                </div>

                <div className="space-y-3 pt-2">
                  <Button 
                    type="submit" 
                    variant="neon" 
                    className="w-full h-11 text-sm font-semibold"
                    disabled={loading}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {loading ? "Logging in..." : `Access Owner Panel`}
                  </Button>

                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-border flex-1" />
                    <div className="border-t border-border flex-1" />
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;