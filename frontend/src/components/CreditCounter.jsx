import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getCreditBalance } from '../services/api';

function CreditCounter({ onPurchaseClick }) {
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user && user.user_type === 'recruiter') {
            fetchBalance();
        }
    }, [user]);

    const fetchBalance = async () => {
        try {
            const response = await getCreditBalance();
            setBalance(response.data.credits);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching credit balance:', error);
            setLoading(false);
        }
    };

    if (!user || user.user_type !== 'recruiter' || loading) {
        return null;
    }

    const { balance: credits, isFirstPurchase } = balance || {};

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Credit Counter */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Credits:</span>
                <span className={`text-sm font-bold ${credits <= 0
                        ? 'text-red-600 dark:text-red-400'
                        : credits <= 10
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                    }`}>
                    {credits || 0}
                </span>
            </div>

            {/* Purchase Button */}
            <button
                onClick={onPurchaseClick}
                className="flex items-center justify-center w-6 h-6 rounded-full bg-primary dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition"
                title="Purchase Credits"
            >
                <span className="text-lg font-bold">+</span>
            </button>

            {/* First Purchase Badge */}
            {isFirstPurchase && credits <= 10 && (
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full animate-pulse">
                    20% OFF
                </span>
            )}
        </div>
    );
}

export default CreditCounter;
