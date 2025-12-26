import { Request, Response, NextFunction } from 'express';
import { pool } from '../db.js';

export async function logAnalytics(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  const originalSend = res.send;
  const originalSendFile = res.sendFile;
  
  let logged = false;
  
  const logRequest = async (statusCode: number) => {
    if (logged) return;
    logged = true;
    
    const responseTime = Date.now() - startTime;
    const path = req.path;
    const userAgent = req.get('user-agent') || '';
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    
    try {
      await pool.query(
        'INSERT INTO analytics_requests (path, status_code, response_time, user_agent, ip_address) VALUES ($1, $2, $3, $4, $5)',
        [path, statusCode, responseTime, userAgent, ipAddress]
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
      console.error('Error logging analytics:', error);
    }
  };
  
  res.send = function(data: any) {
    logRequest(res.statusCode);
    return originalSend.call(this, data);
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
    if (!logged) {
      logRequest(res.statusCode);
    }
  });
  
  next();
}
