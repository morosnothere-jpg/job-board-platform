const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

module.exports = (supabase) => {

  // Get user's notifications
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', req.user.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ notifications: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark notification as read
  router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', req.params.id)
        .eq('user_id', req.user.userId)
        .select()
        .single();

      if (error) throw error;

      res.json({ notification: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark all as read
  router.put('/read-all', authenticateToken, async (req, res) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', req.user.userId)
        .eq('read', false);

      if (error) throw error;

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};