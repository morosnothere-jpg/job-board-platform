import React, { useState, useEffect } from 'react';
import { getCreditPackages, purchaseCredits } from '../services/api';
import { toast } from 'sonner';

function CreditPurchaseModal({ isOpen, onClose, currentBalance, isFirstPurchase }) {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchPackages();
        }
    }, [isOpen]);

    const fetchPackages = async () => {
        try {
            const response = await getCreditPackages();
            setPackages(response.data.packages);
        } catch (error) {
            console.error('Error fetching packages:', error);
            toast.error('Failed to load credit packages');
        }
    };

    const handlePurchase = async (packageId) => {
        setLoading(true);
        setSelectedPackage(packageId);

        try {
            const response = await purchaseCredits(packageId);

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
                        // Refresh page or fetch updated credit balance
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
            setSelectedPackage(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-green-500 to-blue-600 dark:from-green-700 dark:to-blue-800 text-white p-6 rounded-t-2xl">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 className="text-3xl font-bold mb-2">💎 Purchase Credits</h2>
                    <p className="text-green-100">
                        Current Balance: <span className="font-bold text-2xl">{currentBalance || 0}</span> credits
                    </p>
                    {isFirstPurchase && (
                        <div className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold inline-block animate-pulse">
                            🎉 20% OFF YOUR FIRST PURCHASE!
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">ℹ️</span>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">How Credits Work:</h3>
                            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                <li>• <strong>Job Post = 5 credits</strong> (~5 EGP per post)</li>
                                <li>• Credits never expire and roll over each month</li>
                                <li>• Access "Find Candidates" feature as long as credits &gt; 0</li>
                                <li>• Buy credits anytime - no subscription required</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Packages */}
                <div className="p-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                        📦 Choose Your Package
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {packages.map((pkg) => {
                            const discount = isFirstPurchase ? pkg.first_purchase_discount : 0;
                            const finalPrice = pkg.price_egp * (1 - discount);
                            const creditsPerEGP = (pkg.credits / finalPrice).toFixed(1);
                            const jobPosts = Math.floor(pkg.credits / 5);

                            // Highlight the most popular package
                            const isPopular = pkg.name === 'Starter';

                            return (
                                <div
                                    key={pkg.id}
                                    className={`relative border-2 rounded-xl p-6 transition ${isPopular
                                            ? 'border-blue-500 dark:border-blue-600 shadow-lg transform scale-105'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                                        }`}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                ⭐ MOST POPULAR
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-center mb-4">
                                        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                                            {pkg.name}
                                        </h4>
                                        <div className="text-4xl font-bold text-primary dark:text-blue-400 mb-1">
                                            {pkg.credits}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">credits</p>
                                    </div>

                                    <div className="space-y-2 mb-4 text-sm">
                                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                            <span>Job Posts:</span>
                                            <span className="font-semibold">~{jobPosts}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                            <span>Value:</span>
                                            <span className="font-semibold">{creditsPerEGP} credits/EGP</span>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="text-center mb-4">
                                        {isFirstPurchase && discount > 0 ? (
                                            <div>
                                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {finalPrice.toFixed(0)} EGP
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                                    {pkg.price_egp} EGP
                                                </div>
                                                <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                                    Save {(pkg.price_egp - finalPrice).toFixed(0)} EGP (20% off)
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                                {pkg.price_egp} EGP
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handlePurchase(pkg.id)}
                                        disabled={loading && selectedPackage === pkg.id}
                                        className={`w-full py-3 rounded-lg font-semibold transition ${isPopular
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'bg-primary dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white'
                                            } disabled:opacity-50`}
                                    >
                                        {loading && selectedPackage === pkg.id ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </span>
                                        ) : (
                                            `Purchase for ${isFirstPurchase && discount > 0 ? finalPrice.toFixed(0) : pkg.price_egp} EGP`
                                        )}
                                    </button>
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

export default CreditPurchaseModal;
