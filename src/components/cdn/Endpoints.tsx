import { Copy, Check, Lock, Unlock, Shuffle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Endpoint {
  path: string;
  description: string;
  protected: boolean;
  method: string;
  example?: string;
}

const baseUrl = "http://localhost:3001/cdn";

export function Endpoints() {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const pfpCategories = ['anime', 'cats', 'egirls', 'girls', 'boys', 'random'];
  
  const bannerCategories = ['anime', 'cute', 'imsg', 'random'];

  const endpoints: Endpoint[] = [
    {
      path: "/avatars/{userId}",
      description: "Get user avatar by user ID (public access)",
      protected: false,
      method: "GET",
      example: "/avatars/12345",
    },
    ...pfpCategories.map(category => ({
      path: `/autopfp/pfp/${category}`,
      description: `Get random ${category} profile picture${category === 'random' ? ' from any category' : ''}`,
      protected: true,
      method: "GET",
      example: `/autopfp/pfp/${category}`,
    })),
    ...bannerCategories.map(category => ({
      path: `/autopfp/banner/${category}`,
      description: `Get random ${category} banner${category === 'random' ? ' from any category' : ''}`,
      protected: true,
      method: "GET",
      example: `/autopfp/banner/${category}`,
    })),
  ];

  const [displayedEndpoints] = useState<Endpoint[]>(endpoints);

  const copyEndpoint = async (path: string) => {
    const fullUrl = `${baseUrl}${path}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedPath(path);
    toast.success("Endpoint copied to clipboard");
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">CDN Endpoints</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Available API endpoints for accessing your CDN
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Base URL:</span>
          <code className="px-3 py-1.5 rounded-md bg-secondary font-mono text-sm text-primary">
            {baseUrl}
          </code>
        </div>
      </div>

      <div className="space-y-4">
        {displayedEndpoints.map((endpoint) => (
          <div
            key={endpoint.path}
            className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded text-xs font-mono font-medium bg-primary/10 text-primary">
                  {endpoint.method}
                </span>
                {endpoint.path.includes("random") && (
                  <Shuffle className="w-4 h-4 text-accent" />
                )}
                {endpoint.protected ? (
                  <div className="flex items-center gap-1.5 text-warning">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="text-xs">Auth Required</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-success">
                    <Unlock className="w-3.5 h-3.5" />
                    <span className="text-xs">Public</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyEndpoint(endpoint.example || endpoint.path)}
              >
                {copiedPath === endpoint.path ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <code className="block px-3 py-2 rounded-md bg-secondary font-mono text-sm text-foreground mb-3">
              {endpoint.path}
            </code>

            <p className="text-sm text-muted-foreground">{endpoint.description}</p>

            {endpoint.example && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Example:</span>
                <code className="block mt-1 px-3 py-2 rounded-md bg-muted/50 font-mono text-xs text-foreground">
                  {baseUrl}{endpoint.example}
                </code>
              </div>
            )}

            {endpoint.protected && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Headers:</span>
                <code className="block mt-1 px-3 py-2 rounded-md bg-muted/50 font-mono text-xs text-foreground">
                  Authorization: Bearer {"<your-api-key>"}
                </code>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
