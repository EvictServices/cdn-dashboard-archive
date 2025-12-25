import { useState, useEffect } from "react";
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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/keys`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch API keys:', response.status, errorData);
        throw new Error(errorData.error || "Failed to fetch API keys");
      }
      const data = await response.json();
      setKeys(data);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error(`Failed to load API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

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

  const deleteKey = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/keys/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to delete API key");
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API key deleted");
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key");
    }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ name: newKeyName }),
      });
      if (!response.ok) throw new Error("Failed to create API key");
      const newKey = await response.json();
      setKeys((prev) => [newKey, ...prev]);
      setNewKeyName("");
      toast.success("API key created");
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Failed to create API key");
    }
  };

  const maskKey = (key: string) => {
    return key.slice(0, 8) + "•".repeat(16) + key.slice(-4);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-slide-in">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">API Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

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
        {keys.length === 0 ? (
          <div className="text-center py-12 rounded-lg border border-border bg-card">
            <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No API keys yet. Create one to get started.</p>
          </div>
        ) : (
          keys.map((apiKey) => (
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
          ))
        )}
      </div>
    </div>
  );
}
