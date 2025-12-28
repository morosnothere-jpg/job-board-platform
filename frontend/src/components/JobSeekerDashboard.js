import React, { useState, useEffect } from 'react';
import { getMyApplications } from '../services/api';
import { useNavigate } from 'react-router-dom';

function JobSeekerDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    try {
      const response = await getMyApplications();
      setApplications(response.data.applications);
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
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">My Applications</h1>
      </div>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-400">Loading your applications...</p>
      ) : applications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sm:p-8 text-center transition-colors">
          <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't applied to any jobs yet.</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition"
          >
            Start Browsing Jobs
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6">{applications.map((app) => (
            <div key={app.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{app.jobs?.title}</h3>
                  <p className="text-primary dark:text-blue-400 font-semibold">{app.jobs?.company}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">📍 {app.jobs?.location} • {app.jobs?.job_type}</p>
                  
                  {app.cover_letter && (
                    <div className="mt-3">
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Your Cover Letter:</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{app.cover_letter}</p>
                    </div>
                  )}
                  
                  {app.resume_url && (
                    <a 
                      href={app.resume_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary dark:text-blue-400 hover:underline mt-2 inline-block text-sm"
                    >
                      📄 View Your Resume
                    </a>
                  )}
                  
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3">
                    Applied: {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex sm:block justify-center">
                  <span className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold ${getStatusColor(app.status)}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
              </div>
              
              {app.notes && (
                <div className="mt-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm sm:text-base">Recruiter Notes:</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{app.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Browse More Jobs Button - After Applications */}
        <div className="text-center">
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold"
          >
            Browse More Jobs
          </button>
        </div>
      </>
      )}
    </div>
  );
}

export default JobSeekerDashboard;