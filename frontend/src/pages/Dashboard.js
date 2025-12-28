import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import RecruiterDashboard from '../components/RecruiterDashboard';
import JobSeekerDashboard from '../components/JobSeekerDashboard';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import DarkModeToggle from '../components/DarkModeToggle';
import AvatarDisplay from '../components/AvatarDisplay';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const userTypeDisplay = user.user_type === 'recruiter' ? '[Recruiter]' : '[Freelancer]';
  const firstName = user.full_name.split(' ')[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-md transition-colors">
        <div className="container mx-auto px-4 py-4">
          {/* Mobile Layout */}
          <div className="flex md:hidden justify-between items-center">
            <h2 className="text-lg font-bold text-primary dark:text-blue-400">JobBoard</h2>
            <div className="flex items-center gap-2">
              <DarkModeToggle />
              <NotificationBell />
              <AvatarDisplay avatarId={user.avatar} size="sm" />
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center">
            <h2 className="text-2xl font-bold text-primary dark:text-blue-400">JobBoard Dashboard</h2>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <NotificationBell />
              <div className="flex items-center gap-2">
                <AvatarDisplay avatarId={user.avatar} size="sm" />
                <span className="text-gray-700 dark:text-gray-300">
                  <span className="font-bold">{firstName}</span> <span className="font-normal">{userTypeDisplay}</span>
                </span>
              </div>
              <button 
                onClick={() => navigate('/')} 
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Home
              </button>
              <button 
                onClick={logout} 
                className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Mobile Bottom Bar */}
          <div className="md:hidden mt-3 flex gap-2">
            <button 
              onClick={() => navigate('/')} 
              className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
            >
              Home
            </button>
            <button 
              onClick={logout} 
              className="flex-1 px-3 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {user.user_type === 'recruiter' ? (
          <RecruiterDashboard />
        ) : (
          <JobSeekerDashboard />
        )}
      </div>
    </div>
  );
}

export default Dashboard;