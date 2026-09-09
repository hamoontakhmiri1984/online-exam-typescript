import { Navigate } from 'react-router-dom';
import { getCurrentUser, type Role } from '../../api/authApi';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: Role[];
};

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
