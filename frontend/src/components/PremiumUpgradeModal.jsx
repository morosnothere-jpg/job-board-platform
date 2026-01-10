import React, { useState, useEffect } from 'react';
import { getSubscriptionPlans, purchaseSubscription } from '../services/api';
import { toast } from 'sonner';

function PremiumUpgradeModal({ isOpen, onClose, currentTier }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchPlans();
        }
    }, [isOpen]);

    const fetchPlans = async () => {
        try {
            const response = await getSubscriptionPlans();
            const allPlans = response.data.plans;

            // Deduplicate plans: Keep only the best offer for each duration
            const bestPlansMap = new Map();

            allPlans.forEach(plan => {
                const duration = plan.duration_months;
                if (!bestPlansMap.has(duration) || plan.final_price < bestPlansMap.get(duration).final_price) {
                    bestPlansMap.set(duration, plan);
                }
            });

            // Convert map back to array and sort by price
            const uniquePlans = Array.from(bestPlansMap.values()).sort((a, b) => a.final_price - b.final_price);

            setPlans(uniquePlans);
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load subscription plans');
        }
    };

    const handlePurchase = async (planId) => {
        setLoading(true);
        setSelectedPlan(planId);

        try {
            const response = await purchaseSubscription(planId);

            if (response.data.success) {
                // Open Paymob iFrame
                const paymentWindow = window.open(
                    response.data.payment.iframeUrl,
                    'paymob-payment',
                    'width=800,height=600'
                );

                // Monitor payment window
                const checkPaymentWindow = setInterval(() => {
                    if (paymentWindow.closed) {
                        clearInterval(checkPaymentWindow);
                        toast.info('Payment window closed. Checking status...');
                        // Refresh page or fetch updated subscription status
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Error initiating purchase:', error);
            toast.error(error.response?.data?.error || 'Failed to initiate purchase');
        } finally {
            setLoading(false);
            setSelectedPlan(null);
        }
    };

    if (!isOpen) return null;

    const isPremium = currentTier === 'premium';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header - Removed sticky top-0 to fix scrolling issue */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-700 dark:to-purple-800 text-white p-6 rounded-t-2xl relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 className="text-3xl font-bold mb-2">
                        {isPremium ? '⭐ Manage Your Premium' : '🚀 Upgrade to Premium'}
                    </h2>
                    <p className="text-blue-100">
                        {isPremium
                            ? 'Your premium subscription is active!'
                            : 'Unlock unlimited applications and premium features'
                        }
                    </p>
                </div>

                {/* Features */}
                {!isPremium && (
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                            ✨ Premium Features
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { icon: '🚀', text: '40 Applications Daily', subtext: 'vs. 10 on free plan' },
                                { icon: '🚫', text: 'Zero Ads', subtext: 'Clean browsing experience' },
                                { icon: '⭐', text: 'Premium Badge', subtext: 'Stand out to recruiters' },
                                { icon: '🏆', text: 'Top of Search', subtext: 'Appear first in candidate searches' }
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <span className="text-2xl">{feature.icon}</span>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{feature.text}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{feature.subtext}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Plans */}
                <div className="p-6">
                    {/* <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                        {isPremium ? '📅 Renew Subscription' : '💎 Choose Your Plan'}
                    </h3> */}
                    <div className="space-y-4">
                        {plans.map((plan) => {
                            const isFirstTime = plan.is_first_time_offer;
                            const price = plan.final_price;
                            const originalPrice = plan.original_price;
                            const savings = plan.savings;
                            const pricePerMonth = (price / plan.duration_months).toFixed(0);

                            return (
                                <div
                                    key={plan.id}
                                    className={`border-2 rounded-xl p-4 sm:p-6 transition ${isFirstTime
                                        ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-600'
                                        }`}
                                >
                                    {/* Mobile-first: Stack vertically */}
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                                    {plan.duration_months} Months
                                                </h4>
                                                {isFirstTime && (
                                                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                        FIRST TIME OFFER
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                ~{pricePerMonth} EGP per month
                                            </p>
                                        </div>

                                        {/* Price - Centered on mobile, right-aligned on desktop */}
                                        <div className="text-center sm:text-right">
                                            <div className="text-3xl sm:text-4xl font-bold text-primary dark:text-blue-400">
                                                {parseFloat(price).toFixed(2)}
                                            </div>
                                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                EGP
                                            </div>
                                            {isFirstTime && originalPrice > price && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400 line-through mt-1">
                                                    {parseFloat(originalPrice).toFixed(2)} EGP
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handlePurchase(plan.id)}
                                        disabled={loading && selectedPlan === plan.id}
                                        className={`w-full py-3 rounded-lg font-semibold transition ${isFirstTime
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-primary dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white'
                                            } disabled:opacity-50`}
                                    >
                                        {loading && selectedPlan === plan.id ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </span>
                                        ) : (
                                            `Purchase for ${parseFloat(price).toFixed(2)} EGP`
                                        )}
                                    </button>

                                    {isFirstTime && savings > 0 && (
                                        <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-2">
                                            💡 Save {parseFloat(savings).toFixed(2)} EGP on your first purchase!
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                        💳 We accept all major payment methods:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full">Visa</span>
                        <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full">Mastercard</span>
                        <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full">Vodafone Cash</span>
                        <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full">Etisalat Cash</span>
                        <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full">InstaPay</span>
                        <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full">Fawry</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PremiumUpgradeModal;
