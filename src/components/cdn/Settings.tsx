import { Save, Globe, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface SettingsData {
  base_url: string;
  custom_domain: string;
  require_auth_avatars: boolean;
  rate_limiting: boolean;
  cors_enabled: boolean;
  cache_ttl: number;
  cdn_caching: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    base_url: "https://cdn.azron.net",
    custom_domain: "",
    require_auth_avatars: true,
    rate_limiting: true,
    cors_enabled: true,
    cache_ttl: 86400,
    cdn_caching: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your CDN settings and preferences
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">General</h3>
              <p className="text-sm text-muted-foreground">Basic CDN configuration</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base-url">Base URL</Label>
              <Input
                id="base-url"
                value={settings.base_url}
                onChange={(e) => setSettings({ ...settings, base_url: e.target.value })}
                className="bg-secondary border-border font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-domain">Custom Domain</Label>
              <Input
                id="custom-domain"
                placeholder="cdn.example.com"
                value={settings.custom_domain}
                onChange={(e) => setSettings({ ...settings, custom_domain: e.target.value })}
                className="bg-secondary border-border font-mono"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Security</h3>
              <p className="text-sm text-muted-foreground">Authentication and access control</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Auth for /avatars</Label>
                <p className="text-sm text-muted-foreground">
                  Protect avatar endpoints with API key
                </p>
              </div>
              <Switch
                checked={settings.require_auth_avatars}
                onCheckedChange={(checked) => setSettings({ ...settings, require_auth_avatars: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Rate Limiting</Label>
                <p className="text-sm text-muted-foreground">
                  Limit requests per API key
                </p>
              </div>
              <Switch
                checked={settings.rate_limiting}
                onCheckedChange={(checked) => setSettings({ ...settings, rate_limiting: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>CORS Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Allow cross-origin requests
                </p>
              </div>
              <Switch
                checked={settings.cors_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, cors_enabled: checked })}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Caching</h3>
              <p className="text-sm text-muted-foreground">Control file caching behavior</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cache-ttl">Cache TTL (seconds)</Label>
              <Input
                id="cache-ttl"
                type="number"
                value={settings.cache_ttl}
                onChange={(e) => setSettings({ ...settings, cache_ttl: parseInt(e.target.value) })}
                className="bg-secondary border-border font-mono"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable CDN Caching</Label>
                <p className="text-sm text-muted-foreground">
                  Cache files at edge locations
                </p>
              </div>
              <Switch
                checked={settings.cdn_caching}
                onCheckedChange={(checked) => setSettings({ ...settings, cdn_caching: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="glow-primary" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
