import express from 'express';
import { pool } from '../db.js';
import crypto from 'crypto';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, key, created_at, last_used FROM api_keys WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    const keys = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      key: row.key,
      createdAt: row.created_at.toISOString().split('T')[0],
      lastUsed: row.last_used ? row.last_used.toISOString().split('T')[0] : null,
    }));
    res.json(keys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const key = `cdn_${randomBytes}`;

    const result = await pool.query(
      'INSERT INTO api_keys (name, key) VALUES ($1, $2) RETURNING id, name, key, created_at, last_used',
      [name.trim(), key]
    );

    const newKey = {
      id: result.rows[0].id.toString(),
      name: result.rows[0].name,
      key: result.rows[0].key,
      createdAt: result.rows[0].created_at.toISOString().split('T')[0],
      lastUsed: null,
    };

    res.status(201).json(newKey);
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE api_keys SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export default router;
