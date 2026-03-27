import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser, getUserRole } from "../lib/appwrite";

interface Props {
  children: JSX.Element;
  requiredRole?: "owner"; // only owner needs restriction
}

// You can add your particular admin emails here so they always bypass the check
const ADMIN_EMAILS = ["admin@example.com", "ceo@gmail.com"];

const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();

      // Not logged in
      if (!user) {
        setRedirectTo("/login");
        setLoading(false);
        return;
      }

      const role = await getUserRole();
      console.log("ProtectedRoute - User role:", role);

      const isHardcodedAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());

      // If this is an owner route and user is not admin
      if (requiredRole === "owner" && role !== "admin" && !isHardcodedAdmin) {
        setRedirectTo("/command-board");
        setLoading(false);
        return;
      }

      // Authorized for this route
      setAuthorized(true);
      setLoading(false);

    } catch (error) {
      console.error("Auth error:", error);
      setRedirectTo("/login");
      setLoading(false);
    }
  };

  // Wait until auth check finishes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if needed
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  // Authorized
  return children;
};

export default ProtectedRoute;