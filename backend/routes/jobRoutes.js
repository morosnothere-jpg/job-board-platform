const express = require('express');
const router = express.Router();
const { authenticateToken, isRecruiter } = require('../middleware/auth');
const { validateCreateJob, validateUpdateJob } = require('../middleware/validators');
const { calculateJobMatch } = require('../utils/jobMatchingAlgorithm');
const { checkCreditsForJobPost, deductCreditsForJobPost } = require('../middleware/monetizationMiddleware');

module.exports = (supabase) => {

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

  // NEW: Get AI-recommended jobs (job seekers only)
  router.get('/recommended', authenticateToken, async (req, res) => {
    try {
      // Only job seekers can get recommendations
      if (req.user.user_type !== 'job_seeker') {
        return res.status(403).json({ error: 'Only job seekers can get recommendations' });
      }

      const {
        page = 1,
        limit = 12,
        location = '',
        job_type = '',
        work_mode = '',
        search = ''
      } = req.query;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', req.user.userId)
        .single();

      if (profileError || !profile) {
        return res.status(400).json({
          error: 'Please complete your profile to get recommendations',
          needsProfile: true
        });
      }

      // Fetch ALL open jobs (with filters if provided)
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('status', 'open');

      // Apply filters
      if (location) query = query.ilike('location', `%${location}%`);
      if (job_type) query = query.eq('job_type', job_type);
      if (work_mode) query = query.eq('work_mode', work_mode);
      if (search) {
        query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data: allJobs, error: jobsError, count } = await query;

      if (jobsError) throw jobsError;

      // Calculate match score for each job
      const jobsWithScores = allJobs.map(job => {
        const match = calculateJobMatch(profile, job);
        return {
          ...job,
          match_score: match.score,
          match_reasons: match.reasons
        };
      });

      // Sort by match score (highest first)
      jobsWithScores.sort((a, b) => b.match_score - a.match_score);

      // Apply pagination AFTER sorting
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const paginatedJobs = jobsWithScores.slice(offset, offset + parseInt(limit));

      res.json({
        jobs: paginatedJobs,
        pagination: {
          totalCount: count,
          totalPages: Math.ceil(count / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit),
          hasMore: offset + parseInt(limit) < count
        }
      });

    } catch (error) {
      console.error('Error getting recommendations:', error);
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
  // Use checkCreditsForJobPost middleware to verify credits BEFORE creating job
  router.post('/', authenticateToken, isRecruiter, validateCreateJob, checkCreditsForJobPost, async (req, res) => {
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

      // Deduct credits after successful job creation
      if (req.user.user_type === 'recruiter') {
        try {
          await deductCreditsForJobPost(data.id, req.user.userId);
        } catch (creditError) {
          // Log error but don't fail the request since job is already created
          console.error('Failed to deduct credits:', creditError);
        }
      }

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