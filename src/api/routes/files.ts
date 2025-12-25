import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CDN_FILES_DIR = path.join(__dirname, '../../cdn-files');

interface FileNode {
  name: string;
  type: 'folder' | 'file';
  path: string;
  size?: number;
  children?: FileNode[];
  protected?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function buildFileTree(dirPath: string, relativePath: string = ''): Promise<FileNode[]> {
  const items: FileNode[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        const children = await buildFileTree(fullPath, relPath);
        items.push({
          name: entry.name,
          type: 'folder',
          path: relPath,
          children,
          protected: relPath.startsWith('autopfp')
        });
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        items.push({
          name: entry.name,
          type: 'file',
          path: relPath,
          size: stats.size
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

router.get('/files', authenticateToken, async (req: Request, res: Response) => {
  try {
    const fileTree = await buildFileTree(CDN_FILES_DIR);
    res.json({ files: fileTree });
  } catch (error) {
    console.error('Error building file tree:', error);
    res.status(500).json({ error: 'Failed to retrieve file list' });
  }
});

router.get('/file-url', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    let url = '';
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const apiUrl = baseUrl.replace('8080', '3001');
    
    if (filePath.startsWith('avatars/')) {
      const parts = filePath.split('/');
      if (parts.length >= 2) {
        const userId = parts[1];
        url = `${apiUrl}/cdn/avatars/${userId}`;
      }
    } else if (filePath.startsWith('autopfp/pfp/')) {
      const parts = filePath.split('/');
      if (parts.length >= 4) {
        const category = parts[2];
        const filename = parts[3];
        url = `${apiUrl}/cdn/autopfp/pfp/${category}/${filename}`;
      }
    } else if (filePath.startsWith('autopfp/banner/')) {
      const parts = filePath.split('/');
      if (parts.length >= 4) {
        const category = parts[2];
        const filename = parts[3];
        url = `${apiUrl}/cdn/autopfp/banner/${category}/${filename}`;
      }
    }
    
    if (!url) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    res.json({ url });
  } catch (error) {
    console.error('Error generating file URL:', error);
    res.status(500).json({ error: 'Failed to generate file URL' });
  }
});

router.delete('/file', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    if (filePath.includes('..') || path.isAbsolute(filePath)) {
      return res.status(403).json({ error: 'Invalid file path' });
    }
    
    const fullPath = path.join(CDN_FILES_DIR, filePath);
    
    const resolvedPath = path.resolve(fullPath);
    const resolvedCdnDir = path.resolve(CDN_FILES_DIR);
    
    if (!resolvedPath.startsWith(resolvedCdnDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
      const stats = await fs.stat(fullPath);
      if (!stats.isFile()) {
        return res.status(400).json({ error: 'Can only delete files, not directories' });
      }
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    await fs.unlink(fullPath);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
