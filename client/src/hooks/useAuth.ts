import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

// Define the User type to match the data structure from your API
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    // Use the query function that returns null on 401 to prevent crashing
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    // Set a stale time to avoid excessive refetching
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
