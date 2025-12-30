const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');

module.exports = (supabase) => {

    // Get all users with pagination
    router.get('/users', authenticateToken, isAdmin, async (req, res) => {
        try {
            const { page = 1, limit = 20, user_type, search } = req.query;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('users')
                .select('id, email, full_name, user_type, phone, company_name, avatar, created_at', { count: 'exact' });

            // Filter by user type
            if (user_type && user_type !== 'all') {
                query = query.eq('user_type', user_type);
            }

            // Search by name or email
            if (search) {
                query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
            }

            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            res.json({
                users: data,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get user statistics
    router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
        try {
            // Total users by type
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('user_type');

            if (usersError) throw usersError;

            const userStats = users.reduce((acc, user) => {
                acc[user.user_type] = (acc[user.user_type] || 0) + 1;
                return acc;
            }, {});

            // Total jobs
            const { count: totalJobs, error: jobsError } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true });

            if (jobsError) throw jobsError;

            // Total applications
            const { count: totalApplications, error: appsError } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true });

            if (appsError) throw appsError;

            // Recent registrations (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { count: recentUsers, error: recentError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString());

            if (recentError) throw recentError;

            res.json({
                totalUsers: users.length,
                usersByType: userStats,
                totalJobs,
                totalApplications,
                recentUsers
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Delete user
    router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
        try {
            const userId = req.params.id;
            const { reason } = req.body;

            // Prevent admin from deleting themselves
            if (userId === req.user.userId) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }

            // Get user info before deleting
            const { data: user, error: fetchError } = await supabase
                .from('users')
                .select('email, full_name, user_type')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            // Delete all related records first (manual cascade)

            // 1. Delete applications (as candidate)
            await supabase.from('applications').delete().eq('candidate_id', userId);

            // 2. Delete saved jobs
            await supabase.from('saved_jobs').delete().eq('user_id', userId);

            // 3. Delete notifications
            await supabase.from('notifications').delete().eq('user_id', userId);

            // 4. Delete profile
            await supabase.from('profiles').delete().eq('user_id', userId);

            // 5. If recruiter, delete their jobs and related applications
            if (user.user_type === 'recruiter') {
                // Get all job IDs for this recruiter
                const { data: jobs } = await supabase
                    .from('jobs')
                    .select('id')
                    .eq('recruiter_id', userId);

                if (jobs && jobs.length > 0) {
                    const jobIds = jobs.map(job => job.id);

                    // Delete applications for these jobs
                    await supabase.from('applications').delete().in('job_id', jobIds);

                    // Delete saved jobs for these jobs
                    await supabase.from('saved_jobs').delete().in('job_id', jobIds);

                    // Delete the jobs
                    await supabase.from('jobs').delete().eq('recruiter_id', userId);
                }
            }

            // Finally, delete the user
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            // Send email notification if reason provided
            if (reason && user) {
                const { sendAccountDeletionNotification } = require('../services/emailService');
                await sendAccountDeletionNotification(
                    user.email,
                    user.full_name,
                    reason
                );
            }

            res.json({ message: 'User and all related data deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Update user type or status
    router.put('/users/:id', authenticateToken, isAdmin, async (req, res) => {
        try {
            const userId = req.params.id;
            const { user_type } = req.body;

            if (!['job_seeker', 'recruiter', 'admin'].includes(user_type)) {
                return res.status(400).json({ error: 'Invalid user type' });
            }

            const { data, error } = await supabase
                .from('users')
                .update({ user_type })
                .eq('id', userId)
                .select('id, email, full_name, user_type')
                .single();

            if (error) throw error;

            res.json({ message: 'User updated successfully', user: data });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get all jobs with filters
    router.get('/jobs', authenticateToken, isAdmin, async (req, res) => {
        try {
            const { page = 1, limit = 20, status, search } = req.query;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('jobs')
                .select(`
          *,
          users!jobs_recruiter_id_fkey (
            id,
            full_name,
            email,
            company_name
          )
        `, { count: 'exact' });

            if (status && status !== 'all') {
                query = query.eq('status', status);
            }

            if (search) {
                query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
            }

            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            res.json({
                jobs: data,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Delete job (admin override)
    router.delete('/jobs/:id', authenticateToken, isAdmin, async (req, res) => {
        try {
            const { reason } = req.body;

            // Get job and recruiter info before deleting
            const { data: job, error: fetchError } = await supabase
                .from('jobs')
                .select(`
          *,
          users!jobs_recruiter_id_fkey (
            email,
            full_name
          )
        `)
                .eq('id', req.params.id)
                .single();

            if (fetchError) throw fetchError;

            // Delete the job
            const { error } = await supabase
                .from('jobs')
                .delete()
                .eq('id', req.params.id);

            if (error) throw error;

            // Send email notification to recruiter if reason provided
            if (reason && job && job.users) {
                const { sendJobDeletionNotification } = require('../services/emailService');
                await sendJobDeletionNotification(
                    job.users.email,
                    job.users.full_name,
                    job.title,
                    job.company,
                    reason
                );
            }

            res.json({ message: 'Job deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Update job status
    router.put('/jobs/:id/status', authenticateToken, isAdmin, async (req, res) => {
        try {
            const { status } = req.body;

            if (!['open', 'closed', 'filled'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const { data, error } = await supabase
                .from('jobs')
                .update({ status })
                .eq('id', req.params.id)
                .select()
                .single();

            if (error) throw error;

            res.json({ message: 'Job status updated', job: data });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get all applications
    router.get('/applications', authenticateToken, isAdmin, async (req, res) => {
        try {
            const { page = 1, limit = 20, status } = req.query;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('applications')
                .select(`
          *,
          jobs (id, title, company),
          users!applications_candidate_id_fkey (id, full_name, email)
        `, { count: 'exact' });

            if (status && status !== 'all') {
                query = query.eq('status', status);
            }

            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            res.json({
                applications: data,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get activity logs (recent actions)
    router.get('/activity', authenticateToken, isAdmin, async (req, res) => {
        try {
            const { limit = 50 } = req.query;

            // Get recent jobs
            const { data: recentJobs } = await supabase
                .from('jobs')
                .select('id, title, company, created_at, users!jobs_recruiter_id_fkey(full_name)')
                .order('created_at', { ascending: false })
                .limit(limit / 2);

            // Get recent applications
            const { data: recentApps } = await supabase
                .from('applications')
                .select('id, created_at, jobs(title), users!applications_candidate_id_fkey(full_name)')
                .order('created_at', { ascending: false })
                .limit(limit / 2);

            // Combine and sort
            const activities = [
                ...recentJobs.map(job => ({
                    type: 'job_posted',
                    description: `${job.users.full_name} posted "${job.title}" at ${job.company}`,
                    timestamp: job.created_at
                })),
                ...recentApps.map(app => ({
                    type: 'application',
                    description: `${app.users.full_name} applied to "${app.jobs.title}"`,
                    timestamp: app.created_at
                }))
            ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            res.json({ activities: activities.slice(0, limit) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};