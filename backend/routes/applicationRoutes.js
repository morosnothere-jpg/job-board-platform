const express = require('express');
const router = express.Router();
const { authenticateToken, isJobSeeker } = require('../middleware/auth');
const { sendApplicationNotification, sendStatusUpdateNotification } = require('../services/emailService');
const { validateApplication } = require('../middleware/validators');
module.exports = (supabase) => {

    // Apply to a job (job seekers only)
    router.post('/', authenticateToken, isJobSeeker, validateApplication, async (req, res) => {
        try {
            const { job_id, cover_letter, resume_url } = req.body;

            // Check if user is a job seeker
            if (req.user.user_type !== 'job_seeker') {
                return res.status(403).json({ error: 'Only job seekers can apply to jobs' });
            }

            // Check if already applied
            const { data: existingApp } = await supabase
                .from('applications')
                .select('*')
                .eq('job_id', job_id)
                .eq('candidate_id', req.user.userId)
                .single();

            if (existingApp) {
                return res.status(400).json({ error: 'You have already applied to this job' });
            }

            // Create application
            const { data, error } = await supabase
                .from('applications')
                .insert([
                    {
                        job_id,
                        candidate_id: req.user.userId,
                        cover_letter: cover_letter || null,
                        resume_url: resume_url || null,
                        status: 'pending'
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Get job and recruiter info
            const { data: job } = await supabase
                .from('jobs')
                .select('*, users!jobs_recruiter_id_fkey(*)')
                .eq('id', job_id)
                .single();

            // Create notification for recruiter
            if (job) {
                await supabase
                    .from('notifications')
                    .insert([{
                        user_id: job.recruiter_id,
                        title: 'New Application Received',
                        message: `${req.user.email} applied to your job: ${job.title}`,
                        type: 'application',
                        link: `/dashboard`
                    }]);
            }

            // Send email to recruiter
            const { data: candidate } = await supabase
                .from('users')
                .select('*')
                .eq('id', req.user.userId)
                .single();

            if (job && candidate) {
                await sendApplicationNotification(
                    job.users.email,
                    job.users.full_name,
                    job.title,
                    candidate.full_name,
                    candidate.email
                );
            }


            res.status(201).json({
                message: 'Application submitted successfully',
                application: data
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get all applications for a job (recruiter only - for their jobs)
    router.get('/job/:jobId', authenticateToken, async (req, res) => {
        try {
            if (req.user.user_type !== 'recruiter') {
                return res.status(403).json({ error: 'Only recruiters can view applications' });
            }

            // Verify the job belongs to this recruiter
            const { data: job } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', req.params.jobId)
                .eq('recruiter_id', req.user.userId)
                .single();

            if (!job) {
                return res.status(403).json({ error: 'Job not found or unauthorized' });
            }

            // Get applications with candidate info
            const { data, error } = await supabase
                .from('applications')
                .select(`
          *,
          users!applications_candidate_id_fkey (
            id,
            full_name,
            email,
            phone
          )
        `)
                .eq('job_id', req.params.jobId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json({ applications: data });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get job seeker's own applications
    router.get('/my-applications', authenticateToken, async (req, res) => {
        try {
            if (req.user.user_type !== 'job_seeker') {
                return res.status(403).json({ error: 'Only job seekers can view their applications' });
            }

            const { data, error } = await supabase
                .from('applications')
                .select(`
          *,
          jobs (
            id,
            title,
            company,
            location,
            job_type
          )
        `)
                .eq('candidate_id', req.user.userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json({ applications: data });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Update application status (recruiter only)
    router.put('/:id/status', authenticateToken, async (req, res) => {
        try {
            if (req.user.user_type !== 'recruiter') {
                return res.status(403).json({ error: 'Only recruiters can update application status' });
            }

            const { status, notes } = req.body;

            // Get application to verify job ownership
            const { data: application } = await supabase
                .from('applications')
                .select('*, jobs(*)')
                .eq('id', req.params.id)
                .single();

            if (!application || application.jobs.recruiter_id !== req.user.userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Update status
            const { data, error } = await supabase
                .from('applications')
                .update({ status, notes: notes || application.notes })
                .eq('id', req.params.id)
                .select()
                .single();

            if (error) throw error;

            // Create notification for job seeker
            const statusMessages = {
                'reviewed': 'Your application has been reviewed',
                'accepted': '🎉 Congratulations! Your application has been accepted',
                'rejected': 'Your application status has been updated'
            };

            await supabase
                .from('notifications')
                .insert([{
                    user_id: application.candidate_id,
                    title: 'Application Status Update',
                    message: `${statusMessages[status] || 'Application status updated'} for ${application.jobs.title}`,
                    type: 'status_update',
                    link: '/dashboard'
                }]);
            // Send email to candidate
            const { data: candidate } = await supabase
                .from('users')
                .select('*')
                .eq('id', application.candidate_id)
                .single();

            if (candidate) {
                await sendStatusUpdateNotification(
                    candidate.email,
                    candidate.full_name,
                    application.jobs.title,
                    application.jobs.company,
                    status
                );
            }
            res.json({
                message: 'Application status updated',
                application: data
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};