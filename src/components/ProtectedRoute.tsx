import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/appwrite';

// Define the allowed roles
type UserRole = 'owner' | 'company' | undefined;

interface Props {
  children: JSX.Element;
  requiredRole?: UserRole; // Make it optional
}

const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if user is logged in
      const user = await getCurrentUser();
      
      if (!user) {
        console.log("No user logged in");
        setAuthorized(false);
        setLoading(false);
        return;
      }

      // Get user role from localStorage (set during login)
      const userRole = localStorage.getItem('userRole') as UserRole;
      
      // If role is required, check it
      if (requiredRole && userRole !== requiredRole) {
        console.log(`Role mismatch: required ${requiredRole}, got ${userRole}`);
        setAuthorized(false);
      } else {
        console.log("User authorized");
        setAuthorized(true);
      }
      
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;