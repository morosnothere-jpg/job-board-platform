import React, { useState, useEffect } from 'react';
import { getAdminApplications } from '../../services/api';
import { useNavigate } from 'react-router-dom';

function ApplicationsManagement() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, [pagination.page, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await getAdminApplications({
        page: pagination.page,
        limit: 20,
        status: statusFilter
      });
      setApplications(response.data.applications);
      setPagination(response.data.pagination);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'reviewed': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'accepted': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'rejected': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div>
      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="max-w-xs">
          <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-600 dark:text-gray-400">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-600 dark:text-gray-400">
            No applications found
          </div>
        ) : (
          <>
            {applications.map((app) => (
              <div key={app.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {app.users.full_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      Applied to: <span className="font-semibold text-gray-800 dark:text-gray-200">{app.jobs.title}</span>
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                      at {app.jobs.company}
                    </p>
                  </div>
                </div>

                {app.cover_letter && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cover Letter:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{app.cover_letter}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      Email: <span className="font-semibold">{app.users.email}</span>
                    </p>
                    <p className="text-gray-500 dark:text-gray-500">
                      Applied: {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/view-profile/${app.candidate_id}`)}
                    className="px-4 py-2 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold"
                  >
                    View Profile
                  </button>
                </div>

                {app.notes && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Recruiter Notes:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">{app.notes}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md px-6 py-4 flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total applications)
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

export default ApplicationsManagement;