import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAdminStats, getAdminActivity } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import DarkModeToggle from '../components/DarkModeToggle';
import ProfileDropdown from '../components/ProfileDropdown';
import UsersManagement from '../components/admin/UsersManagement';
import JobsManagement from '../components/admin/JobsManagement';
import ApplicationsManagement from '../components/admin/ApplicationsManagement';

function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.user_type !== 'admin') {
      alert('Access denied: Admin only');
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        getAdminStats(),
        getAdminActivity(20)
      ]);
      setStats(statsRes.data);
      setActivities(activityRes.data.activities);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-md transition-colors">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-blue-400 cursor-pointer" onClick={() => navigate('/')}>
                JobBoard
              </h1>
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">ADMIN</span>
            </div>
            <div className="flex gap-3 items-center">
              <DarkModeToggle />
              <NotificationBell />
              <ProfileDropdown user={user} onLogout={logout} />
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users, jobs, and monitor platform activity</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['overview', 'users', 'jobs', 'applications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition ${
                activeTab === tab
                  ? 'bg-primary dark:bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={stats?.totalUsers || 0}
                icon="👥"
                color="blue"
              />
              <StatCard
                title="Total Jobs"
                value={stats?.totalJobs || 0}
                icon="💼"
                color="green"
              />
              <StatCard
                title="Applications"
                value={stats?.totalApplications || 0}
                icon="📝"
                color="purple"
              />
              <StatCard
                title="New Users (7d)"
                value={stats?.recentUsers || 0}
                icon="🆕"
                color="orange"
              />
            </div>

            {/* User Types Breakdown */}
            {stats?.usersByType && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Users by Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(stats.usersByType).map(([type, count]) => (
                    <div key={type} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{type.replace('_', ' ')}</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-2xl">
                      {activity.type === 'job_posted' ? '💼' : '📝'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{activity.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UsersManagement />}
        {activeTab === 'jobs' && <JobsManagement />}
        {activeTab === 'applications' && <ApplicationsManagement />}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800',
    green: 'from-green-500 to-green-600 dark:from-green-700 dark:to-green-800',
    purple: 'from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-800',
    orange: 'from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800',
  };

  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} text-white rounded-lg shadow-md p-6`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-4xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-90">{title}</p>
    </div>
  );
}

export default AdminDashboard;