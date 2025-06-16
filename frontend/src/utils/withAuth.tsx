import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "@tanstack/react-router";

interface DecodedToken {
  role: string;
  id: string;
  [key: string]: any;
}

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[]
) => {
  const ProtectedComponent: React.FC<P> = (props) => {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
      const checkAuth = () => {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate({to:"/sign-in"});
          return;
        }

        try {
          const decoded = jwtDecode<DecodedToken>(token);

          if (!allowedRoles.includes(decoded.role)) {
            navigate({to:"/sign-in"});
          }
        } catch (error) {
          localStorage.removeItem("token");
          navigate({to:"/sign-in"});
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [navigate]);

    if (isLoading) {
      return (
        <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      );
    }

    return <WrappedComponent {...props as P} />;
  };

  return ProtectedComponent;
};

export default withAuth;