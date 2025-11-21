import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/supabase-query-client";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

type AuthContextType = {
  user: SelectUser | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<{ user: SelectUser; session: Session }, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ user: SelectUser; session: Session }, Error, RegisterData>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  username: string;
  name?: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setIsInitialized(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        queryClient.setQueryData(["/api/auth/user"], null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isInitialized && !!session,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      const data = await res.json();
      setSession(data.session);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      const data = await res.json();
      setSession(data.session);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
      queryClient.invalidateQueries();
      toast({
        title: "Registration successful",
        description: "Welcome! Your account has been created.",
      });
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
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      setSession(null);
      queryClient.clear();
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      setSession(null);
      queryClient.clear();
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        session,
        isLoading: !isInitialized || isLoading,
        error,
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
