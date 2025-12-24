const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

module.exports = (supabase) => {

  // Get user's saved jobs
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select(`
          *,
          jobs (*)
        `)
        .eq('user_id', req.user.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ savedJobs: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check if a job is saved
  router.get('/check/:jobId', authenticateToken, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('*')
        .eq('user_id', req.user.userId)
        .eq('job_id', req.params.jobId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      res.json({ isSaved: !!data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Save a job
  router.post('/:jobId', authenticateToken, async (req, res) => {
    try {
      if (req.user.user_type !== 'job_seeker') {
        return res.status(403).json({ error: 'Only job seekers can save jobs' });
      }

      // Check if already saved
      const { data: existing } = await supabase
        .from('saved_jobs')
        .select('*')
        .eq('user_id', req.user.userId)
        .eq('job_id', req.params.jobId)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Job already saved' });
      }

      const { data, error } = await supabase
        .from('saved_jobs')
        .insert([{
          user_id: req.user.userId,
          job_id: req.params.jobId
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Job saved successfully',
        savedJob: data
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unsave a job
  router.delete('/:jobId', authenticateToken, async (req, res) => {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', req.user.userId)
        .eq('job_id', req.params.jobId);

      if (error) throw error;

      res.json({ message: 'Job unsaved successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};