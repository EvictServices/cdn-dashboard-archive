import { useState, useEffect } from "react";
import { Folder, Image, Lock, Unlock, ChevronRight, RefreshCw, Copy, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FileNode {
  name: string;
  type: "folder" | "file";
  path: string;
  protected?: boolean;
  children?: FileNode[];
  size?: number;
}

interface FolderItemProps {
  node: FileNode;
  depth?: number;
  onCopyUrl: (path: string) => void;
  onPreview: (path: string, name: string) => void;
}

function FolderItem({ node, depth = 0, onCopyUrl, onPreview }: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const isFolder = node.type === "folder";

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div>
      <div
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 rounded-md transition-colors text-sm group",
          depth > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <button
          onClick={() => {
            if (isFolder) {
              setIsOpen(!isOpen);
            } else {
              onPreview(node.path, node.name);
            }
          }}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {isFolder && (
            <ChevronRight
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                isOpen && "rotate-90"
              )}
            />
          )}
          {isFolder ? (
            <Folder className="w-4 h-4 text-primary" />
          ) : (
            <Image className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="flex-1 font-mono text-foreground">{node.name}</span>
          {node.protected !== undefined && (
            node.protected ? (
              <Lock className="w-3.5 h-3.5 text-warning" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-success" />
            )
          )}
          {node.size !== undefined && (
            <span className="text-xs text-muted-foreground">{formatFileSize(node.size)}</span>
          )}
        </button>
        {!isFolder && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onCopyUrl(node.path)}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <FolderItem key={idx} node={child} depth={depth + 1} onCopyUrl={onCopyUrl} onPreview={onPreview} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileBrowser() {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string; path: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/files/files`, {
        credentials: "include",
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch files:', response.status, errorData);
        throw new Error(errorData.error || "Failed to fetch files");
      }
      
      const data = await response.json();
      setFileTree(data.files || []);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Request timed out. Server may be offline.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Cannot connect to server. Please check your connection.');
      } else {
        console.error("Error fetching files:", error);
        toast.error(`Failed to load files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleCopyUrl = async (filePath: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/files/file-url?path=${encodeURIComponent(filePath)}`,
        { credentials: "include", signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error("Failed to get file URL");
      }
      
      const data = await response.json();
      await navigator.clipboard.writeText(data.url);
      setCopiedPath(filePath);
      toast.success("URL copied to clipboard");
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Request timed out. Server may be offline.');
      } else {
        console.error("Error copying URL:", error);
        toast.error("Failed to copy URL");
      }
    }
  };

  const handlePreview = async (filePath: string, name: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/files/file-url?path=${encodeURIComponent(filePath)}`,
        { credentials: "include", signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error("Failed to get file URL");
      }
      
      const data = await response.json();
      setPreviewImage({ url: data.url, name, path: filePath });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Request timed out. Server may be offline.');
      } else {
        console.error("Error getting preview URL:", error);
        toast.error("Failed to preview image");
      }
    }
  };

  const handleDelete = async () => {
    if (!previewImage) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/files/file?path=${encodeURIComponent(previewImage.path)}`,
        { 
          method: "DELETE",
          credentials: "include",
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      
      toast.success("File deleted successfully");
      setPreviewImage(null);
      setDeleteConfirm(false);
      fetchFiles();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Request timed out. Server may be offline.');
      } else {
        console.error("Error deleting file:", error);
        toast.error("Failed to delete file");
      }
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{previewImage?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="relative flex items-center justify-center bg-muted/50 rounded-lg p-4">
            <img
              src={previewImage?.url}
              alt={previewImage?.name}
              className="max-h-[70vh] w-auto object-contain rounded"
            />
          </div>
          <div className="flex justify-between gap-2">
            <Button
              variant="destructive"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete File
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => previewImage?.url && navigator.clipboard.writeText(previewImage.url).then(() => toast.success("URL copied!"))}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
              <Button
                onClick={() => previewImage?.url && window.open(previewImage.url, '_blank')}
              >
                Open in New Tab
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">File Browser</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your CDN files and folders
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFiles} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-foreground">Protected Folders</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Require API key authentication to access
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Unlock className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-foreground">Public Folders</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Accessible without authentication
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">File Structure</h3>
        </div>
        <div className="p-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading files...
            </div>
          ) : fileTree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No files found
            </div>
          ) : (
            fileTree.map((node, idx) => (
              <FolderItem key={idx} node={node} onCopyUrl={handleCopyUrl} onPreview={handlePreview} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
