import { Request, Response, NextFunction } from 'express';
import { pool } from '../db.js';

export async function logCdnAccess(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  const originalSendFile = res.sendFile;
  
  let logged = false;
  
  const logRequest = async (statusCode: number) => {
    if (logged) return;
    logged = true;
    
    const responseTime = Date.now() - startTime;
    const filePath = req.path;
    
    try {
      await pool.query(
        'INSERT INTO analytics_requests (path, status_code, response_time, request_type) VALUES ($1, $2, $3, $4)',
        [filePath, statusCode, responseTime, 'cdn']
      );
    } catch (error) {
      console.error('Error logging CDN access:', error);
    }
  };
  
  res.sendFile = function(...args: any[]) {
    const callback = args[args.length - 1];
    if (typeof callback === 'function') {
      args[args.length - 1] = (err: any) => {
        logRequest(err ? 404 : res.statusCode);
        callback(err);
      };
    } else {
      args.push((err: any) => {
        logRequest(err ? 404 : res.statusCode);
      });
    }
    return originalSendFile.apply(this, args as any);
  };
  
  res.on('finish', () => {
    if (!logged && res.statusCode) {
      logRequest(res.statusCode);
    }
  });
  
  next();
}
