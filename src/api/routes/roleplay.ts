import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { authenticateApiKey, authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const apiRouter = Router();
const cdnRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CDN_FILES_DIR = path.join(__dirname, '../../cdn-files');

const fileTokens = new Map<string, { filePath: string; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [token, data] of fileTokens.entries()) {
    if (data.expiresAt < now) {
      fileTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

async function getRandomFile(directory: string): Promise<string | null> {
  try {
    const files = await fs.readdir(directory);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );
    if (imageFiles.length === 0) return null;
    const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)];
    return path.join(directory, randomFile);
  } catch (error) {
    return null;
  }
}

apiRouter.get('/:action', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const { action } = req.params;
    const validActions = ['fuck', 'spank', 'nutkick'];
    
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const directory = path.join(CDN_FILES_DIR, 'roleplay', action);
    const filePath = await getRandomFile(directory);
    
    if (!filePath) {
      return res.status(404).json({ error: 'No files found' });
    }
    
    const token = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(filePath);
    
    fileTokens.set(token, {
      filePath,
      expiresAt: Date.now() + (60 * 60 * 1000)
    });
    
    const cdnUrl = process.env.CDN_URL || `${req.protocol}://${req.get('host')}`;
    const url = `${cdnUrl}/cdn/roleplay/${action}/${token}${ext}`;
    
    res.json({ url });
  } catch (error) {
    console.error('Error serving roleplay file:', error);
    res.status(500).json({ error: 'Failed to serve roleplay file' });
  }
});

cdnRouter.get('/:action/:filename', async (req: Request, res: Response) => {
  try {
    const { action, filename } = req.params;
    const validActions = ['fuck', 'spank', 'nutkick'];
    
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    if (!filename.match(/^[a-f0-9]{32}\./)) {
      return authenticateToken(req, res, async () => {
        const filePath = path.join(CDN_FILES_DIR, 'roleplay', action, filename);
        
        const resolvedPath = path.resolve(filePath);
        const resolvedBase = path.resolve(CDN_FILES_DIR);
        if (!resolvedPath.startsWith(resolvedBase)) {
          return res.status(403).json({ error: 'Access denied' });
        }
        
        try {
          const stats = await fs.stat(filePath);
          if (!stats.isFile()) {
            return res.status(404).json({ error: 'File not found' });
          }
        } catch {
          return res.status(404).json({ error: 'File not found' });
        }
        
        res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        return res.sendFile(resolvedPath);
      });
    }
  
    const token = path.parse(filename).name;
    
    const tokenData = fileTokens.get(token);
    
    if (!tokenData) {
      return res.status(404).json({ error: 'File not found or expired' });
    }
    
    if (tokenData.expiresAt < Date.now()) {
      fileTokens.delete(token);
      return res.status(404).json({ error: 'File not found or expired' });
    }
    
    const filePath = tokenData.filePath;
    
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(CDN_FILES_DIR);
    if (!resolvedPath.startsWith(resolvedBase)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return res.status(404).json({ error: 'File not found' });
      }
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(resolvedPath);
  } catch (error) {
    console.error('Error serving roleplay file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

export { apiRouter as roleplayApiRouter, cdnRouter as roleplayCdnRouter };
