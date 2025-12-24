import { BarChart3, ArrowUpRight, ArrowDownRight, Globe, Image, Zap } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
}

function StatCard({ title, value, change, positive, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        <div className={`flex items-center gap-1 text-xs ${positive ? "text-success" : "text-destructive"}`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      </div>
    </div>
  );
}

const recentRequests = [
  { path: "/autopfp/random", status: 200, time: "12ms", timestamp: "2 min ago" },
  { path: "/avatars/user_12345/avatar.png", status: 200, time: "8ms", timestamp: "5 min ago" },
  { path: "/autopfp/anime/sakura.gif", status: 200, time: "15ms", timestamp: "8 min ago" },
  { path: "/avatars/user_99999/profile.png", status: 404, time: "3ms", timestamp: "12 min ago" },
  { path: "/autopfp/abstract/waves.gif", status: 200, time: "22ms", timestamp: "15 min ago" },
];

export function Analytics() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor your CDN performance and usage
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Requests"
          value="124.5K"
          change="+12.3%"
          positive={true}
          icon={Globe}
        />
        <StatCard
          title="Files Served"
          value="892"
          change="+5.2%"
          positive={true}
          icon={Image}
        />
        <StatCard
          title="Avg Response"
          value="14ms"
          change="-8.1%"
          positive={true}
          icon={Zap}
        />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Recent Requests</h3>
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {recentRequests.map((req, idx) => (
            <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                  req.status === 200 
                    ? "bg-success/10 text-success" 
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {req.status}
                </span>
                <code className="font-mono text-sm text-foreground">{req.path}</code>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="font-mono">{req.time}</span>
                <span>{req.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Top Endpoints</h3>
          <div className="space-y-3">
            {[
              { path: "/autopfp/random", requests: "45.2K" },
              { path: "/autopfp/anime", requests: "28.1K" },
              { path: "/avatars", requests: "21.8K" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <code className="font-mono text-sm text-foreground">{item.path}</code>
                <span className="text-sm text-muted-foreground">{item.requests}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Status Codes</h3>
          <div className="space-y-3">
            {[
              { code: "200 OK", percentage: "94.2%", color: "text-success" },
              { code: "304 Not Modified", percentage: "4.1%", color: "text-primary" },
              { code: "404 Not Found", percentage: "1.7%", color: "text-destructive" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className={`font-mono text-sm ${item.color}`}>{item.code}</span>
                <span className="text-sm text-muted-foreground">{item.percentage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
