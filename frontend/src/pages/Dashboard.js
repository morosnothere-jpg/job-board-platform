import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import RecruiterDashboard from '../components/RecruiterDashboard';
import JobSeekerDashboard from '../components/JobSeekerDashboard';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import DarkModeToggle from '../components/DarkModeToggle';
import AvatarDisplay from '../components/AvatarDisplay';
import ProfileDropdown from '../components/ProfileDropdown';

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
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-2xl font-bold text-primary dark:text-blue-400">JobBoard Dashboard</h2>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <NotificationBell />
              <ProfileDropdown user={user} onLogout={logout} />
            </div>
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