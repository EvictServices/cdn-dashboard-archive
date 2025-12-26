import { Sidebar } from "@/components/cdn/Sidebar";
import { useLocation } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/" || path === "/files") return "files";
    if (path === "/api-keys") return "api-keys";
    if (path === "/endpoints") return "endpoints";
    if (path === "/analytics") return "analytics";
    if (path === "/settings") return "settings";
    return "files";
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={getActiveTab()} setActiveTab={() => {}} />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
