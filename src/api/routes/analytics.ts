import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const statsResult = await pool.query(
      'SELECT * FROM analytics_stats WHERE date = $1',
      [today]
    );

    let stats;
    if (statsResult.rows.length === 0) {
      await pool.query(
        'INSERT INTO analytics_stats (date, total_requests, total_files, avg_response_time) VALUES ($1, 0, 0, 0)',
        [today]
      );
      stats = {
        total_requests: 0,
        total_files: 0,
        avg_response_time: 0,
        status_200: 0,
        status_304: 0,
        status_404: 0,
      };
    } else {
      stats = statsResult.rows[0];
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    
    const yesterdayStats = await pool.query(
      'SELECT * FROM analytics_stats WHERE date = $1',
      [yesterdayDate]
    );

    const changes = {
      requests: yesterdayStats.rows.length > 0 && yesterdayStats.rows[0].total_requests > 0
        ? ((stats.total_requests - yesterdayStats.rows[0].total_requests) / yesterdayStats.rows[0].total_requests * 100).toFixed(1)
        : '0.0',
      files: yesterdayStats.rows.length > 0 && yesterdayStats.rows[0].total_files > 0
        ? ((stats.total_files - yesterdayStats.rows[0].total_files) / yesterdayStats.rows[0].total_files * 100).toFixed(1)
        : '0.0',
      avgResponse: yesterdayStats.rows.length > 0 && yesterdayStats.rows[0].avg_response_time > 0
        ? ((stats.avg_response_time - yesterdayStats.rows[0].avg_response_time) / yesterdayStats.rows[0].avg_response_time * 100).toFixed(1)
        : '0.0',
    };

    res.json({
      stats: {
        totalRequests: stats.total_requests || 0,
        totalFiles: stats.total_files || 0,
        avgResponseTime: stats.avg_response_time || 0,
        status200: stats.status_200 || 0,
        status304: stats.status_304 || 0,
        status404: stats.status_404 || 0,
        statusOther: stats.status_other || 0,
      },
      changes,
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT path, status_code, response_time, created_at 
       FROM analytics_requests 
       ORDER BY created_at DESC 
       LIMIT 20`
    );

    const requests = result.rows.map(row => ({
      path: row.path,
      status: row.status_code,
      time: `${row.response_time}ms`,
      timestamp: getTimeAgo(row.created_at),
    }));

    res.json(requests);
  } catch (error) {
    console.error('Error fetching recent requests:', error);
    res.status(500).json({ error: 'Failed to fetch recent requests' });
  }
});

router.get('/top-endpoints', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT path, COUNT(*) as count 
       FROM analytics_requests 
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY path 
       ORDER BY count DESC 
       LIMIT 10`
    );

    const endpoints = result.rows.map(row => ({
      path: row.path,
      requests: formatNumber(parseInt(row.count)),
    }));

    res.json(endpoints);
  } catch (error) {
    console.error('Error fetching top endpoints:', error);
    res.status(500).json({ error: 'Failed to fetch top endpoints' });
  }
});

router.post('/log', async (req, res) => {
  const { path, statusCode, responseTime, userAgent, ipAddress } = req.body;

  try {
    await pool.query(
      'INSERT INTO analytics_requests (path, status_code, response_time, user_agent, ip_address) VALUES ($1, $2, $3, $4, $5)',
      [path, statusCode, responseTime, userAgent, ipAddress]
    );

    const today = new Date().toISOString().split('T')[0];
    
    await pool.query(`
      INSERT INTO analytics_stats (date, total_requests, status_200, status_304, status_404, status_other)
      VALUES ($1, 1, 
        CASE WHEN $2 = 200 THEN 1 ELSE 0 END,
        CASE WHEN $2 = 304 THEN 1 ELSE 0 END,
        CASE WHEN $2 = 404 THEN 1 ELSE 0 END,
        CASE WHEN $2 NOT IN (200, 304, 404) THEN 1 ELSE 0 END
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

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging analytics:', error);
    res.status(500).json({ error: 'Failed to log analytics' });
  }
});

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return `${seconds} sec ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default router;
