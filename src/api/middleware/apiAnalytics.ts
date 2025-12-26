import { Response, NextFunction } from 'express';
import { pool } from '../db.js';
import { AuthRequest } from './auth.js';

export async function logApiUsage(req: AuthRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const apiKey = req.headers.authorization?.split(' ')[1];
  
  if (!apiKey) {
    return next();
  }
  
  const originalJson = res.json;
  const originalSend = res.send;
  
  let logged = false;
  
  const logRequest = async (statusCode: number) => {
    if (logged) return;
    logged = true;
    
    const responseTime = Date.now() - startTime;
    const endpoint = req.path;
    const ipAddress = 
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.headers['x-real-ip']?.toString() ||
      req.headers['cf-connecting-ip']?.toString() ||
      req.socket.remoteAddress ||
      '';
    
    try {
      const keyResult = await pool.query(
        'SELECT id FROM api_keys WHERE key = $1 AND deleted_at IS NULL',
        [apiKey]
      );
      
      if (keyResult.rows.length === 0) return;
      
      const apiKeyId = keyResult.rows[0].id;
      
      await pool.query(
        'INSERT INTO analytics_requests (path, status_code, response_time, api_key_id, ip_address) VALUES ($1, $2, $3, $4, $5)',
        [endpoint, statusCode, responseTime, apiKeyId, ipAddress]
      );

      const today = new Date().toISOString().split('T')[0];
      
      await pool.query(`
        INSERT INTO analytics_stats (date, total_requests, status_200, status_304, status_404, status_other, avg_response_time)
        VALUES ($1, 1, 
          CASE WHEN $2 = 200 THEN 1 ELSE 0 END,
          CASE WHEN $2 = 304 THEN 1 ELSE 0 END,
          CASE WHEN $2 = 404 THEN 1 ELSE 0 END,
          CASE WHEN $2 NOT IN (200, 304, 404) THEN 1 ELSE 0 END,
          $3
        )
        ON CONFLICT (date) DO UPDATE SET
          total_requests = analytics_stats.total_requests + 1,
          status_200 = analytics_stats.status_200 + CASE WHEN $2 = 200 THEN 1 ELSE 0 END,
          status_304 = analytics_stats.status_304 + CASE WHEN $2 = 304 THEN 1 ELSE 0 END,
          status_404 = analytics_stats.status_404 + CASE WHEN $2 = 404 THEN 1 ELSE 0 END,
          status_other = analytics_stats.status_other + CASE WHEN $2 NOT IN (200, 304, 404) THEN 1 ELSE 0 END,
          avg_response_time = ((analytics_stats.avg_response_time * analytics_stats.total_requests) + $3) / (analytics_stats.total_requests + 1),
          updated_at = CURRENT_TIMESTAMP
      `, [today, statusCode, responseTime]);
    } catch (error) {
      console.error('Error logging API usage:', error);
    }
  };
  
  res.json = function(data: any) {
    logRequest(res.statusCode);
    return originalJson.call(this, data);
  };
  
  res.send = function(data: any) {
    logRequest(res.statusCode);
    return originalSend.call(this, data);
  };
  
  res.on('finish', () => {
    if (!logged) {
      logRequest(res.statusCode);
    }
  });
  
  next();
}
