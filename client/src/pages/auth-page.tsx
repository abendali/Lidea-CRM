import { useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";
import logoUrl from "@assets/logo-lidea_1762250027138.png";
import warehouseUrl from "@assets/image_1762252583003.png";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "" });

  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter your username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required
                    data-testid="input-login-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    data-testid="input-login-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Contact your administrator if you need an account
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div 
        className="hidden lg:flex lg:flex-1 items-center justify-center p-12 relative bg-cover bg-center"
        style={{ backgroundImage: `url(${warehouseUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-black/50" />
        <div className="relative z-10 text-center space-y-6 max-w-md">
          <img src={logoUrl} alt="LiDEA" className="w-36 mx-auto" />
          <h1 className="text-4xl font-bold text-white">Store Management System</h1>
          <p className="text-lg text-white/90">
            Manage your inventory, track cashflow, and grow your business with ease.
          </p>
          <div className="flex items-center justify-center gap-4 text-white/80 pt-4">
            <div className="text-center">
              <Store className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Inventory</p>
            </div>
            <div className="text-center">
              <Store className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Cashflow</p>
            </div>
            <div className="text-center">
              <Store className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
