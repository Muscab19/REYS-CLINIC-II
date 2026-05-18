// src/components/RoleBasedRoute.jsx
import ProtectedRoute from './ProtectedRoute';

const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireSuperAdmin = false, 
  requireAdmin = false 
}) => {
  
  // If specific roles are provided, check against them
  const checkRoleAccess = (userRole) => {
    if (allowedRoles.length > 0) {
      return allowedRoles.includes(userRole);
    }
    
    // Otherwise use the boolean flags
    if (requireSuperAdmin) {
      return userRole === 'superadmin';
    }
    
    if (requireAdmin) {
      return userRole === 'admin' || userRole === 'superadmin';
    }
    
    return true;
  };

  return (
    <ProtectedRoute 
      requireSuperAdmin={requireSuperAdmin} 
      requireAdmin={requireAdmin}
    >
      {({ user }) => {
        if (!checkRoleAccess(user.role)) {
          return <Navigate to="/" replace />;
        }
        return children;
      }}
    </ProtectedRoute>
  );
};

export default RoleBasedRoute;