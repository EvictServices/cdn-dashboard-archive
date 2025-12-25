import { useState, useEffect } from "react";
import { BarChart3, ArrowUpRight, ArrowDownRight, Globe, Image, Zap } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface Stats {
  totalRequests: number;
  totalFiles: number;
  avgResponseTime: number;
  status200: number;
  status304: number;
  status404: number;
  statusOther: number;
}

interface Changes {
  requests: string;
  files: string;
  avgResponse: string;
}

interface RecentRequest {
  path: string;
  status: number;
  time: string;
  timestamp: string;
}

interface TopEndpoint {
  path: string;
  requests: string;
}

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

export function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [changes, setChanges] = useState<Changes | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [topEndpoints, setTopEndpoints] = useState<TopEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      
      const [statsRes, recentRes, topEndpointsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/stats`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/analytics/recent`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/analytics/top-endpoints`, { credentials: 'include' }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setChanges(statsData.changes);
      }

      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentRequests(recentData);
      }

      if (topEndpointsRes.ok) {
        const topData = await topEndpointsRes.json();
        setTopEndpoints(topData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusPercentage = (statusCount: number, total: number) => {
    if (total === 0) return '0.0%';
    return `${((statusCount / total) * 100).toFixed(1)}%`;
  };

  const totalStatusCodes = stats ? stats.status200 + stats.status304 + stats.status404 + stats.statusOther : 0;

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
          value={stats ? formatNumber(stats.totalRequests) : '0'}
          change={`${changes?.requests || '0.0'}%`}
          positive={parseFloat(changes?.requests || '0') >= 0}
          icon={Globe}
        />
        <StatCard
          title="Files Served"
          value={stats ? formatNumber(stats.totalFiles) : '0'}
          change={`${changes?.files || '0.0'}%`}
          positive={parseFloat(changes?.files || '0') >= 0}
          icon={Image}
        />
        <StatCard
          title="Avg Response"
          value={stats ? `${stats.avgResponseTime}ms` : '0ms'}
          change={`${Math.abs(parseFloat(changes?.avgResponse || '0'))}%`}
          positive={parseFloat(changes?.avgResponse || '0') < 0}
          icon={Zap}
        />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Recent Requests</h3>
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {recentRequests.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No requests logged yet
            </div>
          ) : (
            recentRequests.map((req, idx) => (
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
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Top Endpoints</h3>
          <div className="space-y-3">
            {topEndpoints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              topEndpoints.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <code className="font-mono text-sm text-foreground truncate">{item.path}</code>
                  <span className="text-sm text-muted-foreground ml-2">{item.requests}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Status Codes</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-success">200 OK</span>
              <span className="text-sm text-muted-foreground">
                {stats ? getStatusPercentage(stats.status200, totalStatusCodes) : '0%'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-primary">304 Not Modified</span>
              <span className="text-sm text-muted-foreground">
                {stats ? getStatusPercentage(stats.status304, totalStatusCodes) : '0%'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-destructive">404 Not Found</span>
              <span className="text-sm text-muted-foreground">
                {stats ? getStatusPercentage(stats.status404, totalStatusCodes) : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
