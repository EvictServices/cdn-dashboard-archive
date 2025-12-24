import { useState } from "react";
import { Folder, Image, Lock, Unlock, ChevronRight, Upload, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileNode {
  name: string;
  type: "folder" | "file";
  protected?: boolean;
  children?: FileNode[];
  size?: string;
}

const fileTree: FileNode[] = [
  {
    name: "avatars",
    type: "folder",
    protected: true,
    children: [
      {
        name: "user_12345",
        type: "folder",
        children: [
          { name: "avatar.png", type: "file", size: "245 KB" },
          { name: "avatar_thumb.png", type: "file", size: "12 KB" },
        ],
      },
      {
        name: "user_67890",
        type: "folder",
        children: [
          { name: "profile.gif", type: "file", size: "1.2 MB" },
        ],
      },
    ],
  },
  {
    name: "autopfp",
    type: "folder",
    protected: false,
    children: [
      {
        name: "anime",
        type: "folder",
        children: [
          { name: "sakura.gif", type: "file", size: "890 KB" },
          { name: "naruto.png", type: "file", size: "156 KB" },
          { name: "gojo.gif", type: "file", size: "1.1 MB" },
        ],
      },
      {
        name: "abstract",
        type: "folder",
        children: [
          { name: "waves.gif", type: "file", size: "2.3 MB" },
          { name: "gradient.png", type: "file", size: "89 KB" },
        ],
      },
      {
        name: "nature",
        type: "folder",
        children: [
          { name: "sunset.png", type: "file", size: "456 KB" },
          { name: "forest.gif", type: "file", size: "1.8 MB" },
        ],
      },
    ],
  },
];

interface FolderItemProps {
  node: FileNode;
  depth?: number;
}

function FolderItem({ node, depth = 0 }: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(depth === 0);

  const isFolder = node.type === "folder";

  return (
    <div>
      <button
        onClick={() => isFolder && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 rounded-md transition-colors text-sm",
          depth > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
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
        <span className="flex-1 text-left font-mono text-foreground">{node.name}</span>
        {node.protected !== undefined && (
          node.protected ? (
            <Lock className="w-3.5 h-3.5 text-warning" />
          ) : (
            <Unlock className="w-3.5 h-3.5 text-success" />
          )
        )}
        {node.size && (
          <span className="text-xs text-muted-foreground">{node.size}</span>
        )}
      </button>
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <FolderItem key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileBrowser() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">File Browser</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your CDN files and folders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" className="glow-primary">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
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
          {fileTree.map((node, idx) => (
            <FolderItem key={idx} node={node} />
          ))}
        </div>
      </div>
    </div>
  );
}
