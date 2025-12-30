import React, { useState, useEffect } from 'react';
import { getAdminJobs, deleteAdminJob, updateJobStatus } from '../../services/api';

function JobsManagement() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchJobs();
  }, [pagination.page, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getAdminJobs({
        page: pagination.page,
        limit: 20,
        ...filters
      });
      setJobs(response.data.jobs);
      setPagination(response.data.pagination);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    // Ask for reason
    const reason = prompt(`Please provide a reason for removing "${jobTitle}" (optional):`);

    try {
      await deleteAdminJob(jobId, reason || undefined);
      alert('Job deleted successfully' + (reason ? ' and notification email sent to recruiter' : ''));
      fetchJobs();
    } catch (error) {
      alert('Error deleting job: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateStatus = async (jobId, newStatus, jobTitle) => {
    if (!window.confirm(`Change "${jobTitle}" status to ${newStatus}?`)) {
      return;
    }

    try {
      await updateJobStatus(jobId, newStatus);
      alert('Job status updated successfully');
      fetchJobs();
    } catch (error) {
      alert('Error updating job: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700';
      case 'closed': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'filled': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Jobs</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="filled">Filled</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by title or company..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-600 dark:text-gray-400">
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-600 dark:text-gray-400">
            No jobs found
          </div>
        ) : (
          <>
            {jobs.map((job) => (
              <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{job.title}</h3>
                    <p className="text-primary dark:text-blue-400 font-semibold mb-2">{job.company}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>📍 {job.location}</span>
                      <span>• {job.job_type}</span>
                      {job.salary_range && <span>• 💰 {job.salary_range}</span>}
                    </div>
                  </div>
                  
                  <select
                    value={job.status}
                    onChange={(e) => handleUpdateStatus(job.id, e.target.value, job.title)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(job.status)}`}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="filled">Filled</option>
                  </select>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      Posted by: <span className="font-semibold text-gray-800 dark:text-gray-200">{job.users.full_name}</span>
                    </p>
                    <p className="text-gray-500 dark:text-gray-500">
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteJob(job.id, job.title)}
                    className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition font-semibold"
                  >
                    Delete Job
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md px-6 py-4 flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total jobs)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default JobsManagement;