import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import RecruiterDashboard from '../components/RecruiterDashboard';
import JobSeekerDashboard from '../components/JobSeekerDashboard';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

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
      {/* Top Navigation */}
      <Navbar />

      {/* Dashboard Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">


        {user.user_type === 'recruiter' ? (
          <RecruiterDashboard />
        ) : (
          <JobSeekerDashboard />
        )}
      </div>

      {/* Credit Purchase Modal */}

    </div>
  );
}

export default Dashboard;