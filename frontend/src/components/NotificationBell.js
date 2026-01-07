import React, { useState, useEffect, useContext } from 'react';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      const notifs = response.data.notifications;
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId, link) => {
    try {
      await markAsRead(notificationId);
      fetchNotifications();
      setShowDropdown(false);
      if (link) {
        navigate(link);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleViewJob = async (notificationId, jobId) => {
    try {
      await markAsRead(notificationId);
      fetchNotifications();
      setShowDropdown(false);
      navigate(`/apply/${jobId}`);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation(); // Prevent triggering the read action

    setDeletingIds(prev => new Set(prev).add(notificationId));

    try {
      await deleteNotification(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) {
      return;
    }

    try {
      await deleteAllNotifications();
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast.error('Failed to delete all notifications');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application': return '📝';
      case 'status_update': return '🔄';
      case 'message': return '💬';
      case 'job_invitation': return '🎯';
      default: return 'ℹ️';
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content - Mobile First Design */}
          <div className="fixed md:absolute left-0 right-0 md:left-auto md:right-0 top-16 md:top-auto md:mt-2 mx-2 md:mx-0 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-20 max-h-[calc(100vh-5rem)] md:max-h-[500px] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 transition-colors">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-primary dark:text-blue-400 hover:underline"
                    title="Mark all as read"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleDeleteAllNotifications}
                    className="text-sm text-red-500 dark:text-red-400 hover:underline"
                    title="Delete all notifications"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`group relative p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      } ${deletingIds.has(notif.id) ? 'opacity-50' : ''}`}
                  >
                    <div
                      onClick={() => notif.type === 'job_invitation' ? null : handleMarkAsRead(notif.id, notif.link)}
                      className={notif.type === 'job_invitation' ? '' : 'cursor-pointer'}
                    >
                      <div className="flex items-start gap-3 pr-8">
                        <span className="text-2xl flex-shrink-0">{getNotificationIcon(notif.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm md:text-base break-words">{notif.title}</h4>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">{notif.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {formatTimeAgo(notif.created_at)}
                          </p>

                          {/* View Job Button for Invitations */}
                          {notif.type === 'job_invitation' && notif.job_id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewJob(notif.id, notif.job_id);
                              }}
                              className="mt-3 px-4 py-2 bg-primary dark:bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-semibold"
                            >
                              View Job
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Button - Shows on hover on desktop, always visible on mobile */}
                    <button
                      onClick={(e) => handleDeleteNotification(e, notif.id)}
                      disabled={deletingIds.has(notif.id)}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      title="Delete notification"
                    >
                      {deletingIds.has(notif.id) ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center flex-shrink-0">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/dashboard');
                  }}
                  className="text-sm text-primary dark:text-blue-400 hover:underline"
                >
                  View all in dashboard
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;