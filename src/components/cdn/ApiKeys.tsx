import { useState } from "react";
import { Key, Copy, Trash2, Plus, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
}

const initialKeys: ApiKey[] = [
  {
    id: "1",
    name: "Production",
    key: "cdn_live_a1b2c3d4e5f6g7h8i9j0",
    createdAt: "2024-01-15",
    lastUsed: "2024-01-20",
  },
  {
    id: "2",
    name: "Development",
    key: "cdn_test_x9y8z7w6v5u4t3s2r1q0",
    createdAt: "2024-01-10",
    lastUsed: null,
  },
];

export function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyKey = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteKey = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("API key deleted");
  };

  const createKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `cdn_${Math.random().toString(36).slice(2, 22)}`,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: null,
    };
    setKeys((prev) => [...prev, newKey]);
    setNewKeyName("");
    toast.success("API key created");
  };

  const maskKey = (key: string) => {
    return key.slice(0, 8) + "•".repeat(16) + key.slice(-4);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">API Keys</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage authentication keys for protected endpoints
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">Create New Key</h3>
        <div className="flex gap-3">
          <Input
            placeholder="Key name (e.g., Production)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 bg-secondary border-border"
          />
          <Button onClick={createKey} className="glow-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Key
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {keys.map((apiKey) => (
          <div
            key={apiKey.id}
            className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{apiKey.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    Created {apiKey.createdAt}
                    {apiKey.lastUsed && ` • Last used ${apiKey.lastUsed}`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteKey(apiKey.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-md bg-secondary font-mono text-sm text-foreground">
                {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleKeyVisibility(apiKey.id)}
              >
                {visibleKeys.has(apiKey.id) ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyKey(apiKey.key, apiKey.id)}
              >
                {copiedId === apiKey.id ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
