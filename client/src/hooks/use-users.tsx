import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useUsers() {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const getUserName = (userId: number | null | undefined): string => {
    if (!userId) return "Unknown";
    const user = users.find((u) => u.id === userId);
    return user?.name || user?.username || "Unknown";
  };

  return { users, getUserName };
}
