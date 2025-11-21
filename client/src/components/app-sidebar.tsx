import { Home, Package, DollarSign, Settings, LogOut, ClipboardList, Search, FileText, Star, Users, CreditCard, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-supabase-auth";
import logoUrl from "@assets/logo-lidea_1762250027138.png";

const mainItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "All pages",
    url: "/inventory",
    icon: FileText,
  },
  {
    title: "Reports",
    url: "/workshop-orders",
    icon: ClipboardList,
  },
  {
    title: "Products",
    url: "/inventory",
    icon: Package,
  },
  {
    title: "Task",
    url: "/cashflow",
    icon: DollarSign,
  },
];

const featuresItems = [
  {
    title: "Features",
    url: "/settings",
    icon: Star,
  },
  {
    title: "Users",
    url: "/settings",
    icon: Users,
  },
  {
    title: "Pricing",
    url: "/settings",
    icon: CreditCard,
  },
  {
    title: "Integrations",
    url: "/settings",
    icon: Zap,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/auth");
      },
    });
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-lg text-foreground" data-testid="text-logo">Lidea X</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search for..." 
            className="pl-9 bg-muted border-border"
            data-testid="input-search"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {featuresItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/settings"} data-testid="link-settings">
                  <Link href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-4">
        {user && (
          <div className="flex items-center gap-3 p-2 rounded-lg hover-elevate" data-testid="user-profile">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profilePicture || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{user.name || user.username}</p>
              <p className="text-xs text-muted-foreground">Account settings</p>
            </div>
          </div>
        )}
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          data-testid="button-logout"
        >
          {logoutMutation.isPending ? "Logging out..." : "Get template"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
