import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getSavedJobs, unsaveJob } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import DarkModeToggle from '../components/DarkModeToggle';

function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.user_type !== 'job_seeker') {
      alert('Only job seekers can save jobs');
      navigate('/dashboard');
      return;
    }
    fetchSavedJobs();
  }, [user, navigate]);

  const fetchSavedJobs = async () => {
    try {
      const response = await getSavedJobs();
      setSavedJobs(response.data.savedJobs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId) => {
    try {
      await unsaveJob(jobId);
      setSavedJobs(savedJobs.filter(sj => sj.job_id !== jobId));
    } catch (error) {
      alert('Error unsaving job');
    }
  };

  const handleApply = (jobId) => {
    navigate(`/apply/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <p className="text-gray-600 dark:text-gray-400">Loading saved jobs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-md transition-colors">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary dark:text-blue-400 cursor-pointer" onClick={() => navigate('/')}>
            JobBoard
          </h1>
          <div className="flex gap-4 items-center">
            <DarkModeToggle />
            <NotificationBell />
            <button onClick={() => navigate('/')} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400">
              Browse Jobs
            </button>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400">
              Dashboard
            </button>
            <button onClick={logout} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Saved Jobs</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Jobs you've bookmarked for later</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold"
          >
            Browse More Jobs
          </button>
        </div>

        {savedJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center transition-colors">
            <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't saved any jobs yet.</p>
            <p className="text-gray-500 dark:text-gray-500 mb-6">Click the bookmark icon on any job to save it for later!</p>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition"
            >
              Start Browsing Jobs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedJobs.map((savedJob) => {
              const job = savedJob.jobs;
              return (
                <div key={savedJob.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-xl transition">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex-1">{job.title}</h3>
                    <button
                      onClick={() => handleUnsave(job.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 text-xl"
                      title="Remove from saved"
                    >
                      ❌
                    </button>
                  </div>
                  
                  <p className="text-primary dark:text-blue-400 font-semibold mb-2">{job.company}</p>
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                    <span className="mr-2">📍</span>
                    <span>{job.location}</span>
                  </div>
                  <span className="inline-block bg-blue-100 dark:bg-blue-900 text-primary dark:text-blue-300 px-3 py-1 rounded-full text-sm mb-3">
                    {job.job_type}
                  </span>
                  {job.salary_range && (
                    <p className="text-secondary dark:text-green-400 font-semibold mb-3">💰 {job.salary_range}</p>
                  )}
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{job.description}</p>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                    Saved on {new Date(savedJob.created_at).toLocaleDateString()}
                  </p>

                  <button 
                    onClick={() => handleApply(job.id)} 
                    className="w-full bg-primary dark:bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold"
                  >
                    Apply Now
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedJobs;