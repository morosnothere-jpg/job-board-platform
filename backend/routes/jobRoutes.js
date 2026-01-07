const express = require('express');
const router = express.Router();
const { authenticateToken, isRecruiter } = require('../middleware/auth');
const { validateCreateJob, validateUpdateJob } = require('../middleware/validators');

module.exports = (supabase) => {

  // Get all jobs (public - anyone can view)
  // Get all jobs with filtering and pagination
  router.get('/', async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        location = '',
        job_type = '',
        work_mode = '',
        search = ''
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Start building query
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('status', 'open');

      // Apply filters
      if (location) {
        query = query.ilike('location', `%${location}%`);
      }
      if (job_type) {
        query = query.eq('job_type', job_type);
      }
      if (work_mode) {
        query = query.eq('work_mode', work_mode);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply pagination and ordering
      const { data, error, count } = await query
        .range(offset, offset + parseInt(limit) - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        jobs: data,
        pagination: {
          totalCount: count,
          totalPages: Math.ceil(count / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit),
          hasMore: offset + parseInt(limit) < count
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single job by ID
  router.get('/:id', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (error) throw error;

      res.json({ job: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new job (recruiter only)
  router.post('/', authenticateToken, isRecruiter, validateCreateJob, async (req, res) => {
    try {
      const { title, description, company, location, job_type, work_mode, salary_range, requirements } = req.body;
      const { data, error } = await supabase
        .from('jobs')
        .insert([
          {
            recruiter_id: req.user.userId,
            title,
            description,
            company,
            location,
            job_type,
            work_mode,
            salary_range: salary_range || null,
            requirements,
            status: 'open'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Job posted successfully',
        job: data
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get jobs posted by logged-in recruiter
  router.get('/my/posts', authenticateToken, isRecruiter, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', req.user.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ jobs: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update job (recruiter only - their own jobs)
  router.put('/:id', authenticateToken, isRecruiter, validateUpdateJob, async (req, res) => {
    try {
      const { title, description, company, location, job_type, work_mode, salary_range, requirements, status } = req.body;
      const { data, error } = await supabase
        .from('jobs')
        .update({
          title,
          description,
          company,
          location,
          job_type,
          work_mode,
          salary_range,
          requirements,
          status
        })
        .eq('id', req.params.id)
        .eq('recruiter_id', req.user.userId) // Only update their own jobs
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Job updated successfully',
        job: data
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete job (recruiter only)
  router.delete('/:id', authenticateToken, isRecruiter, async (req, res) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', req.params.id)
        .eq('recruiter_id', req.user.userId);

      if (error) throw error;

      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};