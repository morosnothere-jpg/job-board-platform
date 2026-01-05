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

  // Create job invitation notification
  router.post('/invite', authenticateToken, async (req, res) => {
    try {
      const { candidate_id, job_id } = req.body;

      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('title, company')
        .eq('id', job_id)
        .single();

      if (jobError) throw jobError;

      // Get recruiter details
      const { data: recruiter, error: recruiterError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', req.user.userId)
        .single();

      if (recruiterError) throw recruiterError;

      // Create notification
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: candidate_id,
            type: 'job_invitation',
            title: `Job Invitation from ${job.company}`,
            message: `${recruiter.full_name} has invited you to apply for "${job.title}" at ${job.company}.`,
            job_id: job_id,
            read: false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Invitation sent successfully',
        notification: data
      });
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

  // Delete a single notification
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.userId);

      if (error) throw error;

      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete all notifications
  router.delete('/delete-all', authenticateToken, async (req, res) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', req.user.userId);

      if (error) throw error;

      res.json({ message: 'All notifications deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};