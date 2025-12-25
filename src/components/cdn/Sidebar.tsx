import { cn } from "@/lib/utils";
import { Folder, Key, Settings, BarChart3, Globe, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: "files", label: "Files", icon: Folder },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "endpoints", label: "Endpoints", icon: Globe },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">CDN</h1>
            <p className="text-xs text-muted-foreground font-mono">v1.0.0</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === item.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">{user?.name}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          size="sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>

        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs font-medium text-foreground">System Online</span>
          </div>
          <p className="text-xs text-muted-foreground">All endpoints operational</p>
        </div>
      </div>
    </aside>
  );
}
