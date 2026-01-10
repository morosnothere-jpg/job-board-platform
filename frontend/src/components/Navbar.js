import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import DarkModeToggle from './DarkModeToggle';
import ProfileDropdown from './ProfileDropdown';
import ApplicationCounter from './ApplicationCounter';
import CreditCounter from './CreditCounter';
import PremiumUpgradeModal from './PremiumUpgradeModal';
import CreditPurchaseModal from './CreditPurchaseModal';
import { getCreditBalance } from '../services/api';

function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [creditInfo, setCreditInfo] = useState({ balance: 0, isFirstPurchase: false });

    // Fetch recruiter credits when modal opens or user loads
    const handleCreditModalOpen = () => {
        setShowCreditModal(true);
        if (user && user.user_type === 'recruiter') {
            getCreditBalance()
                .then(response => {
                    setCreditInfo({
                        balance: response.data.credits.balance || 0,
                        isFirstPurchase: response.data.credits.isFirstPurchase
                    });
                })
                .catch(error => console.error('Error fetching credits:', error));
        }
    };

    // Also fetch on mount if recruiter
    React.useEffect(() => {
        if (user && user.user_type === 'recruiter') {
            getCreditBalance()
                .then(response => {
                    setCreditInfo({
                        balance: response.data.credits.balance || 0,
                        isFirstPurchase: response.data.credits.isFirstPurchase
                    });
                })
                .catch(error => console.error('Error fetching credits:', error));
        }
    }, [user]);

    const handleNavigationWithWarning = (path) => {
        // This prop will be passed to ProfileDropdown to handle navigation warnings
        navigate(path);
    };

    const handleLogoutWithWarning = () => {
        logout();
    };

    return (
        <>
            <nav className="bg-white dark:bg-gray-800 shadow-md transition-colors sticky top-0 z-40">
                <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                        {/* Logo */}
                        <h1
                            className="text-lg sm:text-xl md:text-2xl font-bold text-primary dark:text-blue-400 cursor-pointer"
                            onClick={() => navigate('/')}
                        >
                            JobBoard
                        </h1>

                        {/* Right Side Actions */}
                        <div className="flex gap-1.5 sm:gap-2 md:gap-3 items-center">
                            <DarkModeToggle />

                            {/* Job Seeker: Application Counter */}
                            {user && user.user_type === 'job_seeker' && (
                                <ApplicationCounter onUpgradeClick={() => setShowUpgradeModal(true)} />
                            )}

                            {/* Recruiter: Credit Counter */}
                            {user && user.user_type === 'recruiter' && (
                                <CreditCounter onPurchaseClick={handleCreditModalOpen} />
                            )}

                            {/* Notifications (Authenticated only) */}
                            {user && <NotificationBell />}

                            {/* User Profile or Login/Register */}
                            {user ? (
                                <ProfileDropdown
                                    user={user}
                                    onLogout={handleLogoutWithWarning}
                                    onNavigate={handleNavigationWithWarning}
                                />
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="px-3 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Global Modals */}
            {user && user.user_type === 'job_seeker' && (
                <PremiumUpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    currentTier={user.subscription_tier || 'free'}
                />
            )}

            {user && user.user_type === 'recruiter' && (
                <CreditPurchaseModal
                    isOpen={showCreditModal}
                    onClose={() => setShowCreditModal(false)}
                    currentBalance={creditInfo.balance}
                    isFirstPurchase={creditInfo.isFirstPurchase}
                />
            )}
        </>
    );
}

export default Navbar;
