import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CDN_FILES_DIR = path.join(__dirname, '../../cdn-files');

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

async function getRandomFileFromCategories(categories: string[], type: 'pfp' | 'banner'): Promise<string | null> {
  const allFiles: string[] = [];
  
  for (const category of categories) {
    const directory = path.join(CDN_FILES_DIR, 'autopfp', type, category);
    try {
      const files = await fs.readdir(directory);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      );
      allFiles.push(...imageFiles.map(file => path.join(directory, file)));
    } catch (error) {
      continue;
    }
  }
  
  if (allFiles.length === 0) return null;
  return allFiles[Math.floor(Math.random() * allFiles.length)];
}

router.get('/avatars/:bot/:userId', async (req: Request, res: Response) => {
  try {
    const { bot, userId } = req.params;
    const validBots = ['evict', 'rival'];
    
    if (!validBots.includes(bot)) {
      return res.status(400).json({ error: 'Invalid bot. Must be evict or rival' });
    }
    
    const avatarPath = path.join(CDN_FILES_DIR, 'avatars', bot, userId);
    
    try {
      const stats = await fs.stat(avatarPath);
      if (!stats.isDirectory()) {
        return res.status(404).json({ error: 'Avatar not found' });
      }
    } catch {
      return res.status(404).json({ error: 'Avatar not found' });
    }
    
    const files = await fs.readdir(avatarPath);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );
    
    if (imageFiles.length === 0) {
      return res.status(404).json({ error: 'No avatars found' });
    }
    
    const baseUrl = 'https://cdn.azron.net';
    const avatarUrls = imageFiles.map(file => 
      `${baseUrl}/api/cdn/avatars/${bot}/${userId}/${file}`
    );
    
    res.set('Cache-Control', 'public, max-age=3600');
    res.json({ avatars: avatarUrls });
  } catch (error) {
    console.error('Error serving avatar list:', error);
    res.status(500).json({ error: 'Failed to serve avatar list' });
  }
});

router.get('/avatars/:bot/:userId/:filename', async (req: Request, res: Response) => {
  try {
    const { bot, userId, filename } = req.params;
    const validBots = ['evict', 'rival'];
    
    if (!validBots.includes(bot)) {
      return res.status(400).json({ error: 'Invalid bot. Must be evict or rival' });
    }
    
    const filePath = path.join(CDN_FILES_DIR, 'avatars', bot, userId, filename);
    
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
    console.error('Error serving avatar file:', error);
    res.status(500).json({ error: 'Failed to serve avatar file' });
  }
});

router.get('/autopfp/pfp/:category', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const validCategories = ['anime', 'cats', 'egirls', 'girls', 'boys', 'random'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    let filePath: string | null;
    
    if (category === 'random') {
      const categories = ['anime', 'cats', 'egirls', 'girls', 'boys'];
      filePath = await getRandomFileFromCategories(categories, 'pfp');
    } else {
      const directory = path.join(CDN_FILES_DIR, 'autopfp', 'pfp', category);
      filePath = await getRandomFile(directory);
    }
    
    if (!filePath) {
      return res.status(404).json({ error: 'No images found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving pfp:', error);
    res.status(500).json({ error: 'Failed to serve profile picture' });
  }
});

router.get('/autopfp/banner/:category', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const validCategories = ['anime', 'cute', 'imsg', 'random'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    let filePath: string | null;
    
    if (category === 'random') {
      const categories = ['anime', 'cute', 'imsg'];
      filePath = await getRandomFileFromCategories(categories, 'banner');
    } else {
      const directory = path.join(CDN_FILES_DIR, 'autopfp', 'banner', category);
      filePath = await getRandomFile(directory);
    }
    
    if (!filePath) {
      return res.status(404).json({ error: 'No images found' });
    }
    
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving banner:', error);
    res.status(500).json({ error: 'Failed to serve banner' });
  }
});

router.get('/autopfp/:type/:category/:filename', async (req: Request, res: Response) => {
  try {
    const { type, category, filename } = req.params;
    
    if (type !== 'pfp' && type !== 'banner') {
      return res.status(400).json({ error: 'Invalid type' });
    }
    
    const validPfpCategories = ['anime', 'cats', 'egirls', 'girls', 'boys'];
    const validBannerCategories = ['anime', 'cute', 'imsg'];
    const validCategories = type === 'pfp' ? validPfpCategories : validBannerCategories;
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const filePath = path.join(CDN_FILES_DIR, 'autopfp', type, category, filename);
    
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
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

export default router;
