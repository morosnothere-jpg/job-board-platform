import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarDisplay from './AvatarDisplay';

function ProfileDropdown({ user, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const firstName = user.full_name.split(' ')[0];
  const userTypeDisplay = user.user_type === 'recruiter' ? '[Recruiter]' : '[Freelancer]';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleNavigation = (path) => {
    setShowDropdown(false);
    navigate(path);
  };

  const handleLogout = () => {
    setShowDropdown(false);
    onLogout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        <AvatarDisplay avatarId={user.avatar} size="sm" />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-10 md:hidden" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-20 border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* User Info Header */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <AvatarDisplay avatarId={user.avatar} size="md" />
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100">{firstName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{userTypeDisplay}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => handleNavigation('/')}
                className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-3"
              >
                <span className="text-lg">🏠</span>
                <span>Home</span>
              </button>

              <button
                onClick={() => handleNavigation('/dashboard')}
                className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-3"
              >
                <span className="text-lg">📊</span>
                <span>Dashboard</span>
              </button>

              {user.user_type === 'job_seeker' && (
                <>
                  <button
                    onClick={() => handleNavigation('/profile')}
                    className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-3"
                  >
                    <span className="text-lg">✏️</span>
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => handleNavigation('/saved-jobs')}
                    className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-3"
                  >
                    <span className="text-lg">🔖</span>
                    <span>Saved Jobs</span>
                  </button>
                </>
              )}

              {/* Divider */}
              <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-3"
              >
                <span className="text-lg">🚪</span>
                <span>Log out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ProfileDropdown;