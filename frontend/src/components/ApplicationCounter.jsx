import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getSubscriptionStatus } from '../services/api';
import { toast } from 'sonner';

function ApplicationCounter({ onUpgradeClick }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user && user.user_type === 'job_seeker') {
            fetchStatus();
        }
    }, [user]);

    const fetchStatus = async () => {
        try {
            const response = await getSubscriptionStatus();
            setStatus(response.data.subscription);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching subscription status:', error);
            setLoading(false);
        }
    };

    if (!user || user.user_type !== 'job_seeker' || loading) {
        return null;
    }

    const { applicationsRemaining, dailyLimit, tier } = status || {};
    const isPremium = tier === 'premium';

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 sm:px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Applications Counter */}
            <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs font-bold text-gray-600 dark:text-gray-400">Applications:</span>
                <span className={`text-sm font-bold ${applicationsRemaining <= 2
                    ? 'text-red-600 dark:text-red-400'
                    : applicationsRemaining <= 5
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                    {applicationsRemaining}/{dailyLimit}
                </span>
            </div>

            {/* Upgrade Button */}
            <button
                onClick={onUpgradeClick}
                className={`flex items-center justify-center w-6 h-6 rounded-full transition ${isPremium
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
                    : 'bg-primary dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
                    }`}
                title={isPremium ? 'Manage subscription' : 'Upgrade to Premium'}
            >
                {isPremium ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ) : (
                    <span className="text-lg font-bold leading-none pb-1">+</span>
                )}
            </button>

            {/* Premium Badge (if premium) - Hidden on mobile */}
            {isPremium && (
                <span className="hidden sm:inline text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
                    PRO
                </span>
            )}
        </div>
    );
}

export default ApplicationCounter;
