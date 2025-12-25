import express from 'express';
import { pool } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get user settings
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        settings: {
          base_url: 'https://cdn.azron.net',
          custom_domain: '',
          require_auth_avatars: true,
          rate_limiting: true,
          cors_enabled: true,
          cache_ttl: 86400,
          cdn_caching: true,
        }
      });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/', authenticateToken, async (req: AuthRequest, res) => {
  const {
    base_url,
    custom_domain,
    require_auth_avatars,
    rate_limiting,
    cors_enabled,
    cache_ttl,
    cdn_caching,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO user_settings (
        user_id, base_url, custom_domain, require_auth_avatars,
        rate_limiting, cors_enabled, cache_ttl, cdn_caching, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET
        base_url = $2,
        custom_domain = $3,
        require_auth_avatars = $4,
        rate_limiting = $5,
        cors_enabled = $6,
        cache_ttl = $7,
        cdn_caching = $8,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [req.userId, base_url, custom_domain, require_auth_avatars, rate_limiting, cors_enabled, cache_ttl, cdn_caching]
    );

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
