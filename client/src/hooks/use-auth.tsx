import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = {
  username: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [localUser, setLocalUser] = useState<SelectUser | null>(null);
  const [localLoading, setLocalLoading] = useState(true);

  // Check for existing Supabase session on mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLocalLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch user data from our database
        fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
          .then((res) => res.ok ? res.json() : null)
          .then((user) => {
            setLocalUser(user);
            setLocalLoading(false);
          })
          .catch(() => setLocalLoading(false));
      } else {
        setLocalLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          fetch("/api/user", {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          })
            .then((res) => res.ok ? res.json() : null)
            .then((user) => setLocalUser(user))
            .catch(() => setLocalUser(null));
        } else {
          setLocalUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      if (!isSupabaseConfigured) {
        // Fallback to local auth
        const res = await apiRequest("POST", "/api/login", credentials);
        return await res.json();
      }

      // Look up email by username
      const res = await fetch(`/api/user-by-username?username=${encodeURIComponent(credentials.username)}`);
      if (!res.ok) throw new Error("Invalid credentials");
      const userData = await res.json();

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: credentials.password,
      });

      if (error) throw new Error(error.message);
      if (!data.session) throw new Error("Login failed");

      return userData;
    },
    onSuccess: (user: SelectUser) => {
      setLocalUser(user);
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      if (!isSupabaseConfigured) {
        // Fallback to local auth
        const res = await apiRequest("POST", "/api/register", credentials);
        return await res.json();
      }

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email!,
        password: credentials.password!,
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Registration failed");

      // Create user in our database
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      setLocalUser(user);
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      setLocalUser(null);
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: localUser,
        isLoading: localLoading,
        error: null,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
