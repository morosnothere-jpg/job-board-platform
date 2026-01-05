const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

module.exports = (supabase) => {

  // Get user's own profile
  router.get('/me', authenticateToken, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', req.user.userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

      res.json({ profile: data || null });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Search job seekers (recruiters only) - LIMITED INFO
  router.get('/search-candidates', authenticateToken, async (req, res) => {
    try {
      // Only recruiters can search candidates
      if (req.user.user_type !== 'recruiter') {
        return res.status(403).json({ error: 'Only recruiters can search candidates' });
      }

      const { search = '' } = req.query;

      // Get job seekers only with limited info
      let query = supabase
        .from('users')
        .select('id, full_name, email, avatar')
        .eq('user_type', 'job_seeker');

      // Search by name or email
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query.order('full_name', { ascending: true });

      if (error) throw error;

      res.json({ candidates: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get any user's profile by user_id (for recruiters to view candidates)
  router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
      // Get profile with user info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', req.params.userId)
        .single();

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, user_type')
        .eq('id', req.params.userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      if (userError) throw userError;

      res.json({ 
        profile: profile || null,
        user: user 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create or Update profile
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const {
        bio,
        skills,
        experience,
        education,
        portfolio_links,
        resume_link,
        location,
        linkedin_url,
        github_url,
        website_url,
        availability,
        expected_salary
      } = req.body;

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', req.user.userId)
        .single();

      let data, error;

      if (existingProfile) {
        // Update existing profile
        const result = await supabase
          .from('profiles')
          .update({
            bio,
            skills,
            experience,
            education,
            portfolio_links,
            resume_link,
            location,
            linkedin_url,
            github_url,
            website_url,
            availability,
            expected_salary,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', req.user.userId)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Create new profile
        const result = await supabase
          .from('profiles')
          .insert([{
            user_id: req.user.userId,
            bio,
            skills,
            experience,
            education,
            portfolio_links,
            resume_link,
            location,
            linkedin_url,
            github_url,
            website_url,
            availability,
            expected_salary
          }])
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      res.json({
        message: 'Profile saved successfully',
        profile: data
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};