import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Bell, LogOut, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, UserProfile } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

const TopNavbar = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    api.get("/auth/me").then((response) => setProfile(response.data)).catch(() => setProfile(null));
  }, []);

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <header className="h-16 border-b border-border/40 bg-background/60 backdrop-blur-xl flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-10 w-64 bg-secondary/40 border-border/40" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </Button>
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-secondary/40">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm leading-tight">
            <div>{profile?.full_name || "LexaAI User"}</div>
            <div className="text-xs text-muted-foreground">{profile?.email || "Signed in"}</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default TopNavbar;
