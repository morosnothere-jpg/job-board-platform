import React, { useState, useEffect, useContext } from 'react';
import { getMyJobs, createJob, deleteJob, getJobApplications, updateApplicationStatus } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CandidateSearch from './CandidateSearch';
import RichTextEditor from './RichTextEditor';
import { toast } from 'sonner';
import { sanitizeHtml } from '../utils/sanitizeHtml';

function RecruiterDashboard() {
    const [jobs, setJobs] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'my-jobs');
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [newJob, setNewJob] = useState({
        title: '',
        description: '',
        company: user?.company_name || '',
        location: '',
        job_type: 'full-time',
        work_mode: 'on-site',
        salary_range: '',
        requirements: ''
    });
    const [expandedJobs, setExpandedJobs] = useState(new Set());
    useEffect(() => {
        fetchMyJobs();
    }, []);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'find-candidates') {
            setActiveTab('find-candidates');
        } else {
            setActiveTab('my-jobs');
        }
    }, [searchParams]);

    const fetchMyJobs = async () => {
        try {
            const response = await getMyJobs();
            setJobs(response.data.jobs);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setLoading(false);
        }
    };

    const handleCreateJob = async (e) => {
        e.preventDefault();
        try {
            await createJob(newJob);
            setShowCreateForm(false);
            setNewJob({
                title: '',
                description: '',
                company: user?.company_name || '',
                location: '',
                job_type: 'full-time',
                work_mode: 'on-site',
                salary_range: '',
                requirements: ''
            });
            fetchMyJobs();
            toast.success('Job posted successfully! 🎉');
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message;
            const errorDetails = error.response?.data?.details;
            if (errorDetails && errorDetails.length > 0) {
                toast.error(errorDetails[0]);
            } else {
                toast.error('Error creating job: ' + errorMessage);
            }
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            try {
                await deleteJob(jobId);
                fetchMyJobs();
                toast.success('Job deleted! 🗑️');
            } catch (error) {
                toast.error('Error deleting job: ' + (error.response?.data?.error || error.message));
            }
        }
    };

    const viewApplications = async (job) => {
        setSelectedJob(job);
        try {
            const response = await getJobApplications(job.id);
            setApplications(response.data.applications);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Error loading applications');
        }
    };
    const toggleJobExpansion = (jobId) => {
        setExpandedJobs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(jobId)) {
                newSet.delete(jobId);
            } else {
                newSet.add(jobId);
            }
            return newSet;
        });
    };

    const stripHtmlAndTruncate = (html, maxLength = 200) => {
        const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    {activeTab === 'my-jobs' ? 'My Job Posts' : 'Find Candidates'}
                </h1>
                {activeTab === 'my-jobs' && (
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="px-6 py-3 bg-secondary dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition font-semibold"
                    >
                        {showCreateForm ? 'Cancel' : '+ Post New Job'}
                    </button>
                )}
            </div>

            {activeTab === 'my-jobs' && (
                <>
                    {/* Create Job Form */}
                    {showCreateForm && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Create New Job</h2>
                            <form onSubmit={handleCreateJob}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Job Title *</label>
                                        <input
                                            type="text"
                                            value={newJob.title}
                                            onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            placeholder="e.g. Senior Developer"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Company *</label>
                                        <input
                                            type="text"
                                            value={newJob.company}
                                            onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Location *</label>
                                        <input
                                            type="text"
                                            value={newJob.location}
                                            onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            placeholder="e.g. New York, NY"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Job Type *</label>
                                        <select
                                            value={newJob.job_type}
                                            onChange={(e) => setNewJob({ ...newJob, job_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        >
                                            <option value="full-time">Full-time</option>
                                            <option value="part-time">Part-time</option>
                                            <option value="contract">Contract</option>
                                            <option value="flexible">Flexible</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Work Mode *</label>
                                        <select
                                            value={newJob.work_mode}
                                            onChange={(e) => setNewJob({ ...newJob, work_mode: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        >
                                            <option value="on-site">On-site</option>
                                            <option value="remote">Remote</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Salary Range</label>
                                        <input
                                            type="text"
                                            value={newJob.salary_range}
                                            onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            placeholder="e.g. $80k - $120k"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Job Description *</label>
                                    <RichTextEditor
                                        value={newJob.description}
                                        onChange={(value) => setNewJob({ ...newJob, description: value })}
                                        placeholder="Describe the role, responsibilities, and what makes this position great..."
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Requirements *</label>
                                    <RichTextEditor
                                        value={newJob.requirements}
                                        onChange={(value) => setNewJob({ ...newJob, requirements: value })}
                                        placeholder="List required skills, experience, education, etc..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="mt-4 px-6 py-3 bg-secondary dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition font-semibold"
                                >
                                    Post Job
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Jobs List */}
                    {loading ? (
                        <p className="text-gray-600 dark:text-gray-400">Loading your jobs...</p>
                    ) : jobs.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center transition-colors">
                            <p className="text-gray-600 dark:text-gray-400">You haven't posted any jobs yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {jobs.map((job) => (
                                <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
                                    {/* Top Section: Info + Buttons */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                        {/* Left: Job Info */}
                                        <div className="flex-1 w-full">
                                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{job.title}</h3>
                                            <p className="text-primary dark:text-blue-400 font-semibold">{job.company}</p>
                                            <p className="text-gray-600 dark:text-gray-400">📍 {job.location} • {job.job_type}</p>
                                            {job.salary_range && <p className="text-secondary dark:text-green-400">💰 {job.salary_range}</p>}
                                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Posted: {new Date(job.created_at).toLocaleDateString()}</p>
                                        </div>

                                        {/* Right: Action Buttons */}
                                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => viewApplications(job)}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition text-sm whitespace-nowrap"
                                            >
                                                View Applications
                                            </button>
                                            <button
                                                onClick={() => handleDeleteJob(job.id)}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bottom Section: Description */}
                                    <div className="border-t dark:border-gray-700 pt-4">
                                        <div className="text-gray-700 dark:text-gray-300">
                                            {expandedJobs.has(job.id) ? (
                                                <div
                                                    className="prose dark:prose-invert max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description) }}
                                                />
                                            ) : (
                                                <p>{stripHtmlAndTruncate(job.description, 200)}</p>
                                            )}
                                            <button
                                                onClick={() => toggleJobExpansion(job.id)}
                                                className="text-primary dark:text-blue-400 hover:underline text-sm mt-2 font-semibold"
                                            >
                                                {expandedJobs.has(job.id) ? 'View Less' : 'View More'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Applications Modal */}
                    {selectedJob && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 transition-colors">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Applications for: {selectedJob.title}</h2>
                                    <button
                                        onClick={() => setSelectedJob(null)}
                                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {applications.length === 0 ? (
                                    <p className="text-gray-600 dark:text-gray-400">No applications yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {applications.map((app) => (
                                            <div key={app.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{app.users?.full_name}</h3>
                                                        <p className="text-gray-600 dark:text-gray-400">{app.users?.email}</p>
                                                        {app.users?.phone && <p className="text-gray-600 dark:text-gray-400">📞 {app.users.phone}</p>}
                                                        <button
                                                            onClick={() => navigate(`/view-profile/${app.candidate_id}`)}
                                                            className="mt-2 text-primary dark:text-blue-400 hover:underline font-semibold text-sm"
                                                        >
                                                            👤 View Full Profile
                                                        </button>
                                                    </div>
                                                    <StatusDropdown
                                                        applicationId={app.id}
                                                        currentStatus={app.status}
                                                        onStatusChange={() => viewApplications(selectedJob)}
                                                    />
                                                </div>

                                                {app.cover_letter && (
                                                    <div className="mt-2">
                                                        <p className="font-semibold text-gray-800 dark:text-gray-200">Cover Letter:</p>
                                                        <p className="text-gray-700 dark:text-gray-300">{app.cover_letter}</p>
                                                    </div>
                                                )}
                                                {app.resume_url && (
                                                    <a
                                                        href={app.resume_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary dark:text-blue-400 hover:underline mt-2 inline-block"
                                                    >
                                                        📄 View Resume
                                                    </a>
                                                )}
                                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'find-candidates' && (
                <CandidateSearch myJobs={jobs} />
            )}
        </div>
    );
}

// Status Dropdown Component
function StatusDropdown({ applicationId, currentStatus, onStatusChange }) {
    const [status, setStatus] = useState(currentStatus);
    const [notes, setNotes] = useState('');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    const handleStatusChange = async (newStatus) => {
        if (newStatus === currentStatus) return;

        setStatus(newStatus);
        setShowNotesModal(true);
    };

    const submitStatusUpdate = async () => {
        setUpdating(true);
        try {
            await updateApplicationStatus(applicationId, { status, notes });
            toast.success('Application status updated! ✅');
            setShowNotesModal(false);
            setNotes('');
            onStatusChange();
        } catch (error) {
            toast.error('Error updating status: ' + (error.response?.data?.error || error.message));
            setStatus(currentStatus);
        }
        setUpdating(false);
    };

    const getStatusColor = (s) => {
        switch (s) {
            case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
            case 'reviewed': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700';
            case 'accepted': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700';
            case 'rejected': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
        }
    };

    return (
        <>
            <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor(status)} focus:outline-none focus:ring-2 focus:ring-primary`}
            >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
            </select>

            {/* Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 transition-colors">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Update Application Status</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Changing status to: <span className="font-semibold capitalize">{status}</span>
                        </p>
                        <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                            Add notes for the candidate (optional):
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Any feedback or next steps..."
                        />
                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={submitStatusUpdate}
                                disabled={updating}
                                className="flex-1 bg-primary dark:bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {updating ? 'Updating...' : 'Confirm'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowNotesModal(false);
                                    setStatus(currentStatus);
                                    setNotes('');
                                }}
                                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default RecruiterDashboard;