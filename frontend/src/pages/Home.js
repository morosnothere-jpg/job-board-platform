import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAllJobs, saveJob, unsaveJob, checkIfJobSaved } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import DarkModeToggle from '../components/DarkModeToggle';

function Home() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchTerm, locationFilter, jobTypeFilter, jobs]);

  useEffect(() => {
    if (jobs.length > 0 && user && user.user_type === 'job_seeker') {
      checkSavedJobs(jobs);
    }
  }, [jobs, user]);

  const fetchJobs = async () => {
    try {
      const response = await getAllJobs();
      setJobs(response.data.jobs);
      setFilteredJobs(response.data.jobs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const checkSavedJobs = async (jobs) => {
    if (!user || user.user_type !== 'job_seeker') return;
    
    try {
      const savedIds = new Set();
      for (const job of jobs) {
        const response = await checkIfJobSaved(job.id);
        if (response.data.isSaved) {
          savedIds.add(job.id);
        }
      }
      setSavedJobIds(savedIds);
    } catch (error) {
      console.error('Error checking saved jobs:', error);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (jobTypeFilter) {
      filtered = filtered.filter(job => job.job_type === jobTypeFilter);
    }

    setFilteredJobs(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setJobTypeFilter('');
  };

  const handleApply = (jobId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.user_type !== 'job_seeker') {
      alert('Only job seekers can apply to jobs');
      return;
    }
    navigate(`/apply/${jobId}`);
  };

  const handleSaveJob = async (e, jobId) => {
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.user_type !== 'job_seeker') {
      alert('Only job seekers can save jobs');
      return;
    }

    try {
      if (savedJobIds.has(jobId)) {
        await unsaveJob(jobId);
        setSavedJobIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } else {
        await saveJob(jobId);
        setSavedJobIds(prev => new Set(prev).add(jobId));
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving job');
    }
  };

  const userTypeDisplay = user ? (user.user_type === 'recruiter' ? '[Recruiter]' : '[Freelancer]') : '';
  const firstName = user ? user.full_name.split(' ')[0] : '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md transition-colors">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary dark:text-blue-400 cursor-pointer" onClick={() => navigate('/')}>
            JobBoard
          </h1>
          <div className="flex gap-4 items-center">
            <DarkModeToggle />
            {user ? (
              <>
                {user.user_type === 'job_seeker' && (
                  <button 
                    onClick={() => navigate('/saved-jobs')} 
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition flex items-center gap-2"
                  >
                    🔖 Saved Jobs
                  </button>
                )}
                <NotificationBell />
                <span className="text-gray-700 dark:text-gray-300">
                  <span className="font-bold">{firstName}</span> <span className="font-normal">{userTypeDisplay}</span>
                </span>
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="px-4 py-2 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition"
                >
                  Dashboard
                </button>
                <button 
                  onClick={logout} 
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login')} 
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/register')} 
                  className="px-6 py-2 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white py-20 transition-colors">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Find Your Dream Job</h1>
          <p className="text-xl">Connect with top companies and start your career journey today</p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Search & Filter Jobs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by title, company, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Job Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          {(searchTerm || locationFilter || jobTypeFilter) && (
            <div className="mt-4 flex items-center gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredJobs.length} of {jobs.length} jobs
              </p>
              <button 
                onClick={clearFilters}
                className="text-sm text-primary dark:text-blue-400 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Jobs Listing */}
      <section className="container mx-auto px-4 pb-12">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100">
          {filteredJobs.length === jobs.length ? 'All Jobs' : 'Filtered Results'}
        </h2>
        
        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center transition-colors">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {jobs.length === 0 ? 'No jobs available at the moment.' : 'No jobs match your search criteria.'}
            </p>
            {jobs.length > 0 && (
              <button 
                onClick={clearFilters}
                className="px-6 py-2 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-xl transition relative">
                {user && user.user_type === 'job_seeker' && (
                  <button
                    onClick={(e) => handleSaveJob(e, job.id)}
                    className="absolute top-4 right-4 text-2xl hover:scale-110 transition"
                    title={savedJobIds.has(job.id) ? 'Unsave job' : 'Save job'}
                  >
                    {savedJobIds.has(job.id) ? '🔖' : '🏷️'}
                  </button>
                )}
                
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 pr-8">{job.title}</h3>
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
                <button 
                  onClick={() => handleApply(job.id)} 
                  className="w-full bg-primary dark:bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold"
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;